"use client";

import Link from "next/link";
import { Flag } from "@phosphor-icons/react";
import { useState } from "react";
import {
  KIND_LABELS,
  formatRating,
  providerRatings,
  publicListings,
  rankedProviders,
} from "@/lib/listings";
import type { Property } from "@/lib/types";
import { ListingCard, Stars } from "@/components/listings/listing-card";
import { ProviderMasterplan } from "@/components/providers/provider-masterplan";
import { useDataset } from "@/hooks/use-dataset";

export function ProvidersDirectory() {
  const { data } = useDataset();
  const ranked = rankedProviders(data);
  return (
    <section className="page-section" aria-labelledby="directory-title">
      <p className="section-kicker">Land sellers</p>
      <h1 id="directory-title">Owners, brokers, and developers</h1>
      <p className="section-lead">People and businesses offering lot plans and open development land, ordered by buyer reviews. Ratings come from visitor reviews and are not a licence check.</p>
      {ranked.length === 0 ? <p className="empty-state">No land sellers have joined yet.</p> : null}
      <div className="provider-grid">
        {ranked.map(({ provider, rating, listings }) => (
          <Link key={provider.id} className="provider-card" href={`/providers/${encodeURIComponent(provider.id)}`}>
            <span className="provider-avatar" aria-hidden="true">{provider.name.replace(/^Sample\s+/i, "").slice(0, 2).toUpperCase()}</span>
            <strong>{provider.name}</strong>
            <span className="provider-meta">{KIND_LABELS[provider.kind]}{provider.serviceArea ? ` · ${provider.serviceArea}` : ""}</span>
            <Stars rating={rating} />
            <span className="provider-meta">{listings.length} {listings.length === 1 ? "listing" : "listings"}{provider.staffReviewed ? " · Staff reviewed" : ""}</span>
            {provider.tagline ? <span className="provider-tagline">{provider.tagline}</span> : null}
          </Link>
        ))}
      </div>
    </section>
  );
}

export function ProviderProfile({ id }: { id: string }) {
  const { data, ready, mutate } = useDataset();
  const [note, setNote] = useState("");
  const provider = data.providers.find((item) => item.id === id);

  if (!provider)
    return (
      <section className="page-section">
        <h1>{ready ? "Provider not found" : "Loading provider…"}</h1>
        {ready ? <p className="section-lead">This provider profile does not exist or was removed. <Link href="/providers">See all providers</Link>.</p> : null}
      </section>
    );

  const rating = providerRatings(data.reviews).get(provider.id);
  const listings = publicListings(data).filter((item) => item.providerId === provider.id);
  const featured = listings.filter((item) => item.featured);
  const groups = data.groups.filter((item) => item.providerId === provider.id);
  const ungrouped = listings.filter((item) => !item.groupId);
  const reviews = data.reviews.filter((item) => item.providerId === provider.id && item.status !== "removed");

  const cards = (properties: Property[]) => (
    <div className="card-grid">
      {properties.map((property) => (
        <ListingCard key={property.id} property={property} />
      ))}
    </div>
  );

  const submitReview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    await mutate((store) =>
      store.addReview({
        providerId: provider.id,
        rating: Number(values.get("rating")),
        comment: String(values.get("comment") ?? ""),
        author: String(values.get("author") ?? ""),
      }),
    );
    form.reset();
    setNote("Thank you. Your review was published and can be flagged for staff moderation.");
  };

  return (
    <>
      <section className="page-section profile-head" aria-labelledby="profile-title">
        <span className="provider-avatar provider-avatar-lg" aria-hidden="true">{provider.name.replace(/^Sample\s+/i, "").slice(0, 2).toUpperCase()}</span>
        <div>
          <p className="section-kicker">{KIND_LABELS[provider.kind]}{provider.serviceArea ? ` · ${provider.serviceArea}` : ""}</p>
          <h1 id="profile-title">{provider.name}</h1>
          {provider.tagline ? <p className="section-lead">{provider.tagline}</p> : null}
          <p className="profile-meta">
            <Stars rating={rating} />
            <span>{listings.length} public {listings.length === 1 ? "listing" : "listings"}</span>
            <span>{provider.staffReviewed ? "Profile reviewed by staff" : "Profile not yet reviewed by staff"}</span>
          </p>
        </div>
      </section>

      {provider.id === "provider-coastal" && listings.length > 0 ? (
        <ProviderMasterplan listings={listings} />
      ) : null}

      {featured.length > 0 ? (
        <section className="page-section" aria-labelledby="featured-title">
          <h2 id="featured-title">Highlighted by this seller</h2>
          {cards(featured)}
        </section>
      ) : null}

      {groups.map((group) => {
        const members = listings.filter((item) => item.groupId === group.id);
        if (members.length === 0) return null;
        return (
          <section key={group.id} className="page-section" aria-labelledby={`group-${group.id}`}>
            <p className="section-kicker">Lot group · {members.length} {members.length === 1 ? "lot" : "lots"}</p>
            <h2 id={`group-${group.id}`}>{group.name}</h2>
            {group.description ? <p className="section-lead">{group.description}</p> : null}
            {cards(members)}
          </section>
        );
      })}

      {ungrouped.length > 0 ? (
        <section className="page-section" aria-labelledby="other-title">
          <h2 id="other-title">{groups.length > 0 ? "Other lots" : "Lots for sale"}</h2>
          {cards(ungrouped)}
        </section>
      ) : null}
      {listings.length === 0 ? <p className="page-section empty-state">This seller has no public lot listings right now.</p> : null}

      <section className="page-section page-section-tint" aria-labelledby="reviews-title">
        <h2 id="reviews-title">Reviews</h2>
        <p className="section-lead">{formatRating(rating)}. Reviews are visitor opinions and are not verified transactions.</p>
        <ul className="review-list">
          {reviews.map((review) => (
            <li key={review.id} className="review">
              <p className="review-head">
                <strong>{review.author}</strong>
                <span aria-label={`${review.rating} out of 5`}>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
                <time dateTime={review.createdAt}>{new Date(review.createdAt).toLocaleDateString("en-PH", { dateStyle: "medium", timeZone: "Asia/Manila" })}</time>
              </p>
              <p>{review.comment || "No comment."}</p>
              {review.status === "flagged" ? (
                <p className="review-flagged">Flagged — waiting for staff review. Not counted in the rating.</p>
              ) : (
                <button
                  className="text-button"
                  type="button"
                  disabled={!ready}
                  onClick={() => void mutate((store) => store.setReviewStatus(review.id, "flagged"))}
                >
                  <Flag aria-hidden="true" /> Flag this review
                </button>
              )}
            </li>
          ))}
        </ul>
        {reviews.length === 0 ? <p className="empty-state">No reviews yet. Be the first to review this provider.</p> : null}

        <form className="panel-form" onSubmit={submitReview} aria-labelledby="review-form-title">
          <h3 id="review-form-title">Review this provider</h3>
          <label>Rating
            <select name="rating" defaultValue="5" required>
              <option value="5">5 — Excellent</option>
              <option value="4">4 — Good</option>
              <option value="3">3 — Fair</option>
              <option value="2">2 — Poor</option>
              <option value="1">1 — Very poor</option>
            </select>
          </label>
          <label>Display name<input name="author" required maxLength={60} placeholder="e.g., Buyer from Cebu" /></label>
          <label>Your experience<textarea name="comment" rows={3} maxLength={600} required /></label>
          <button className="primary-action" type="submit" disabled={!ready}>Publish review</button>
          <p role="status" aria-live="polite" className="form-note">{note}</p>
        </form>
      </section>
    </>
  );
}
