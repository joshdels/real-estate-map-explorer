"use client";

import { useEffect } from "react";
import { brand } from "@/lib/brand";

export function MapExplorer({ workspaceMode = false }: { workspaceMode?: boolean }) {
  useEffect(() => {
    void import("@/explorer/main").then(({ initializeApp }) => initializeApp());
  }, []);

  return (
    <>
  <main className={`app-shell${workspaceMode ? " listing-workspace-shell" : ""}`} aria-label={workspaceMode ? `${brand.name} lot listing workspace` : `${brand.name} map explorer`}>
    <header className="site-header">
      {/* Plain anchors on purpose: src/main.ts attaches once per page load, so
          leaving and re-entering the explorer must be a full navigation. */}
      {/* eslint-disable @next/next/no-html-link-for-pages */}
      <a className="brand" href="/" aria-label={`${brand.name} home`}>
        <span className="brand-mark" aria-hidden="true">{brand.shortName}</span>
        <span><strong>{brand.name}</strong><small>{brand.tagline}</small></span>
      </a>
      <nav className="site-nav" aria-label="Primary navigation">
        <a className="site-nav-link" href="/providers">Providers</a>
        {/* eslint-enable @next/next/no-html-link-for-pages */}
        <div className="view-switch" role="group" aria-label="Choose how to browse lots">
          <button id="view-list-button" type="button" className="is-active" aria-pressed="true">
            <i className="ph ph-list" aria-hidden="true" /> List
          </button>
          <button id="view-map-button" type="button" aria-pressed="false">
            <i className="ph ph-map-pin" aria-hidden="true" /> Map
          </button>
        </div>
        <button id="nav-list-property" className="nav-cta" type="button">List your lot</button>
      </nav>
    </header>
    <aside id="property-search" className="listing-panel" aria-label="Lot plan listings">
      <section className="listing-search" aria-labelledby="listing-heading">
        <div className="listing-heading-row">
          <div><p className="eyebrow">Explore lot plans</p><h1 id="listing-heading">Land for development across the Philippines</h1></div>
          <span id="listing-count" className="listing-count" aria-live="polite">Loading…</span>
        </div>
        <label className="search-field search-keywords">
          <span className="sr-only">What kind of land are you looking for?</span>
          <i className="ph ph-magnifying-glass" aria-hidden="true" />
          <input id="property-search-input" type="search" placeholder="Lot, seller, or keyword" autoComplete="off" />
        </label>
        <fieldset className="area-filter">
          <legend>Search by official area</legend>
          <label><span>Region</span><select id="filter-region" defaultValue=""><option value="">All regions</option></select></label>
          <label><span>Province</span><select id="filter-province" defaultValue=""><option value="">All provinces</option></select></label>
          <label><span>City / municipality</span><select id="filter-city" defaultValue="" disabled><option value="">All cities</option></select></label>
          <p id="area-status" className="area-status" role="status" aria-live="polite"></p>
        </fieldset>
        <div className="portal-search-grid">
          <label><span>Offer</span><select id="filter-purpose" defaultValue=""><option value="">All lots for sale</option><option value="sale">For sale</option></select></label>
          <label><span>Land</span><select id="filter-type" defaultValue=""><option value="">All development land</option><option value="lot">Lot plan or open land</option></select></label>
          <label><span>Sort by</span><select id="filter-sort" defaultValue="recommended"><option value="recommended">Recommended</option><option value="newest">Newest</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option></select></label>
          <label><span>Street or landmark</span><input id="property-location-input" type="search" placeholder="Street or landmark" autoComplete="off" /></label>
          <label><span>Minimum price</span><select id="property-min-price" defaultValue=""><option value="">No minimum</option><option value="20000">₱20K</option><option value="1000000">₱1M</option><option value="3000000">₱3M</option><option value="5000000">₱5M</option></select></label>
          <label><span>Maximum price</span><select id="property-max-price" defaultValue=""><option value="">No maximum</option><option value="50000">₱50K</option><option value="2000000">₱2M</option><option value="5000000">₱5M</option><option value="10000000">₱10M</option></select></label>
        </div>
        <div className="listing-filters" role="group" aria-label="Filter by listing status">
          <button type="button" className="is-active" data-listing-filter="All" aria-pressed="true">All</button>
          <button type="button" data-listing-filter="Available" aria-pressed="false">Available</button>
          <button type="button" data-listing-filter="Reserved" aria-pressed="false">Reserved</button>
          <button id="clear-filters" type="button" className="clear-filters">Clear filters</button>
        </div>
        <p className="recommended-note">“Recommended” ranks listings by the review rating of the provider, then by staff review and recency.</p>
        <p id="listing-action-note" className="sr-only" role="status" aria-live="polite"></p>
        <div id="property-list" className="property-list" aria-live="polite"></div>
        <p id="property-list-empty" className="property-list-empty" hidden>No lots match this search. Try another place or filter.</p>
        <p className="sample-disclosure">{brand.sampleNotice} {brand.boundaryCredit}</p>
      </section>
    </aside>
    <div id="map" className="map" aria-label="Interactive satellite map of available lots"></div>
    <div className="mobile-view-switcher" aria-label="Choose lot view">
      <button id="show-list-button" type="button" aria-pressed="true"><i className="ph ph-list" aria-hidden="true" /> List</button>
      <button id="show-map-button" type="button" aria-pressed="false"><i className="ph ph-map-pin" aria-hidden="true" /> Map</button>
    </div>
    <section className="agent-card" aria-label="Land specialist">
      <div className="agent-heading"><span id="agent-initials" className="avatar" aria-hidden="true">EC</span><span><strong id="agent-name">Eric Costuna</strong><small id="agent-role">Property Specialist</small></span></div>
      <a id="agent-call" className="contact-button contact-call" href="tel:+639285354832">
        <i className="ph ph-phone contact-emoji" aria-hidden="true" />
        <span id="agent-phone">Call: 0928 535 4832</span>
      </a>
      <a id="agent-message" className="contact-button contact-message" href="https://www.facebook.com/EsamarRealtor" target="_blank" rel="noopener noreferrer">
        <i className="ph ph-globe contact-emoji" aria-hidden="true" />
        <span>Visit Page</span>
      </a>
    </section>
    <aside id="admin-panel" className="admin-panel" aria-labelledby="admin-title" aria-hidden="true">
      <header className="admin-header">
        <div><h1 id="admin-title">Lot plan listing workspace</h1><p>Add land details, photos, and an approximate map boundary</p></div>
        <button id="close-admin" className="admin-close" type="button" aria-label="Close admin console"><i className="ph ph-x" aria-hidden="true" /></button>
      </header>
      <nav className="admin-tabs" aria-label="Admin sections">
        <button type="button" data-admin-tab="properties" className="is-active">Lots</button>
        <button type="button" data-admin-tab="utilities">Utilities</button>
        <button type="button" data-admin-tab="routes">Routes</button>
        <button type="button" data-admin-tab="locations">Locations</button>
        <button type="button" data-admin-tab="reports">Reports</button>
      </nav>
      <div className="admin-scroll">
        <section data-admin-view="properties">
          <form id="property-form" className="admin-form">
            <h2>Create your lot plan listing</h2><p className="form-help">Add clear land details and an approximate boundary. Lot plans are open listing data, not surveyed plans, and remain unverified.</p>
            <label>Listed by<select id="property-provider" name="providerId" required></select></label>
            <label>Listing group (optional)<select id="property-group" name="groupId"></select></label>
            <div className="form-grid"><label>Offer<select name="purpose"><option value="sale">For sale</option></select></label><label>Land type<select name="propertyType"><option value="lot">Lot plan or open development land</option></select></label></div>
            <label>Listing title<input name="title" required placeholder="e.g., LOT 003" /></label>
            <label>Street name<input name="address" required placeholder="e.g., Maharlika Avenue" /></label>
            <fieldset><legend>Approximate lot boundary</legend><div id="boundary-points" className="point-list"></div>
              <button id="pin-boundary" className="outline-button" type="button"><i className="ph ph-map-pin-plus" aria-hidden="true" /> Start pinning on map</button>
              <p className="form-help">Add at least three points, then press “Finish boundary”. The region, province, and city are filled in from the location of the pins.</p>
            </fieldset>
            <div className="form-grid"><label>Area<input name="area" required placeholder="500 sqm" /></label><label>Price (PHP)<input name="price" required type="number" min="0" step="1" placeholder="2500000" /></label></div>
            <label>Measurements<input name="measurements" placeholder="25m × 20m" /></label>
            <div className="form-grid"><label>Intended land use<input name="landUse" maxLength={80} placeholder="Residential development" /></label><label>Terrain<input name="terrain" maxLength={80} placeholder="Level, sloping, or rolling" /></label></div>
            <label>Road access<input name="roadAccess" maxLength={120} placeholder="Paved barangay road along the west boundary" /></label>
            <label>Status<select name="status"><option>Available</option><option>Reserved</option><option>Sold</option></select></label>
            <label>Description<textarea name="description" rows={4} placeholder="Road access, utilities, terrain, and development potential"></textarea></label>
            <fieldset><legend>Land media</legend>
              <label>360° panorama image URL<input name="panoramaUrl" type="url" placeholder="https://example.com/panorama.jpg" /></label>
              <label>Drone / aerial video URL<input name="aerialVideoUrl" type="url" placeholder="YouTube or direct video URL" /></label>
              <label>Site walkthrough video URL<input name="walkthroughVideoUrl" type="url" placeholder="YouTube or direct video URL" /></label>
              <label>Lot image URLs<textarea name="images" rows={5} placeholder={"https://example.com/road-frontage.jpg\nhttps://example.com/lot-view.jpg"}></textarea></label>
            </fieldset>
            <label className="authority-confirmation"><input name="authorityConfirmed" type="checkbox" required /><span>I am the owner or have permission to advertise this land, and the information I supplied is accurate to the best of my knowledge.</span></label>
            <button className="save-button" type="submit">Submit lot listing</button>
          </form>
          <p id="property-form-status" className="form-help" role="status" aria-live="polite"></p>
          <div><h2>Listings in this workspace</h2><div id="property-feed" className="admin-feed"></div></div>
        </section>
        <section data-admin-view="utilities" hidden>
          <form id="utilities-form" className="admin-form">
            <h2><i className="ph ph-lightning" aria-hidden="true" /> Utility services</h2><p className="form-help">Comma-separated options are applied to newly created lot listings.</p>
            <label>Electricity options<input name="Electricity" placeholder="ESAMELCO, No Power Line" /></label>
            <label>Water options<input name="Water" placeholder="Deepwell, NAWASA" /></label>
            <label>Mobile options<input name="Mobile" placeholder="Smart, Globe" /></label>
            <label>Internet options<input name="Internet" placeholder="PLDT, Smart, Netcamp" /></label>
            <label>Cable options<input name="Cable" placeholder="Amboy" /></label>
            <button className="save-button" type="submit">Save utility options</button>
          </form>
        </section>
        <section data-admin-view="routes" hidden>
          <form id="route-form" className="admin-form">
            <h2><i className="ph ph-road-horizon" aria-hidden="true" /> Manual routes</h2><p className="form-help">Attach a destination to a lot. The application draws a direct reference line.</p>
            <label>Lot<select id="route-property" name="propertyId" required></select></label>
            <label>Destination<select id="route-destination" name="destinationId" required></select></label>
            <button className="save-button" type="submit">Add route</button>
          </form>
          <div id="route-feed" className="admin-feed"></div>
        </section>
        <section data-admin-view="locations" hidden>
          <form id="location-form" className="admin-form">
            <h2><i className="ph ph-map-pin" aria-hidden="true" /> Destination points</h2><p className="form-help">Save schools, banks, stores, and landmarks for route planning.</p>
            <label>Name<input name="name" required placeholder="e.g., Eastern Samar State University" /></label>
            <label>Type<select name="type"><option value="school">School</option><option value="bank">Bank</option><option value="store">Store / Mall</option><option value="landmark">Landmark</option></select></label>
            <div className="form-grid"><label>Latitude<input name="lat" required type="number" step="any" /></label><label>Longitude<input name="lng" required type="number" step="any" /></label></div>
            <button id="use-map-location" className="outline-button" type="button"><i className="ph ph-map-pin" aria-hidden="true" /> Pick location on map</button>
            <button className="save-button" type="submit">Save destination point</button>
          </form>
          <div><h2>Saved destinations</h2><div id="location-feed" className="admin-feed"></div></div>
        </section>
        <section data-admin-view="reports" hidden>
          <h2><i className="ph ph-flag" aria-hidden="true" /> Reported listings</h2>
          <p className="form-help">Listings flagged by visitors for sexual, inappropriate, or fraudulent content. Review each one and mark it reviewed when resolved. Reports are stored in this browser only. The <a href="/staff">staff console</a> has the full moderation queue.</p>
          <div id="report-feed" className="admin-feed"></div>
        </section>
      </div>
    </aside>
    <aside id="details-panel" className="details-panel" aria-labelledby="property-title" aria-hidden="true">
      <button id="toggle-details" className="sheet-toggle" type="button" aria-controls="property-details-content" aria-expanded="true" aria-label="Collapse lot details">
        <i className="ph ph-caret-down" aria-hidden="true" />
      </button>
      <p id="collapsed-property-title" className="collapsed-property-title" aria-hidden="true"></p>
      <button id="close-details" className="close-button" type="button" aria-label="Close lot details"><i className="ph ph-x" aria-hidden="true" /></button>
      <div id="property-details-content" className="details-scroll" role="region" aria-label="Lot details" tabIndex={0}>
        <p className="panel-kicker">Available land</p>
        <h1 id="property-title">Lot details</h1>
        <p id="property-address" className="property-address"></p>
        <dl className="property-facts">
          <div><dt>Area</dt><dd id="property-area"></dd></div><div><dt>Price</dt><dd id="property-price"></dd></div>
          <div><dt>Measurements</dt><dd id="property-measurements"></dd></div><div><dt>Status</dt><dd><span id="property-status" className="status-pill"></span></dd></div>
          <div><dt>Land use</dt><dd id="property-land-use"></dd></div><div><dt>Terrain</dt><dd id="property-terrain"></dd></div>
          <div><dt>Road access</dt><dd id="property-road-access"></dd></div>
        </dl>
        <div className="detail-actions">
          <button id="detail-view-map" className="detail-action detail-action-map" type="button">
            <i className="ph ph-map-pin" aria-hidden="true" /> View on map
          </button>
          <button id="detail-share" className="detail-action detail-action-share" type="button">
            <i className="ph ph-share-network" aria-hidden="true" /> Share
          </button>
          <button id="detail-report" className="detail-action detail-action-report" type="button">
            <i className="ph ph-flag" aria-hidden="true" /> Report
          </button>
        </div>
        <div id="detail-report-panel" className="detail-report-panel" role="group" aria-label="Report this listing" hidden>
          <p>Why are you reporting this listing? An admin will review it.</p>
          <div className="detail-report-reasons">
            <button type="button" data-report-reason="Sexual or explicit content">Sexual / explicit</button>
            <button type="button" data-report-reason="Scam or fraudulent listing">Scam / fraud</button>
            <button type="button" data-report-reason="Inappropriate or offensive">Inappropriate</button>
            <button type="button" data-report-reason="Other">Other</button>
          </div>
        </div>
        <p id="detail-action-note" className="detail-action-note" role="status" aria-live="polite" hidden></p>
        <button id="property-gallery" className="property-gallery" type="button" aria-label="View lot photos">
          <img id="property-gallery-image" alt="" loading="lazy" />
          <span id="property-gallery-placeholder" className="property-gallery-placeholder" aria-hidden="true">No photos yet</span>
          <span id="property-gallery-count" className="property-gallery-count"></span>
        </button>
        <div id="property-media" className="feature-grid" aria-label="Lot media and navigation"></div>
        <section className="detail-section"><h2>Land details</h2><p id="property-description"></p></section>
        <section className="detail-section"><h2><i className="ph ph-lightning" aria-hidden="true" /> Utilities available</h2><dl id="property-utilities" className="detail-list"></dl></section>
        <section className="detail-section"><h2><i className="ph ph-path" aria-hidden="true" /> Nearby routes</h2><ul id="property-routes" className="route-list"></ul></section>
        <section className="detail-section">
          <h2><i className="ph ph-map-pin" aria-hidden="true" /> Location</h2>
          <button id="property-minimap" className="property-minimap" type="button" aria-label="Open this lot on the full map">
            <img id="property-minimap-image" alt="" loading="lazy" />
            <i className="ph ph-map-pin property-minimap-pin" aria-hidden="true" />
            <span className="property-minimap-caption">Approximate location — tap to open the full map.</span>
          </button>
        </section>
        <p className="data-note">Property information shown here is sample content and must be independently verified.</p>
      </div>
    </aside>
    <div id="admin-dialog" className="dialog-backdrop" hidden>
      <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="admin-access-title">
        <button id="cancel-admin" className="dialog-close" type="button" aria-label="Cancel admin access"><i className="ph ph-x" aria-hidden="true" /></button><i className="ph ph-lock-key dialog-icon" aria-hidden="true" />
        <h2 id="admin-access-title">List your lot plan</h2>
        <p className="signup-intro">Create an account, add your land information and images, and place its approximate lot plan on the map.</p>
        <ol className="signup-steps" aria-label="How lot listing works"><li><b>1</b><span>Sign in securely</span></li><li><b>2</b><span>Add accurate land details</span></li><li><b>3</b><span>Submit your listing</span></li></ol>
        <p id="auth-status" className="auth-status">Sign in with Google or Facebook to manage shared listing data, or use a local demo passcode for this browser only.</p>
        <button id="google-sign-in" className="google-auth-button" type="button"><span aria-hidden="true">G</span> Continue with Google</button>
        <button id="facebook-sign-in" className="facebook-auth-button" type="button"><span aria-hidden="true">f</span> Continue with Facebook</button>
        <button id="google-sign-out" className="outline-button" type="button" hidden>Sign out</button>
        <div className="auth-divider"><span>or local access</span></div>
        <form id="admin-access-form"><input name="username" type="text" value="local-admin" autoComplete="username" readOnly hidden /><label className="dialog-label">Passcode (demo: “admin” or “staff”)<input id="admin-passcode" type="password" required autoComplete="current-password" /></label><p id="admin-access-error" className="form-error" role="alert"></p><button className="primary-button" type="submit">Open listing workspace</button></form>
        <p className="form-help">Listing as a client? <a href="/dashboard">Open the client dashboard</a> to manage your listings and groups.</p>
      </section>
    </div>
    <div id="media-dialog" className="media-backdrop" hidden>
      <section className="media-dialog" role="dialog" aria-modal="true" aria-labelledby="media-title">
        <header><div><span className="panel-kicker">Lot media</span><h2 id="media-title">Media viewer</h2></div><button id="close-media" type="button" aria-label="Close media viewer"><i className="ph ph-x" aria-hidden="true" /></button></header>
        <div id="media-stage" className="media-stage"></div>
        <p id="media-caption" className="media-caption"></p>
      </section>
    </div>
    <noscript><p className="fatal-message">JavaScript is required to use the interactive lot plan map.</p></noscript>
    <div id="app-status" className="fatal-message" role="alert" hidden></div>
  </main>
    </>
  );
}
