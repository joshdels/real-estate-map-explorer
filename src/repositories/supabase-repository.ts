import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { DataRepository, Dataset } from "../types";
import { validateDataset } from "../validation";

export class SupabaseRepository implements DataRepository {
  readonly source = "supabase" as const;
  private readonly client: SupabaseClient;

  constructor(url: string, anonKey: string) {
    this.client = createClient(url, anonKey);
  }

  async load(): Promise<Dataset> {
    const { data, error } = await this.client
      .from("app_datasets")
      .select("payload")
      .eq("slug", "default")
      .single();
    if (error) throw error;
    return validateDataset(data?.payload);
  }

  async save(dataset: Dataset): Promise<void> {
    const { error } = await this.client
      .from("app_datasets")
      .upsert(
        {
          slug: "default",
          payload: validateDataset(dataset),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "slug" },
      );
    if (error) throw error;
  }
}
