"use client";

import { useEffect } from "react";

export function MapExplorer() {
  useEffect(() => {
    void import("@/src/main").then(({ initializeApp }) => initializeApp());
  }, []);

  return (
    <>
  <main className="app-shell" aria-label="Real Estate Map Explorer">
    <header className="site-header">
      <a className="brand" href="#property-search" aria-label="Smart Property Listing home">
        <span className="brand-mark" aria-hidden="true">SP</span>
        <span><strong>Smart Property Listing</strong><small>Provincial homes &amp; land</small></span>
      </a>
      <nav className="site-nav" aria-label="Primary navigation">
        <div className="view-switch" role="group" aria-label="Choose how to browse properties">
          <button id="view-list-button" type="button" className="is-active" aria-pressed="true">
            <span aria-hidden="true">☷</span> List
          </button>
          <button id="view-map-button" type="button" aria-pressed="false">
            <span aria-hidden="true">⌖</span> Map
          </button>
        </div>
        <button id="nav-list-property" className="nav-cta" type="button">List your property</button>
      </nav>
    </header>
    <aside id="property-search" className="listing-panel" aria-label="Property listings">
      <section className="portal-intro">
        <p className="intro-kicker">A simpler way to move</p>
        <h1>Find a place that fits your next chapter.</h1>
        <p>Explore provincial homes and land in a searchable list and directly on the map.</p>
        <button id="intro-list-property" className="intro-cta" type="button">List your property without the hassle <span aria-hidden="true">→</span></button>
      </section>
      <section className="listing-search" aria-labelledby="listing-heading">
        <div className="listing-heading-row">
          <div><p className="eyebrow">Explore properties</p><h2 id="listing-heading">Available near you</h2></div>
          <span id="listing-count" className="listing-count" aria-live="polite">Loading…</span>
        </div>
        <label className="search-field search-keywords">
          <span className="sr-only">What kind of property are you looking for?</span>
          <span aria-hidden="true">⌕</span>
          <input id="property-search-input" type="search" placeholder="Lot name, size, or keyword" autoComplete="off" />
        </label>
        <div className="portal-search-grid">
          <label><span>Location</span><input id="property-location-input" type="search" placeholder="City, municipality, or street" autoComplete="address-level2" /></label>
          <label><span>Minimum price</span><select id="property-min-price" defaultValue=""><option value="">No minimum</option><option value="1000000">₱1M</option><option value="2000000">₱2M</option><option value="3000000">₱3M</option></select></label>
          <label><span>Maximum price</span><select id="property-max-price" defaultValue=""><option value="">No maximum</option><option value="2000000">₱2M</option><option value="2500000">₱2.5M</option><option value="3000000">₱3M</option><option value="5000000">₱5M</option></select></label>
        </div>
        <div className="listing-filters" aria-label="Filter by listing status">
          <button type="button" className="is-active" data-listing-filter="All" aria-pressed="true">All</button>
          <button type="button" data-listing-filter="Available" aria-pressed="false">Available</button>
          <button type="button" data-listing-filter="Reserved" aria-pressed="false">Reserved</button>
        </div>
        <div id="property-list" className="property-list" aria-live="polite"></div>
        <p id="property-list-empty" className="property-list-empty" hidden>No properties match this search. Try another place or filter.</p>
        <p className="sample-disclosure">All properties currently shown are clearly labeled fictional samples for product testing.</p>
      </section>
    </aside>
    <div id="map" className="map" aria-label="Interactive satellite map of available lots"></div>
    <div className="mobile-view-switcher" aria-label="Choose property view">
      <button id="show-list-button" type="button" aria-pressed="true"><span aria-hidden="true">☷</span> List</button>
      <button id="show-map-button" type="button" aria-pressed="false"><span aria-hidden="true">⌖</span> Map</button>
    </div>
    <section className="agent-card" aria-label="Property specialist">
      <div className="agent-heading"><span id="agent-initials" className="avatar" aria-hidden="true">EC</span><span><strong id="agent-name">Eric Costuna</strong><small id="agent-role">Property Specialist</small></span></div>
      <a id="agent-call" className="contact-button contact-call" href="tel:+639285354832">
        <span className="contact-emoji" aria-hidden="true">📞</span>
        <span id="agent-phone">Call: 0928 535 4832</span>
      </a>
      <a id="agent-message" className="contact-button contact-message" href="https://www.facebook.com/EsamarRealtor" target="_blank" rel="noopener noreferrer">
        <span className="contact-emoji" aria-hidden="true">🌐</span>
        <span>Visit Page</span>
      </a>
    </section>
    <aside id="admin-panel" className="admin-panel" aria-labelledby="admin-title" aria-hidden="true">
      <header className="admin-header">
        <div><h1 id="admin-title">Property listing workspace</h1><p>Add your property details, photos, and map location</p></div>
        <button id="close-admin" className="admin-close" type="button" aria-label="Close admin console">×</button>
      </header>
      <nav className="admin-tabs" aria-label="Admin sections">
        <button type="button" data-admin-tab="properties" className="is-active">Properties</button>
        <button type="button" data-admin-tab="utilities">Utilities</button>
        <button type="button" data-admin-tab="routes">Routes</button>
        <button type="button" data-admin-tab="locations">Locations</button>
        <button type="button" data-admin-tab="reports">Reports</button>
      </nav>
      <div className="admin-scroll">
        <section data-admin-view="properties">
          <form id="property-form" className="admin-form">
            <h2>Create your property listing</h2><p className="form-help">Add clear, accurate details. New and edited records remain unverified until a production review workflow is introduced.</p>
            <label>Lot name / ID<input name="title" required placeholder="e.g., LOT 003" /></label>
            <label>Street name<input name="address" required placeholder="e.g., Maharlika Avenue" /></label>
            <fieldset><legend>Property boundary</legend><div id="boundary-points" className="point-list"></div>
              <button id="pin-boundary" className="outline-button" type="button">＋ Start pinning on map</button>
              <p className="form-help">Add at least three points. Click the first point again or press “Finish boundary” when done.</p>
            </fieldset>
            <div className="form-grid"><label>Area<input name="area" required placeholder="500 sqm" /></label><label>Price (PHP)<input name="price" required type="number" min="0" step="1" placeholder="2500000" /></label></div>
            <label>Measurements<input name="measurements" placeholder="25m × 20m" /></label>
            <label>Status<select name="status"><option>Available</option><option>Reserved</option><option>Sold</option></select></label>
            <label>Description<textarea name="description" rows={4} placeholder="Property description"></textarea></label>
            <fieldset><legend>Property media</legend>
              <label>360° panorama image URL<input name="panoramaUrl" type="url" placeholder="https://example.com/panorama.jpg" /></label>
              <label>Drone / aerial video URL<input name="aerialVideoUrl" type="url" placeholder="YouTube or direct video URL" /></label>
              <label>Walkthrough video URL<input name="walkthroughVideoUrl" type="url" placeholder="YouTube or direct video URL" /></label>
              <label>Property image URLs<textarea name="images" rows={5} placeholder={"https://example.com/front.jpg\nhttps://example.com/kitchen.jpg"}></textarea></label>
            </fieldset>
            <label className="authority-confirmation"><input name="authorityConfirmed" type="checkbox" required /><span>I am the owner or have permission to advertise this property, and the information I supplied is accurate to the best of my knowledge.</span></label>
            <button className="save-button" type="submit">Submit property listing</button>
          </form>
          <div><h2>Temporary property feed</h2><div id="property-feed" className="admin-feed"></div></div>
        </section>
        <section data-admin-view="utilities" hidden>
          <form id="utilities-form" className="admin-form">
            <h2>⚡ Utility services</h2><p className="form-help">Comma-separated options are applied to newly created properties.</p>
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
            <h2>🛣 Manual routes</h2><p className="form-help">Attach a destination to a property. The application draws a direct reference line.</p>
            <label>Property<select id="route-property" name="propertyId" required></select></label>
            <label>Destination<select id="route-destination" name="destinationId" required></select></label>
            <button className="save-button" type="submit">Add route</button>
          </form>
          <div id="route-feed" className="admin-feed"></div>
        </section>
        <section data-admin-view="locations" hidden>
          <form id="location-form" className="admin-form">
            <h2>📍 Destination points</h2><p className="form-help">Save schools, banks, stores, and landmarks for route planning.</p>
            <label>Name<input name="name" required placeholder="e.g., Eastern Samar State University" /></label>
            <label>Type<select name="type"><option value="school">School</option><option value="bank">Bank</option><option value="store">Store / Mall</option><option value="landmark">Landmark</option></select></label>
            <div className="form-grid"><label>Latitude<input name="lat" required type="number" step="any" /></label><label>Longitude<input name="lng" required type="number" step="any" /></label></div>
            <button id="use-map-location" className="outline-button" type="button">⌖ Pick location on map</button>
            <button className="save-button" type="submit">Save destination point</button>
          </form>
          <div><h2>Saved destinations</h2><div id="location-feed" className="admin-feed"></div></div>
        </section>
        <section data-admin-view="reports" hidden>
          <h2>⚑ Reported listings</h2>
          <p className="form-help">Listings flagged by visitors for sexual, inappropriate, or fraudulent content. Review each one and mark it reviewed when resolved. Reports are stored in this browser only.</p>
          <div id="report-feed" className="admin-feed"></div>
        </section>
      </div>
    </aside>
    <aside id="details-panel" className="details-panel" aria-labelledby="property-title" aria-hidden="true">
      <button id="toggle-details" className="sheet-toggle" type="button" aria-controls="property-details-content" aria-expanded="true" aria-label="Collapse property details">
        <span aria-hidden="true">⌄</span>
      </button>
      <p id="collapsed-property-title" className="collapsed-property-title" aria-hidden="true"></p>
      <button id="close-details" className="close-button" type="button" aria-label="Close property details">×</button>
      <div id="property-details-content" className="details-scroll" role="region" aria-label="Property details" tabIndex={0}>
        <p className="panel-kicker">Available property</p>
        <h1 id="property-title">Lot details</h1>
        <p id="property-address" className="property-address"></p>
        <dl className="property-facts">
          <div><dt>Area</dt><dd id="property-area"></dd></div><div><dt>Price</dt><dd id="property-price"></dd></div>
          <div><dt>Measurements</dt><dd id="property-measurements"></dd></div><div><dt>Status</dt><dd><span id="property-status" className="status-pill"></span></dd></div>
        </dl>
        <div className="detail-actions">
          <button id="detail-view-map" className="detail-action detail-action-map" type="button">
            <span aria-hidden="true">⌖</span> View on map
          </button>
          <button id="detail-share" className="detail-action detail-action-share" type="button">
            <span aria-hidden="true">f</span> Share
          </button>
          <button id="detail-report" className="detail-action detail-action-report" type="button">
            <span aria-hidden="true">⚑</span> Report
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
        <button id="property-gallery" className="property-gallery" type="button" aria-label="View property photos">
          <img id="property-gallery-image" alt="" loading="lazy" />
          <span id="property-gallery-placeholder" className="property-gallery-placeholder" aria-hidden="true">No photos yet</span>
          <span id="property-gallery-count" className="property-gallery-count"></span>
        </button>
        <div id="property-media" className="feature-grid" aria-label="Property media and navigation"></div>
        <section className="detail-section"><h2>Description</h2><p id="property-description"></p></section>
        <section className="detail-section"><h2><span aria-hidden="true">⌁</span> Utilities available</h2><dl id="property-utilities" className="detail-list"></dl></section>
        <section className="detail-section"><h2><span aria-hidden="true">⌖</span> Nearby routes</h2><ul id="property-routes" className="route-list"></ul></section>
        <section className="detail-section">
          <h2><span aria-hidden="true">⌖</span> Location</h2>
          <button id="property-minimap" className="property-minimap" type="button" aria-label="Open this property on the full map">
            <img id="property-minimap-image" alt="" loading="lazy" />
            <span className="property-minimap-pin" aria-hidden="true">⌖</span>
            <span className="property-minimap-caption">Approximate location — tap to open the full map.</span>
          </button>
        </section>
        <p className="data-note">Property information shown here is sample content and must be independently verified.</p>
      </div>
    </aside>
    <div id="admin-dialog" className="dialog-backdrop" hidden>
      <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="admin-access-title">
        <button id="cancel-admin" className="dialog-close" type="button" aria-label="Cancel admin access">×</button><span className="dialog-icon" aria-hidden="true">🔐</span>
        <h2 id="admin-access-title">List your property</h2>
        <p className="signup-intro">Create an account, add your property information and images, and place it on the map. No complicated onboarding.</p>
        <ol className="signup-steps" aria-label="How property listing works"><li><b>1</b><span>Sign in securely</span></li><li><b>2</b><span>Add accurate details</span></li><li><b>3</b><span>Submit your listing</span></li></ol>
        <p id="auth-status" className="auth-status">Sign in with Google or Facebook to manage shared listing data, or use the local demo passcode for this browser only.</p>
        <button id="google-sign-in" className="google-auth-button" type="button"><span aria-hidden="true">G</span> Continue with Google</button>
        <button id="facebook-sign-in" className="facebook-auth-button" type="button"><span aria-hidden="true">f</span> Continue with Facebook</button>
        <button id="google-sign-out" className="outline-button" type="button" hidden>Sign out</button>
        <div className="auth-divider"><span>or local access</span></div>
        <form id="admin-access-form"><input name="username" type="text" value="local-admin" autoComplete="username" readOnly hidden /><label className="dialog-label">Passcode<input id="admin-passcode" type="password" required autoComplete="current-password" /></label><p id="admin-access-error" className="form-error" role="alert"></p><button className="primary-button" type="submit">Access admin panel</button></form>
      </section>
    </div>
    <div id="media-dialog" className="media-backdrop" hidden>
      <section className="media-dialog" role="dialog" aria-modal="true" aria-labelledby="media-title">
        <header><div><span className="panel-kicker">Property media</span><h2 id="media-title">Media viewer</h2></div><button id="close-media" type="button" aria-label="Close media viewer">×</button></header>
        <div id="media-stage" className="media-stage"></div>
        <p id="media-caption" className="media-caption"></p>
      </section>
    </div>
    <noscript><p className="fatal-message">JavaScript is required to use the interactive property map.</p></noscript>
    <div id="app-status" className="fatal-message" role="alert" hidden></div>
  </main>
    </>
  );
}
