import type { DataRepository, Dataset } from "../types";
import { validateDataset } from "../validation";
import seedData from "../../data/data.json";

const STORAGE_KEY = "real-estate-map-explorer.data.v6";

export class LocalRepository implements DataRepository {
  readonly source = "local" as const;

  async load(): Promise<Dataset> {
    const seed = validateDataset(seedData);
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return seed;
    try {
      return validateDataset(JSON.parse(saved));
    } catch (error) {
      console.warn("Saved data was invalid; using data/data.json.", error);
      return seed;
    }
  }

  async save(data: Dataset): Promise<void> {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validateDataset(data)));
  }
}
