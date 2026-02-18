/**
 * SearchScreen — full-text search for matches by team, venue, or city.
 *
 * Search flow:
 * 1. Empty query → show helper UI (location button, region chips, recents)
 * 2. User types → client-side filter on the full match list
 *
 * Geolocation fallback:
 * Uses navigator.geolocation with a 5s timeout. On success, the
 * coordinates are displayed in the search input as a visual cue.
 * In production this would trigger a backend query with lat/lng params.
 * On failure (denied or timeout), the button silently stops loading.
 *
 * Region chips:
 * Quick-tap shortcuts that set the search query to a country name,
 * filtering matches by venue city. These are hardcoded for now but
 * could be made server-driven via the SDUI pattern.
 */

import { useState, useMemo, useCallback } from "react";
import { Search, MapPin, X, Navigation } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MatchCard } from "@/components/MatchCard";
import { useMatches } from "@/hooks/useMatches";
import type { Match } from "@/types/sdui";

const RECENT_LOCATIONS = [
  "London, UK",
  "Barcelona, Spain",
  "Munich, Germany",
];

const REGIONS = [
  { label: "England", emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { label: "Spain", emoji: "🇪🇸" },
  { label: "Germany", emoji: "🇩🇪" },
  { label: "Italy", emoji: "🇮🇹" },
  { label: "France", emoji: "🇫🇷" },
];

interface SearchScreenProps {
  onMatchSelect: (match: Match) => void;
  isSaved: (id: string) => boolean;
  onToggleSave: (match: Match) => void;
}

export function SearchScreen({
  onMatchSelect,
  isSaved,
  onToggleSave,
}: SearchScreenProps) {
  const [query, setQuery] = useState("");
  const [locating, setLocating] = useState(false);
  const { data: allMatches = [] } = useMatches();

  /** Client-side fuzzy match on team names, venue, and city */
  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allMatches.filter(
      (m) =>
        m.venue.toLowerCase().includes(q) ||
        m.homeTeam.toLowerCase().includes(q) ||
        m.awayTeam.toLowerCase().includes(q) ||
        m.venueAddress?.toLowerCase().includes(q)
    );
  }, [query, allMatches]);

  /** Request device GPS and populate search with coordinates */
  const handleUseLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setQuery(`${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}`);
      },
      () => setLocating(false),
      { timeout: 5000 }
    );
  }, []);

  return (
    <div className="animate-fade-in px-md pt-md">
      {/* Search input with clear button */}
      <div className="relative mb-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search city, venue, or team…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 pr-9"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Empty query → show discovery helpers */}
      {!query.trim() && (
        <>
          {/* GPS location button */}
          <Button
            variant="outline"
            className="mb-md w-full gap-sm"
            onClick={handleUseLocation}
            disabled={locating}
          >
            <Navigation className="h-4 w-4" />
            {locating ? "Locating…" : "Use Current Location"}
          </Button>

          {/* Region quick-filter chips */}
          <div className="mb-lg">
            <h3 className="mb-sm text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Browse by region
            </h3>
            <div className="flex flex-wrap gap-sm">
              {REGIONS.map((r) => (
                <button
                  key={r.label}
                  onClick={() => setQuery(r.label)}
                  className="flex items-center gap-xs rounded-lg bg-secondary px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-accent/10"
                >
                  <span>{r.emoji}</span>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recent location shortcuts */}
          <div className="mb-lg">
            <h3 className="mb-sm text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Recent locations
            </h3>
            <div className="flex flex-col gap-xs">
              {RECENT_LOCATIONS.map((loc) => (
                <button
                  key={loc}
                  onClick={() => setQuery(loc.split(",")[0])}
                  className="flex items-center gap-sm rounded-lg bg-secondary p-sm text-sm text-foreground transition-colors hover:bg-accent/10"
                >
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {loc}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Search results */}
      {query.trim() && (
        <div className="flex flex-col gap-sm pb-md">
          {filtered.length === 0 ? (
            <p className="py-xl text-center text-sm text-muted-foreground">
              No matches found for "{query}".
            </p>
          ) : (
            filtered.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                isSaved={isSaved(match.id)}
                onToggleSave={() => onToggleSave(match)}
                onPress={() => onMatchSelect(match)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
