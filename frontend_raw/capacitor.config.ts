import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor config for native iOS/Android deployment.
 *
 * The server.url points to the Lovable preview for hot-reload
 * during development. Remove or change it for production builds.
 */
const config: CapacitorConfig = {
  appId: "app.lovable.63d3623d615b44d79a19076ac77da0a9",
  appName: "MatchNearby",
  webDir: "dist",
  server: {
    url: "https://63d3623d-615b-44d7-9a19-076ac77da0a9.lovableproject.com?forceHideBadge=true",
    cleartext: true,
  },
};

export default config;
