import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "maplibre-gl/dist/maplibre-gl.css";
import "@/css/tokens.css";
import "@/css/components.css";
import "@/css/layout.css";

export const metadata: Metadata = {
  title: "Smart Property Listing",
  description:
    "Explore clearly labeled sample real-estate listings on an interactive satellite map.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#3b41c7",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-PH">
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
