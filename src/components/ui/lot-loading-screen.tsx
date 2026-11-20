"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function LotLoadingScreen({ overlay = false }: { overlay?: boolean }) {
  const container = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!overlay) return;

    const showForLotLink = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return;

      const target = event.target;
      const anchor = target instanceof Element ? target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!anchor || anchor.target === "_blank" || anchor.origin !== window.location.origin) return;
      if (!anchor.pathname.startsWith("/property/")) return;

      container.current?.removeAttribute("hidden");
    };

    document.addEventListener("click", showForLotLink);
    return () => document.removeEventListener("click", showForLotLink);
  }, [overlay]);

  useEffect(() => {
    if (overlay) container.current?.setAttribute("hidden", "");
  }, [overlay, pathname]);

  return (
    <div
      ref={container}
      className={`lot-loading${overlay ? " lot-loading-overlay" : ""}`}
      role="status"
      aria-live="polite"
      aria-label="Opening lot details"
      hidden={overlay}
    >
      <div className="lot-loading-content">
        <div className="loading-map-mark" aria-hidden="true">
          <span></span><span></span><span></span><span></span>
          <i className="ph ph-map-pin" />
        </div>
        <p className="eyebrow">Opening lot details</p>
        <strong>Loading plan and location</strong>
        <div className="loading-progress" aria-hidden="true"><span></span></div>
        <small>Preparing the listing for you.</small>
      </div>
    </div>
  );
}

export function LotNavigationOverlay() {
  return <LotLoadingScreen overlay />;
}
