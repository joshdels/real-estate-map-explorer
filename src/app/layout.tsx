import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "@mantine/core/styles.css";
import "maplibre-gl/dist/maplibre-gl.css";
import "@phosphor-icons/web/regular";
import "@/styles/tokens.css";
import "@/styles/components.css";
import "@/styles/layout.css";
import "@/styles/site.css";
import { brand } from "@/lib/brand";
import { SITE_URL } from "@/lib/seo";
import { AppUiProvider } from "@/components/ui/app-ui";
import { LotNavigationOverlay } from "@/components/ui/lot-loading-screen";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${brand.name} — ${brand.tagline}`,
    template: `%s | ${brand.name}`,
  },
  description: brand.positioning,
  applicationName: brand.name,
  keywords: [
    "land for sale Philippines",
    "lot for sale",
    "lot plans",
    "provincial land",
    "real estate map",
    "lot map Philippines",
    brand.name,
  ],
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    siteName: brand.name,
    title: `${brand.name} — ${brand.tagline}`,
    description: brand.positioning,
    url: SITE_URL,
    locale: "en_PH",
  },
  twitter: {
    card: "summary_large_image",
    title: `${brand.name} — ${brand.tagline}`,
    description: brand.positioning,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#3b41c7",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-PH" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://server.arcgisonline.com" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/pannellum@2.5.7/build/pannellum.css"
        />
      </head>
      <body suppressHydrationWarning>
        <AppUiProvider>
          {children}
          <LotNavigationOverlay />
        </AppUiProvider>
        <Script
          src="https://cdn.jsdelivr.net/npm/pannellum@2.5.7/build/pannellum.js"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
