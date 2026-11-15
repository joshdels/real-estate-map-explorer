import type { Metadata } from "next";
import { ProviderProfile } from "@/components/providers/providers";
import { SiteFooter, SiteHeader } from "@/components/layout/site-chrome";
import { brand } from "@/lib/brand";
import { seedDataset } from "@/lib/seed";

type Params = { params: Promise<{ id: string }> };

export function generateStaticParams(): { id: string }[] {
  return seedDataset.providers.map((item) => ({ id: item.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const provider = seedDataset.providers.find((item) => item.id === id);
  return {
    title: `${provider?.name ?? "Provider"} — ${brand.name}`,
    description: provider?.tagline,
  };
}

export default async function ProviderPage({ params }: Params) {
  const { id } = await params;
  return (
    <div className="page-shell">
      <SiteHeader current="providers" />
      <main id="main"><ProviderProfile id={id} /></main>
      <SiteFooter />
    </div>
  );
}
