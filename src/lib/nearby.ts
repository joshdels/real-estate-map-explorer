import type { Coordinate, Property } from "@/lib/types";

/**
 * Nearby neighbourhood places for a lot detail page.
 *
 * Preferred source is live OpenStreetMap data through the Overpass API, so the
 * amenities and their distances are real for the lot's coordinates. The lot
 * itself is a fictional sample, but the surrounding map features are genuine
 * OSM data. When Overpass is unreachable (offline, blocked, rate limited) the
 * UI falls back to clearly-labelled illustrative sample points so the page
 * still works. Only the coordinates are ever sent to the external service.
 */

export type NearbyCategory =
  | "school"
  | "transport"
  | "dining"
  | "cafe"
  | "groceries"
  | "health"
  | "finance";

export interface NearbyPlace {
  id: string;
  name: string;
  category: NearbyCategory;
  /** Short descriptor shown after the distance, e.g. "Supermarket". */
  subtype: string;
  coordinates: Coordinate;
  /** Straight-line distance from the lot, in metres. */
  distanceM: number;
}

export interface NearbyCategoryMeta {
  category: NearbyCategory;
  label: string;
  /** Phosphor icon name (regular weight) for the imperative map pins. */
  icon: string;
}

export interface NearbyResult {
  places: NearbyPlace[];
  source: "osm" | "sample";
}

export const NEARBY_CATEGORIES: NearbyCategoryMeta[] = [
  { category: "school", label: "Schools", icon: "graduation-cap" },
  { category: "transport", label: "Transit", icon: "bus" },
  { category: "dining", label: "Restaurants", icon: "fork-knife" },
  { category: "cafe", label: "Cafes", icon: "coffee" },
  { category: "groceries", label: "Groceries", icon: "shopping-cart" },
  { category: "health", label: "Healthcare", icon: "first-aid-kit" },
  { category: "finance", label: "Banks", icon: "bank" },
];

/** Metres between two lat/lng points (equirectangular approximation). */
export function distanceMeters(a: Coordinate, b: Coordinate): number {
  const R = 6371000;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const meanLat = toRad((a[0] + b[0]) / 2);
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]) * Math.cos(meanLat);
  return Math.round(Math.sqrt(dLat * dLat + dLng * dLng) * R);
}

/** Human distance label, e.g. "240 m" or "1.2 km". */
export function formatDistance(distanceM: number): string {
  if (distanceM < 1000) return `${distanceM} m`;
  return `${(distanceM / 1000).toFixed(1)} km`;
}

/** Title-case an OSM tag value like "fast_food" -> "Fast Food". */
function humanize(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

type OsmTags = Record<string, string>;

/** Map an OSM element's tags to one of our categories, or null to drop it. */
function classify(tags: OsmTags): { category: NearbyCategory; subtype: string } | null {
  const amenity = tags.amenity;
  const shop = tags.shop;
  if (amenity === "cafe") return { category: "cafe", subtype: "Cafe" };
  if (amenity === "restaurant") return { category: "dining", subtype: humanize(tags.cuisine ?? "restaurant") };
  if (amenity === "fast_food") return { category: "dining", subtype: "Fast Food" };
  if (amenity === "bank") return { category: "finance", subtype: "Bank" };
  if (amenity === "atm") return { category: "finance", subtype: "ATM" };
  if (amenity === "pharmacy") return { category: "health", subtype: "Pharmacy" };
  if (amenity === "hospital") return { category: "health", subtype: "Hospital" };
  if (amenity === "clinic" || amenity === "doctors") return { category: "health", subtype: "Clinic" };
  if (amenity === "school") return { category: "school", subtype: "School" };
  if (amenity === "kindergarten") return { category: "school", subtype: "Preschool" };
  if (amenity === "college") return { category: "school", subtype: "College" };
  if (amenity === "university") return { category: "school", subtype: "University" };
  if (amenity === "bus_station") return { category: "transport", subtype: "Bus station" };
  if (tags.highway === "bus_stop") return { category: "transport", subtype: "Bus stop" };
  if (tags.railway === "station") return { category: "transport", subtype: "Station" };
  if (shop === "supermarket") return { category: "groceries", subtype: "Supermarket" };
  if (shop === "convenience") return { category: "groceries", subtype: "Convenience" };
  if (shop === "grocery" || shop === "greengrocer") return { category: "groceries", subtype: "Grocery" };
  return null;
}

/** A readable default name when an OSM feature has no name tag. */
function fallbackName(subtype: string): string {
  return `${subtype} (unnamed)`;
}

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

/** How many places to keep per category, nearest first. */
const PER_CATEGORY = 6;
/** Search radius in metres. */
const RADIUS_M = 2500;

function overpassQuery(lat: number, lng: number): string {
  const a = `(around:${RADIUS_M},${lat},${lng})`;
  return `[out:json][timeout:20];(
    node[amenity=school]${a};
    node[amenity=kindergarten]${a};
    node[amenity=college]${a};
    node[amenity=university]${a};
    node[amenity=cafe]${a};
    node[amenity=restaurant]${a};
    node[amenity=fast_food]${a};
    node[amenity=bank]${a};
    node[amenity=atm]${a};
    node[amenity=pharmacy]${a};
    node[amenity=hospital]${a};
    node[amenity=clinic]${a};
    node[amenity=doctors]${a};
    node[amenity=bus_station]${a};
    node[highway=bus_stop]${a};
    node[railway=station]${a};
    node[shop=supermarket]${a};
    node[shop=convenience]${a};
    node[shop=grocery]${a};
  );out body ${PER_CATEGORY * NEARBY_CATEGORIES.length * 3};`;
}

interface OverpassElement {
  id: number;
  lat?: number;
  lon?: number;
  tags?: OsmTags;
}

function parseElements(
  elements: OverpassElement[],
  origin: Coordinate,
): NearbyPlace[] {
  const byCategory = new Map<NearbyCategory, NearbyPlace[]>();
  const seen = new Set<string>();
  for (const el of elements) {
    if (typeof el.lat !== "number" || typeof el.lon !== "number" || !el.tags) continue;
    const match = classify(el.tags);
    if (!match) continue;
    const name = el.tags.name?.trim() || fallbackName(match.subtype);
    const key = `${match.category}:${name.toLocaleLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const coordinates: Coordinate = [el.lat, el.lon];
    const list = byCategory.get(match.category) ?? [];
    list.push({
      id: `osm-${el.id}`,
      name,
      category: match.category,
      subtype: match.subtype,
      coordinates,
      distanceM: distanceMeters(origin, coordinates),
    });
    byCategory.set(match.category, list);
  }
  const places: NearbyPlace[] = [];
  for (const { category } of NEARBY_CATEGORIES) {
    const list = (byCategory.get(category) ?? []).sort((a, b) => a.distanceM - b.distanceM);
    places.push(...list.slice(0, PER_CATEGORY));
  }
  return places;
}

function cacheKey(coordinates: Coordinate): string {
  return `nearby:osm:${coordinates[0].toFixed(4)},${coordinates[1].toFixed(4)}`;
}

function readCache(coordinates: Coordinate): NearbyPlace[] | null {
  try {
    const raw = sessionStorage.getItem(cacheKey(coordinates));
    return raw ? (JSON.parse(raw) as NearbyPlace[]) : null;
  } catch {
    return null;
  }
}

function writeCache(coordinates: Coordinate, places: NearbyPlace[]): void {
  try {
    sessionStorage.setItem(cacheKey(coordinates), JSON.stringify(places));
  } catch {
    // Storage may be unavailable (private mode); caching is best-effort.
  }
}

/**
 * Fetch real nearby places from OpenStreetMap. Resolves to `source: "sample"`
 * with illustrative points when the lookup fails or returns nothing, so callers
 * always get something to show.
 */
export async function fetchNearbyPlaces(
  property: Pick<Property, "id" | "coordinates">,
  signal?: AbortSignal,
): Promise<NearbyResult> {
  const [lat, lng] = property.coordinates;

  const cached = readCache(property.coordinates);
  if (cached && cached.length > 0) return { places: cached, source: "osm" };

  const body = `data=${encodeURIComponent(overpassQuery(lat, lng))}`;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        signal,
      });
      if (!response.ok) continue;
      const json = (await response.json()) as { elements?: OverpassElement[] };
      const places = parseElements(json.elements ?? [], property.coordinates);
      if (places.length > 0) {
        writeCache(property.coordinates, places);
        return { places, source: "osm" };
      }
    } catch (error) {
      if (signal?.aborted) throw error;
      // Try the next endpoint, then fall back to sample data.
    }
  }

  return { places: samplePlaces(property), source: "sample" };
}

// --- Illustrative fallback (used only when OSM cannot be reached) -------------

const SAMPLE_NAMES: Record<NearbyCategory, [string, string][]> = {
  school: [["Sample Elementary School", "School"], ["Sample National High School", "School"]],
  transport: [["Sample jeepney terminal", "Transit"], ["Sample highway bus stop", "Bus stop"]],
  dining: [["Sample carinderia", "Restaurant"], ["Sample roadside eatery", "Fast Food"]],
  cafe: [["Sample coffee and bakeshop", "Cafe"], ["Sample corner cafe", "Cafe"]],
  groceries: [["Sample public market", "Grocery"], ["Sample convenience store", "Convenience"]],
  health: [["Sample barangay health center", "Clinic"], ["Sample community pharmacy", "Pharmacy"]],
  finance: [["Sample rural bank", "Bank"], ["Sample ATM booth", "ATM"]],
};

function seed(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pseudoRandom(state: number): [number, number] {
  let x = state || 1;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  const next = x >>> 0;
  return [next / 0xffffffff, next];
}

/** Deterministic illustrative points around the lot, one or two per category. */
export function samplePlaces(property: Pick<Property, "id" | "coordinates">): NearbyPlace[] {
  const [lat, lng] = property.coordinates;
  let state = seed(property.id || "lot");
  const places: NearbyPlace[] = [];
  for (const { category } of NEARBY_CATEGORIES) {
    const entries = SAMPLE_NAMES[category];
    const list: NearbyPlace[] = [];
    entries.forEach(([name, subtype], i) => {
      let r1: number;
      let r2: number;
      [r1, state] = pseudoRandom(state);
      [r2, state] = pseudoRandom(state);
      const coordinates: Coordinate = [lat + (r1 - 0.5) * 0.024, lng + (r2 - 0.5) * 0.024];
      list.push({
        id: `${property.id}-${category}-${i}`,
        name,
        category,
        subtype,
        coordinates,
        distanceM: distanceMeters(property.coordinates, coordinates),
      });
    });
    list.sort((a, b) => a.distanceM - b.distanceM);
    places.push(...list);
  }
  return places;
}
