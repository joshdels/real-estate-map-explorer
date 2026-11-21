import type { Metadata } from "next";
import { ProviderProfile } from "@/components/providers/providers";
import { SiteFooter, SiteHeader } from "@/components/layout/site-chrome";
import { JsonLd } from "@/components/seo/json-ld";
import { brand } from "@/lib/brand";
import { isPublic } from "@/lib/listings";
import { seedDataset } from "@/lib/seed";
import { absoluteUrl, providerGraph } from "@/lib/seo";

type Params = { params: Promise<{ id: string }> };

function findProvider(id: string) {
  return seedDataset.providers.find((item) => item.id === id);
}

export function generateStaticParams(): { id: string }[] {
  return seedDataset.providers.map((item) => ({ id: item.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const provider = findProvider(id);
  if (!provider) return { title: "Provider", robots: { index: false, follow: true } };
  const title = `${provider.name} — ${brand.name}`;
  const description =
    provider.tagline ||
    `${provider.name} lists land for sale on ${brand.name}. Browse their lots and reviews.`;
  const url = absoluteUrl(`/providers/${provider.id}`);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "profile", siteName: brand.name },
    twitter: { card: "summary", title, description },
  };
}

export default async function ProviderPage({ params }: Params) {
  const { id } = await params;
  const provider = findProvider(id);
  const listings = provider
    ? seedDataset.properties.filter(
        (item) => item.providerId === provider.id && isPublic(item),
      )
    : [];
  return (
    <div className="page-shell">
      {provider ? (
        <JsonLd data={providerGraph(provider, listings, seedDataset.reviews)} />
      ) : null}
      <SiteHeader current="providers" />
      <main id="main"><ProviderProfile id={id} /></main>
      <SiteFooter />
    </div>
  );
}
