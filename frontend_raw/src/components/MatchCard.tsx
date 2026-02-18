/**
 * MatchCard — compact card showing a single upcoming match.
 *
 * Key design decisions:
 * - "SOON" badge: shown when kickoff is < 24 hours away.
 *   This creates urgency and draws attention to imminent matches.
 * - Save button uses e.stopPropagation() so tapping the heart
 *   doesn't also trigger the card's onPress (navigation to detail).
 * - Distance display auto-formats: < 1km shows meters, ≥ 1km shows km.
 */

import { format } from "date-fns";
import { MapPin, Clock, Heart } from "lucide-react";
import type { Match } from "@/types/sdui";
import { cn } from "@/lib/utils";

interface MatchCardProps {
  match: Match;
  isSaved?: boolean;
  onToggleSave?: () => void;
  onPress?: () => void;
}

export function MatchCard({
  match,
  isSaved,
  onToggleSave,
  onPress,
}: MatchCardProps) {
  const kickoffDate = new Date(match.kickoff);

  /* Show "SOON" badge when match is within 24 hours */
  const isUpcomingSoon =
    kickoffDate.getTime() - Date.now() < 24 * 60 * 60 * 1000;

  return (
    <button
      onClick={onPress}
      className="w-full rounded-lg border bg-card p-md text-left shadow-sm transition-all active:scale-[0.98]"
    >
      {/* Competition badge + live/soon indicator */}
      <div className="mb-sm flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-muted-foreground">
            {match.competition}
          </span>
          {match.gameweek && (
            <span className="text-[10px] text-muted-foreground/70">
              {match.gameweek}
            </span>
          )}
        </div>
        <div className="flex items-center gap-sm">
          {isUpcomingSoon && (
            <span className="rounded-full bg-urgent/15 px-2 py-0.5 text-[10px] font-semibold text-urgent">
              SOON
            </span>
          )}
          {onToggleSave && (
            <button
              onClick={(e) => {
                /* Prevent card navigation when tapping save */
                e.stopPropagation();
                onToggleSave();
              }}
              className="p-1"
              aria-label={isSaved ? "Remove from saved" : "Save match"}
            >
              <Heart
                className={cn(
                  "h-4 w-4 transition-colors",
                  isSaved
                    ? "fill-accent text-accent"
                    : "text-muted-foreground"
                )}
              />
            </button>
          )}
        </div>
      </div>

      {/* Teams */}
      <div className="mb-sm flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">
          {match.homeTeam}
        </span>
        <span className="text-xs font-medium text-muted-foreground">vs</span>
        <span className="text-sm font-semibold text-foreground">
          {match.awayTeam}
        </span>
      </div>

      {/* Meta: time + venue + distance */}
      <div className="flex flex-wrap items-center gap-x-md gap-y-xs text-xs text-muted-foreground">
        <span className="flex items-center gap-xs">
          <Clock className="h-3 w-3 shrink-0" />
          {format(kickoffDate, "EEE d MMM · HH:mm")}
        </span>
        <span className="flex items-center gap-xs">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="max-w-[120px] truncate">{match.venue}</span>
        </span>
        {match.distance != null && (
          <span className="ml-auto shrink-0 text-[10px]">
            {match.distance < 1
              ? `${Math.round(match.distance * 1000)}m`
              : `${match.distance.toFixed(1)}km`}
          </span>
        )}
      </div>
    </button>
  );
}
