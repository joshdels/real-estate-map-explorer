import type { Metadata } from "next";
import { MapExplorer } from "@/components/explorer/map-explorer";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Explore the map — ${brand.name}`,
  description:
    "Search sample Philippine listings by region, province, city, and map location.",
};

export default function ExplorePage() {
  return <MapExplorer />;
}
