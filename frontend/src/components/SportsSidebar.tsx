/**
 * SportsSidebar — slide-out sport selector panel.
 *
 * Design: overlay-only on all viewports (no persistent desktop sidebar).
 * This keeps the main content full-width and avoids layout complexity.
 * The sidebar opens via the hamburger in AppHeader and closes on
 * backdrop click or the X button.
 *
 * Currently only "Football" is active; other sports show "Soon" badges
 * and are disabled. When new sports are added on the backend, simply
 * toggle `active: true` in the sports array.
 */

import { Dribbble, CircleDot, Trophy, Globe, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SportsSidebarProps {
  open: boolean;
  onClose: () => void;
}

const sports = [
  { id: "football", label: "Football", icon: Dribbble, active: true },
  { id: "basketball", label: "Basketball", icon: CircleDot, active: false },
  { id: "tennis", label: "Tennis", icon: Trophy, active: false },
  { id: "rugby", label: "Rugby", icon: Globe, active: false },
];

export function SportsSidebar({ open, onClose }: SportsSidebarProps) {
  return (
    <>
      {/* Backdrop — click to dismiss */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel — slides in from the left */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r bg-card transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ paddingTop: "var(--safe-area-top)" }}
      >
        {/* Header */}
        <div className="flex h-header items-center justify-between border-b px-md">
          <span className="text-sm font-semibold text-foreground">Sports</span>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-secondary"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Sport list */}
        <nav className="flex-1 px-sm py-md">
          <ul className="flex flex-col gap-xs">
            {sports.map((sport) => (
              <li key={sport.id}>
                <button
                  className={cn(
                    "flex w-full items-center gap-sm rounded-lg px-md py-sm text-sm font-medium transition-colors",
                    sport.active
                      ? "bg-accent/10 text-accent"
                      : "text-muted-foreground hover:bg-secondary"
                  )}
                  disabled={!sport.active}
                >
                  <sport.icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left">{sport.label}</span>
                  {!sport.active && (
                    <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground">
                      Soon
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}
