/**
 * BottomTabs — fixed bottom tab bar for primary navigation.
 *
 * Uses design tokens:
 * - h-tab-bar for consistent height
 * - --safe-area-bottom padding so tabs don't hide behind
 *   the home indicator on iPhone / gesture-nav Android devices
 *
 * Active tab is highlighted with the accent colour; inactive
 * tabs use muted-foreground for a clear visual hierarchy.
 */

import { Compass, Search, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";

export type TabId = "explore" | "search" | "saved" | "profile";

interface BottomTabsProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; icon: typeof Compass }[] = [
  { id: "explore", label: "Explore", icon: Compass },
  { id: "search", label: "Search", icon: Search },
  { id: "saved", label: "Saved", icon: Heart },
  { id: "profile", label: "Profile", icon: User },
];

export function BottomTabs({ active, onChange }: BottomTabsProps) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 flex h-tab-bar items-start justify-around border-t bg-card/95 backdrop-blur-md"
      style={{ paddingBottom: "var(--safe-area-bottom)" }}
    >
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={cn(
            "flex flex-1 flex-col items-center gap-0.5 pt-2 text-[10px] font-medium transition-colors",
            active === id ? "text-accent" : "text-muted-foreground"
          )}
        >
          <Icon className="h-5 w-5" />
          {label}
        </button>
      ))}
    </nav>
  );
}
