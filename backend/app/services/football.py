"""
Football Service — Core Business Logic
=======================================
This is the orchestrator. It decides:
    1. "Do we already have fresh data in Supabase?" → serve from DB
    2. "Is the data stale or missing?" → fetch from API-Football, transform, store, then serve

Data flow:
    Request → is_synced_fresh? ─── YES ──→ Read from Supabase → Return
                    │
                    NO
                    │
                    ▼
              Fetch from API-Football → Transform to Match objects
              → Store in Supabase → Mark synced → Read from Supabase → Return

No other file calls API-Football directly. If we ever switch data providers,
only this file changes.

Important: API-Football has a 100 requests/day limit on the free tier.
The sync_freshness_hours setting (default 6h) controls how aggressively
we re-fetch. With 7 leagues at 6-hour intervals, worst case is ~28 calls/day.
"""

import httpx
import logging
from datetime import datetime, timezone

from app.config.settings import get_settings
from app.models.schemas import Match
from app.services.database import (
    is_synced_fresh,
    mark_synced,
    get_matches_by_date,
    get_matches_upcoming,
    upsert_matches,
    match_to_db_row,
    db_row_to_match,
)

logger = logging.getLogger(__name__)

# API-Football v3 base URL — all fixture/league endpoints live under this.
API_BASE = "https://v3.football.api-sports.io"


# ─── Constants ────────────────────────────────────────────────

# Status codes that mean a match is currently being played.
# API-Football returns these in fixture.status.short.
# See: https://www.api-football.com/documentation-v3#tag/Fixtures/operation/get-fixtures
LIVE_STATUSES = {"1H", "2H", "HT", "ET", "P", "BT", "LIVE"}

# API-Football only classifies competitions as "League" or "Cup".
# Our frontend contract requires an "international" category as well.
# These are the API-Football league IDs for international competitions.
# We maintain this manually because there's no API field that flags them.
INTERNATIONAL_LEAGUE_IDS = {
    1,    # FIFA World Cup
    4,    # Euro Championship
    5,    # UEFA Nations League
    6,    # Africa Cup of Nations
    7,    # Asian Cup
    9,    # Copa America
    10,   # International Friendlies
    11,   # International Friendlies (Women)
    29,   # World Cup Qualifiers — South America
    30,   # World Cup Qualifiers — CONCACAF
    31,   # World Cup Qualifiers — Europe
    32,   # World Cup Qualifiers — Africa
    33,   # World Cup Qualifiers — Asia
    34,   # World Cup Qualifiers — Oceania
}


# ─── Classification Helper ────────────────────────────────────


def _classify_competition_type(league: dict) -> str:
    """
    Map an API-Football league object to our contract's competition types.

    Priority: if the league ID is in our international set → "international".
    Otherwise, use API-Football's own "type" field (lowercased): "league" or "cup".
    """
    league_id = league.get("id", 0)
    if league_id in INTERNATIONAL_LEAGUE_IDS:
        return "international"

    # API-Football returns "League" or "Cup" — we lowercase to match our contract.
    league_type = league.get("type", "League")
    return league_type.lower() if league_type else "league"


# ─── API-Football Fetchers ────────────────────────────────────
# These two functions are the ONLY place in the codebase that talks
# to API-Football. Every call includes the API key in a custom header.


async def _fetch_fixtures_by_date(league_id: int, date: str) -> list[dict]:
    """
    Fetch all fixtures for a specific league on a specific date.
    Used when the frontend sends ?date=2026-03-15.

    API endpoint: GET /fixtures?league={id}&season={year}&date={YYYY-MM-DD}
    Costs 1 API call per league per date.
    """
    settings = get_settings()

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{API_BASE}/fixtures",
            headers={"x-apisports-key": settings.api_football_key},
            params={
                "league": league_id,
                "season": settings.season,
                "date": date,
            },
        )
        response.raise_for_status()
        data = response.json()

    fixtures = data.get("response", [])
    logger.info(f"API-Football: {len(fixtures)} fixtures for league {league_id} on {date}")
    return fixtures


async def _fetch_fixtures_upcoming(league_id: int, next_count: int) -> list[dict]:
    """
    Fetch the next N upcoming fixtures for a league (no specific date).
    Used when the frontend opens the app without specifying a date.

    API endpoint: GET /fixtures?league={id}&season={year}&next={count}
    Costs 1 API call per league. The response spans multiple future dates.
    """
    settings = get_settings()

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{API_BASE}/fixtures",
            headers={"x-apisports-key": settings.api_football_key},
            params={
                "league": league_id,
                "season": settings.season,
                "next": next_count,
            },
        )
        response.raise_for_status()
        data = response.json()

    fixtures = data.get("response", [])
    logger.info(f"API-Football: {len(fixtures)} upcoming fixtures for league {league_id}")
    return fixtures


# ─── Fixture Transformation ───────────────────────────────────


def _transform_fixture(fixture: dict) -> Match:
    """
    Convert one API-Football fixture into our clean Match format.

    API-Football returns deeply nested JSON like:
        fixture.fixture.id, fixture.fixture.date, fixture.fixture.venue.name,
        fixture.teams.home.name, fixture.league.name, fixture.fixture.status.short

    We flatten this into the shape our frontend expects (defined in schemas.py).
    The frontend uses venue + venueCity to construct native maps deep links.
    """
    f = fixture["fixture"]
    teams = fixture["teams"]
    league = fixture["league"]

    # Extract venue info — the frontend uses these two fields to construct
    # a native maps deep link: maps://?q={venue}+{venueCity}
    venue_name = f.get("venue", {}).get("name") or "Unknown"
    venue_city = f.get("venue", {}).get("city") or "Unknown"

    # Check if the match is currently live by comparing the status code
    # against our known set of "in-progress" statuses.
    status_code = f.get("status", {}).get("short", "")
    is_live = status_code in LIVE_STATUSES

    return Match(
        id=str(f["id"]),                           # API returns int, contract requires string
        homeTeam=teams["home"]["name"],
        awayTeam=teams["away"]["name"],
        homeTeamBadge=teams["home"]["logo"],        # URL to team crest PNG
        awayTeamBadge=teams["away"]["logo"],
        competition=league["name"],                 # e.g. "Premier League"
        competitionType=_classify_competition_type(league),
        gameweek=league.get("round", ""),           # e.g. "Regular Season - 28"
        kickoff=f["date"],                          # ISO 8601 with timezone
        venue=venue_name,
        venueCity=venue_city,
        isLive=is_live,
    )


# ─── Sync Functions ───────────────────────────────────────────
# These functions fetch from API-Football, transform, store in DB,
# and mark the sync. They are only called when data is stale.


async def _sync_league_for_date(league_id: int, date: str) -> None:
    """
    Sync one league for one specific date.
    Fetch → Transform → Store → Mark synced.

    Called when is_synced_fresh() returns False for this league+date.
    If the league has no games on this date, we still mark it as synced
    so we don't re-check on every subsequent request.
    """
    try:
        fixtures = await _fetch_fixtures_by_date(league_id, date)

        if fixtures:
            matches = [_transform_fixture(f) for f in fixtures]
            rows = [match_to_db_row(m, league_id) for m in matches]
            upsert_matches(rows)

        # Always mark synced — even for zero-match days.
        # Without this, every request for a match-less Wednesday
        # would trigger a wasted API call.
        mark_synced(league_id, date)

    except httpx.HTTPStatusError as e:
        logger.error(f"API-Football error for league {league_id}, date {date}: {e}")
    except Exception as e:
        logger.error(f"Sync failed for league {league_id}, date {date}: {e}")


async def _sync_league_upcoming(league_id: int, next_count: int) -> None:
    """
    Sync one league's upcoming fixtures (no specific date).
    The API response covers multiple future dates, so we mark
    each date as synced individually.

    Example: asking for the next 50 PL fixtures might return matches
    spanning March 10 – April 20. All those dates get marked as synced.
    """
    try:
        fixtures = await _fetch_fixtures_upcoming(league_id, next_count)
        if not fixtures:
            return

        matches = [_transform_fixture(f) for f in fixtures]
        rows = [match_to_db_row(m, league_id) for m in matches]
        upsert_matches(rows)

        # Track which dates this response covered, so each one is marked fresh.
        dates_covered = set()
        for match in matches:
            try:
                kickoff_dt = datetime.fromisoformat(match.kickoff.replace("Z", "+00:00"))
                dates_covered.add(kickoff_dt.date().isoformat())
            except (ValueError, AttributeError):
                pass  # Skip malformed timestamps

        for d in dates_covered:
            mark_synced(league_id, d)

    except httpx.HTTPStatusError as e:
        logger.error(f"API-Football error for upcoming league {league_id}: {e}")
    except Exception as e:
        logger.error(f"Sync failed for upcoming league {league_id}: {e}")


# ─── Main Entry Point ─────────────────────────────────────────


async def get_matches(
    filter_type: str = "all",
    sort_by: str = "date",
    date: str | None = None,
    city: str | None = None,  # Added city parameter
    next_count: int = 50,
) -> list[Match]:
    """
    The function that routes/matches.py calls. Orchestrates everything.

    Two modes of operation:
        1. Specific date (?date=2026-03-15):
           - Check each league's sync freshness for that date
           - Sync any stale leagues
           - Query DB for that exact date (filtering by city if needed)

        2. Upcoming (no date):
           - Check each league's sync freshness for today
           - Sync stale leagues (fetches next N fixtures, covering many dates)
           - Query DB for today onward (filtering by city if needed)
    """
    settings = get_settings()

    if date:
        # ── Mode 1: Specific date ──
        for league_id in settings.league_id_list:
            if not is_synced_fresh(league_id, date):
                logger.info(f"Data stale — syncing league {league_id} for {date}")
                await _sync_league_for_date(league_id, date)

        # Pass city to DB query
        rows = get_matches_by_date(date, filter_type, city)

    else:
        # ── Mode 2: Upcoming matches ──
        today = datetime.now(timezone.utc).date().isoformat()

        for league_id in settings.league_id_list:
            if not is_synced_fresh(league_id, today):
                logger.info(f"Data stale — syncing upcoming for league {league_id}")
                await _sync_league_upcoming(league_id, next_count)

        # Pass city to DB query
        rows = get_matches_upcoming(today, filter_type, city)

    # Convert database rows (snake_case) to Match objects (camelCase)
    matches = [db_row_to_match(row) for row in rows]

    # Sort by kickoff time (soonest first).
    matches.sort(key=lambda m: m.kickoff)

    return matches