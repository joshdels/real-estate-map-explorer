"use client";

import { useEffect, useMemo, useState } from "react";
import { useBoundaryIndex } from "@/hooks/use-boundary-index";

type Position = [number, number];
type PolygonCoordinates = Position[][];

type ProvinceFeature = {
  properties: { code: string; name: string };
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: PolygonCoordinates | PolygonCoordinates[];
  };
};

type ProvinceCollection = { features: ProvinceFeature[] };

const MAP_BOUNDS = {
  west: 116.8,
  east: 127,
  south: 4.4,
  north: 21.4,
};

// True EPSG:4326 (plate carr'ee): degrees map 1:1 to the canvas so the
// Philippines keeps its real proportions. One degree is MAP_SCALE units.
const MAP_SCALE = 46;
const MAP_WIDTH = (MAP_BOUNDS.east - MAP_BOUNDS.west) * MAP_SCALE;
const MAP_HEIGHT = (MAP_BOUNDS.north - MAP_BOUNDS.south) * MAP_SCALE;

function point([longitude, latitude]: Position) {
  const x = (longitude - MAP_BOUNDS.west) * MAP_SCALE;
  const y = (MAP_BOUNDS.north - latitude) * MAP_SCALE;
  return `${x.toFixed(1)},${y.toFixed(1)}`;
}

// Drop tiny simplified slivers and specks that read as broken stray lines.
// Threshold is in square degrees (about 0.9 km per 0.008 deg at this latitude).
const MIN_RING_AREA = 0.0008;

function ringArea(ring: Position[]): number {
  let sum = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    sum += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  }
  return Math.abs(sum) / 2;
}

function ringPath(ring: Position[]) {
  return ring.map((position, index) => `${index === 0 ? "M" : "L"}${point(position)}`).join(" ") + " Z";
}

function geometryPath(feature: ProvinceFeature) {
  const polygons = feature.geometry.type === "Polygon"
    ? [feature.geometry.coordinates as PolygonCoordinates]
    : feature.geometry.coordinates as PolygonCoordinates[];

  return polygons
    // Keep a polygon only when its outer ring is large enough to be a real body.
    .filter((polygon) => polygon[0] && ringArea(polygon[0]) >= MIN_RING_AREA)
    .flatMap((polygon) => polygon.map(ringPath))
    .join(" ");
}

function shortRegionName(name: string) {
  const numbered = name.match(/^Region ([IVX]+)/);
  if (numbered) return `Region ${numbered[1]}`;
  const acronym = name.match(/\(([A-Z]+)\)\s*$/);
  if (acronym) return acronym[1];
  return name;
}

export function RegionMapSelector() {
  const { index, failed } = useBoundaryIndex();
  const [collection, setCollection] = useState<ProvinceCollection | null>(null);
  const [mapFailed, setMapFailed] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    if (collection || mapFailed) return;
    void fetch("/data/boundaries/regions.geojson")
      .then((response) => {
        if (!response.ok) throw new Error("Could not load the region map");
        return response.json() as Promise<ProvinceCollection>;
      })
      .then(setCollection)
      .catch(() => setMapFailed(true));
  }, [collection, mapFailed]);

  const regionPaths = useMemo(() => {
    if (!collection) return [];
    return collection.features.map((feature) => ({
      code: feature.properties.code,
      name: feature.properties.name,
      label: shortRegionName(feature.properties.name),
      path: geometryPath(feature),
    }));
  }, [collection]);

  return (
    <section className="region-finder" aria-label="Browse land by Philippine region">
      <header className="region-finder-head">
        <h2 className="region-finder-title">View land listings by region</h2>
        <p className="region-finder-lead">Select a region on the map to see every lot listed there.</p>
      </header>
      <div className="region-map-panel">
        {regionPaths.length > 0 ? (
          <svg className="region-map" viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} role="img" aria-labelledby="region-map-title region-map-description">
            <title id="region-map-title">Philippine regions</title>
            <desc id="region-map-description">A simplified map. Select any region to view its land listings.</desc>
            {regionPaths.map((region) => region.path && (
              <a
                key={region.code}
                href={`/explore?region=${encodeURIComponent(region.code)}`}
                aria-label={`View land in ${region.name}`}
                onMouseEnter={() => setHovered(region.label)}
                onMouseLeave={() => setHovered((current) => (current === region.label ? null : current))}
                onFocus={() => setHovered(region.label)}
                onBlur={() => setHovered((current) => (current === region.label ? null : current))}
              >
                <title>{region.label}</title>
                <path className="region-shape" d={region.path} fillRule="evenodd" />
              </a>
            ))}
          </svg>
        ) : (
          <div className="region-map-skeleton" aria-hidden="true" />
        )}
        <p className="region-map-caption" role="status" aria-live="polite" data-active={hovered ? "true" : "false"}>
          {hovered ?? "Hover or focus a region to see its name, then select it."}
        </p>
        {!index && !failed && <p className="region-finder-status" role="status">Loading region map...</p>}
        {(failed || mapFailed) && <p className="region-finder-status" role="status">The region map is unavailable. Use the location search above to find land.</p>}
      </div>
    </section>
  );
}
