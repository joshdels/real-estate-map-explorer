import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/layout/site-chrome";
import { brand } from "@/lib/brand";
import { formatPrice, isPublic } from "@/lib/listings";
import { seedDataset } from "@/lib/seed";
import { PropertyView } from "@/components/property/property-view";

type Params = { params: Promise<{ id: string }> };

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

function findSeedProperty(id: string) {
  return seedDataset.properties.find((item) => item.id === id && isPublic(item));
}

export function generateStaticParams(): { id: string }[] {
  return seedDataset.properties.map((item) => ({ id: item.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const property = findSeedProperty(id);
  // Listings created in the browser are not known to the server.
  if (!property) return { title: `Lot listing — ${brand.name}` };
  const title = `${property.title} — ${formatPrice(property)} | ${brand.name}`;
  const description =
    property.description ||
    `${property.area} ${property.status} lot for sale at ${property.address}. Sample lot plan on ${brand.name}.`;
  const image = property.media?.images?.[0];
  const url = `${SITE_URL}/property/${property.id}`;
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: brand.name,
      images: image ? [{ url: image, alt: property.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function PropertyPage({ params }: Params) {
  const { id } = await params;
  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="detail-page" id="top">
        <div className="detail-backbar">
          <a className="detail-back" href="/explore">
            <i className="ph ph-arrow-left" aria-hidden="true" /> All lots
          </a>
        </div>
        <PropertyView id={id} />
      </main>
      <SiteFooter />
    </div>
  );
}
