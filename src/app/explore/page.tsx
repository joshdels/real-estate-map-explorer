import type { Metadata } from "next";
import { MapExplorer } from "@/components/explorer/map-explorer";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Explore the map — ${brand.name}`,
  description:
    "Search sample Philippine listings by region, province, city, and map location.",
  alternates: { canonical: "/explore" },
  openGraph: {
    title: `Explore the map — ${brand.name}`,
    description:
      "Search land for sale across the Philippines by region, province, city, and map location.",
    url: "/explore",
    type: "website",
    siteName: brand.name,
  },
};

export default function ExplorePage() {
  return (
    <>
      {/* Paint the map-first layout immediately (AGENTS: satellite map by
          default), so the first frame is the map and sidebar, not a full-width
          list skeleton. The explorer still honours ?view=list after load. */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "try{if(new URLSearchParams(location.search).get('view')!=='list')document.body.classList.add('show-map-view')}catch(e){}",
        }}
      />
      <MapExplorer />
    </>
  );
}
