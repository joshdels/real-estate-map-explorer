import { qs } from "./dom";
import type { MediaRequest } from "./types";
import { validMediaUrl } from "./validation";

export function resolveMediaUrl(
  url: string,
  base = import.meta.env.BASE_URL,
): string {
  if (!url.startsWith("/")) return url;

  const baseUrl = new URL(base, window.location.origin);
  return new URL(url.slice(1), baseUrl).href;
}

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

export class MediaViewer {
  private readonly backdrop = qs<HTMLElement>("#media-dialog");
  private readonly stage = qs<HTMLElement>("#media-stage");
  private readonly title = qs<HTMLElement>("#media-title");
  private readonly caption = qs<HTMLElement>("#media-caption");
  private viewer?: { destroy(): void };
  private galleryUrls: string[] = [];
  private galleryIndex = 0;
  private touchStartX?: number;

  constructor() {
    qs<HTMLButtonElement>("#close-media").addEventListener("click", () =>
      this.close(),
    );
    this.backdrop.addEventListener("click", (event) => {
      if (event.target === this.backdrop) this.close();
    });
    this.stage.addEventListener(
      "touchstart",
      (event) => {
        this.touchStartX = event.changedTouches[0]?.clientX;
      },
      { passive: true },
    );
    this.stage.addEventListener(
      "touchend",
      (event) => {
        if (this.touchStartX === undefined) return;
        const distance =
          (event.changedTouches[0]?.clientX ?? this.touchStartX) -
          this.touchStartX;
        if (Math.abs(distance) > 45)
          this.showGalleryImage(this.galleryIndex + (distance < 0 ? 1 : -1));
        this.touchStartX = undefined;
      },
      { passive: true },
    );
  }

  open(request: MediaRequest): void {
    this.close();
    this.title.textContent = request.title;
    this.caption.textContent = request.isExample
      ? "Sample media placeholder. Verify and replace before production use."
      : "Property media supplied by the listing source.";
    this.backdrop.hidden = false;
    if (request.type === "gallery")
      this.openGallery(request.urls ?? [], request.title);
    else if (request.url && validMediaUrl(request.url))
      request.type === "panorama"
        ? this.openPanorama(request.url)
        : this.stage.replaceChildren(
            this.content(request.url, request.type, request.title),
          );
    qs<HTMLButtonElement>("#close-media").focus();
  }

  close(): void {
    this.viewer?.destroy();
    this.viewer = undefined;
    this.galleryUrls = [];
    this.stage.replaceChildren();
    this.backdrop.hidden = true;
  }

  nextGallery(delta: number): void {
    if (this.galleryUrls.length)
      this.showGalleryImage(this.galleryIndex + delta);
  }

  private openGallery(urls: string[], title: string): void {
    this.galleryUrls = urls.filter(validMediaUrl);
    this.galleryIndex = 0;
    if (!this.galleryUrls.length) {
      this.stage.textContent = "No valid property images are available.";
      return;
    }
    this.showGalleryImage(0, title);
  }

  private showGalleryImage(
    index: number,
    title = this.title.textContent ?? "Property image",
  ): void {
    if (!this.galleryUrls.length) return;
    this.galleryIndex =
      (index + this.galleryUrls.length) % this.galleryUrls.length;
    const image = document.createElement("img");
    image.src = resolveMediaUrl(this.galleryUrls[this.galleryIndex]);
    image.alt = `${title}, image ${this.galleryIndex + 1} of ${this.galleryUrls.length}`;
    const previous = galleryButton("Previous image", "‹", () =>
      this.nextGallery(-1),
    );
    const next = galleryButton("Next image", "›", () => this.nextGallery(1));
    const count = document.createElement("span");
    count.className = "gallery-count";
    count.textContent = `${this.galleryIndex + 1} / ${this.galleryUrls.length}`;
    this.stage.replaceChildren(image, previous, next, count);
  }

  private openPanorama(url: string): void {
    const container = document.createElement("div");
    container.className = "panorama-viewer";
    this.stage.replaceChildren(container);
    if (!window.pannellum) {
      container.textContent = "The 360° viewer could not load.";
      return;
    }
    this.viewer = window.pannellum.viewer(container, {
      type: "equirectangular",
      panorama: resolveMediaUrl(url),
      autoLoad: true,
      showControls: true,
      compass: false,
      escapeHTML: true,
    });
  }

  private content(url: string, type: string, title: string): HTMLElement {
    if (type === "image") {
      const image = document.createElement("img");
      image.src = resolveMediaUrl(url);
      image.alt = title;
      return image;
    }
    const youtubeId = getYouTubeId(url);
    if (youtubeId) {
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0`;
      iframe.title = title;
      iframe.allow =
        "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen";
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      return iframe;
    }
    const video = document.createElement("video");
    video.src = resolveMediaUrl(url);
    video.controls = true;
    video.playsInline = true;
    return video;
  }
}

function galleryButton(
  label: string,
  text: string,
  onClick: () => void,
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `gallery-nav gallery-${label.startsWith("Previous") ? "previous" : "next"}`;
  button.setAttribute("aria-label", label);
  button.textContent = text;
  button.addEventListener("click", onClick);
  return button;
}
function getYouTubeId(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.hostname === "youtu.be")
      return url.pathname.slice(1).split("/")[0] || null;
    if (url.hostname.endsWith("youtube.com")) {
      if (url.pathname === "/watch") return url.searchParams.get("v");
      if (
        url.pathname.startsWith("/embed/") ||
        url.pathname.startsWith("/shorts/")
      )
        return url.pathname.split("/")[2] || null;
    }
  } catch {
    return null;
  }
  return null;
}
