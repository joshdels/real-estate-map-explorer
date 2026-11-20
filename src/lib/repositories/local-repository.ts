import type { DataRepository, Dataset } from "@/lib/types";
import { validateDataset } from "@/lib/validation";
import seedData from "../../../public/data/data.json";

// Bump the version whenever the seed changes shape so stale overrides are ignored.
export const STORAGE_KEY = "real-estate-map-explorer.data.v8";

export class LocalRepository implements DataRepository {
  readonly source = "local" as const;

  async load(): Promise<Dataset> {
    const seed = validateDataset(seedData);
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return seed;
    try {
      return validateDataset(JSON.parse(saved));
    } catch (error) {
      console.warn("Saved data was invalid; using the bundled seed dataset.", error);
      return seed;
    }
  }

  async save(data: Dataset): Promise<void> {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validateDataset(data)));
  }
}
