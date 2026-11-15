import Link from "next/link";
import { brand } from "@/lib/brand";

// Links to /explore are plain anchors on purpose: the map explorer attaches
// its behavior once per page load, so it must be entered with a full navigation.

export function SiteHeader({ current }: { current?: "home" | "providers" | "dashboard" | "staff" }) {
  const link = (href: string, label: string, key: string) => (
    <Link className="site-nav-link" href={href} aria-current={current === key ? "page" : undefined}>
      {label}
    </Link>
  );
  return (
    <header className="page-header">
      <div className="page-header-inner">
        <Link className="brand" href="/" aria-label={`${brand.name} home`}>
          <span className="brand-mark" aria-hidden="true">{brand.shortName}</span>
          <span>
            <strong>{brand.name}</strong>
            <small>{brand.tagline}</small>
          </span>
        </Link>
        <nav className="page-nav" aria-label="Primary navigation">
          <a className="site-nav-link" href="/explore">Explore map</a>
          {link("/providers", "Providers", "providers")}
          <Link className="site-nav-link" href="/become-a-provider">Become a provider</Link>
          <a className="nav-cta" href="/list-property">List your property</a>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-main">
          <section className="site-footer-about" aria-labelledby="footer-brand-name">
            <div className="site-footer-brand">
              <span className="brand-mark" aria-hidden="true">{brand.shortName}</span>
              <div>
                <strong id="footer-brand-name">{brand.name}</strong>
                <small>{brand.tagline}</small>
              </div>
            </div>
            <p>{brand.positioning}</p>
          </section>

          <nav className="site-footer-group" aria-labelledby="footer-explore-title">
            <h2 id="footer-explore-title">Explore</h2>
            <Link href="/">Home</Link>
            <a href="/explore">Explore the map</a>
            <Link href="/providers">Property providers</Link>
            <a href="/list-property">List a property</a>
          </nav>

          <nav className="site-footer-group" aria-labelledby="footer-manage-title">
            <h2 id="footer-manage-title">Manage</h2>
            <Link href="/dashboard">Client dashboard</Link>
            <Link href="/become-a-provider">Become a provider</Link>
            <Link href="/staff">Staff console</Link>
            <a href="/list-property">Create a listing</a>
          </nav>

        </div>

        <div className="site-footer-bottom">
          <p>© {new Date().getFullYear()} {brand.name}. Built for clearer Philippine property discovery.</p>
          <p>Sample product. No listing is independently verified. {brand.boundaryCredit}</p>
        </div>
      </div>
    </footer>
  );
}
