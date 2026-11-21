import { describe, expect, it } from "vitest";
import {
  NEARBY_CATEGORIES,
  distanceMeters,
  formatDistance,
  samplePlaces,
  type NearbyPlace,
} from "@/lib/nearby";

describe("nearby sample places (offline fallback)", () => {
  const property = { id: "property-014", coordinates: [14.65, 121.05] as [number, number] };

  it("is deterministic for the same listing", () => {
    expect(samplePlaces(property)).toEqual(samplePlaces(property));
  });

  it("differs between listings", () => {
    const a = samplePlaces(property).map((place: NearbyPlace) => place.coordinates);
    const b = samplePlaces({ id: "property-001", coordinates: property.coordinates }).map(
      (place: NearbyPlace) => place.coordinates,
    );
    expect(a).not.toEqual(b);
  });

  it("covers every category and stays within a short radius", () => {
    const places = samplePlaces(property);
    for (const { category } of NEARBY_CATEGORIES) {
      expect(places.some((place: NearbyPlace) => place.category === category)).toBe(true);
    }
    expect(places.every((place: NearbyPlace) => place.distanceM <= 2500)).toBe(true);
  });

  it("formats distances", () => {
    expect(formatDistance(240)).toBe("240 m");
    expect(formatDistance(1200)).toBe("1.2 km");
  });

  it("measures distance between points", () => {
    expect(distanceMeters([14.65, 121.05], [14.65, 121.05])).toBe(0);
    expect(distanceMeters([14.65, 121.05], [14.66, 121.05])).toBeGreaterThan(1000);
  });
});
