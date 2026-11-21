import seedJson from "../../public/data/data.json";
import type { Dataset } from "@/lib/types";
import { datasetForMode, isProductionMode } from "@/lib/runtime-mode";
import { validateDataset } from "@/lib/validation";

/** The bundled fictional dataset, validated once. Safe on server and client. */
export const seedDataset: Dataset = datasetForMode(validateDataset(seedJson), isProductionMode);
