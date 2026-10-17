import type { DataRepository } from "../types";
import { LocalRepository } from "./local-repository";
import { SupabaseRepository } from "./supabase-repository";

export interface RepositoryResult {
  repository: DataRepository;
  usedFallback: boolean;
  message?: string;
}

export async function createRepository(): Promise<RepositoryResult> {
  const local = new LocalRepository();
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  if (!url || !key)
    return {
      repository: local,
      usedFallback: true,
      message: "Supabase is not configured; using local sample data.",
    };
  try {
    const remote = new SupabaseRepository(url, key);
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
