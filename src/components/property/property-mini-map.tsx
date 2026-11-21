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

// A grouped-count bubble shown while many places overlap. Clicking it zooms in
// until the cluster breaks apart into individual pins.
function clusterPin(count: number): HTMLElement {
  const element = document.createElement("button");
  element.type = "button";
  element.className = "nearby-cluster";
  element.textContent = String(count);
  element.setAttribute("aria-label", `${count} places here. Zoom in to separate them.`);
  // Scale the bubble a little with the count so a big group reads as bigger.
  const size = count < 10 ? 34 : count < 50 ? 40 : 46;
  element.style.width = `${size}px`;
  element.style.height = `${size}px`;
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
      attributionControl: { compact: true },
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
      const src = map.getSource("nearby-src") as maplibregl.GeoJSONSource | undefined;
      if (!src) return;
      const next: Record<string, maplibregl.Marker> = {};
      for (const feature of map.querySourceFeatures("nearby-src")) {
        if (feature.geometry.type !== "Point") continue;
        const [flng, flat] = feature.geometry.coordinates as [number, number];
        const props = feature.properties as Record<string, unknown>;
        let id: string;
        let marker = undefined as maplibregl.Marker | undefined;

        if (props.cluster) {
          const clusterId = props.cluster_id as number;
          const count = props.point_count as number;
          id = `c${clusterId}`;
          marker = markersById.current[id];
          if (!marker) {
            const element = clusterPin(count);
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
            marker.getElement().textContent = String(count);
          }
        } else {
          id = `p${props.pid}`;
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
      map.addSource("nearby-src", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
        cluster: true,
        clusterRadius: 55,
        clusterMaxZoom: 15,
      });
      // An invisible layer keeps the source instantiated so querySourceFeatures
      // returns its clusters and points; the visible marks are the HTML markers.
      map.addLayer({
        id: "nearby-src-probe",
        type: "circle",
        source: "nearby-src",
        paint: { "circle-radius": 0, "circle-opacity": 0 },
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
    const src = map.getSource("nearby-src") as maplibregl.GeoJSONSource | undefined;
    if (!src) return;

    const shown = activeCategory ? nearby.filter((place) => place.category === activeCategory) : nearby;
    src.setData({
      type: "FeatureCollection",
      features: shown.map((place) => ({
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

    // When a single category is toggled, frame the lot and those places so the
    // map visibly moves to that set of points.
    if (activeCategory && shown.length > 0) {
      const box = new maplibregl.LngLatBounds([coordinates[1], coordinates[0]], [coordinates[1], coordinates[0]]);
      shown.forEach((place) => box.extend([place.coordinates[1], place.coordinates[0]]));
      map.fitBounds(box, { padding: 56, maxZoom: 16, duration: reducedMotion() ? 0 : 600 });
    } else if (polygon && polygon.length >= 3) {
      map.fitBounds(bounds(polygon), { padding: 64, maxZoom: 17, duration: reducedMotion() ? 0 : 600 });
    }
  }, [nearby, activeCategory, ready, coordinates, polygon]);

  return <div ref={ref} className="detail-minimap-interactive" aria-label="Interactive lot plan location map" />;
}
