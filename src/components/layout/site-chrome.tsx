"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { List, X } from "@phosphor-icons/react";
import { brand } from "@/lib/brand";
import { clearSession } from "@/lib/session";
import { useSession } from "@/hooks/use-session";
import { isProductionMode } from "@/lib/runtime-mode";

// Links to /explore are plain anchors on purpose: the map explorer attaches
// its behavior once per page load, so it must be entered with a full navigation.

export function SiteHeader({ current }: { current?: "home" | "providers" | "dashboard" | "staff" }) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const navRef = useRef<HTMLElement>(null);
  const [session, refreshSession] = useSession();
  // Staff roles land on the staff console; clients on their dashboard.
  const home = session ? (session.role === "client" ? "/dashboard" : "/staff") : null;
  const signOut = () => {
    clearSession();
    refreshSession();
    setOpen(false);
  };

  // Close the dropdown on Escape or a click outside the nav.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onClick = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onClick);
    };
  }, [open]);

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
        <nav className="page-nav" aria-label="Primary navigation" ref={navRef}>
          {home ? (
            <Link className="nav-button nav-button-solid" href={home}>My workspace</Link>
          ) : (
            <>
              <Link className="nav-button nav-button-ghost" href="/login">Login</Link>
              <Link className="nav-button nav-button-solid" href="/become-a-provider">Become a Provider</Link>
            </>
          )}
          <button
            type="button"
            className="nav-burger"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X aria-hidden="true" /> : <List aria-hidden="true" />}
          </button>
          <div className="nav-dropdown" id={menuId} hidden={!open}>
            <Link className="nav-dropdown-link" href="/" aria-current={current === "home" ? "page" : undefined} onClick={() => setOpen(false)}>Home</Link>
            <a className="nav-dropdown-link" href="/explore" onClick={() => setOpen(false)}>Find Lands</a>
            <Link className="nav-dropdown-link" href="/providers" aria-current={current === "providers" ? "page" : undefined} onClick={() => setOpen(false)}>Trusted Providers</Link>
            {home ? (
              <>
                <Link className="nav-dropdown-link" href={home} onClick={() => setOpen(false)}>My workspace</Link>
                <button type="button" className="nav-dropdown-link nav-dropdown-signout" onClick={signOut}>Log out</button>
              </>
            ) : (
              <Link className="nav-dropdown-link nav-dropdown-login" href="/login" onClick={() => setOpen(false)}>Login</Link>
            )}
          </div>
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
          <p>{!isProductionMode ? "Sample listings are not verified. " : ""}{brand.boundaryCredit}</p>
        </div>
      </div>
    </footer>
  );
}
