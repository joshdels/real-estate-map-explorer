import { describe, expect, it, vi } from "vitest";
import { DjangoRepository } from "@/lib/repositories/django-repository";
import { seedDataset } from "@/lib/seed";

describe("DjangoRepository", () => {
  it("loads and validates the dataset with cookies", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(seedDataset), { status: 200 }),
    );
    const result = await new DjangoRepository("https://api.example.test").load();
    expect(result.metadata.name).toBe(seedDataset.metadata.name);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/v1/dataset",
      { credentials: "include" },
    );
    fetchMock.mockRestore();
  });

  it("sends validated data to the Django API", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 200 }),
    );
    await new DjangoRepository("https://api.example.test").save(seedDataset);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/v1/dataset",
      expect.objectContaining({ method: "PUT", credentials: "include" }),
    );
    fetchMock.mockRestore();
  });

  it("reports API failures", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 503 }),
    );
    await expect(new DjangoRepository("https://api.example.test").load()).rejects.toThrow("503");
    fetchMock.mockRestore();
  });
});
