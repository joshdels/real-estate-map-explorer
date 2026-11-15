"use client";

import Link from "next/link";
import { ArrowRight, Buildings, HouseLine, MapTrifold } from "@phosphor-icons/react";
import { brand } from "@/lib/brand";
import {
  KIND_LABELS,
  providerRatings,
  publicListings,
  rankedProviders,
  recentListings,
  suggestedListings,
} from "@/lib/listings";
import type { Property } from "@/lib/types";
import { AreaSearch } from "@/components/listings/area-search";
import { ListingCard, Stars } from "@/components/listings/listing-card";
import { useDataset } from "@/hooks/use-dataset";

export function HomePage() {
  const { data } = useDataset();
  const ratings = providerRatings(data.reviews);
  const providers = new Map(data.providers.map((item) => [item.id, item]));
  const listings = publicListings(data);
  const topProviders = rankedProviders(data).filter((item) => item.listings.length > 0).slice(0, 4);

  const cards = (properties: Property[]) => (
    <div className="card-grid">
      {properties.map((property) => (
        <ListingCard
          key={property.id}
          property={property}
          provider={providers.get(property.providerId ?? "")}
          rating={ratings.get(property.providerId ?? "")}
        />
      ))}
    </div>
  );

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-inner">
          <h1 id="hero-title">Find the property. See <span className="hero-title-accent">exactly where</span> it stands.</h1>
          <p className="hero-lead">{brand.positioning}</p>
          <AreaSearch />
          <dl className="hero-stats">
            <div><dt>Listings</dt><dd>{listings.length}</dd></div>
            <div><dt>Providers</dt><dd>{data.providers.length}</dd></div>
            <div><dt>Provinces searchable</dt><dd>88</dd></div>
          </dl>
        </div>
      </section>

      <section className="page-section" aria-labelledby="audience-title">
        <p className="section-kicker">Built for every side of the sale</p>
        <h2 id="audience-title">Where do you fit in?</h2>
        <div className="lane-grid">
          <article className="lane">
            <MapTrifold className="lane-icon" aria-hidden="true" />
            <h3>Buyers</h3>
            <p>Search by region, province, and city, then check each lot outline, road access, and nearby landmarks on satellite imagery before you travel.</p>
            <a className="lane-link" href="/explore">Explore the map <ArrowRight aria-hidden="true" /></a>
          </article>
          <article className="lane">
            <HouseLine className="lane-icon" aria-hidden="true" />
            <h3>Owners and sellers</h3>
            <p>Place your property on the map, add photos, and publish. Our staff can help prepare the listing when you need support.</p>
            <a className="lane-link" href="/list-property">List your property <ArrowRight aria-hidden="true" /></a>
          </article>
          <article className="lane">
            <Buildings className="lane-icon" aria-hidden="true" />
            <h3>Brokers and developers</h3>
            <p>Group listings by project, highlight your best properties, and earn buyer reviews that move your listings up the recommended results.</p>
            <Link className="lane-link" href="/become-a-provider">Become a provider <ArrowRight aria-hidden="true" /></Link>
          </article>
        </div>
      </section>

      <section className="page-section" aria-labelledby="recent-title">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Fresh on the map</p>
            <h2 id="recent-title">Recently added</h2>
          </div>
          <a className="section-link" href="/explore?sort=newest">See all new listings <ArrowRight aria-hidden="true" /></a>
        </div>
        {cards(recentListings(data, 3))}
      </section>

      <section className="page-section page-section-tint" aria-labelledby="suggested-title">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Suggested for you</p>
            <h2 id="suggested-title">From our best-reviewed providers</h2>
            <p className="section-lead">Ranked by buyer reviews of the provider. A provider needs several strong reviews to rank first, so one rating cannot game the list.</p>
          </div>
          <a className="section-link" href="/explore">See all recommended <ArrowRight aria-hidden="true" /></a>
        </div>
        {cards(suggestedListings(data, 6))}
      </section>

      <section className="page-section" aria-labelledby="providers-title">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Our clients</p>
            <h2 id="providers-title">Providers buyers rate highly</h2>
          </div>
          <Link className="section-link" href="/providers">All providers <ArrowRight aria-hidden="true" /></Link>
        </div>
        <div className="provider-grid">
          {topProviders.map(({ provider, rating, listings: owned }) => (
            <Link key={provider.id} className="provider-card" href={`/providers/${encodeURIComponent(provider.id)}`}>
              <span className="provider-avatar" aria-hidden="true">{provider.name.replace(/^Sample\s+/i, "").slice(0, 2).toUpperCase()}</span>
              <strong>{provider.name}</strong>
              <span className="provider-meta">{KIND_LABELS[provider.kind]}{provider.serviceArea ? ` · ${provider.serviceArea}` : ""}</span>
              <Stars rating={rating} />
              <span className="provider-meta">{owned.length} {owned.length === 1 ? "listing" : "listings"}{provider.staffReviewed ? " · Staff reviewed" : ""}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="page-section brand-story" aria-labelledby="brand-story-title">
        <div className="brand-story-copy">
          <p className="section-kicker">You bring the property. We help buyers see it.</p>
          <h2 id="brand-story-title">Your experience leads the way</h2>
          <p>Owners, brokers, and developers know their properties and the buyers they want to serve. That knowledge is the heart of every useful listing.</p>
          <p>Smart Property Listing is your guide. We give you the map, presentation tools, and support to make each property easier to find and understand while you stay in control.</p>
          <div className="brand-story-actions">
            <a className="brand-story-primary" href="/explore">Find a property <ArrowRight aria-hidden="true" /></a>
            <a className="brand-story-secondary" href="/list-property">Present your property</a>
          </div>
        </div>
        <div className="brand-story-principles" aria-label="What guides the service">
          <article>
            <span aria-hidden="true">01</span>
            <div><h3>Your property leads</h3><p>You decide what to present and keep the information current.</p></div>
          </article>
          <article>
            <span aria-hidden="true">02</span>
            <div><h3>We make it visible</h3><p>Clear maps, photos, prices, and details help buyers notice the right property.</p></div>
          </article>
          <article>
            <span aria-hidden="true">03</span>
            <div><h3>You stay in control</h3><p>Manage availability, organize listings, and choose what to feature.</p></div>
          </article>
        </div>
      </section>

      <section className="page-section service-band" aria-labelledby="service-title">
        <p className="section-kicker">Built for buyers and property providers</p>
        <h2 id="service-title">Everything needed to find, present, and manage a property</h2>
        <ol className="service-steps">
          <li><strong>Easy to find by location</strong><span>Buyers can search by region, province, and city, then see each property on the map.</span></li>
          <li><strong>Clear details for buyers</strong><span>Show the price, lot shape, photos, videos, nearby places, and useful routes in one listing.</span></li>
          <li><strong>Simple tools for providers</strong><span>Create listings, organize properties, update their status, and feature the ones you want buyers to notice.</span></li>
          <li><strong>Support when you need it</strong><span>Our staff can help prepare a listing and review reports so property information stays useful.</span></li>
        </ol>
      </section>

      <p className="sample-band" role="note">{brand.sampleNotice}</p>
    </>
  );
}
