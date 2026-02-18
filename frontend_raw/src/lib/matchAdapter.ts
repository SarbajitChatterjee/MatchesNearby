/**
 * matchAdapter — Adapter pattern for backend ↔ frontend data mapping.
 *
 * Why an adapter?
 * The FastAPI backend returns a slightly different shape than what
 * the UI components consume (e.g. `venueCity` vs `venueAddress`,
 * nullable vs default coordinates). This module centralises that
 * mapping so if the backend contract changes, only this file needs
 * updating — no component surgery required.
 *
 * See BACKEND_CONTRACT.md for the full API response shapes.
 */

import type { Match } from "@/types/sdui";

/**
 * BackendMatch — the exact JSON shape returned by FastAPI
 * inside the `matches` array of `GET /api/matches`.
 */
export interface BackendMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamBadge?: string;
  awayTeamBadge?: string;
  competition: string;
  competitionType?: "league" | "cup" | "international";
  gameweek?: string;
  kickoff: string;
  venue: string;
  venueCity?: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
  isLive?: boolean;
}

/** Map a single backend match into the internal Match type. */
export function toMatch(raw: BackendMatch): Match {
  return {
    id: raw.id,
    homeTeam: raw.homeTeam,
    awayTeam: raw.awayTeam,
    homeTeamBadge: raw.homeTeamBadge,
    awayTeamBadge: raw.awayTeamBadge,
    competition: raw.competition,
    competitionType: raw.competitionType ?? "league",
    gameweek: raw.gameweek,
    kickoff: raw.kickoff,
    venue: raw.venue,
    /* Backend sends `venueCity`, UI expects `venueAddress` */
    venueAddress: raw.venueCity,
    /* Default to 0,0 so map components never receive undefined coords */
    latitude: raw.latitude ?? 0,
    longitude: raw.longitude ?? 0,
    distance: raw.distance,
    isLive: raw.isLive,
  };
}

/** Map an array of backend matches. */
export function toMatchList(raw: BackendMatch[]): Match[] {
  return raw.map(toMatch);
}
