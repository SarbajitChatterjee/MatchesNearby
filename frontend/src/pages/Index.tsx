/**
 * Index — main app shell after authentication.
 *
 * Architecture: single-page tab layout.
 * - AppHeader (fixed top) with sidebar toggle + theme switch
 * - BottomTabs (fixed bottom) for Explore / Search / Saved / Profile
 * - Active screen renders in the scrollable main area between them
 *
 * Match detail takeover:
 * When a match is selected, the entire shell is replaced by MatchDetail.
 * This avoids nested routing complexity — it's a simple state swap.
 * The "Back" button in MatchDetail sets selectedMatch back to null.
 *
 * Saved matches:
 * The useSavedMatches hook is lifted here so saved state is shared
 * across all tabs (Explore can save, Saved can unsave, etc.).
 */

import { useState, useCallback } from "react";
import { AppHeader } from "@/components/AppHeader";
import { BottomTabs, type TabId } from "@/components/BottomTabs";
import { SportsSidebar } from "@/components/SportsSidebar";
import { ExploreScreen } from "@/screens/ExploreScreen";
import { SearchScreen } from "@/screens/SearchScreen";
import { SavedScreen } from "@/screens/SavedScreen";
import { ProfileScreen } from "@/screens/ProfileScreen";
import { MatchDetail } from "@/components/MatchDetail";
import { useSavedMatches } from "@/hooks/useSavedMatches";
import type { Match } from "@/types/sdui";
import { toast } from "sonner";

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabId>("explore");
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { saved, toggleSave, isSaved } = useSavedMatches();

  const handleSetReminder = useCallback(() => {
    toast.success("Reminder set! We'll notify you before kickoff.", {
      duration: 2500,
    });
  }, []);

  /* Match detail takeover — replaces the entire tab layout */
  if (selectedMatch) {
    return (
      <MatchDetail
        match={selectedMatch}
        isSaved={isSaved(selectedMatch.id)}
        onToggleSave={() => toggleSave(selectedMatch)}
        onSetReminder={handleSetReminder}
        onBack={() => setSelectedMatch(null)}
      />
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sports sidebar — overlay on all viewports */}
      <SportsSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col">
        <AppHeader onMenuToggle={() => setSidebarOpen((p) => !p)} />

        <main
          className="flex-1 overflow-y-auto"
          style={{
            paddingTop: "calc(var(--header-height) + var(--safe-area-top))",
            paddingBottom:
              "calc(var(--tab-bar-height) + var(--safe-area-bottom))",
          }}
        >
          {activeTab === "explore" && (
            <ExploreScreen
              onMatchSelect={setSelectedMatch}
              isSaved={isSaved}
              onToggleSave={toggleSave}
            />
          )}
          {activeTab === "search" && (
            <SearchScreen
              onMatchSelect={setSelectedMatch}
              isSaved={isSaved}
              onToggleSave={toggleSave}
            />
          )}
          {activeTab === "saved" && (
            <SavedScreen
              matches={saved}
              onMatchSelect={setSelectedMatch}
              onToggleSave={toggleSave}
            />
          )}
          {activeTab === "profile" && <ProfileScreen />}
        </main>

        <BottomTabs active={activeTab} onChange={setActiveTab} />
      </div>
    </div>
  );
};

export default Index;
