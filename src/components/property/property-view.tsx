"use client";

import Link from "next/link";
import { ListingTools, Stars } from "@/components/listings/listing-card";
import { useDataset } from "@/hooks/use-dataset";
import {
  PURPOSE_LABELS,
  TYPE_LABELS,
  formatPrice,
  isPublic,
  providerRatings,
} from "@/lib/listings";
import { PropertyMedia } from "@/components/property/property-media";
import { PropertyMiniMap } from "@/components/property/property-mini-map";

/**
 * Renders from the seed during server render, then from the live store, so
 * listings created or suspended in this browser are reflected too.
 */
export function PropertyView({ id }: { id: string }) {
  const { data, ready } = useDataset();
  const property = data.properties.find((item) => item.id === id);

  if (!property || !isPublic(property))
    return (
      <section className="page-section">
        <h1>{property || ready ? "Listing not available" : "Loading listing…"}</h1>
        {property || ready ? (
          <p className="section-lead">
            This listing does not exist, was removed, or is suspended while staff review it.{" "}
            <a href="/explore">Browse all listings</a>.
          </p>
        ) : null}
      </section>
    );

  const images = property.media?.images?.filter(Boolean) ?? [];
  const mapHref = `/explore?property=${encodeURIComponent(property.id)}`;
  const utilities = Object.entries(property.utilities ?? {});
  const provider = data.providers.find((item) => item.id === property.providerId);
  const rating = provider ? providerRatings(data.reviews).get(provider.id) : undefined;
  const group = data.groups.find((item) => item.id === property.groupId);
  const area = property.adminArea;

  return (
    <>
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
          <p className="detail-kicker">
            {PURPOSE_LABELS[property.purpose ?? "sale"]} · {TYPE_LABELS[property.propertyType ?? "lot"]} · Sample data
          </p>
          <h1>{property.title}</h1>
          <p className="detail-price">{formatPrice(property)}</p>
          <p className="detail-address">
            {property.address}
            {area ? ` · ${[area.city, area.province].filter(Boolean).join(", ")}` : ""}
          </p>
          <p className="property-card-badges">
            <span className="card-badge">{property.review === "reviewed" ? "Staff reviewed" : "Not yet reviewed by staff"}</span>
            {property.assistedBy ? <span className="card-badge">Assisted listing</span> : null}
          </p>
          <dl className="property-facts">
            <div><dt>Area</dt><dd>{property.area}</dd></div>
            <div><dt>Price</dt><dd>{formatPrice(property)}</dd></div>
            <div><dt>Measurements</dt><dd>{property.measurements || "Not specified"}</dd></div>
            <div><dt>Status</dt><dd><span className="status-pill">{property.status}</span></dd></div>
          </dl>
          <ListingTools property={property} />
          <PropertyMedia title={property.title} media={property.media ?? {}} mapHref={mapHref} />
        </aside>
      </div>

      <div className="detail-page-body">
        {provider ? (
          <section className="detail-block">
            <h2>Listed by</h2>
            <p className="detail-provider">
              <Link href={`/providers/${encodeURIComponent(provider.id)}`}>{provider.name}</Link>
              <Stars rating={rating} />
            </p>
            {group ? <p className="detail-note">Part of the listing group “{group.name}”.</p> : null}
          </section>
        ) : null}

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
          {area ? (
            <p className="detail-note">
              {[area.city, area.province, area.region].filter(Boolean).join(" · ")}
              {area.approximate ? " (nearest official area to the pin)" : ""}
            </p>
          ) : null}
          <PropertyMiniMap coordinates={property.coordinates} polygon={property.polygon} />
          <p className="detail-note">
            Approximate satellite location — not a surveyed boundary. This is a
            clearly labeled fictional sample listing and must be independently
            verified.
          </p>
        </section>
      </div>
    </>
  );
}
