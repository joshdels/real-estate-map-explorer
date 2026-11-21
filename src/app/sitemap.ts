import type { MetadataRoute } from "next";
import { isPublic } from "@/lib/listings";
import { seedDataset } from "@/lib/seed";
import { absoluteUrl } from "@/lib/seo";

/**
 * Lists every public, indexable URL for crawlers. Built from the bundled seed,
 * the same source the listing and provider pages are generated from. Private
 * surfaces (dashboard, staff, list-property, login) are excluded and also
 * blocked in robots.ts.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const core: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/explore"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/providers"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/become-a-provider"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  const listings: MetadataRoute.Sitemap = seedDataset.properties
    .filter(isPublic)
    .map((property) => ({
      url: absoluteUrl(`/property/${property.id}`),
      lastModified: property.createdAt ? new Date(property.createdAt) : now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  const providers: MetadataRoute.Sitemap = seedDataset.providers.map((provider) => ({
    url: absoluteUrl(`/providers/${provider.id}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...core, ...listings, ...providers];
}
