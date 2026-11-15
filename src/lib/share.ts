import { brand } from "@/lib/brand";

export function propertyUrl(id: string): string {
  return `${window.location.origin}/property/${encodeURIComponent(id)}`;
}

/**
 * Shares a listing link: native share sheet where available, otherwise the
 * clipboard. Resolves to a short status message for an aria-live region.
 */
export async function shareListing(id: string, title: string, text: string): Promise<string> {
  const url = propertyUrl(id);
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title: `${title} — ${brand.name}`, text, url });
      return "Share sheet opened.";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError")
        return "Sharing cancelled.";
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return "Listing link copied to the clipboard.";
  } catch {
    return `Copy this link to share: ${url}`;
  }
}

export function facebookShareUrl(id: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(propertyUrl(id))}`;
}
