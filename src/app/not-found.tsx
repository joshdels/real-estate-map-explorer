import type { Metadata } from "next";
import { brand } from "@/lib/brand";
import { ErrorScene } from "@/components/layout/error-scene";
import { SiteFooter, SiteHeader } from "@/components/layout/site-chrome";

export const metadata: Metadata = {
  title: `Page not found — ${brand.name}`,
  description: "The page you were looking for could not be found.",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className="page-shell">
      <SiteHeader />
      <ErrorScene
        code="404"
        title="We cannot find that page"
        message="The page may have moved, or the link may be wrong. Let us get you back to the land map."
      />
      <SiteFooter />
    </div>
  );
}
