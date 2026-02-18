/**
 * MapView — interactive Leaflet map for match venue pins.
 *
 * Why vanilla Leaflet instead of react-leaflet?
 * react-leaflet has tight React version coupling and often
 * breaks on upgrades. Vanilla Leaflet + useRef gives us full
 * control with zero version conflicts.
 *
 * Stacking context fix:
 * Leaflet internally sets z-index: 400+ on tile panes.
 * The `z-0` class on the container creates a new stacking context
 * so the map never bleeds above our header / modals.
 *
 * Marker lifecycle:
 * On every `matches` change, all existing markers are cleared
 * and rebuilt. This is simple and correct for our data size
 * (<100 markers). For thousands, switch to a clustering plugin.
 */

import { useEffect, useRef } from "react";
import L from "leaflet";
import type { Match } from "@/types/sdui";
import { useTheme } from "@/hooks/useTheme";

interface MapViewProps {
  matches: Match[];
  onMatchSelect?: (match: Match) => void;
  className?: string;
}

const LIGHT_TILES = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const DARK_TILES = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

/** Custom SVG pin icon — avoids loading external marker images */
function createPinIcon() {
  return L.divIcon({
    className: "",
    iconSize: [24, 32],
    iconAnchor: [12, 32],
    popupAnchor: [0, -34],
    html: `<svg width="24" height="32" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20c0-6.6-5.4-12-12-12z" fill="hsl(217,91%,60%)"/>
      <circle cx="12" cy="12" r="5" fill="white"/>
    </svg>`,
  });
}

export function MapView({ matches, onMatchSelect, className }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileRef = useRef<L.TileLayer | null>(null);
  const { isDark } = useTheme();

  /* Initialise map once on mount */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center: L.LatLngExpression =
      matches.length > 0
        ? [matches[0].latitude ?? 51.505, matches[0].longitude ?? -0.09]
        : [51.505, -0.09];

    const map = L.map(containerRef.current, {
      center,
      zoom: 6,
      scrollWheelZoom: false,
      zoomControl: false,
      attributionControl: false,
    });

    tileRef.current = L.tileLayer(isDark ? DARK_TILES : LIGHT_TILES).addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      tileRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Swap tile layer URL when theme toggles */
  useEffect(() => {
    if (!mapRef.current || !tileRef.current) return;
    tileRef.current.setUrl(isDark ? DARK_TILES : LIGHT_TILES);
  }, [isDark]);

  /* Rebuild markers whenever matches change */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    /* Clear all existing markers before adding new ones */
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) map.removeLayer(layer);
    });

    const icon = createPinIcon();

    matches.filter((m) => m.latitude && m.longitude).forEach((match) => {
      const marker = L.marker([match.latitude!, match.longitude!], { icon })
        .addTo(map)
        .bindPopup(
          `<span style="font-weight:600;font-size:12px">${match.homeTeam} vs ${match.awayTeam}</span><br/><span style="font-size:10px">${match.venue}</span>`
        );

      if (onMatchSelect) {
        marker.on("click", () => onMatchSelect(match));
      }
    });

    /* Fit map bounds to show all markers */
    const geoMatches = matches.filter((m) => m.latitude && m.longitude);
    if (geoMatches.length > 0) {
      const bounds = L.latLngBounds(
        geoMatches.map((m) => [m.latitude!, m.longitude!] as L.LatLngTuple)
      );
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 13 });
    }
  }, [matches, onMatchSelect]);

  return (
    <div
      ref={containerRef}
      className={`relative z-0 overflow-hidden rounded-xl ${className ?? ""}`}
    />
  );
}
