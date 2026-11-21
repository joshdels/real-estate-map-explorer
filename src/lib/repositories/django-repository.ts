import type { DataRepository, Dataset } from "@/lib/types";
import { validateDataset } from "@/lib/validation";

export class DjangoRepository implements DataRepository {
  readonly source = "django" as const;

  constructor(private readonly apiUrl: string) {}

  async load(): Promise<Dataset> {
    const response = await fetch(`${this.apiUrl}/api/v1/dataset`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error(`Django dataset load failed: ${response.status}`);
    return validateDataset(await response.json());
  }

  async save(dataset: Dataset): Promise<void> {
    const response = await fetch(`${this.apiUrl}/api/v1/dataset`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validateDataset(dataset)),
    });
    if (!response.ok) throw new Error(`Django dataset save failed: ${response.status}`);
  }
}
