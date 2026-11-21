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

const CATEGORY_ORDER: NearbyCategory[] = ["school", "transport", "dining", "cafe", "groceries", "health", "finance"];

function nearbySourceId(category: NearbyCategory): string {
  return `nearby-src-${category}`;
}

// Categories cluster independently, so every bubble keeps one clear category
// icon even when the map is zoomed all the way out.
function updateClusterPin(element: HTMLElement, count: number, category: NearbyCategory): void {
  const icons = document.createElement("span");
  icons.className = "nearby-cluster-icons";
  icons.setAttribute("aria-hidden", "true");
  const icon = document.createElement("span");
  icon.className = "nearby-cluster-icon";
  const glyph = document.createElement("i");
  glyph.className = `ph ph-${CATEGORY_ICON[category]}`;
  icon.append(glyph);
  icons.append(icon);
  const total = document.createElement("span");
  total.className = "nearby-cluster-count";
  total.textContent = String(count);
  element.replaceChildren(icons, total);
  element.setAttribute(
    "aria-label",
    `${count} ${category} places here. Zoom in to separate them.`,
  );
}

function clusterPin(count: number, category: NearbyCategory): HTMLElement {
  const element = document.createElement("button");
  element.type = "button";
  element.className = `nearby-cluster nearby-cluster-${category}`;
  updateClusterPin(element, count, category);
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
  // Clustered HTML markers: one dictionary of all live markers keyed by a
  // stable id ("c"+clusterId for a cluster, "p"+placeId for a single place),
  // and the subset currently added to the map, so each render only adds and
  // removes what changed.
  const markersById = useRef<Record<string, maplibregl.Marker>>({});
  const markersOnScreen = useRef<Record<string, maplibregl.Marker>>({});
  const popupRef = useRef<maplibregl.Popup | null>(null);
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
      attributionControl: false,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.FullscreenControl(), "top-right");
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 110, unit: "metric" }), "bottom-left");

    new maplibregl.Marker({ color: "#4f57e3" }).setLngLat([lng, lat]).addTo(map);

    // One reused popup shows the hovered (or focused) place's name and distance.
    const popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 16,
      className: "nearby-popup",
    });
    popupRef.current = popup;

    // Sync HTML markers to whatever the cluster source renders in view: grouped
    // places collapse into a numbered bubble, and single places show a pin.
    const updateMarkers = () => {
      const next: Record<string, maplibregl.Marker> = {};
      for (const category of CATEGORY_ORDER) {
        const sourceId = nearbySourceId(category);
        const src = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;
        if (!src) continue;
        for (const feature of map.querySourceFeatures(sourceId)) {
        if (feature.geometry.type !== "Point") continue;
        const [flng, flat] = feature.geometry.coordinates as [number, number];
        const props = feature.properties as Record<string, unknown>;
        let id: string;
        let marker = undefined as maplibregl.Marker | undefined;

        if (props.cluster) {
          const clusterId = props.cluster_id as number;
          const count = props.point_count as number;
          id = `c${category}-${clusterId}`;
          marker = markersById.current[id];
          if (!marker) {
            const element = clusterPin(count, category);
            element.addEventListener("click", () => {
              src
                .getClusterExpansionZoom(clusterId)
                .then((zoom) =>
                  map.easeTo({
                    center: [flng, flat],
                    zoom: zoom ?? map.getZoom() + 2,
                    duration: reducedMotion() ? 0 : 500,
                  }),
                )
                .catch(() => undefined);
            });
            marker = new maplibregl.Marker({ element, anchor: "center" }).setLngLat([flng, flat]);
            markersById.current[id] = marker;
          } else {
            updateClusterPin(marker.getElement(), count, category);
          }
        } else {
          id = `p${category}-${props.pid}`;
          marker = markersById.current[id];
          if (!marker) {
            const category = props.category as NearbyCategory;
            const place = {
              name: String(props.name),
              category,
              distanceM: Number(props.distanceM),
              subtype: String(props.subtype),
            } as NearbyPlace;
            const element = nearbyPin(place, CATEGORY_ICON[category]);
            element.tabIndex = 0;
            element.setAttribute("role", "button");
            element.setAttribute("aria-label", `${place.name}, ${formatDistance(place.distanceM)} away`);
            const open = () => {
              popup
                .setLngLat([flng, flat])
                .setHTML(`<strong class="nearby-popup-name"></strong><span class="nearby-popup-meta"></span>`)
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
            marker = new maplibregl.Marker({ element, anchor: "center" }).setLngLat([flng, flat]);
            markersById.current[id] = marker;
          }
        }
        next[id] = marker;
        if (!markersOnScreen.current[id]) marker.addTo(map);
        }
      }
      for (const id of Object.keys(markersOnScreen.current)) {
        if (!next[id]) markersOnScreen.current[id].remove();
      }
      markersOnScreen.current = next;
    };

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

      // Cluster source for the nearby places. Groups break apart above
      // clusterMaxZoom, so zooming in reveals the individual pins.
      CATEGORY_ORDER.forEach((category) => {
        const sourceId = nearbySourceId(category);
        map.addSource(sourceId, {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
          cluster: true,
          clusterRadius: 55,
          clusterMaxZoom: 15,
        });
        // An invisible layer keeps each category source instantiated so
        // querySourceFeatures returns its clusters and individual points.
        map.addLayer({
          id: `${sourceId}-probe`,
          type: "circle",
          source: sourceId,
          paint: { "circle-radius": 0, "circle-opacity": 0 },
        });
      });
      map.on("render", updateMarkers);

      setReady(true);
    });

    return () => {
      Object.values(markersById.current).forEach((marker) => marker.remove());
      markersById.current = {};
      markersOnScreen.current = {};
      popup.remove();
      popupRef.current = null;
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

  // Feed the active category (or all) into the cluster source. The render
  // handler installed on load turns the result into clustered HTML markers.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const shown = activeCategory ? nearby.filter((place) => place.category === activeCategory) : nearby;
    CATEGORY_ORDER.forEach((category) => {
      const src = map.getSource(nearbySourceId(category)) as maplibregl.GeoJSONSource | undefined;
      if (!src) return;
      src.setData({
        type: "FeatureCollection",
        features: shown.filter((place) => place.category === category).map((place) => ({
          type: "Feature",
          properties: {
            pid: place.id,
            category: place.category,
            name: place.name,
            distanceM: place.distanceM,
            subtype: place.subtype,
          },
          geometry: { type: "Point", coordinates: [place.coordinates[1], place.coordinates[0]] },
        })),
      });
    });

    // Frame the lot with every currently shown place. On first load this gives
    // the All view a useful city-level cluster overview instead of starting
    // tightly on the lot; category filters then refit to their own places.
    if (shown.length > 0) {
      const box = new maplibregl.LngLatBounds([coordinates[1], coordinates[0]], [coordinates[1], coordinates[0]]);
      shown.forEach((place) => box.extend([place.coordinates[1], place.coordinates[0]]));
      map.fitBounds(box, {
        padding: 56,
        maxZoom: activeCategory ? 16 : 14,
        duration: reducedMotion() ? 0 : 600,
      });
    } else if (polygon && polygon.length >= 3) {
      map.fitBounds(bounds(polygon), { padding: 64, maxZoom: 17, duration: reducedMotion() ? 0 : 600 });
    }
  }, [nearby, activeCategory, ready, coordinates, polygon]);

  return <div ref={ref} className="detail-minimap-interactive" aria-label="Interactive lot plan location map" />;
}
