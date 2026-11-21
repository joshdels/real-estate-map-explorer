"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import { formatDistance, type NearbyCategory, type NearbyPlace } from "@/lib/nearby";

const BASEMAPS = {
  imagery: {
    tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
    maxzoom: 18,
    attribution: "Imagery &copy; Esri",
  },
  roads: {
    tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"],
    // Esri's street tiles thin out in rural areas; cap the source here so MapLibre
    // overzooms (scales up) the last real tile instead of fetching blank ones.
    maxzoom: 16,
    attribution: "&copy; Esri",
  },
  osm: {
    tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
    maxzoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  },
} as const;

export type BasemapKey = keyof typeof BASEMAPS;

// Same-origin worker; Next.js does not emit MapLibre's module worker URL.
maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");

type Coord = [number, number];

function reducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function bounds(polygon: Coord[]): [[number, number], [number, number]] {
  const lats = polygon.map(([lat]) => lat);
  const lngs = polygon.map(([, lng]) => lng);
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];
}

function nearbyPin(place: NearbyPlace, icon: string): HTMLElement {
  const element = document.createElement("span");
  element.className = `nearby-pin nearby-pin-${place.category}`;
  element.title = place.name;
  const glyph = document.createElement("i");
  glyph.className = `ph ph-${icon}`;
  glyph.setAttribute("aria-hidden", "true");
  element.append(glyph);
  return element;
}

const CATEGORY_ICON: Record<NearbyCategory, string> = {
  school: "graduation-cap",
  transport: "bus",
  dining: "fork-knife",
  cafe: "coffee",
  groceries: "shopping-cart",
  health: "first-aid-kit",
  finance: "bank",
};

export function PropertyMiniMap({
  coordinates,
  polygon,
  nearby = [],
  activeCategory = null,
  basemap = "imagery",
}: {
  coordinates: Coord;
  polygon: Coord[];
  nearby?: NearbyPlace[];
  activeCategory?: NearbyCategory | null;
  basemap?: BasemapKey;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [ready, setReady] = useState(false);

  // Build the map once. All three basemaps are added as layers and toggled by
  // visibility so switching never re-downloads the lot outline.
  useEffect(() => {
    if (!ref.current) return;
    const [lat, lng] = coordinates;
    const map = new maplibregl.Map({
      container: ref.current,
      style: {
        version: 8,
        sources: Object.fromEntries(
          Object.entries(BASEMAPS).map(([key, value]) => [
            key,
            { type: "raster", tiles: [...value.tiles], tileSize: 256, maxzoom: value.maxzoom, attribution: value.attribution },
          ]),
        ),
        layers: (Object.keys(BASEMAPS) as BasemapKey[]).map((key) => ({
          id: key,
          type: "raster",
          source: key,
          layout: { visibility: key === "imagery" ? "visible" : "none" },
        })),
      },
      center: [lng, lat],
      zoom: 16,
      minZoom: 10,
      maxZoom: 18,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.FullscreenControl(), "top-right");
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 110, unit: "metric" }), "bottom-left");

    new maplibregl.Marker({ color: "#4f57e3" }).setLngLat([lng, lat]).addTo(map);

    map.on("load", () => {
      if (polygon && polygon.length >= 3) {
        const ring = [...polygon, polygon[0]].map(([la, ln]) => [ln, la]);
        map.addSource("lot", {
          type: "geojson",
          data: { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [ring] } },
        });
        map.addLayer({ id: "lot-fill", type: "fill", source: "lot", paint: { "fill-color": "#4f57e3", "fill-opacity": 0.22 } });
        map.addLayer({ id: "lot-line", type: "line", source: "lot", paint: { "line-color": "#6f78f0", "line-width": 2 } });
        map.fitBounds(bounds(polygon), { padding: 64, maxZoom: 17, duration: 0 });
      }
      setReady(true);
    });

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, [coordinates, polygon]);

  // Toggle the active basemap. The camera can still zoom to 18 on every basemap;
  // where a basemap's own tiles stop sooner (see each source's maxzoom) MapLibre
  // overzooms the last real tile, so the view never falls back to blank tiles.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    (Object.keys(BASEMAPS) as BasemapKey[]).forEach((key) => {
      map.setLayoutProperty(key, "visibility", key === basemap ? "visible" : "none");
    });
    map.setMaxZoom(18);
  }, [basemap, ready]);

  // Render the nearby markers for the active category (or all when none).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    markersRef.current.forEach((marker) => marker.remove());

    // One reused popup shows the hovered (or focused) place's name and distance.
    const popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 16,
      className: "nearby-popup",
    });

    const shown = activeCategory ? nearby.filter((place) => place.category === activeCategory) : nearby;
    markersRef.current = shown.map((place) => {
      const [plat, plng] = place.coordinates;
      const element = nearbyPin(place, CATEGORY_ICON[place.category]);
      element.tabIndex = 0;
      element.setAttribute("role", "button");
      element.setAttribute("aria-label", `${place.name}, ${formatDistance(place.distanceM)} away`);
      const open = () => {
        popup
          .setLngLat([plng, plat])
          .setHTML(
            `<strong class="nearby-popup-name"></strong><span class="nearby-popup-meta"></span>`,
          )
          .addTo(map);
        const root = popup.getElement();
        const name = root?.querySelector(".nearby-popup-name");
        const meta = root?.querySelector(".nearby-popup-meta");
        if (name) name.textContent = place.name;
        if (meta) meta.textContent = `${formatDistance(place.distanceM)} away · ${place.subtype}`;
      };
      const close = () => popup.remove();
      element.addEventListener("pointerenter", open);
      element.addEventListener("pointerleave", close);
      element.addEventListener("focus", open);
      element.addEventListener("blur", close);
      return new maplibregl.Marker({ element, anchor: "center" })
        .setLngLat([plng, plat])
        .addTo(map);
    });
    // When a single category is toggled, frame the lot and those places so the
    // map visibly moves to that set of points.
    if (activeCategory && shown.length > 0) {
      const box = new maplibregl.LngLatBounds([coordinates[1], coordinates[0]], [coordinates[1], coordinates[0]]);
      shown.forEach((place) => box.extend([place.coordinates[1], place.coordinates[0]]));
      map.fitBounds(box, { padding: 56, maxZoom: 16, duration: reducedMotion() ? 0 : 600 });
    } else if (polygon && polygon.length >= 3) {
      map.fitBounds(bounds(polygon), { padding: 64, maxZoom: 17, duration: reducedMotion() ? 0 : 600 });
    }

    return () => {
      popup.remove();
    };
  }, [nearby, activeCategory, ready, coordinates, polygon]);

  return <div ref={ref} className="detail-minimap-interactive" aria-label="Interactive lot plan location map" />;
}
