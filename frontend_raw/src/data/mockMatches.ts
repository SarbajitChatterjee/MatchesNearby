/**
 * Mock Data — simulates the FastAPI backend responses.
 *
 * These match the exact shape defined in BACKEND_CONTRACT.md so
 * swapping to real API data requires zero component changes —
 * only the queryFn in useMatches.ts needs updating.
 *
 * Kickoff times are set relative to Date.now() so matches always
 * appear as "upcoming" regardless of when the app is loaded.
 */

import type { Match, FilterOption, SortOption } from "@/types/sdui";

export const MOCK_MATCHES: Match[] = [
  {
    id: "m1",
    homeTeam: "Arsenal",
    awayTeam: "Chelsea",
    competition: "Premier League",
    competitionType: "league",
    gameweek: "Matchday 28",
    kickoff: new Date(Date.now() + 2 * 86400000).toISOString(),
    venue: "Emirates Stadium",
    venueAddress: "London",
    latitude: 51.5549,
    longitude: -0.1084,
    distance: 3.2,
  },
  {
    id: "m2",
    homeTeam: "Barcelona",
    awayTeam: "Real Madrid",
    competition: "La Liga",
    competitionType: "league",
    gameweek: "Matchday 25",
    kickoff: new Date(Date.now() + 5 * 86400000).toISOString(),
    venue: "Camp Nou",
    venueAddress: "Barcelona",
    latitude: 41.3809,
    longitude: 2.1228,
    distance: 1120,
  },
  {
    id: "m3",
    homeTeam: "Man City",
    awayTeam: "Liverpool",
    competition: "FA Cup",
    competitionType: "cup",
    gameweek: "Quarter-finals",
    kickoff: new Date(Date.now() + 1 * 86400000).toISOString(),
    venue: "Etihad Stadium",
    venueAddress: "Manchester",
    latitude: 53.4831,
    longitude: -2.2004,
    distance: 260,
  },
  {
    id: "m4",
    homeTeam: "Bayern Munich",
    awayTeam: "Dortmund",
    competition: "Bundesliga",
    competitionType: "league",
    gameweek: "Matchday 22",
    kickoff: new Date(Date.now() + 3 * 86400000).toISOString(),
    venue: "Allianz Arena",
    venueAddress: "Munich",
    latitude: 48.2188,
    longitude: 11.6247,
    distance: 920,
  },
  {
    id: "m5",
    homeTeam: "Juventus",
    awayTeam: "AC Milan",
    competition: "Serie A",
    competitionType: "league",
    gameweek: "Matchday 26",
    kickoff: new Date(Date.now() + 7 * 86400000).toISOString(),
    venue: "Allianz Stadium",
    venueAddress: "Turin",
    latitude: 45.1096,
    longitude: 7.6413,
    distance: 850,
  },
  {
    id: "m6",
    homeTeam: "PSG",
    awayTeam: "Marseille",
    competition: "Coupe de France",
    competitionType: "cup",
    gameweek: "Semi-finals",
    kickoff: new Date(Date.now() + 10 * 86400000).toISOString(),
    venue: "Parc des Princes",
    venueAddress: "Paris",
    latitude: 48.8414,
    longitude: 2.2530,
    distance: 340,
  },
];

export const MOCK_FILTERS: FilterOption[] = [
  { id: "f1", label: "All", value: "all", group: "type" },
  { id: "f2", label: "League", value: "league", group: "type" },
  { id: "f3", label: "Cup", value: "cup", group: "type" },
];

export const MOCK_SORTS: SortOption[] = [
  { id: "s1", label: "Soonest", value: "date" },
  { id: "s2", label: "Nearest", value: "distance" },
];
