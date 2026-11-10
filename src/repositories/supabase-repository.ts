import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "../lib/supabase/database.types";
import type { DataRepository, Dataset } from "../types";
import { validateDataset } from "../validation";

export class SupabaseRepository implements DataRepository {
  readonly source = "supabase" as const;
  private readonly client: SupabaseClient<Database>;

  constructor(client: SupabaseClient<Database>) {
    this.client = client;
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
          payload: validateDataset(dataset) as unknown as Json,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "slug" },
      );
    if (error) throw error;
  }
}
