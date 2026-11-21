import type {
  Dataset,
  ListingPurpose,
  Property,
  PropertyType,
  Provider,
  ProviderReview,
} from "@/lib/types";

export type ListingSort = "recommended" | "newest" | "price-asc" | "price-desc";

export interface ListingCriteria {
  term?: string;
  location?: string;
  status?: string;
  purpose?: ListingPurpose | "";
  propertyType?: PropertyType | "";
  minPrice?: number;
  maxPrice?: number;
  regionCode?: string;
  provinceCode?: string;
  cityCode?: string;
  sort?: ListingSort;
}

export interface ListingBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

export interface ProviderRating {
  average: number;
  count: number;
}

export const PURPOSE_LABELS: Record<ListingPurpose, string> = {
  sale: "For sale",
  rent: "For rent",
};
export const TYPE_LABELS: Record<PropertyType, string> = {
  lot: "Lot",
  house: "House & lot",
  condo: "Condominium",
  farm: "Farm / agricultural",
  commercial: "Commercial",
};
export const KIND_LABELS: Record<Provider["kind"], string> = {
  owner: "Land owner",
  broker: "Broker",
  developer: "Developer",
};

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

export function formatPrice(property: Pick<Property, "price" | "purpose">): string {
  return `${peso.format(property.price)}${property.purpose === "rent" ? " / month" : ""}`;
}

/** Rounded peso amount for dense map markers, e.g. ₱5M or ₱850K. */
export function formatCompactAmount(price: number): string {
  const divisor = price >= 1_000_000 ? 1_000_000 : price >= 1_000 ? 1_000 : 1;
  const suffix = divisor === 1_000_000 ? "M" : divisor === 1_000 ? "K" : "";
  const scaled = price / divisor;
  const amount = scaled >= 100 || Number.isInteger(scaled)
    ? String(Math.round(scaled))
    : scaled.toFixed(1).replace(/\.0$/, "");
  return `₱${amount}${suffix}`;
}

/** Short price label for dense map markers. Full prices remain visible in cards and popups. */
export function formatCompactPrice(
  property: Pick<Property, "price" | "purpose">,
): string {
  return `${formatCompactAmount(property.price)}${property.purpose === "rent" ? "/mo" : ""}`;
}

/** Rounded price range for a group of lots, e.g. "₱2M – ₱5M" or a single "₱3M". */
export function formatCompactPriceRange(min: number, max: number): string {
  const low = formatCompactAmount(min);
  const high = formatCompactAmount(max);
  return low === high ? low : `${low} – ${high}`;
}

/** Listings whose representative point falls inside the current map view. */
export function listingsInBounds(
  properties: Property[],
  bounds: ListingBounds,
): Property[] {
  return properties.filter((property) => {
    const [latitude, longitude] = property.coordinates;
    const withinLatitude = latitude >= bounds.south && latitude <= bounds.north;
    const withinLongitude = bounds.west <= bounds.east
      ? longitude >= bounds.west && longitude <= bounds.east
      : longitude >= bounds.west || longitude <= bounds.east;
    return withinLatitude && withinLongitude;
  });
}

/** Suspended listings never appear on public surfaces. */
export function isPublic(property: Property): boolean {
  return property.review !== "suspended";
}

export function publicListings(data: Dataset): Property[] {
  return data.properties.filter(isPublic);
}

export function areaLabel(property: Property): string {
  const area = property.adminArea;
  if (!area) return property.address;
  return [area.city, area.province].filter(Boolean).join(", ");
}

/** Average rating per provider from published reviews only. */
export function providerRatings(
  reviews: ProviderReview[],
): Map<string, ProviderRating> {
  const totals = new Map<string, { sum: number; count: number }>();
  for (const review of reviews) {
    if (review.status !== "published") continue;
    const entry = totals.get(review.providerId) ?? { sum: 0, count: 0 };
    entry.sum += review.rating;
    entry.count += 1;
    totals.set(review.providerId, entry);
  }
  return new Map(
    [...totals].map(([id, { sum, count }]) => [
      id,
      { average: sum / count, count },
    ]),
  );
}

/** Neutral starting point for a provider's score, on the 1-5 scale. */
const PRIOR_RATING = 3.5;

/**
 * Rating that is fair to providers with few reviews: every provider starts
 * with `minimumReviews` imaginary reviews at a neutral `prior`, so one 5-star
 * review cannot outrank a provider with many strong reviews.
 */
export function weightedRating(
  rating: ProviderRating | undefined,
  prior = PRIOR_RATING,
  minimumReviews = 3,
): number {
  if (!rating || rating.count === 0) return prior;
  return (
    (rating.count * rating.average + minimumReviews * prior) /
    (rating.count + minimumReviews)
  );
}

function timestamp(property: Property): number {
  return property.createdAt ? Date.parse(property.createdAt) : 0;
}

/** Recommendation score: provider reputation first, then small trust signals. */
export function recommendationScore(
  property: Property,
  ratings: Map<string, ProviderRating>,
): number {
  // Listings without a provider profile rank below unreviewed providers.
  let score = property.providerId
    ? weightedRating(ratings.get(property.providerId))
    : PRIOR_RATING - 1;
  if (property.featured) score += 0.2;
  if (property.review === "reviewed") score += 0.15;
  if (property.status !== "Available") score -= 1.5;
  return score;
}

export function sortListings(
  properties: Property[],
  sort: ListingSort,
  reviews: ProviderReview[],
): Property[] {
  const sorted = [...properties];
  if (sort === "price-asc") return sorted.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") return sorted.sort((a, b) => b.price - a.price);
  if (sort === "newest")
    return sorted.sort((a, b) => timestamp(b) - timestamp(a));
  const ratings = providerRatings(reviews);
  return sorted.sort(
    (a, b) =>
      recommendationScore(b, ratings) - recommendationScore(a, ratings) ||
      timestamp(b) - timestamp(a),
  );
}

export function filterListings(data: Dataset, criteria: ListingCriteria): Property[] {
  const term = criteria.term?.trim().toLocaleLowerCase() ?? "";
  const location = criteria.location?.trim().toLocaleLowerCase() ?? "";
  const minimum = criteria.minPrice || 0;
  const maximum = criteria.maxPrice || Number.POSITIVE_INFINITY;
  const providers = new Map(data.providers.map((item) => [item.id, item.name]));
  const matches = publicListings(data).filter((property) => {
    const area = property.adminArea;
    const place = `${property.address} ${area?.city ?? ""} ${area?.province ?? ""} ${area?.region ?? ""}`.toLocaleLowerCase();
    const searchable = `${property.title} ${place} ${property.area} ${property.description ?? ""} ${providers.get(property.providerId ?? "") ?? ""}`.toLocaleLowerCase();
    return (
      (!criteria.status || criteria.status === "All" || property.status === criteria.status) &&
      (!criteria.purpose || property.purpose === criteria.purpose) &&
      (!criteria.propertyType || property.propertyType === criteria.propertyType) &&
      (!term || searchable.includes(term)) &&
      (!location || place.includes(location)) &&
      property.price >= minimum &&
      property.price <= maximum &&
      (!criteria.regionCode || area?.regionCode === criteria.regionCode) &&
      (!criteria.provinceCode || area?.provinceCode === criteria.provinceCode) &&
      (!criteria.cityCode || area?.cityCode === criteria.cityCode)
    );
  });
  return sortListings(matches, criteria.sort ?? "recommended", data.reviews);
}

export function recentListings(data: Dataset, limit: number): Property[] {
  return sortListings(
    publicListings(data).filter((item) => item.createdAt),
    "newest",
    data.reviews,
  ).slice(0, limit);
}

/** Available listings from the best-reviewed providers. */
export function suggestedListings(data: Dataset, limit: number): Property[] {
  const ratings = providerRatings(data.reviews);
  return sortListings(
    publicListings(data).filter(
      (item) =>
        item.status === "Available" &&
        item.providerId !== undefined &&
        ratings.has(item.providerId),
    ),
    "recommended",
    data.reviews,
  ).slice(0, limit);
}

export interface ProviderSummary {
  provider: Provider;
  rating?: ProviderRating;
  listings: Property[];
}

/** Providers ordered by weighted rating, then by number of public listings. */
export function rankedProviders(data: Dataset): ProviderSummary[] {
  const ratings = providerRatings(data.reviews);
  const listings = publicListings(data);
  return data.providers
    .map((provider) => ({
      provider,
      rating: ratings.get(provider.id),
      listings: listings.filter((item) => item.providerId === provider.id),
    }))
    .sort(
      (a, b) =>
        Number(Boolean(b.rating)) - Number(Boolean(a.rating)) ||
        weightedRating(b.rating) - weightedRating(a.rating) ||
        b.listings.length - a.listings.length,
    );
}

export function formatRating(rating?: ProviderRating): string {
  if (!rating) return "No reviews yet";
  return `${rating.average.toFixed(1)} out of 5 from ${rating.count} ${rating.count === 1 ? "review" : "reviews"}`;
}
