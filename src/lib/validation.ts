import type {
  AdminArea,
  Coordinate,
  Dataset,
  ListingGroup,
  Provider,
  ProviderReview,
  PropertyMedia,
} from "@/lib/types";

const PURPOSES = ["sale", "rent"] as const;
const PROPERTY_TYPES = ["lot", "house", "condo", "farm", "commercial"] as const;
const REVIEW_STATES = ["pending", "reviewed", "suspended"] as const;
const PROVIDER_KINDS = ["owner", "broker", "developer"] as const;
const REVIEW_STATUSES = ["published", "flagged", "removed"] as const;

function oneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function isoDate(value: unknown): string | undefined {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value)))
    return undefined;
  return new Date(value).toISOString();
}

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function sanitizeAdminArea(value: unknown): AdminArea | undefined {
  if (!value || typeof value !== "object") return undefined;
  const input = value as Record<string, unknown>;
  const regionCode = cleanText(input.regionCode, 20);
  const provinceCode = cleanText(input.provinceCode, 20);
  if (!regionCode || !provinceCode) return undefined;
  const area: AdminArea = {
    regionCode,
    region: cleanText(input.region, 120),
    provinceCode,
    province: cleanText(input.province, 120),
  };
  const cityCode = cleanText(input.cityCode, 20);
  if (cityCode) {
    area.cityCode = cityCode;
    area.city = cleanText(input.city, 120);
  }
  if (input.approximate === true) area.approximate = true;
  return area;
}

function sanitizeProviders(value: unknown): Provider[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item: Record<string, unknown>) => {
    const id = cleanText(item?.id, 80);
    const name = cleanText(item?.name, 120);
    if (!id || !name) return [];
    const provider: Provider = {
      id,
      name,
      kind: oneOf(item.kind, PROVIDER_KINDS, "owner"),
      staffReviewed: item.staffReviewed === true,
    };
    const tagline = cleanText(item.tagline, 200);
    const serviceArea = cleanText(item.serviceArea, 120);
    const joinedAt = isoDate(item.joinedAt);
    if (tagline) provider.tagline = tagline;
    if (serviceArea) provider.serviceArea = serviceArea;
    if (joinedAt) provider.joinedAt = joinedAt;
    return [provider];
  });
}

function sanitizeGroups(value: unknown, providerIds: Set<string>): ListingGroup[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item: Record<string, unknown>) => {
    const id = cleanText(item?.id, 80);
    const name = cleanText(item?.name, 120);
    const providerId = cleanText(item?.providerId, 80);
    if (!id || !name || !providerIds.has(providerId)) return [];
    const group: ListingGroup = { id, providerId, name };
    const description = cleanText(item.description, 300);
    if (description) group.description = description;
    return [group];
  });
}

function sanitizeReviews(value: unknown, providerIds: Set<string>): ProviderReview[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item: Record<string, unknown>) => {
    const id = cleanText(item?.id, 80);
    const providerId = cleanText(item?.providerId, 80);
    const rating = Number(item?.rating);
    const createdAt = isoDate(item?.createdAt);
    if (
      !id ||
      !providerIds.has(providerId) ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5 ||
      !createdAt
    )
      return [];
    return [
      {
        id,
        providerId,
        rating,
        comment: cleanText(item.comment, 600),
        author: cleanText(item.author, 60) || "Anonymous",
        createdAt,
        status: oneOf(item.status, REVIEW_STATUSES, "published"),
      },
    ];
  });
}

export function validPoint(value: unknown): value is Coordinate {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    value.every(Number.isFinite) &&
    Math.abs(value[0]) <= 90 &&
    Math.abs(value[1]) <= 180
  );
}

export function validHttpUrl(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false;
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

export function validMediaUrl(value: unknown): value is string {
  return typeof value === "string" && (value.startsWith("/") || validHttpUrl(value));
}

function sanitizeMedia(value: unknown): PropertyMedia {
  if (!value || typeof value !== "object") return {};
  const input = value as Record<string, unknown>;
  const result: PropertyMedia = {};
  for (const key of [
    "panoramaUrl",
    "aerialVideoUrl",
    "walkthroughVideoUrl",
  ] as const) {
    if (validMediaUrl(input[key])) result[key] = String(input[key]);
  }
  if (Array.isArray(input.images))
    result.images = input.images.filter(validMediaUrl);
  return result;
}

export function validateDataset(value: unknown): Dataset {
  if (!value || typeof value !== "object")
    throw new TypeError("Dataset must be an object.");
  const data = structuredClone(value) as Dataset;
  if (
    !Array.isArray(data.properties) ||
    !Array.isArray(data.destinations) ||
    !Array.isArray(data.routes) ||
    !data.utilities ||
    !data.metadata
  ) {
    throw new TypeError(
      "Dataset must contain metadata, properties, utilities, destinations, and routes.",
    );
  }
  data.providers = sanitizeProviders(data.providers);
  const providerIds = new Set(data.providers.map((item) => item.id));
  data.groups = sanitizeGroups(data.groups, providerIds);
  data.reviews = sanitizeReviews(data.reviews, providerIds);
  const groupOwners = new Map(
    data.groups.map((group) => [group.id, group.providerId]),
  );
  data.properties.forEach((property) => {
    if (
      !property.id ||
      !property.title ||
      !validPoint(property.coordinates) ||
      !Array.isArray(property.polygon) ||
      property.polygon.length < 3 ||
      !property.polygon.every(validPoint)
    ) {
      throw new TypeError(
        `Invalid property record: ${property?.id || "unknown"}`,
      );
    }
    if (!Number.isFinite(property.price) || property.price < 0)
      throw new TypeError(`Invalid property price: ${property.id}`);
    property.media = sanitizeMedia(property.media);
    property.purpose = oneOf(property.purpose, PURPOSES, "sale");
    property.propertyType = oneOf(property.propertyType, PROPERTY_TYPES, "lot");
    property.review = oneOf(property.review, REVIEW_STATES, "pending");
    property.featured = property.featured === true;
    property.createdAt = isoDate(property.createdAt);
    property.adminArea = sanitizeAdminArea(property.adminArea);
    property.assistedBy = cleanText(property.assistedBy, 60) || undefined;
    if (!property.providerId || !providerIds.has(property.providerId))
      property.providerId = undefined;
    // A listing may only sit in a group that belongs to its own provider.
    if (
      !property.groupId ||
      groupOwners.get(property.groupId) !== property.providerId
    )
      property.groupId = undefined;
  });
  data.destinations.forEach((destination) => {
    if (
      !destination.id ||
      !destination.name ||
      !validPoint(destination.coordinates)
    )
      throw new TypeError(
        `Invalid destination record: ${destination?.id || "unknown"}`,
      );
  });
  return data;
}

export function parseImageUrls(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(validHttpUrl);
}
