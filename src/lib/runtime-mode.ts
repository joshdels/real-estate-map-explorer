import type { Dataset } from "@/lib/types";

export const isProductionMode = process.env.NEXT_PUBLIC_APP_MODE === "production";

export function datasetForMode(dataset: Dataset, production: boolean): Dataset {
  if (!production) return dataset;
  return {
    metadata: {
      name: "Open Lot Plans",
      version: dataset.metadata.version,
      isSample: false,
      notice: "",
    },
    utilities: {},
    properties: [],
    destinations: [],
    routes: [],
    providers: [],
    groups: [],
    reviews: [],
  };
}
