import { HomePage } from "@/components/home/home-page";
import { SiteFooter, SiteHeader } from "@/components/layout/site-chrome";

export default function Home() {
  return (
    <div className="page-shell">
      <SiteHeader current="home" />
      <main id="main">
        <HomePage />
      </main>
      <SiteFooter />
    </div>
  );
}
