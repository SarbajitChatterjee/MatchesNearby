/**
 * useTheme — dark/light mode toggle with localStorage persistence.
 *
 * How it works:
 * Tailwind's dark mode is configured as "class" strategy, meaning
 * the `dark` class on <html> activates all `dark:` variants.
 * This hook toggles that class and persists the choice so it
 * survives page reloads.
 *
 * Returns: { theme, toggle, isDark }
 * - theme: "light" | "dark" — also consumed by Sonner for toast theming
 * - toggle: flip between modes
 * - isDark: convenience boolean for conditional rendering
 */

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "matchnearby-theme";

type Theme = "light" | "dark";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    return (localStorage.getItem(STORAGE_KEY) as Theme) || "light";
  });

  /* Sync the `dark` class on <html> whenever theme changes */
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setThemeState((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  return { theme, toggle, isDark: theme === "dark" };
}
