/**
 * useSavedMatches — client-side bookmarking system.
 *
 * Persistence strategy:
 * Saved matches are stored as a JSON array in localStorage under
 * the key "matchnearby-saved". This avoids needing a backend for
 * a feature that's primarily a convenience shortcut.
 *
 * When real auth + backend is wired up, this can be replaced with
 * a server-backed favourites table without changing the hook API.
 *
 * Exports: saved (array), saveMatch, removeMatch, isSaved, toggleSave
 */

import { useState, useCallback, useEffect } from "react";
import type { Match } from "@/types/sdui";

const STORAGE_KEY = "matchnearby-saved";

export function useSavedMatches() {
  const [saved, setSaved] = useState<Match[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  /* Sync to localStorage whenever the saved array changes */
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  }, [saved]);

  const saveMatch = useCallback((match: Match) => {
    setSaved((prev) => {
      if (prev.some((m) => m.id === match.id)) return prev;
      return [...prev, match];
    });
  }, []);

  const removeMatch = useCallback((matchId: string) => {
    setSaved((prev) => prev.filter((m) => m.id !== matchId));
  }, []);

  const isSaved = useCallback(
    (matchId: string) => saved.some((m) => m.id === matchId),
    [saved]
  );

  const toggleSave = useCallback(
    (match: Match) => {
      if (isSaved(match.id)) removeMatch(match.id);
      else saveMatch(match);
    },
    [isSaved, removeMatch, saveMatch]
  );

  return { saved, saveMatch, removeMatch, isSaved, toggleSave };
}
