"""
Database Service
================
All Supabase/Postgres operations live here. No other file imports 'supabase' directly.
This keeps database logic centralized — if we ever swap databases, only this file changes.

Tables used:
    - matches   → stores transformed match data (cache + persistent storage)
    - sync_log  → tracks when each league+date was last synced from API-Football

Naming convention:
    Database columns use snake_case (Postgres convention): home_team, venue_city
    API response fields use camelCase (JS convention): homeTeam, venueCity
    The db_row_to_match() and match_to_db_row() functions translate between the two.
"""

from datetime import datetime, timedelta, timezone
import logging

from supabase import create_client, Client

from app.config.settings import get_settings
from app.models.schemas import Match

logger = logging.getLogger(__name__)


# ─── Supabase Client (Singleton) ────────────────────────────

_client: Client | None = None


def get_supabase() -> Client:
    """
    Returns a single, reused Supabase client instance.
    Creating a new client on every call would be wasteful — the client
    maintains an HTTP connection pool internally.
    """
    global _client
    if _client is None:
        settings = get_settings()
        _client = create_client(settings.supabase_url, settings.supabase_key)
    return _client


# ─── Sync Log Operations ────────────────────────────────────
# The sync_log table answers one question: "should we call API-Football?"
# If we synced this league+date recently, the answer is no — use the DB.


def is_synced_fresh(league_id: int, match_date: str) -> bool:
    """
    Check if we recently fetched data for this league + date.

    "Recently" means within SYNC_FRESHNESS_HOURS (default 6 hours).
    Returns True → data is fresh, skip API-Football.
    Returns False → data is stale or missing, sync needed.

    On database errors, returns False (fail-open). This means a DB
    hiccup triggers an extra API call rather than serving stale data.
    """
    settings = get_settings()
    cutoff = datetime.now(timezone.utc) - timedelta(hours=settings.sync_freshness_hours)

    try:
        result = (
            get_supabase()
            .table("sync_log")
            .select("synced_at")
            .eq("league_id", league_id)
            .eq("sync_date", match_date)
            .gte("synced_at", cutoff.isoformat())
            .execute()
        )
        return len(result.data) > 0
    except Exception as e:
        logger.error(f"Sync log check failed for league {league_id}, date {match_date}: {e}")
        return False


def mark_synced(league_id: int, match_date: str) -> None:
    """
    Record that we just synced this league + date from API-Football.
    Uses UPSERT — if a row exists for this league+date, update the timestamp.
    This is called even when zero matches are found, to record "we checked."
    """
    try:
        get_supabase().table("sync_log").upsert(
            {
                "league_id": league_id,
                "sync_date": match_date,
                "synced_at": datetime.now(timezone.utc).isoformat(),
            },
            on_conflict="league_id,sync_date",
        ).execute()
    except Exception as e:
        logger.error(f"Failed to mark sync for league {league_id}, date {match_date}: {e}")


# ─── Match Read Operations ───────────────────────────────────


def get_matches_by_date(match_date: str, filter_type: str = "all", city: str | None = None) -> list[dict]:
    """
    Fetch all matches on a specific date from the database.
    Optionally filters by competition type and/or city.
    """
    try:
        query = (
            get_supabase()
            .table("matches")
            .select("*")
            .eq("match_date", match_date)
        )

        # Apply competition type filter if not "all"
        if filter_type != "all":
            query = query.eq("competition_type", filter_type)

        # Apply city filter if provided (case-insensitive partial match)
        if city:
            query = query.ilike("venue_city", f"%{city}%")

        result = query.order("kickoff").execute()
        return result.data
    except Exception as e:
        logger.error(f"DB fetch failed for date {match_date}: {e}")
        return []


def get_matches_upcoming(from_date: str, filter_type: str = "all", city: str | None = None) -> list[dict]:
    """
    Fetch all matches from today onward.
    Optionally filters by competition type and/or city.
    """
    try:
        query = (
            get_supabase()
            .table("matches")
            .select("*")
            .gte("match_date", from_date)
        )

        if filter_type != "all":
            query = query.eq("competition_type", filter_type)

        # Apply city filter if provided (case-insensitive partial match)
        if city:
            query = query.ilike("venue_city", f"%{city}%")

        result = query.order("kickoff").execute()
        return result.data
    except Exception as e:
        logger.error(f"DB upcoming fetch failed from {from_date}: {e}")
        return []


# ─── Match Write Operations ──────────────────────────────────


def upsert_matches(rows: list[dict]) -> None:
    """
    Insert or update matches in the database.
    UPSERT on 'id' means: existing matches get updated (e.g., kickoff time
    changed, match went live), new matches get inserted.
    """
    if not rows:
        return

    try:
        get_supabase().table("matches").upsert(rows, on_conflict="id").execute()
        logger.info(f"Upserted {len(rows)} matches into DB")
    except Exception as e:
        logger.error(f"DB upsert failed: {e}")


# ─── Data Conversion ─────────────────────────────────────────
# These two functions translate between database format (snake_case)
# and API response format (camelCase).


def db_row_to_match(row: dict) -> Match:
    """
    Database row (snake_case) → Match API object (camelCase).
    Used when reading from the DB to build the API response.
    """
    return Match(
        id=row["id"],
        homeTeam=row["home_team"],
        awayTeam=row["away_team"],
        homeTeamBadge=row.get("home_team_badge", ""),
        awayTeamBadge=row.get("away_team_badge", ""),
        competition=row["competition"],
        competitionType=row["competition_type"],
        gameweek=row.get("gameweek", ""),
        kickoff=row["kickoff"],
        venue=row.get("venue", "Unknown"),
        venueCity=row.get("venue_city", "Unknown"),
        isLive=row.get("is_live", False),
    )


def match_to_db_row(match: Match, league_id: int) -> dict:
    """
    Match API object (camelCase) → database row (snake_case).
    Used after fetching from API-Football, before storing in Supabase.

    Adds two fields that don't exist in the Match model:
    - league_id: which league this belongs to (for sync tracking)
    - match_date: extracted from kickoff for efficient date queries
    """
    # Extract the date portion from the ISO 8601 kickoff timestamp.
    # "2026-03-15T15:30:00+00:00" → "2026-03-15"
    try:
        kickoff_dt = datetime.fromisoformat(match.kickoff.replace("Z", "+00:00"))
        match_date = kickoff_dt.date().isoformat()
    except (ValueError, AttributeError):
        match_date = "1970-01-01"  # Fallback for malformed timestamps

    return {
        "id": match.id,
        "home_team": match.homeTeam,
        "away_team": match.awayTeam,
        "home_team_badge": match.homeTeamBadge,
        "away_team_badge": match.awayTeamBadge,
        "competition": match.competition,
        "competition_type": match.competitionType,
        "gameweek": match.gameweek,
        "kickoff": match.kickoff,
        "venue": match.venue,
        "venue_city": match.venueCity,
        "is_live": match.isLive,
        "league_id": league_id,
        "match_date": match_date,
        "synced_at": datetime.now(timezone.utc).isoformat(),
    }