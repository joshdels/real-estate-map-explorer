// @vitest-environment node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { BoundaryService, findArea, pointInFeature, type BoundaryFeature } from "@/lib/geo/boundaries";

const square: BoundaryFeature = {
  type: "Feature",
  properties: { code: "SQ" },
  geometry: {
    type: "MultiPolygon",
    coordinates: [[
      [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
      [[4, 4], [6, 4], [6, 6], [4, 6], [4, 4]],
    ]],
  },
};
const entry = { code: "SQ", name: "Square", center: [5, 5] as [number, number], bbox: [0, 0, 10, 10] as [number, number, number, number] };

describe("point lookup", () => {
  it("treats coordinates as [latitude, longitude] and respects holes", () => {
    expect(pointInFeature([2, 8], square)).toBe(true);
    expect(pointInFeature([5, 5], square)).toBe(false);
    expect(pointInFeature([12, 5], square)).toBe(false);
  });
  it("falls back to the nearest outline for a point just outside, and flags it", () => {
    const collection = { type: "FeatureCollection" as const, features: [square] };
    expect(findArea([2, 2], [entry], collection)).toEqual({ entry, approximate: false });
    expect(findArea([10.05, 10.05], [entry], collection)).toEqual({ entry, approximate: true });
    expect(findArea([30, 30], [entry], collection)).toBeUndefined();
  });
});

describe("PSA / NAMRIA boundary files", () => {
  const service = new BoundaryService(async (file) =>
    JSON.parse(await readFile(path.join(process.cwd(), "public/data/boundaries", file), "utf8")),
  );

  it("indexes every region, province, and city with a parent", async () => {
    const index = await service.index();
    expect(index.regions).toHaveLength(17);
    expect(index.provinces.length).toBeGreaterThanOrEqual(80);
    expect(index.cities.length).toBeGreaterThan(1600);
    const regions = new Set(index.regions.map((item) => item.code));
    const provinces = new Set(index.provinces.map((item) => item.code));
    expect(index.provinces.every((item) => regions.has(item.region))).toBe(true);
    expect(index.cities.every((item) => provinces.has(item.province))).toBe(true);
  });

  it("locates known places", async () => {
    expect(await service.locate([6.9552, 126.2165])).toMatchObject({ province: "Davao Oriental", regionCode: "PH11" });
    expect((await service.locate([10.334, 123.899]))?.city).toMatch(/Cebu City/);
    expect((await service.locate([14.65, 121.05]))?.city).toBe("Quezon City");
  });

  it("returns nothing for a point outside the Philippines", async () => {
    expect(await service.locate([35.68, 139.69])).toBeUndefined();
  });
});
