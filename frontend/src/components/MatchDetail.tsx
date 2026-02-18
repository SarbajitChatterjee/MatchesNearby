/**
 * MatchDetail — full-screen match information view.
 *
 * Takes over the entire viewport (replaces the tab layout in Index).
 * Shows everything a fan needs: teams, kickoff, venue, map, and actions.
 *
 * Directions URL:
 * Opens Google Maps with the venue coordinates as the destination.
 * On mobile devices, this automatically opens the native maps app.
 *
 * Map overlay button z-index:
 * The "Get directions" button sits above the Leaflet map, which
 * internally uses z-index 400+. We use z-[1000] to ensure it stays
 * clickable above all Leaflet panes.
 */

import { format } from "date-fns";
import { MapPin, Clock, Heart, Bell, ArrowLeft, Navigation } from "lucide-react";
import type { Match } from "@/types/sdui";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MapView } from "@/components/MapView";
import { openDirections } from "@/lib/openDirections";

interface MatchDetailProps {
  match: Match;
  isSaved: boolean;
  onToggleSave: () => void;
  onSetReminder?: () => void;
  onBack: () => void;
}

export function MatchDetail({
  match,
  isSaved,
  onToggleSave,
  onSetReminder,
  onBack,
}: MatchDetailProps) {
  const kickoff = new Date(match.kickoff);

  const handleDirections = () => {
    openDirections(match.venue, match.venueAddress, match.latitude, match.longitude);
  };

  return (
    <div className="animate-fade-in flex min-h-screen flex-col bg-background">
      {/* Back button */}
      <div
        className="flex h-header items-center px-md"
        style={{ paddingTop: "var(--safe-area-top)" }}
      >
        <button
          onClick={onBack}
          className="flex items-center gap-xs text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 px-md pb-2xl md:max-w-xl md:mx-auto">
        {/* Competition + gameweek */}
        <div className="mb-sm flex flex-wrap items-center gap-sm">
          <span className="inline-block rounded-full bg-accent/15 px-2.5 py-1 text-xs font-semibold text-accent">
            {match.competition}
          </span>
          {match.competitionType === "cup" && (
            <span className="inline-block rounded-full bg-urgent/15 px-2 py-0.5 text-[10px] font-semibold text-urgent">
              Cup
            </span>
          )}
          {match.gameweek && (
            <span className="text-xs text-muted-foreground">
              {match.gameweek}
            </span>
          )}
        </div>

        {/* Teams */}
        <div className="mb-lg mt-md">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            {match.homeTeam}
          </h2>
          <span className="text-sm text-muted-foreground">vs</span>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            {match.awayTeam}
          </h2>
        </div>

        {/* Date & time */}
        <div className="mb-md flex items-center gap-sm rounded-lg bg-secondary p-md">
          <Clock className="h-5 w-5 text-accent" />
          <div>
            <p className="text-sm font-medium text-foreground">
              {format(kickoff, "EEEE, d MMMM yyyy")}
            </p>
            <p className="text-xs text-muted-foreground">
              Kickoff at {format(kickoff, "HH:mm")} (local time)
            </p>
          </div>
        </div>

        {/* Venue */}
        <div className="mb-md flex items-center gap-sm rounded-lg bg-secondary p-md">
          <MapPin className="h-5 w-5 text-accent" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{match.venue}</p>
            {match.venueAddress && (
              <p className="text-xs text-muted-foreground">
                {match.venueAddress}
              </p>
            )}
          </div>
          {match.distance != null && (
            <span className="text-xs text-muted-foreground">
              {match.distance.toFixed(1)} km
            </span>
          )}
        </div>

        {/* Venue map with directions overlay */}
        <div className="relative mb-lg h-40 md:h-52 overflow-hidden rounded-xl">
          <MapView
            matches={[match]}
            className="h-full w-full"
          />
          <button
            onClick={handleDirections}
            className="absolute bottom-sm right-sm z-[1000] flex items-center gap-xs rounded-lg bg-card/90 px-3 py-1.5 text-xs font-medium text-accent shadow-md backdrop-blur-sm transition-colors hover:bg-card"
          >
            <Navigation className="h-3.5 w-3.5" />
            Get directions
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-md" style={{ paddingBottom: "var(--safe-area-bottom)" }}>
          <Button
            onClick={onToggleSave}
            variant={isSaved ? "default" : "outline"}
            className={cn(
              "flex-1 gap-sm",
              isSaved &&
                "bg-accent text-accent-foreground hover:bg-accent/90"
            )}
          >
            <Heart
              className={cn("h-4 w-4", isSaved && "fill-current")}
            />
            {isSaved ? "Saved" : "Save"}
          </Button>

          <Button
            onClick={onSetReminder}
            variant="outline"
            className="flex-1 gap-sm"
          >
            <Bell className="h-4 w-4" />
            Remind me
          </Button>
        </div>
      </div>
    </div>
  );
}
