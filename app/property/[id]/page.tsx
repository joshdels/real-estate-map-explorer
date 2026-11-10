import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PropertyActions } from "./PropertyActions";
import { PropertyMedia } from "./PropertyMedia";
import { PropertyMiniMap } from "./PropertyMiniMap";

interface PropertyRecord {
  id: string;
  title: string;
  address: string;
  coordinates: [number, number];
  polygon: [number, number][];
  area: string;
  price: number;
  status: string;
  measurements?: string;
  description?: string;
  utilities?: Record<string, string>;
  media?: {
    images?: string[];
    panoramaUrl?: string;
    aerialVideoUrl?: string;
    walkthroughVideoUrl?: string;
  };
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

async function loadProperties(): Promise<PropertyRecord[]> {
  try {
    const file = path.join(process.cwd(), "public", "data", "data.json");
    const parsed: unknown = JSON.parse(await readFile(file, "utf8"));
    const list = (parsed as { properties?: unknown })?.properties;
    return Array.isArray(list) ? (list as PropertyRecord[]) : [];
  } catch {
    return [];
  }
}

async function findProperty(id: string): Promise<PropertyRecord | undefined> {
  return (await loadProperties()).find((item) => item.id === id);
}

export async function generateStaticParams(): Promise<{ id: string }[]> {
  return (await loadProperties()).map((item) => ({ id: item.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const property = await findProperty(id);
  if (!property) return { title: "Property not found — Smart Property Listing" };
  const title = `${property.title} — ${peso.format(property.price)} | Smart Property Listing`;
  const description =
    property.description ||
    `${property.area} ${property.status} property at ${property.address}. Sample listing on Smart Property Listing.`;
  const image = property.media?.images?.[0];
  const url = `${SITE_URL}/property/${property.id}`;
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: "Smart Property Listing",
      images: image ? [{ url: image, alt: property.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await findProperty(id);
  if (!property) notFound();
  const images = property.media?.images?.filter(Boolean) ?? [];
  const media = property.media ?? {};
  const mapHref = `/?property=${property.id}`;
  const utilities = Object.entries(property.utilities ?? {});

  return (
    <main className="detail-page" id="top">
      <header className="detail-page-bar">
        <Link className="detail-back" href="/">
          <span aria-hidden="true">←</span> All properties
        </Link>
        <span className="detail-brand">Smart Property Listing</span>
      </header>

      <div className="detail-page-grid">
        <section className="detail-gallery" aria-label="Property photos">
          {images.length > 0 ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="detail-gallery-main" src={images[0]} alt={property.title} />
              {images.length > 1 ? (
                <div className="detail-gallery-thumbs">
                  {images.slice(1, 5).map((src) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={src} src={src} alt="" loading="lazy" />
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <div className="detail-gallery-empty">No photos supplied yet</div>
          )}
        </section>

        <aside className="detail-summary">
          <p className="detail-kicker">Available property · Sample data</p>
          <h1>{property.title}</h1>
          <p className="detail-price">{peso.format(property.price)}</p>
          <p className="detail-address">{property.address}</p>
          <dl className="property-facts">
            <div><dt>Area</dt><dd>{property.area}</dd></div>
            <div><dt>Price</dt><dd>{peso.format(property.price)}</dd></div>
            <div><dt>Measurements</dt><dd>{property.measurements || "Not specified"}</dd></div>
            <div><dt>Status</dt><dd><span className="status-pill">{property.status}</span></dd></div>
          </dl>
          <PropertyActions id={property.id} title={property.title} address={property.address} />
          <PropertyMedia title={property.title} media={media} mapHref={mapHref} />
        </aside>
      </div>

      <div className="detail-page-body">
        {property.description ? (
          <section className="detail-block">
            <h2>Description</h2>
            <p>{property.description}</p>
          </section>
        ) : null}

        {utilities.length > 0 ? (
          <section className="detail-block">
            <h2>Utilities available</h2>
            <dl className="detail-utilities">
              {utilities.map(([name, value]) => (
                <div key={name}><dt>{name}</dt><dd>{value}</dd></div>
              ))}
            </dl>
          </section>
        ) : null}

        <section className="detail-block">
          <h2>Location</h2>
          <PropertyMiniMap coordinates={property.coordinates} polygon={property.polygon} />
          <p className="detail-note">
            Approximate satellite location — not a surveyed boundary. This is a
            clearly labeled fictional sample listing and must be independently
            verified.
          </p>
        </section>
      </div>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <div className="site-footer-brand">
            <span className="brand-mark" aria-hidden="true">SP</span>
            <div>
              <strong>Smart Property Listing</strong>
              <small>Provincial homes &amp; land</small>
            </div>
          </div>
          <nav className="site-footer-links" aria-label="Footer">
            <Link href="/">Browse properties</Link>
            <Link href={`/?property=${property.id}`}>View on map</Link>
            <a href="#top">Back to top</a>
          </nav>
          <p className="site-footer-note">
            All listings shown are clearly labeled fictional samples for product
            testing and must be independently verified. © {new Date().getFullYear()}{" "}
            Smart Property Listing.
          </p>
        </div>
      </footer>
    </main>
  );
}
