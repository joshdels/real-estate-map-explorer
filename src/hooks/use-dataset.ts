"use client";

import { useCallback, useEffect, useState } from "react";
import { createRepository } from "@/lib/repositories/factory";
import { seedDataset } from "@/lib/seed";
import { PropertyStore } from "@/lib/store";
import type { Dataset } from "@/lib/types";

let shared: Promise<PropertyStore> | undefined;

/** One PropertyStore per page load, shared by every React surface. */
export function getStore(): Promise<PropertyStore> {
  shared ??= (async () => {
    const { repository } = await createRepository();
    const store = new PropertyStore(repository);
    await store.initialize();
    return store;
  })();
  shared.catch(() => {
    shared = undefined;
  });
  return shared;
}

export interface DatasetState {
  /** Seed data during server render and first paint, then the live store data. */
  data: Dataset;
  /** False until the store has loaded; mutations are unavailable before then. */
  ready: boolean;
  failed: boolean;
  /** Runs a store mutation, then refreshes `data`. */
  mutate: (action: (store: PropertyStore) => Promise<unknown>) => Promise<void>;
}

export function useDataset(): DatasetState {
  const [data, setData] = useState<Dataset>(seedDataset);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    getStore().then(
      (store) => {
        if (!active) return;
        setData(store.snapshot());
        setReady(true);
      },
      () => active && setFailed(true),
    );
    return () => {
      active = false;
    };
  }, []);

  const mutate = useCallback<DatasetState["mutate"]>(async (action) => {
    const store = await getStore();
    await action(store);
    setData(store.snapshot());
  }, []);

  return { data, ready, failed, mutate };
}
