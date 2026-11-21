import type { Metadata } from "next";
import { ProvidersDirectory } from "@/components/providers/providers";
import { SiteFooter, SiteHeader } from "@/components/layout/site-chrome";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Lot sellers — ${brand.name}`,
  description: "Owners, brokers, and developers offering lot plans and open development land, ordered by buyer reviews.",
  alternates: { canonical: "/providers" },
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
