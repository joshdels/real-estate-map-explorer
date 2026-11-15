import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "maplibre-gl/dist/maplibre-gl.css";
import "@phosphor-icons/web/regular";
import "@/styles/tokens.css";
import "@/styles/components.css";
import "@/styles/layout.css";
import "@/styles/site.css";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: `${brand.name} — ${brand.tagline}`,
  description: brand.positioning,
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
      <body>
        {children}
        <Script
          src="https://cdn.jsdelivr.net/npm/pannellum@2.5.7/build/pannellum.js"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
