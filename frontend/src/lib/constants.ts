/**
 * App-wide constants.
 *
 * IS_DEVELOPER — when true, the app skips the auth gate so you can
 * move directly into the main experience without login/signup flows.
 * Flip to false for production / user-facing builds.
 *
 * USE_MOCK_DATA — when true, data-fetching hooks return static mock
 * data instead of calling the real backend. Flip to false when the
 * API is ready and you want live data.
 *
 * API_BASE_URL — points to the FastAPI backend. Defaults to "/api"
 * so that in production the frontend can be served from the same
 * domain via a reverse proxy. Override with VITE_API_BASE_URL env
 * var for local development against a remote API.
 */
export const IS_DEVELOPER = true;

export const USE_MOCK_DATA = true;

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "/api";
