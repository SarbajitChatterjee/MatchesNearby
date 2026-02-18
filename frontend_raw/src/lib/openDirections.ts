/**
 * openDirections — opens the venue in the platform's native maps app.
 *
 * Uses venue name + city (not raw coordinates) so the maps app shows
 * the real place with reviews, photos, etc.
 *
 * Platform detection:
 * - iOS → maps://?q=Venue+City
 * - Android/other → geo:0,0?q=Venue+City
 * - Desktop fallback → Google Maps URL
 */

function isIOS(): boolean {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function openDirections(
  venue: string,
  venueCity?: string,
  lat?: number,
  lng?: number
) {
  const query = [venue, venueCity].filter(Boolean).join(" ");
  const encoded = encodeURIComponent(query);

  if (isIOS()) {
    window.location.href = `maps://?q=${encoded}`;
    return;
  }

  // Android or other mobile — try geo: URI
  const geoUrl = `geo:0,0?q=${encoded}`;
  const fallbackUrl =
    lat != null && lng != null
      ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encoded}`;

  // Try geo: scheme, fall back to Google Maps for desktop
  const w = window.open(geoUrl, "_blank");
  if (!w || w.closed) {
    window.open(fallbackUrl, "_blank");
  }
}
