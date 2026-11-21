import { describe, expect, it } from "vitest";
import {
  filterListings,
  formatCompactPrice,
  formatPrice,
  listingsInBounds,
  providerRatings,
  rankedProviders,
  recentListings,
  suggestedListings,
  weightedRating,
} from "@/lib/listings";
import { seedDataset } from "@/lib/seed";
import type { Dataset, Property, ProviderReview } from "@/lib/types";
import { validateDataset } from "@/lib/validation";

const review = (providerId: string, rating: number, status: ProviderReview["status"] = "published"): ProviderReview => ({
  id: `${providerId}-${rating}-${Math.random()}`,
  providerId,
  rating,
  comment: "",
  author: "Tester",
  createdAt: "2026-01-01T00:00:00.000Z",
  status,
});

const listing = (id: string, overrides: Partial<Property> = {}): Property => ({
  id,
  title: id,
  address: "Sample Street",
  coordinates: [10, 123],
  polygon: [[10, 123], [10, 123.001], [10.001, 123.001]],
  area: "100 sqm",
  price: 1_000_000,
  status: "Available",
  utilities: {},
  ...overrides,
});

function dataset(properties: Property[], reviews: ProviderReview[]): Dataset {
  return validateDataset({
    metadata: { name: "test", version: 1, isSample: true, notice: "sample" },
    utilities: {},
    destinations: [],
    routes: [],
    providers: [
      { id: "many", name: "Many Reviews", kind: "broker", staffReviewed: false },
      { id: "single", name: "Single Review", kind: "owner", staffReviewed: false },
      { id: "none", name: "No Reviews", kind: "owner", staffReviewed: false },
    ],
    groups: [],
    reviews,
    properties,
  });
}

describe("provider ratings", () => {
  it("averages published reviews and ignores flagged or removed ones", () => {
    const ratings = providerRatings([review("a", 5), review("a", 3), review("a", 1, "flagged"), review("a", 1, "removed")]);
    expect(ratings.get("a")).toEqual({ average: 4, count: 2 });
  });

  it("pulls a single review toward the platform average", () => {
    expect(weightedRating({ average: 5, count: 1 }, 4)).toBeCloseTo(4.25);
    expect(weightedRating({ average: 5, count: 30 }, 4)).toBeGreaterThan(4.9);
    expect(weightedRating(undefined, 4)).toBe(4);
  });
});

describe("recommended ranking", () => {
  const reviews = [...Array.from({ length: 8 }, () => review("many", 5)), review("many", 4), review("single", 5)];

  it("ranks a provider with many strong reviews above one perfect review", () => {
    const data = dataset([listing("from-single", { providerId: "single" }), listing("from-many", { providerId: "many" }), listing("from-none", { providerId: "none" })], reviews);
    expect(filterListings(data, {}).map((item) => item.id)).toEqual(["from-many", "from-single", "from-none"]);
    expect(rankedProviders(data).map((item) => item.provider.id)).toEqual(["many", "single", "none"]);
  });

  it("suggests only available listings from reviewed providers", () => {
    const data = dataset(
      [listing("sold", { providerId: "many", status: "Sold" }), listing("open", { providerId: "many" }), listing("unrated", { providerId: "none" })],
      reviews,
    );
    expect(suggestedListings(data, 5).map((item) => item.id)).toEqual(["open"]);
  });
});

describe("listing filters", () => {
  const data = dataset(
    [
      listing("cebu-rent", { purpose: "rent", propertyType: "condo", price: 25_000, createdAt: "2026-03-01T00:00:00Z", adminArea: { regionCode: "PH07", region: "Central Visayas", provinceCode: "PH07022", province: "Cebu", cityCode: "PH0702217", city: "Cebu City" } }),
      listing("davao-lot", { price: 2_000_000, createdAt: "2026-05-01T00:00:00Z", adminArea: { regionCode: "PH11", region: "Davao Region", provinceCode: "PH11025", province: "Davao Oriental" } }),
      listing("hidden", { review: "suspended", createdAt: "2026-06-01T00:00:00Z" }),
      listing("no-area", { price: 500_000 }),
    ],
    [],
  );
  const ids = (criteria: Parameters<typeof filterListings>[1]) => filterListings(data, criteria).map((item) => item.id).sort();

  it("never returns suspended listings", () => {
    expect(ids({})).toEqual(["cebu-rent", "davao-lot", "no-area"]);
  });
  it("filters by official area codes", () => {
    expect(ids({ regionCode: "PH07" })).toEqual(["cebu-rent"]);
    expect(ids({ provinceCode: "PH11025" })).toEqual(["davao-lot"]);
    expect(ids({ cityCode: "PH0702217" })).toEqual(["cebu-rent"]);
  });
  it("filters by purpose, type, price, and place name", () => {
    expect(ids({ purpose: "rent" })).toEqual(["cebu-rent"]);
    expect(ids({ propertyType: "lot" })).toEqual(["davao-lot", "no-area"]);
    expect(ids({ minPrice: 1_000_000 })).toEqual(["davao-lot"]);
    expect(ids({ term: "davao oriental" })).toEqual(["davao-lot"]);
  });
  it("sorts by price and by newest", () => {
    expect(filterListings(data, { sort: "price-asc" }).map((item) => item.id)).toEqual(["cebu-rent", "no-area", "davao-lot"]);
    expect(recentListings(data, 5).map((item) => item.id)).toEqual(["davao-lot", "cebu-rent"]);
  });
  it("formats rent as a monthly price", () => {
    expect(formatPrice({ price: 25_000, purpose: "rent" })).toBe("₱25,000 / month");
    expect(formatPrice({ price: 2_500_000, purpose: "sale" })).toBe("₱2,500,000");
  });
  it("keeps map marker prices compact", () => {
    expect(formatCompactPrice({ price: 25_000, purpose: "rent" })).toBe("₱25K/mo");
    expect(formatCompactPrice({ price: 2_500_000, purpose: "sale" })).toBe("₱2.5M");
    expect(formatCompactPrice({ price: 950, purpose: "sale" })).toBe("₱950");
  });

  it("limits map results to listing points inside the viewport", () => {
    const properties = [
      listing("inside", { coordinates: [10, 123] }),
      listing("outside", { coordinates: [12, 125] }),
    ];
    expect(listingsInBounds(properties, {
      west: 122,
      south: 9,
      east: 124,
      north: 11,
    }).map((property) => property.id)).toEqual(["inside"]);
  });

  it("supports map bounds that cross the antimeridian", () => {
    const property = listing("near-antimeridian", { coordinates: [10, 179] });
    expect(listingsInBounds([property], {
      west: 170,
      south: 0,
      east: -170,
      north: 20,
    })).toEqual([property]);
  });
});

describe("bundled seed", () => {
  it("has an official area, a provider, and a date on every listing", () => {
    for (const property of seedDataset.properties) {
      expect(property.adminArea?.provinceCode, property.id).toBeTruthy();
      expect(property.providerId, property.id).toBeTruthy();
      expect(property.createdAt, property.id).toBeTruthy();
    }
  });
  it("labels every provider as a sample", () => {
    expect(seedDataset.providers.every((item) => item.name.startsWith("Sample"))).toBe(true);
  });
});
