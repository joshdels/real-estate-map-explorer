import type { MetadataRoute } from "next";
import { SITE_URL, absoluteUrl } from "@/lib/seo";

/**
 * Crawl rules. Public marketing and listing pages are open to every bot,
 * including the answer and generative engines (AEO / GEO). Private or demo-only
 * surfaces are disallowed. The sitemap points crawlers at every indexable URL.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/staff",
        "/list-property",
        "/login",
        "/auth/",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE_URL,
  };
}
