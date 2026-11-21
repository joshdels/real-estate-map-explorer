import { describe, expect, it } from "vitest";
import { datasetForMode } from "@/lib/runtime-mode";
import { seedDataset } from "@/lib/seed";

describe("production dataset mode", () => {
  it("removes every bundled sample record in production", () => {
    const result = datasetForMode(seedDataset, true);
    expect(result.metadata.isSample).toBe(false);
    expect(result.properties).toEqual([]);
    expect(result.providers).toEqual([]);
    expect(result.reviews).toEqual([]);
    expect(result.agent).toBeUndefined();
  });

  it("keeps the validated seed outside production", () => {
    expect(datasetForMode(seedDataset, false)).toBe(seedDataset);
  });
});
