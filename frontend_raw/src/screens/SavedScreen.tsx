/**
 * SavedScreen — displays the user's bookmarked matches.
 *
 * Data source: useSavedMatches hook (localStorage-backed).
 *
 * Empty state pattern:
 * When no matches are saved, a friendly illustration + message
 * guides the user to explore and save matches. This avoids a
 * blank screen which would confuse new users.
 */

import { Heart } from "lucide-react";
import { MatchCard } from "@/components/MatchCard";
import type { Match } from "@/types/sdui";

interface SavedScreenProps {
  matches: Match[];
  onMatchSelect: (match: Match) => void;
  onToggleSave: (match: Match) => void;
}

export function SavedScreen({
  matches,
  onMatchSelect,
  onToggleSave,
}: SavedScreenProps) {
  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-md pt-md py-2xl text-center animate-fade-in">
        <div className="mb-md flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
          <Heart className="h-7 w-7 text-muted-foreground" />
        </div>
        <h2 className="mb-xs text-lg font-semibold text-foreground">
          No saved matches
        </h2>
        <p className="text-sm text-muted-foreground">
          Tap the heart icon on any match to save it here for quick access.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in px-md pt-md">
      <h2 className="mb-md text-lg font-semibold text-foreground">
        Saved matches
      </h2>
      <div className="flex flex-col gap-sm pb-md">
        {matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            isSaved
            onToggleSave={() => onToggleSave(match)}
            onPress={() => onMatchSelect(match)}
          />
        ))}
      </div>
    </div>
  );
}
