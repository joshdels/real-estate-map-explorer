"use client";

import Link from "next/link";
import { useState } from "react";
import { Flag, SealCheck, ShareNetwork, Star } from "@phosphor-icons/react";
import {
  areaLabel,
  formatPrice,
  type ProviderRating,
} from "@/lib/listings";
import { REPORT_REASONS, addReport } from "@/lib/local-records";
import { shareListing } from "@/lib/share";
import type { Property, Provider } from "@/lib/types";
import { isProductionMode } from "@/lib/runtime-mode";

export function Stars({ rating }: { rating?: ProviderRating }) {
  if (!rating) return <span className="rating rating-empty">No reviews yet</span>;
  return (
    <span className="rating">
      <Star weight="fill" aria-hidden="true" /> {rating.average.toFixed(1)}
      <span className="rating-count">
        {" "}
        ({rating.count} {rating.count === 1 ? "review" : "reviews"})
      </span>
    </span>
  );
}

/** Share and report controls shared by listing cards and the property page. */
export function ListingTools({ property }: { property: Property }) {
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);
  const [note, setNote] = useState("");

  const report = (reason: string) => {
    addReport(property.id, reason, property.title);
    setReporting(false);
    setReported(true);
    setNote("Thank you. This listing was flagged for staff review.");
  };

  return (
    <div className="listing-tools">
      <div className="property-card-tools">
        <button
          className="card-tool"
          type="button"
          aria-label={`Share listing: ${property.title}`}
          onClick={async () => setNote(await shareListing(property.id, property.title, areaLabel(property)))}
        >
          <ShareNetwork aria-hidden="true" /> Share
        </button>
        <button
          className="card-tool"
          type="button"
          aria-expanded={reporting}
          aria-label={`Report listing: ${property.title}`}
          disabled={reported}
          onClick={() => setReporting((open) => !open)}
        >
          <Flag aria-hidden="true" /> {reported ? "Reported" : "Report"}
        </button>
      </div>
      {reporting ? (
        <div className="card-report-reasons" role="group" aria-label={`Reason for reporting ${property.title}`}>
          {REPORT_REASONS.map((reason) => (
            <button key={reason} className="card-report-reason" type="button" onClick={() => report(reason)}>
              {reason}
            </button>
          ))}
        </div>
      ) : null}
      <p className="listing-tools-note" role="status" aria-live="polite">{note}</p>
    </div>
  );
}

export function ListingCard({
  property,
  provider,
  rating,
}: {
  property: Property;
  provider?: Provider;
  rating?: ProviderRating;
}) {
  const image = property.media?.images?.[0] ?? (isProductionMode ? "" : "/images/sample-aerial-lot-plan.webp");
  return (
    <article className="property-card listing-card">
      <Link className="property-card-button" href={`/property/${encodeURIComponent(property.id)}`}>
        <span className="property-card-media">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" loading="lazy" />
          ) : null}
          <span className={`card-status status-${property.status.toLowerCase()}`}>{property.status}</span>
        </span>
        <span className="property-card-content">
          {property.review === "reviewed" || property.featured ? (
            <span className="property-card-badges">
              {property.review === "reviewed" ? (
                <span className="card-badge card-badge-reviewed">
                  <SealCheck aria-hidden="true" /> Staff reviewed
                </span>
              ) : null}
              {property.featured ? <span className="card-badge card-badge-featured">Provider highlight</span> : null}
            </span>
          ) : null}
          <strong className="property-card-price">{formatPrice(property)}</strong>
          <span className="property-card-title">{property.title}</span>
          <span className="property-card-address">{areaLabel(property)}</span>
          <span className="property-card-facts"><b>Lot size</b> {property.area}</span>
          <span className="property-card-land-use">{property.landUse ?? "Open development land"}</span>
          {provider ? (
            <span className="property-card-provider">
              {provider.name} · <Stars rating={rating} />
            </span>
          ) : null}
        </span>
      </Link>
      <ListingTools property={property} />
    </article>
  );
}
