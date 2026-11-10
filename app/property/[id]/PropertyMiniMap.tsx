"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";

const TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

type Coord = [number, number];

function bounds(polygon: Coord[]): [[number, number], [number, number]] {
  const lats = polygon.map(([lat]) => lat);
  const lngs = polygon.map(([, lng]) => lng);
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];
}

export function PropertyMiniMap({
  coordinates,
  polygon,
}: {
  coordinates: Coord;
  polygon: Coord[];
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const [lat, lng] = coordinates;
    const map = new maplibregl.Map({
      container: ref.current,
      style: {
        version: 8,
        sources: {
          satellite: {
            type: "raster",
            tiles: [TILE_URL],
            tileSize: 256,
            attribution: "Imagery &copy; Esri",
          },
        },
        layers: [{ id: "satellite", type: "raster", source: "satellite" }],
      },
      center: [lng, lat],
      zoom: 16,
      minZoom: 10,
      maxZoom: 20,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.FullscreenControl(), "top-right");
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 110, unit: "metric" }), "bottom-left");

    const marker = new maplibregl.Marker({ color: "#4f57e3" })
      .setLngLat([lng, lat])
      .addTo(map);

    map.on("load", () => {
      if (polygon && polygon.length >= 3) {
        const ring = [...polygon, polygon[0]].map(([la, ln]) => [ln, la]);
        map.addSource("lot", {
          type: "geojson",
          data: { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [ring] } },
        });
        map.addLayer({ id: "lot-fill", type: "fill", source: "lot", paint: { "fill-color": "#4f57e3", "fill-opacity": 0.22 } });
        map.addLayer({ id: "lot-line", type: "line", source: "lot", paint: { "line-color": "#6f78f0", "line-width": 2 } });
        map.fitBounds(bounds(polygon), { padding: 44, maxZoom: 18, duration: 0 });
      }
    });

    return () => {
      marker.remove();
      map.remove();
    };
  }, [coordinates, polygon]);

  return <div ref={ref} className="detail-minimap-interactive" aria-label="Interactive property location map" />;
}
