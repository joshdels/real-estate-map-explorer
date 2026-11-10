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
    await withTimeout(remote.load(), 6_000);
    return { repository: remote, usedFallback: false };
  } catch (error) {
    console.warn(
      "The configured Supabase dataset could not be loaded; using local sample data.",
      error,
    );
    return {
      repository: local,
      usedFallback: true,
      message: "The Supabase dataset is unavailable; using local sample data.",
    };
  }
}

function withTimeout<T>(operation: Promise<T>, milliseconds: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(
      () => reject(new Error("Supabase connection timed out.")),
      milliseconds,
    );
    operation.then(
      (value) => {
        window.clearTimeout(timeout);
        resolve(value);
      },
      (error: unknown) => {
        window.clearTimeout(timeout);
        reject(error);
      },
    );
  });
}
