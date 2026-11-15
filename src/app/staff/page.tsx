import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/layout/site-chrome";
import { StaffConsole } from "@/components/staff/staff-console";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Staff console — ${brand.name}`,
  description: "Admin and employee tools for listing review, flags, and assisted listings.",
  robots: { index: false },
};

export default function StaffPage() {
  return (
    <div className="page-shell">
      <SiteHeader current="staff" />
      <main id="main"><StaffConsole /></main>
      <SiteFooter />
    </div>
  );
}
