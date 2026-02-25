/**
 * SearchScreen — location-centric search for matches.
 *
 * Primary use case:
 * - User types a city (e.g. "Munich") and optionally picks a date
 * - Backend returns matches for that day, sorted by nearest when requested
 */

import { useState, useCallback } from "react";
import { Search, MapPin, X, Navigation, CalendarIcon, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MatchCard } from "@/components/MatchCard";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMatches } from "@/hooks/useMatches";
import { cn } from "@/lib/utils";
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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [sortByNearest, setSortByNearest] = useState(false);
  const trimmedQuery = query.trim();

  /**
   * Server-driven search:
   * - `query` is treated as a city / location name (e.g. "Munich")
   * - Date and sort mode are passed directly to the backend
   */
  const { data: results = [], isLoading } = useMatches({
    sort: sortByNearest ? "distance" : "date",
    date: selectedDate,
    city: trimmedQuery || undefined,
  });

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

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setCalendarOpen(false);
  };

  return (
    <div className="animate-fade-in px-md pt-md">
      {/* Search input row with date picker */}
      <div className="mb-md flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Enter a city (e.g. Munich)…"
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

        {/* Date picker */}
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            {selectedDate ? (
              <div className="flex shrink-0 items-center gap-1 rounded-full bg-accent px-3 py-1.5">
                <span className="text-xs font-medium text-accent-foreground">
                  {format(selectedDate, "MMM d")}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDate(undefined);
                  }}
                  className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-accent-foreground/20"
                >
                  <X className="h-3 w-3 text-accent-foreground" />
                </button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0 rounded-full"
              >
                <CalendarIcon className="h-4 w-4" />
              </Button>
            )}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Sort by nearest toggle — only when a city is provided */}
      {trimmedQuery && (
        <div className="mb-md flex items-center gap-2">
          <Button
            variant={sortByNearest ? "default" : "outline"}
            size="sm"
            className="gap-1.5"
            onClick={() => setSortByNearest(!sortByNearest)}
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            {sortByNearest ? "Sorted by nearest" : "Sort by nearest"}
          </Button>
        </div>
      )}

      {/* Empty query → show discovery helpers */}
      {!trimmedQuery && (
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
      {trimmedQuery && (
        <div className="flex flex-col gap-sm pb-md">
          {isLoading ? (
            <p className="py-xl text-center text-sm text-muted-foreground">
              Loading matches near "{trimmedQuery}"…
            </p>
          ) : results.length === 0 ? (
            <p className="py-xl text-center text-sm text-muted-foreground">
              No matches found for "{trimmedQuery}"
              {selectedDate && ` on ${format(selectedDate, "MMMM d, yyyy")}`}.
            </p>
          ) : (
            results.map((match) => (
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
