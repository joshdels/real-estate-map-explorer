"use client";

import Link from "next/link";
import { DeviceMobile, Drop, Lightning, RoadHorizon, SealCheck, TelevisionSimple, WifiHigh } from "@phosphor-icons/react";
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
import { PropertyNearby } from "@/components/property/property-nearby";
import { AgentContactCard } from "@/components/property/agent-contact-card";

function UtilityIcon({ name }: { name: string }) {
  const key = name.toLocaleLowerCase();
  if (key.includes("electric")) return <Lightning aria-hidden="true" />;
  if (key.includes("water")) return <Drop aria-hidden="true" />;
  if (key.includes("road") || key.includes("access")) return <RoadHorizon aria-hidden="true" />;
  if (key.includes("internet") || key.includes("wifi") || key.includes("telecom")) return <WifiHigh aria-hidden="true" />;
  if (key.includes("mobile") || key.includes("cell")) return <DeviceMobile aria-hidden="true" />;
  return <TelevisionSimple aria-hidden="true" />;
}

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

  const suppliedImages = property.media?.images?.filter(Boolean) ?? [];
  const images = suppliedImages.length > 0 ? suppliedImages : ["/images/sample-aerial-lot-plan.webp"];
  const mapHref = `/explore?property=${encodeURIComponent(property.id)}`;
  const utilities = Object.entries(property.utilities ?? {});
  const provider = data.providers.find((item) => item.id === property.providerId);
  const rating = provider ? providerRatings(data.reviews).get(provider.id) : undefined;
  const group = data.groups.find((item) => item.id === property.groupId);
  const area = property.adminArea;
  const providerInitials = provider?.name
    .replace(/^Sample\s+/i, "")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      {provider ? (
        <section className="detail-provider-banner" aria-labelledby="listed-by-title">
          <Link
            className="detail-provider-logo"
            href={`/providers/${encodeURIComponent(provider.id)}`}
            aria-label={`View ${provider.name}`}
          >
            <span aria-hidden="true">{providerInitials}</span>
          </Link>
          <div className="detail-provider-copy">
            <p className="detail-provider-kicker" id="listed-by-title">Listed by</p>
            <p className="detail-provider">
              <Link href={`/providers/${encodeURIComponent(provider.id)}`}>{provider.name}</Link>
              <Stars rating={rating} />
            </p>
            {group ? <p className="detail-note">Part of “{group.name}”.</p> : null}
          </div>
          <Link className="detail-provider-link" href={`/providers/${encodeURIComponent(provider.id)}`}>
            View provider
          </Link>
        </section>
      ) : null}

      <div className="detail-page-grid">
        <div className="detail-main">
        <section className="detail-gallery" aria-label="Lot photos">
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
          ) : null}
        </section>

        {property.description ? (
          <section className="detail-block">
            <h2>Land details</h2>
            <p>{property.description}</p>
          </section>
        ) : null}

        {utilities.length > 0 ? (
          <section className="detail-block">
            <h2>Utilities available</h2>
            <dl className="detail-utilities">
              {utilities.map(([name, value]) => (
                <div key={name}>
                  <UtilityIcon name={name} />
                  <div><dt>{name}</dt><dd>{value}</dd></div>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        <section className="detail-block">
          <h2>Location and nearby</h2>
          {area ? (
            <p className="detail-note">
              {[area.city, area.province, area.region].filter(Boolean).join(" · ")}
              {area.approximate ? " (nearest official area to the pin)" : ""}
            </p>
          ) : null}
          <PropertyNearby id={property.id} coordinates={property.coordinates} polygon={property.polygon} />
          <p className="detail-note">
            Approximate lot plan and satellite location. This is open listing data,
            not a surveyed boundary. This fictional sample must be independently
            verified.
          </p>
        </section>
        </div>

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
            {property.review === "reviewed" ? (
              <span className="card-badge card-badge-reviewed">
                <SealCheck aria-hidden="true" /> Staff reviewed
              </span>
            ) : (
              <span className="card-badge">Not yet reviewed by staff</span>
            )}
            {property.assistedBy ? <span className="card-badge">Assisted listing</span> : null}
          </p>
          <dl className="property-facts">
            <div><dt>Area</dt><dd>{property.area}</dd></div>
            <div><dt>Price</dt><dd>{formatPrice(property)}</dd></div>
            <div><dt>Measurements</dt><dd>{property.measurements || "Not specified"}</dd></div>
            <div><dt>Status</dt><dd><span className="status-pill">{property.status}</span></dd></div>
            <div><dt>Land use</dt><dd>{property.landUse || "Open development land"}</dd></div>
            <div><dt>Terrain</dt><dd>{property.terrain || "Confirm with seller"}</dd></div>
            <div><dt>Road access</dt><dd>{property.roadAccess || property.address}</dd></div>
          </dl>
          <ListingTools property={property} />
          <PropertyMedia title={property.title} media={property.media ?? {}} mapHref={mapHref} />
        </aside>
      </div>

      <AgentContactCard agent={data.agent} />
    </>
  );
}
