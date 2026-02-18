/**
 * ExploreScreen — the default "home" tab.
 */

import { useState, useCallback } from "react";
import { format } from "date-fns";
import { CalendarIcon, X, MapPin } from "lucide-react";
import { MapView } from "@/components/MapView";
import { FilterBar } from "@/components/FilterBar";
import { MatchCard } from "@/components/MatchCard";
import { useMatches, useFilters, useSorts } from "@/hooks/useMatches";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Match } from "@/types/sdui";

interface ExploreScreenProps {
  onMatchSelect: (match: Match) => void;
  isSaved: (id: string) => boolean;
  onToggleSave: (match: Match) => void;
}

export function ExploreScreen({
  onMatchSelect,
  isSaved,
  onToggleSave,
}: ExploreScreenProps) {
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState<"date" | "distance">("date");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [userCity, setUserCity] = useState("");
  const [detectingCity, setDetectingCity] = useState(false);
  const { toast } = useToast();

  const detectCity = useCallback(async () => {
    setDetectingCity(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      );
      const { latitude, longitude } = pos.coords;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      const city = data.address?.city || data.address?.town || data.address?.village || "";
      if (city) {
        setUserCity(city);
        setSort("distance");
      } else {
        toast({ title: "Could not determine your city", variant: "destructive" });
      }
    } catch {
      toast({ title: "Location access denied or unavailable", variant: "destructive" });
      setSort("date");
    } finally {
      setDetectingCity(false);
    }
  }, [toast]);

  const handleSortChange = useCallback(
    (value: "date" | "distance") => {
      if (value === "distance" && !userCity) {
        detectCity();
      } else {
        setSort(value);
      }
    },
    [userCity, detectCity]
  );

  const { data: matches = [], isLoading } = useMatches({
    filter,
    sort,
    date: selectedDate,
    city: sort === "distance" ? userCity : undefined,
  });
  const { data: filters = [] } = useFilters();
  const { data: sorts = [] } = useSorts();

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setCalendarOpen(false);
  };

  return (
    <div className="animate-fade-in">
      {/* Map section */}
      <div className="px-md pt-md">
        <MapView
          matches={matches}
          onMatchSelect={onMatchSelect}
          className="h-44 md:h-60"
        />
      </div>

      {/* Filter + sort + date picker row */}
      <div className="flex items-center gap-xs pr-md">
        <div className="flex-1 min-w-0">
          <FilterBar
            filters={filters}
            activeFilter={filter}
            onFilterChange={setFilter}
            sorts={sorts}
            activeSort={sort}
            onSortChange={handleSortChange}
          />
        </div>

        {/* City label when sorting by distance */}
        {sort === "distance" && userCity && (
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-accent px-2.5 py-1">
            <MapPin className="h-3 w-3 text-accent-foreground" />
            <span className="text-xs font-medium text-accent-foreground">
              Near {userCity}
            </span>
          </div>
        )}

        {detectingCity && (
          <span className="shrink-0 text-xs text-muted-foreground animate-pulse">
            Locating…
          </span>
        )}

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
                className="h-8 w-8 shrink-0 rounded-full"
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

      {/* Match list */}
      <div className="flex flex-col gap-sm px-md pb-md">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg bg-secondary"
            />
          ))
        ) : matches.length === 0 ? (
          <p className="py-xl text-center text-sm text-muted-foreground">
            {selectedDate
              ? `No matches on ${format(selectedDate, "MMMM d, yyyy")}.`
              : "No matches found for this filter."}
          </p>
        ) : (
          matches.map((match) => (
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
    </div>
  );
}
