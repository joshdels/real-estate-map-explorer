"use client";

import Link from "next/link";
import { ArrowRight, Buildings, MapPinLine, MapTrifold } from "@phosphor-icons/react";
import { brand } from "@/lib/brand";
import {
  KIND_LABELS,
  providerRatings,
  publicListings,
  rankedProviders,
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
          <h1 id="hero-title">Find land for sale. See <span className="hero-title-accent">exactly where</span> it lies.</h1>
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
        <p className="section-kicker">Made for land sales</p>
        <h2 id="audience-title">What do you want to do?</h2>
        <div className="lane-grid">
          <article className="lane">
            <MapTrifold className="lane-icon" aria-hidden="true" />
            <h3>Buyers</h3>
            <p>Choose a place. Compare lot size, price, roads, and nearby places before you visit.</p>
            <a className="lane-link" href="/explore">Explore the map <ArrowRight aria-hidden="true" /></a>
          </article>
          <article className="lane">
            <MapPinLine className="lane-icon" aria-hidden="true" />
            <h3>Owners and sellers</h3>
            <p>Mark your lot on the map. Add the price, details, and photos. Publish when ready.</p>
            <a className="lane-link" href="/list-property">List your land <ArrowRight aria-hidden="true" /></a>
          </article>
          <article className="lane">
            <Buildings className="lane-icon" aria-hidden="true" />
            <h3>Brokers and developers</h3>
            <p>Group lots, feature key listings, and build trust through buyer reviews.</p>
            <Link className="lane-link" href="/become-a-provider">Become a Provider <ArrowRight aria-hidden="true" /></Link>
          </article>
        </div>
      </section>

      <section className="page-section page-section-tint" aria-labelledby="suggested-title">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Suggested for you</p>
            <h2 id="suggested-title">From our best-reviewed providers</h2>
            <p className="section-lead">Based on buyer reviews. Several good reviews matter more than one rating.</p>
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
          <p className="section-kicker">You bring the land. We help buyers understand it.</p>
          <h2 id="brand-story-title">Your experience leads the way</h2>
          <p>Owners, brokers, and developers know their land and the buyers they want to serve. That knowledge is the heart of every useful listing.</p>
          <p>{brand.name} gives you the map, presentation tools, and support to make each parcel easier to find and understand while you stay in control.</p>
          <div className="brand-story-actions">
            <a className="brand-story-primary" href="/explore">Find land for sale <ArrowRight aria-hidden="true" /></a>
            <a className="brand-story-secondary" href="/list-property">Present your land</a>
          </div>
        </div>
        <div className="brand-story-principles" aria-label="What guides the service">
          <article>
            <span aria-hidden="true">01</span>
            <div><h3>Your land leads</h3><p>You decide what to present and keep the information current.</p></div>
          </article>
          <article>
            <span aria-hidden="true">02</span>
            <div><h3>We make it visible</h3><p>Clear boundaries, photos, prices, and details help buyers notice the right lot.</p></div>
          </article>
          <article>
            <span aria-hidden="true">03</span>
            <div><h3>You stay in control</h3><p>Manage availability, organize listings, and choose what to feature.</p></div>
          </article>
        </div>
      </section>

      <section className="page-section service-band" aria-labelledby="service-title">
        <p className="section-kicker">Built for land buyers and sellers</p>
        <h2 id="service-title">Everything needed to find, present, and manage land for sale</h2>
        <ol className="service-steps">
          <li><strong>Easy to find by location</strong><span>Buyers can search by region, province, and city, then see each available lot on the map.</span></li>
          <li><strong>Clear land details</strong><span>Show the price, lot area, shape, road access, utilities, photos, nearby places, and useful routes in one listing.</span></li>
          <li><strong>Simple tools for sellers</strong><span>Create listings, organize lots, update their status, and feature the land you want buyers to notice.</span></li>
          <li><strong>Support when you need it</strong><span>Our staff can help prepare a listing and review reports so land information stays useful.</span></li>
        </ol>
      </section>

      <p className="sample-band" role="note">{brand.sampleNotice}</p>
    </>
  );
}
