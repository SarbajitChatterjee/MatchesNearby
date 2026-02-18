/**
 * App-wide constants.
 *
 * IS_DEVELOPER — when true, the app skips the auth gate and uses
 * mock data instead of hitting the real backend. Flip to false
 * for production / user-facing builds.
 *
 * API_BASE_URL — points to the FastAPI backend. Defaults to "/api"
 * so that in production the frontend can be served from the same
 * domain via a reverse proxy. Override with VITE_API_BASE_URL env
 * var for local development against a remote API.
 */
export const IS_DEVELOPER = true;

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "/api";
