import type { Metadata } from "next";
import { ClientDashboard } from "@/components/dashboard/client-dashboard";
import { SiteFooter, SiteHeader } from "@/components/layout/site-chrome";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Client dashboard — ${brand.name}`,
  description: "Manage lot listings, development groups, and highlighted land for sale.",
  robots: { index: false },
};

export default function DashboardPage() {
  return (
    <div className="page-shell">
      <SiteHeader current="dashboard" />
      <main id="main"><ClientDashboard /></main>
      <SiteFooter />
    </div>
  );
}
