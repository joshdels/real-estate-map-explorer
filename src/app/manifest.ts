import type { MetadataRoute } from "next";
import { brand } from "@/lib/brand";

/** Web app manifest: install metadata and a richer identity for search. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: brand.name,
    short_name: brand.shortName,
    description: brand.positioning,
    start_url: "/",
    display: "standalone",
    background_color: "#171b45",
    theme_color: "#3b41c7",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any", purpose: "any" },
    ],
  };
}
