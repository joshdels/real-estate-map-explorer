"use client";

import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    pannellum?: {
      viewer(
        element: HTMLElement,
        options: Record<string, unknown>,
      ): { destroy(): void };
    };
  }
}

interface Media {
  images?: string[];
  panoramaUrl?: string;
  aerialVideoUrl?: string;
  walkthroughVideoUrl?: string;
}

type Popup =
  | { kind: "gallery"; label: string }
  | { kind: "panorama"; label: string; url: string }
  | { kind: "video"; label: string; url: string };

function youTubeId(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.hostname === "youtu.be") return url.pathname.slice(1).split("/")[0] || null;
    if (url.hostname.endsWith("youtube.com")) {
      if (url.pathname === "/watch") return url.searchParams.get("v");
      if (url.pathname.startsWith("/embed/") || url.pathname.startsWith("/shorts/"))
        return url.pathname.split("/")[2] || null;
    }
  } catch {
    return null;
  }
  return null;
}

export function PropertyMedia({
  title,
  media,
  mapHref,
}: {
  title: string;
  media: Media;
  mapHref: string;
}) {
  const images = (media.images ?? []).filter(Boolean);
  const [popup, setPopup] = useState<Popup | null>(null);
  const [index, setIndex] = useState(0);
  const panoRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setPopup(null), []);

  useEffect(() => {
    if (!popup) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (popup.kind === "gallery" && images.length > 1) {
        if (event.key === "ArrowRight") setIndex((i) => (i + 1) % images.length);
        if (event.key === "ArrowLeft") setIndex((i) => (i - 1 + images.length) % images.length);
      }
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [popup, images.length, close]);

  useEffect(() => {
    if (popup?.kind !== "panorama" || !panoRef.current) return;
    const node = panoRef.current;
    if (!window.pannellum) {
      node.textContent = "The 360° viewer could not load.";
      return;
    }
    const viewer = window.pannellum.viewer(node, {
      type: "equirectangular",
      panorama: popup.url,
      autoLoad: true,
      showControls: true,
      compass: false,
      escapeHTML: true,
    });
    return () => viewer.destroy();
  }, [popup]);

  const features: {
    label: string;
    icon: string;
    cls: string;
    onClick?: () => void;
    href?: string;
    disabled?: boolean;
  }[] = [
    {
      label: "360 View",
      icon: "360°",
      cls: "feature-panoramaUrl",
      onClick: media.panoramaUrl
        ? () => setPopup({ kind: "panorama", label: "360° View", url: media.panoramaUrl! })
        : undefined,
      disabled: !media.panoramaUrl,
    },
    { label: "Lot Layout", icon: "⌞", cls: "feature-layout", href: mapHref },
    {
      label: "Drone Aerial",
      icon: "◉",
      cls: "feature-aerialVideoUrl",
      onClick: media.aerialVideoUrl
        ? () => setPopup({ kind: "video", label: "Drone Aerial", url: media.aerialVideoUrl! })
        : undefined,
      disabled: !media.aerialVideoUrl,
    },
    {
      label: "Walkthrough",
      icon: "↟",
      cls: "feature-walkthroughVideoUrl",
      onClick: media.walkthroughVideoUrl
        ? () => setPopup({ kind: "video", label: "Walkthrough", url: media.walkthroughVideoUrl! })
        : undefined,
      disabled: !media.walkthroughVideoUrl,
    },
    {
      label: "Photos",
      icon: "▧",
      cls: "feature-images",
      onClick: images.length
        ? () => {
            setIndex(0);
            setPopup({ kind: "gallery", label: "Photos" });
          }
        : undefined,
      disabled: images.length === 0,
    },
    { label: "Routes", icon: "⌖", cls: "feature-route", href: mapHref },
  ];

  const videoId = popup?.kind === "video" ? youTubeId(popup.url) : null;

  return (
    <>
      <div className="feature-grid">
        {features.map((item) =>
          item.href ? (
            <a key={item.label} className={`feature-button ${item.cls}`} href={item.href}>
              <span aria-hidden="true">{item.icon}</span> {item.label}
            </a>
          ) : (
            <button
              key={item.label}
              type="button"
              className={`feature-button ${item.cls}`}
              onClick={item.onClick}
              aria-disabled={item.disabled || undefined}
              disabled={item.disabled}
              title={item.disabled ? `${item.label} is not available for this listing` : undefined}
            >
              <span aria-hidden="true">{item.icon}</span> {item.label}
            </button>
          ),
        )}
      </div>

      {popup ? (
        <div
          className="media-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <section className="media-dialog" role="dialog" aria-modal="true" aria-label={`${title} — ${popup.label}`}>
            <header>
              <div>
                <span className="panel-kicker">Property media</span>
                <h2>{popup.label}</h2>
              </div>
              <button type="button" onClick={close} aria-label="Close media viewer">
                ×
              </button>
            </header>
            <div className="media-stage">
              {popup.kind === "panorama" ? (
                <div ref={panoRef} className="panorama-viewer" />
              ) : null}
              {popup.kind === "video" ? (
                videoId ? (
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0`}
                    title={`${title} — ${popup.label}`}
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                ) : (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <video src={popup.url} controls playsInline />
                )
              ) : null}
              {popup.kind === "gallery" ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={images[index]}
                    alt={`${title}, image ${index + 1} of ${images.length}`}
                  />
                  {images.length > 1 ? (
                    <>
                      <button
                        type="button"
                        className="gallery-nav gallery-previous"
                        aria-label="Previous image"
                        onClick={() => setIndex((i) => (i - 1 + images.length) % images.length)}
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        className="gallery-nav gallery-next"
                        aria-label="Next image"
                        onClick={() => setIndex((i) => (i + 1) % images.length)}
                      >
                        ›
                      </button>
                      <span className="gallery-count">
                        {index + 1} / {images.length}
                      </span>
                    </>
                  ) : null}
                </>
              ) : null}
            </div>
            <p className="media-caption">
              Sample media placeholder. Verify and replace before production use.
            </p>
          </section>
        </div>
      ) : null}
    </>
  );
}
