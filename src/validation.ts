import type { Coordinate, Dataset, PropertyMedia } from "./types";

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
