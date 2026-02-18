/**
 * AppHeader — fixed top navigation bar.
 *
 * Always visible at the top of every screen. Uses the design token
 * --header-height for consistent spacing and --safe-area-top to
 * respect device notches / status bars (iOS, Android).
 *
 * Features:
 * - Hamburger menu button → opens SportsSidebar (passed via onMenuToggle)
 * - Brand logo
 * - Dark mode toggle button
 */

import { Moon, Sun, Menu } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

interface AppHeaderProps {
  onMenuToggle?: () => void;
}

export function AppHeader({ onMenuToggle }: AppHeaderProps) {
  const { isDark, toggle } = useTheme();

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 flex h-header items-center justify-between border-b bg-card/95 px-md backdrop-blur-md"
      style={{ paddingTop: "var(--safe-area-top)" }}
    >
      <div className="flex items-center gap-sm">
        {/* Hamburger — only rendered when a toggle handler is provided */}
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-secondary"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-4 w-4 text-muted-foreground" />
          </button>
        )}

        <h1 className="text-base font-bold tracking-tight text-foreground">
          Match<span className="text-accent">Nearby</span>
        </h1>
      </div>

      <button
        onClick={toggle}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary transition-colors hover:bg-accent/10"
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? (
          <Sun className="h-4 w-4 text-accent" />
        ) : (
          <Moon className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
    </header>
  );
}
