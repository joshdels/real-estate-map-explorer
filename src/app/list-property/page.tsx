import type { Metadata } from "next";
import { MapExplorer } from "@/components/explorer/map-explorer";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: `List a lot plan — ${brand.name}`,
  description:
    "List land for sale with its lot details and approximate boundary on the map.",
  robots: { index: false },
};

export default function ListPropertyPage() {
  return <MapExplorer workspaceMode />;
}
