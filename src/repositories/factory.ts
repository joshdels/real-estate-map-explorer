import type { DataRepository } from "../types";
import { createSupabaseBrowserClient } from "../lib/supabase/client";
import { LocalRepository } from "./local-repository";
import { SupabaseRepository } from "./supabase-repository";

export interface RepositoryResult {
  repository: DataRepository;
  usedFallback: boolean;
  message?: string;
}

export async function createRepository(): Promise<RepositoryResult> {
  const local = new LocalRepository();
  const client = createSupabaseBrowserClient();
  if (!client)
    return {
      repository: local,
      usedFallback: true,
      message: "Supabase is not configured; using local sample data.",
    };
  try {
    const remote = new SupabaseRepository(client);
    await remote.load();
    return { repository: remote, usedFallback: false };
  } catch (error) {
    console.warn(
      "Supabase could not be reached; using local sample data.",
      error,
    );
    return {
      repository: local,
      usedFallback: true,
      message: "Supabase is unavailable; using local sample data.",
    };
  }
}
