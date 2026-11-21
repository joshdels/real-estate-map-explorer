import type { DataRepository } from "@/lib/types";
import { DjangoRepository } from "@/lib/repositories/django-repository";
import { LocalRepository } from "@/lib/repositories/local-repository";
import { isProductionMode } from "@/lib/runtime-mode";

export interface RepositoryResult {
  repository: DataRepository;
  usedFallback: boolean;
  message?: string;
}

export async function createRepository(): Promise<RepositoryResult> {
  const local = new LocalRepository();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (apiUrl) {
    try {
      const remote = new DjangoRepository(apiUrl);
      await withTimeout(remote.load(), 6_000, "Django API connection timed out.");
      return { repository: remote, usedFallback: false };
    } catch (error) {
      if (isProductionMode) throw error;
      console.warn(
        "The configured Django dataset could not be loaded; using local sample data.",
        error,
      );
      return {
        repository: local,
        usedFallback: true,
        message: "The Django dataset is unavailable; using local sample data.",
      };
    }
  }
  if (isProductionMode) {
    throw new Error("NEXT_PUBLIC_API_URL is required in production mode.");
  }
  return {
    repository: local,
    usedFallback: true,
    message: "The Django API is not configured; using local sample data.",
  };
}

function withTimeout<T>(
  operation: Promise<T>,
  milliseconds: number,
  timeoutMessage: string,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(
      () => reject(new Error(timeoutMessage)),
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
