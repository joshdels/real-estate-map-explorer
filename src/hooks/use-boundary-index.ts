"use client";

import { useEffect, useState } from "react";
import { boundaries, type BoundaryIndex } from "@/lib/geo/boundaries";

export interface BoundaryIndexState {
  /** Null while loading or when the boundary files are unavailable. */
  index: BoundaryIndex | null;
  failed: boolean;
}

/** Loads the PSA / NAMRIA region, province, and city lookup once per page. */
export function useBoundaryIndex(): BoundaryIndexState {
  const [index, setIndex] = useState<BoundaryIndex | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    boundaries.index().then(
      (loaded) => active && setIndex(loaded),
      () => active && setFailed(true),
    );
    return () => {
      active = false;
    };
  }, []);

  return { index, failed };
}
