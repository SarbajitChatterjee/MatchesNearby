/**
 * FilterBar — horizontally scrollable chip bar for filters and sorts.
 *
 * Pattern: a single-row overflow container with left/right arrow
 * buttons that appear when content is scrollable. Chips are rendered
 * from server-driven FilterOption[] and SortOption[] arrays, making
 * it easy to add new categories from the backend without touching UI.
 *
 * Scroll detection runs on scroll + resize events with a 2px
 * threshold to avoid flickering at exact boundaries.
 */

import { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FilterOption, SortOption } from "@/types/sdui";

interface FilterBarProps {
  filters: FilterOption[];
  activeFilter: string;
  onFilterChange: (value: string) => void;
  sorts?: SortOption[];
  activeSort?: string;
  onSortChange?: (value: "date" | "distance") => void;
}

export function FilterBar({
  filters,
  activeFilter,
  onFilterChange,
  sorts,
  activeSort,
  onSortChange,
}: FilterBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  /** Check whether the container has overflow in either direction */
  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    el?.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el?.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll, filters, sorts]);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -120 : 120, behavior: "smooth" });
  };

  return (
    <div className="relative flex items-center px-md py-sm">
      {/* Left scroll arrow — only visible when overflowed */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-1 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-card shadow-sm border border-border"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-3.5 w-3.5 text-foreground" />
        </button>
      )}

      {/* Chips container — scrollbar hidden via utility class */}
      <div
        ref={scrollRef}
        className="flex gap-sm overflow-x-auto scrollbar-hide"
      >
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => onFilterChange(f.value)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              activeFilter === f.value
                ? "bg-accent text-accent-foreground"
                : "bg-secondary text-secondary-foreground"
            )}
          >
            {f.label}
          </button>
        ))}

        {/* Visual separator between filter and sort chips */}
        {sorts && sorts.length > 0 && (
          <div className="mx-xs w-px shrink-0 self-stretch bg-border" />
        )}

        {sorts?.map((s) => (
          <button
            key={s.id}
            onClick={() => onSortChange?.(s.value)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              activeSort === s.value
                ? "bg-accent text-accent-foreground"
                : "bg-secondary text-secondary-foreground"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Right scroll arrow */}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-1 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-card shadow-sm border border-border"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-3.5 w-3.5 text-foreground" />
        </button>
      )}
    </div>
  );
}
