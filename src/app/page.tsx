import { HomePage } from "@/components/home/home-page";
import { SiteFooter, SiteHeader } from "@/components/layout/site-chrome";
import { JsonLd } from "@/components/seo/json-ld";
import { homeGraph } from "@/lib/seo";

export default function Home() {
  return (
    <div className="page-shell">
      <JsonLd data={homeGraph()} />
      <SiteHeader current="home" />
      <main id="main">
        <HomePage />
      </main>
      <SiteFooter />
    </div>
  );
}
