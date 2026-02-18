/**
 * useMatches — React Query hook for fetching matches.
 *
 * Dual-mode data source:
 * - IS_DEVELOPER=true → returns mock data with a simulated 300ms delay
 *   so loading skeletons are visible during development.
 * - IS_DEVELOPER=false → calls the real FastAPI backend via API_BASE_URL,
 *   passing filter/sort as query params, and adapts the response through
 *   the matchAdapter.
 *
 * Query key structure: ["matches", { filter, sort }]
 * React Query auto-refetches when filter/sort options change.
 *
 * useFilters / useSorts — return static mock data for now.
 * When the backend ships a /filters endpoint, swap the queryFn.
 */

import { useQuery } from "@tanstack/react-query";
import { MOCK_MATCHES, MOCK_FILTERS, MOCK_SORTS } from "@/data/mockMatches";
import { IS_DEVELOPER, API_BASE_URL } from "@/lib/constants";
import { toMatchList } from "@/lib/matchAdapter";
import type { Match, FilterOption, SortOption } from "@/types/sdui";

interface UseMatchesOptions {
  filter?: string;
  sort?: "date" | "distance";
  date?: Date;
  city?: string;
}

export function useMatches(options: UseMatchesOptions = {}) {
  return useQuery<Match[]>({
    queryKey: ["matches", { ...options, date: options.date?.toISOString()?.slice(0, 10), city: options.city }],
    queryFn: async () => {
      if (IS_DEVELOPER) {
        /* Simulate network latency so skeletons render in dev */
        await new Promise((r) => setTimeout(r, 300));

        let results = [...MOCK_MATCHES];

        if (options.filter && options.filter !== "all") {
          results = results.filter((m) => m.competitionType === options.filter);
        }

        /* Date filter — match on same calendar day */
        if (options.date) {
          const d = options.date;
          results = results.filter((m) => {
            const k = new Date(m.kickoff);
            return (
              k.getFullYear() === d.getFullYear() &&
              k.getMonth() === d.getMonth() &&
              k.getDate() === d.getDate()
            );
          });
        }

        if (options.sort === "distance") {
          results.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
        } else {
          results.sort(
            (a, b) =>
              new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
          );
        }

        return results;
      }

      /* ── Real API path ── */
      const params = new URLSearchParams();
      if (options.filter && options.filter !== "all")
        params.set("filter", options.filter);
      if (options.sort) params.set("sort", options.sort);
      if (options.date)
        params.set("date", options.date.toISOString().slice(0, 10));
      if (options.city) params.set("city", options.city);

      const res = await fetch(`${API_BASE_URL}/matches?${params}`);
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const json = await res.json();
      return toMatchList(json.matches);
    },
  });
}

/** Static filter options — swap queryFn when backend provides /filters */
export function useFilters() {
  return useQuery<FilterOption[]>({
    queryKey: ["filters"],
    queryFn: async () => MOCK_FILTERS,
  });
}

/** Static sort options — swap queryFn when backend provides /sorts */
export function useSorts() {
  return useQuery<SortOption[]>({
    queryKey: ["sorts"],
    queryFn: async () => MOCK_SORTS,
  });
}
