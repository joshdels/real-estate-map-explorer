import type { Metadata } from "next";
import { BecomeProvider } from "@/components/providers/become-provider";
import { SiteFooter, SiteHeader } from "@/components/layout/site-chrome";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Become a provider | ${brand.name}`,
  description: "Present and manage mapped property listings with a provider profile.",
};

export default function BecomeProviderPage() {
  return <div className="page-shell"><SiteHeader /><main><BecomeProvider /></main><SiteFooter /></div>;
}
