import type { Metadata } from "next";
import { MapExplorer } from "@/components/explorer/map-explorer";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: `List a property — ${brand.name}`,
  description:
    "Create a property listing and pin its approximate boundary on the map.",
  robots: { index: false },
};

export default function ListPropertyPage() {
  return <MapExplorer workspaceMode />;
}
