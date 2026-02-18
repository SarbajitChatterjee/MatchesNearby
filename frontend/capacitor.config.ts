import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor config for native iOS/Android deployment.
 *
 * ── Development mode ──
 * The `server.url` below points to the Lovable preview so the native
 * shell hot-reloads your latest edits without rebuilding.
 *
 * ── Production mode ──
 * Remove (or comment out) the entire `server` block so the app loads
 * from the bundled `dist/` files instead:
 *
 *   // server: { ... },
 *
 * Then run:  npm run build && npx cap sync
 */
const config: CapacitorConfig = {
  appId: "MatchesNearby/SarbajitChatterjee/com.github", // Unique appID in the entire mobile ecosystem, cannot be chnaged after publishing to app stores.
  appName: "MatchNearby_Alpha1",
  webDir: "dist",
  // server: {
  //   url: "https://63d3623d-615b-44d7-9a19-076ac77da0a9.lovableproject.com?forceHideBadge=true",
  //   cleartext: true,
  // },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 0, // 0 because app has its own SplashScreen component
      backgroundColor: "#000000",
    },
    StatusBar: {
      style: "DARK", // light text on dark background
      backgroundColor: "#000000",
    },
  },
};

export default config;
