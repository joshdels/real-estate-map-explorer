import { isProductionMode } from "@/lib/runtime-mode";

/** Single source for brand copy. Rename the product here, not in components. */
export const brand = Object.freeze({
  name: "Open Lot Plans",
  shortName: "OLP",
  tagline: "Provincial land for sale, clearly mapped",
  positioning:
    "Find open lots for sale across Philippine provinces. Compare land on the map, or list land for buyers to see.",
  sampleNotice: isProductionMode
    ? ""
    : "All lots, sellers, reviews, and prices are fictional samples. Check all details before making a decision.",
  boundaryCredit:
    "Administrative outlines are simplified and are not legal or surveyed boundaries.",
});
