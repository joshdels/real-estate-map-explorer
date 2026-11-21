import type { AdminArea, Coordinate } from "@/lib/types";

export interface RegionEntry {
  code: string;
  name: string;
}
export interface AreaEntry {
  code: string;
  name: string;
  center: Coordinate;
  /** [west, south, east, north] */
  bbox: [number, number, number, number];
}
export interface ProvinceEntry extends AreaEntry {
  region: string;
}
export interface CityEntry extends AreaEntry {
  province: string;
}
export interface BoundaryIndex {
  source: string;
  notice: string;
  regions: RegionEntry[];
  provinces: ProvinceEntry[];
  cities: CityEntry[];
}

type Ring = number[][];
export interface BoundaryFeature {
  type: "Feature";
  properties: { code: string };
  geometry: { type: "MultiPolygon"; coordinates: Ring[][] };
}
export interface BoundaryCollection {
  type: "FeatureCollection";
  features: BoundaryFeature[];
}

/** Points this far (km) from every outline are treated as outside the country. */
const NEAREST_LIMIT_KM = 15;

function inRing([lat, lng]: Coordinate, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}

/**
 * Bounding box of a feature's outlines as [west, south, east, north].
 * Walks the coordinate tree so it works for both Polygon and MultiPolygon
 * geometries (the region file mixes the two).
 */
export function featureBounds(
  feature: { geometry: { coordinates: unknown } },
): [number, number, number, number] {
  let west = Infinity, south = Infinity, east = -Infinity, north = -Infinity;
  const walk = (node: unknown): void => {
    if (!Array.isArray(node)) return;
    if (typeof node[0] === "number" && typeof node[1] === "number") {
      const [lng, lat] = node as [number, number];
      if (lng < west) west = lng;
      if (lng > east) east = lng;
      if (lat < south) south = lat;
      if (lat > north) north = lat;
      return;
    }
    for (const child of node) walk(child);
  };
  walk(feature.geometry.coordinates);
  return [west, south, east, north];
}

export function pointInFeature(point: Coordinate, feature: BoundaryFeature): boolean {
  return feature.geometry.coordinates.some(
    ([outer, ...holes]) =>
      inRing(point, outer) && !holes.some((hole) => inRing(point, hole)),
  );
}

function inBbox([lat, lng]: Coordinate, [west, south, east, north]: AreaEntry["bbox"]): boolean {
  return lng >= west && lng <= east && lat >= south && lat <= north;
}

export function distanceKm(a: Coordinate, b: Coordinate): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = radians(b[0] - a[0]);
  const dLng = radians(b[1] - a[1]);
  const value =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(a[0])) * Math.cos(radians(b[0])) * Math.sin(dLng / 2) ** 2;
  return 6371.0088 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

/** Distance from a point to the closest vertex of a feature's outer rings. */
function distanceToFeature(point: Coordinate, feature: BoundaryFeature): number {
  let best = Number.POSITIVE_INFINITY;
  for (const [outer] of feature.geometry.coordinates)
    for (const [lng, lat] of outer) {
      const distance = distanceKm(point, [lat, lng]);
      if (distance < best) best = distance;
    }
  return best;
}

interface Match<T> {
  entry: T;
  approximate: boolean;
}

/**
 * Finds the area containing a point. Simplified outlines leave small gaps
 * along coasts and shared borders, so a miss falls back to the nearest
 * outline within NEAREST_LIMIT_KM and is flagged approximate.
 */
export function findArea<T extends AreaEntry>(
  point: Coordinate,
  entries: T[],
  collection: BoundaryCollection,
): Match<T> | undefined {
  const features = new Map(collection.features.map((item) => [item.properties.code, item]));
  for (const entry of entries) {
    const feature = features.get(entry.code);
    if (feature && inBbox(point, entry.bbox) && pointInFeature(point, feature))
      return { entry, approximate: false };
  }
  let nearest: T | undefined;
  let best = NEAREST_LIMIT_KM;
  for (const entry of entries) {
    const feature = features.get(entry.code);
    if (!feature) continue;
    const distance = distanceToFeature(point, feature);
    if (distance < best) {
      best = distance;
      nearest = entry;
    }
  }
  return nearest ? { entry: nearest, approximate: true } : undefined;
}

export type BoundaryLoader = (path: string) => Promise<unknown>;

const fetchJson: BoundaryLoader = async (path) => {
  const response = await fetch(`/data/boundaries/${path}`);
  if (!response.ok) throw new Error(`Boundary data unavailable: ${path}`);
  return response.json();
};

/** Lazy, cached access to the PSA/NAMRIA boundary files in public/data/boundaries. */
export class BoundaryService {
  private readonly cache = new Map<string, Promise<unknown>>();
  constructor(private readonly loader: BoundaryLoader = fetchJson) {}

  private load<T>(path: string): Promise<T> {
    let pending = this.cache.get(path);
    if (!pending) {
      pending = this.loader(path).catch((error: unknown) => {
        this.cache.delete(path);
        throw error;
      });
      this.cache.set(path, pending);
    }
    return pending as Promise<T>;
  }

  index(): Promise<BoundaryIndex> {
    return this.load("index.json");
  }
  regions(): Promise<BoundaryCollection> {
    return this.load("regions.geojson");
  }
  provinces(): Promise<BoundaryCollection> {
    return this.load("provinces.geojson");
  }
  cities(provinceCode: string): Promise<BoundaryCollection> {
    return this.load(`cities/${provinceCode}.geojson`);
  }

  /** Outline of one region, for drawing on the map. */
  async regionOutline(regionCode: string): Promise<BoundaryFeature | undefined> {
    const collection = await this.regions();
    return collection.features.find((item) => item.properties.code === regionCode);
  }

  /** Overall bounds of every region as [west, south, east, north], for the first-load frame. */
  async countryBounds(): Promise<[number, number, number, number]> {
    const collection = await this.regions();
    let west = Infinity, south = Infinity, east = -Infinity, north = -Infinity;
    for (const feature of collection.features) {
      const [fw, fs, fe, fn] = featureBounds(feature);
      if (fw < west) west = fw;
      if (fs < south) south = fs;
      if (fe > east) east = fe;
      if (fn > north) north = fn;
    }
    return [west, south, east, north];
  }

  /** Outline of one province or city/municipality, for drawing on the map. */
  async outline(provinceCode: string, cityCode?: string): Promise<BoundaryFeature | undefined> {
    const collection = cityCode
      ? await this.cities(provinceCode)
      : await this.provinces();
    const code = cityCode ?? provinceCode;
    return collection.features.find((item) => item.properties.code === code);
  }

  /** Resolves the region, province, and city/municipality for a map point. */
  async locate(point: Coordinate): Promise<AdminArea | undefined> {
    const [index, provinces] = await Promise.all([this.index(), this.provinces()]);
    const province = findArea(point, index.provinces, provinces);
    if (!province) return undefined;
    const region = index.regions.find((item) => item.code === province.entry.region);
    const area: AdminArea = {
      regionCode: province.entry.region,
      region: region?.name ?? "",
      provinceCode: province.entry.code,
      province: province.entry.name,
    };
    const city = findArea(
      point,
      index.cities.filter((item) => item.province === province.entry.code),
      await this.cities(province.entry.code),
    );
    if (city) {
      area.cityCode = city.entry.code;
      area.city = city.entry.name;
    }
    if (province.approximate || city?.approximate) area.approximate = true;
    return area;
  }
}

export const boundaries = new BoundaryService();
