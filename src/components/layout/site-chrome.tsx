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
          <a className="site-nav-link" href="/explore">Find Lands</a>
          {link("/providers", "Trusted Providers", "providers")}
          <Link className="nav-cta" href="/become-a-provider">Become a Provider</Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer id="site-footer" className="site-footer">
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
            <p>Find land by location. Compare lots on the map. List your land for buyers to see.</p>
          </section>

          <nav className="site-footer-group" aria-labelledby="footer-explore-title">
            <h2 id="footer-explore-title">Explore</h2>
            <Link href="/">Home</Link>
            <a href="/explore">Find Lands</a>
            <Link href="/providers">Trusted Providers</Link>
            <Link href="/become-a-provider">Become a Provider</Link>
          </nav>

          <nav className="site-footer-group" aria-labelledby="footer-manage-title">
            <h2 id="footer-manage-title">For sellers</h2>
            <Link href="/dashboard">My listings</Link>
            <a href="/list-property">Provider listing form</a>
            <Link href="/staff">Staff</Link>
            <a href="/list-property">Add land</a>
          </nav>

        </div>

        <div className="site-footer-bottom">
          <p>© {new Date().getFullYear()} {brand.name}</p>
          <p>Sample listings are not verified. {brand.boundaryCredit}</p>
        </div>
      </div>
    </footer>
  );
}
