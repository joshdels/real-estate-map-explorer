import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/layout/site-chrome";
import { JsonLd } from "@/components/seo/json-ld";
import { brand } from "@/lib/brand";
import { formatPrice, isPublic, providerRatings } from "@/lib/listings";
import { seedDataset } from "@/lib/seed";
import { SITE_URL, listingGraph } from "@/lib/seo";
import { PropertyView } from "@/components/property/property-view";

type Params = { params: Promise<{ id: string }> };

function findSeedProperty(id: string) {
  return seedDataset.properties.find((item) => item.id === id && isPublic(item));
}

export function generateStaticParams(): { id: string }[] {
  return seedDataset.properties.map((item) => ({ id: item.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const property = findSeedProperty(id);
  // Listings created in the browser are not known to the server, so there is no
  // crawlable content; keep them out of the index.
  if (!property)
    return { title: `Lot listing — ${brand.name}`, robots: { index: false, follow: true } };
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
  const property = findSeedProperty(id);
  const provider = property?.providerId
    ? seedDataset.providers.find((item) => item.id === property.providerId)
    : undefined;
  const rating = provider
    ? providerRatings(seedDataset.reviews).get(provider.id)
    : undefined;
  return (
    <div className="page-shell">
      {property ? <JsonLd data={listingGraph(property, provider, rating)} /> : null}
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
