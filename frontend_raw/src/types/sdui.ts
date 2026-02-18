/**
 * Shared Data Models
 * ------------------
 * These types define the core data structures used across the app.
 * They mirror the JSON shapes returned by the FastAPI backend
 * (see BACKEND_CONTRACT.md for the full API spec).
 *
 * Why a separate file?
 * Keeps data contracts decoupled from UI components so both
 * frontend screens and data-fetching hooks import from one place.
 */

/* ── Match — the central domain entity ── */
export interface Match {
  id: string;

  homeTeam: string;
  awayTeam: string;

  /** Optional badge URLs — used for team crests when available */
  homeTeamBadge?: string;
  awayTeamBadge?: string;

  /** Competition name, e.g. "Premier League" */
  competition: string;

  /** Drives filter logic: "league" | "cup" | "international" */
  competitionType?: "league" | "cup" | "international";

  /** Human-readable round label, e.g. "Matchday 28" or "Quarter-finals" */
  gameweek?: string;

  /** ISO 8601 kickoff time — always UTC from backend, displayed in local time */
  kickoff: string;

  venue: string;
  venueAddress?: string;

  /** GPS coordinates — used for map pins and distance calculation */
  latitude?: number;
  longitude?: number;

  /** Distance in km from user's location — computed by backend or client */
  distance?: number;

  /** True when the match is currently in play */
  isLive?: boolean;
}

/* ── Filter chip sent by backend for the FilterBar ── */
export interface FilterOption {
  id: string;
  label: string;
  value: string;
  /** Grouping key for future multi-row filter UIs */
  group?: string;
}

/* ── Sort option for the FilterBar sort chips ── */
export interface SortOption {
  id: string;
  label: string;
  value: "date" | "distance";
}
