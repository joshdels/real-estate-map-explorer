import type { Metadata } from "next";
import { ProvidersDirectory } from "@/components/providers/providers";
import { SiteFooter, SiteHeader } from "@/components/layout/site-chrome";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Property providers — ${brand.name}`,
  description: "Owners, brokers, and developers listing on the platform, ordered by buyer reviews.",
};

export default function ProvidersPage() {
  return (
    <div className="page-shell">
      <SiteHeader current="providers" />
      <main id="main"><ProvidersDirectory /></main>
      <SiteFooter />
    </div>
  );
}
