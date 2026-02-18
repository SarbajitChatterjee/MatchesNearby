"""
API Response Schemas
====================
Pydantic models that define the exact shape of every API response.
These are the DATA CONTRACT between the backend and frontend.

If a field name or type changes here, the frontend will break.
Always update BACKEND_CONTRACT.md when modifying these models.
"""

from pydantic import BaseModel


class Match(BaseModel):
    """
    A single football match — the core data object of the API.

    Field names use camelCase to match the frontend JavaScript convention.
    The database uses snake_case; translation happens in database.py.

    The frontend uses 'venue' + 'venueCity' to construct a native maps
    deep link for directions (e.g., maps://?q=Allianz+Arena+Munich).
    """
    id: str                              # API-Football fixture ID (as string, not int)
    homeTeam: str                        # e.g. "Arsenal"
    awayTeam: str                        # e.g. "Liverpool"
    homeTeamBadge: str                   # URL to home team crest image
    awayTeamBadge: str                   # URL to away team crest image
    competition: str                     # e.g. "Premier League"
    competitionType: str                 # "league", "cup", or "international"
    gameweek: str                        # e.g. "Regular Season - 28" or "Quarter-finals"
    kickoff: str                         # ISO 8601 datetime: "2026-03-15T15:00:00+00:00"
    venue: str                           # Stadium name: "Emirates Stadium"
    venueCity: str                       # City name: "London"
    isLive: bool = False                 # True when the match is currently in progress


class MatchesResponse(BaseModel):
    """Wrapper for the /api/matches endpoint response."""
    matches: list[Match]


class ErrorResponse(BaseModel):
    """
    Standard error shape the frontend expects on non-200 responses.
    The frontend throws on any non-200 status (useMatches.ts line 62),
    so errors must always be in this exact format.
    """
    error: str  # Human-readable error message
    code: int   # HTTP status code (mirrored in body for convenience)


class FilterOption(BaseModel):
    """A single option in the filter/sort chip bar (SDUI pattern)."""
    id: str     # Unique identifier: "f1", "f2", etc.
    label: str  # Display text: "All", "League", "Cup"
    value: str  # Query param value: "all", "league", "cup"


class FiltersResponse(BaseModel):
    """Response for /api/filters — tells the frontend what filter chips to show."""
    filters: list[FilterOption]


class SortsResponse(BaseModel):
    """Response for /api/sorts — tells the frontend what sort options to show."""
    sorts: list[FilterOption]
