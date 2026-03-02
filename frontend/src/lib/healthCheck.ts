/**
 * healthCheck — lightweight connectivity probe for the backend.
 *
 * Uses the existing FastAPI `/health` endpoint which lives at the
 * backend root (not under `/api`). We derive the base URL from
 * API_BASE_URL by stripping a trailing `/api` when present, then
 * append `/health`.
 *
 * This is intentionally kept small and dependency-free so it can be
 * called during app boot (e.g. while the splash screen is visible)
 * without pulling in the entire data-fetching stack.
 */
import { API_BASE_URL } from "@/lib/constants";

function resolveHealthUrl(): string {
  try {
    const url = new URL(API_BASE_URL, window.location.origin);
    // If API_BASE_URL ends with /api or /api/, drop that segment.
    if (url.pathname === "/api" || url.pathname === "/api/") {
      url.pathname = "/health";
    } else {
      // Fallback: just append /health relative to the configured base.
      url.pathname = `${url.pathname.replace(/\/+$/, "")}/health`;
    }
    return url.toString();
  } catch {
    // If API_BASE_URL is something unexpected, fall back to same-origin /health.
    return "/health";
  }
}

export async function healthCheck(): Promise<void> {
  const endpoint = resolveHealthUrl();
  const controller = new AbortController();

  // Hard timeout so the splash experience is predictable even when
  // the network is slow or the backend host is unreachable.
  const timeout = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(endpoint, {
      method: "GET",
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`Health check failed with status ${res.status}`);
    }
  } finally {
    clearTimeout(timeout);
  }
}

