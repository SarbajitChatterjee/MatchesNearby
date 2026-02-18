"""
Match Routes
============
HTTP endpoints for the MatchNearby API.
These are the URLs the frontend calls.

This file contains ZERO business logic — its job is:
    1. Validate incoming request parameters
    2. Call the football service
    3. Return the response (or a clean error)

All endpoints are mounted under /api by main.py, so:
    @router.get("/matches") → GET /api/matches
    @router.get("/filters") → GET /api/filters
"""

from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
from datetime import datetime
import logging

from app.models.schemas import (
    MatchesResponse,
    FiltersResponse,
    SortsResponse,
    FilterOption,
)
from app.services.football import get_matches

logger = logging.getLogger(__name__)

router = APIRouter()

# Allowed values for query parameters — reject anything else with a 400.
VALID_FILTERS = {"all", "league", "cup", "international"}
# Added "distance" to allow sorting by city proximity (via text filter)
VALID_SORTS = {"date", "distance"}


@router.get("/matches", response_model=MatchesResponse)
async def list_matches(
    filter: str = Query("all", description="Competition type: all, league, cup, or international"),
    sort: str = Query("date", description="Sort order: date (sooner first) or distance (nearest city)"),
    date: str | None = Query(None, description="Specific date in YYYY-MM-DD format. Omit for upcoming matches."),
    city: str | None = Query(None, description="Filter by city name (e.g. 'Munich')"),
    next: int = Query(50, description="Upcoming fixtures per league (only used when date is omitted)"),
):
    """
    GET /api/matches — the primary endpoint.

    Two modes:
        With ?date=2026-03-15 → matches on that exact date
        Without date          → all upcoming matches from today onward

    Data flow:
        1. Validate params
        2. Check if Supabase has fresh data for requested date(s)
        3. If stale, sync from API-Football first
        4. Return matches from Supabase
    """

    # ── Input Validation ──
    # Reject invalid params early with clear error messages.
    # This prevents bad data from reaching the database layer.

    if filter not in VALID_FILTERS:
        return JSONResponse(
            status_code=400,
            content={
                "error": f"Invalid filter '{filter}'. Must be one of: {', '.join(sorted(VALID_FILTERS))}",
                "code": 400,
            },
        )

    if sort not in VALID_SORTS:
        return JSONResponse(
            status_code=400,
            content={
                "error": f"Invalid sort '{sort}'. Must be one of: {', '.join(sorted(VALID_SORTS))}",
                "code": 400,
            },
        )

    if date:
        try:
            datetime.strptime(date, "%Y-%m-%d")
        except ValueError:
            return JSONResponse(
                status_code=400,
                content={
                    "error": f"Invalid date format '{date}'. Expected YYYY-MM-DD.",
                    "code": 400,
                },
            )

    # ── Fetch Matches ──
    try:
        # Pass the 'city' parameter down to the service layer
        # Pass the data now to service layer > football.py
        matches = await get_matches(
            filter_type=filter,
            sort_by=sort,
            date=date,
            city=city,
            next_count=next,
        )
        return MatchesResponse(matches=matches)

    except Exception as e:
        # 502 = Bad Gateway — tells the frontend "our server is fine,
        # but something upstream (API-Football or Supabase) failed."
        logger.error(f"Failed to fetch matches: {e}")
        return JSONResponse(
            status_code=502,
            content={
                "error": "Failed to fetch match data. Please try again shortly.",
                "code": 502,
            },
        )


@router.get("/filters", response_model=FiltersResponse)
async def list_filters():
    """
    GET /api/filters — SDUI (Server-Driven UI) endpoint.

    Returns the list of filter options the frontend should display.
    By serving this from the backend, we can add new filters (e.g., "Women's")
    without releasing a new app version — the UI updates automatically.
    """
    return FiltersResponse(
        filters=[
            FilterOption(id="f1", label="All", value="all"),
            FilterOption(id="f2", label="League", value="league"),
            FilterOption(id="f3", label="Cup", value="cup"),
            FilterOption(id="f4", label="International", value="international"),
        ]
    )


@router.get("/sorts", response_model=SortsResponse)
async def list_sorts():
    """
    GET /api/sorts — SDUI endpoint for sort options.
    Added "Nearest" option which triggers the city filter flow.
    """
    return SortsResponse(
        sorts=[
            FilterOption(id="s1", label="Soonest", value="date"),
            FilterOption(id="s2", label="Nearest", value="distance"),
        ]
    )