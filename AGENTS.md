# AGENTS.md

## Mission

Build **Real Estate Map Explorer** into a trustworthy, responsive, map-first application for discovering properties for sale or rent. Users should be able to understand what is available in an area, narrow results quickly, compare listings, and open useful property details with minimal friction.

The repository contains a standalone reconstruction of the supplied Canva map screenshots. It uses Leaflet with Esri satellite tiles and clearly labeled fictional sample data. Continue moving it toward a verified real-estate product; do not describe sample boundaries or listings as authoritative.

## Source of truth

- `index.html`, `css/`, and `js/` are the maintained application source.
- `canva.html` is a saved Canva export and reference artifact. It is generated, includes Canva runtime markup, and points to a missing `canva_files/index.html`.
- `data/data.json` is the editable, clearly fictional seed dataset for properties, utilities, destinations, and routes.
- `js/config.js` contains map configuration and public action definitions; do not duplicate seed records there.
- `js/store.js` owns browser-local persistence in `localStorage`; UI modules must not write storage directly.
- `js/map-controller.js`, `js/details.js`, and `js/admin.js` own map rendering, public details, and admin workflows respectively. Keep `js/main.js` limited to composition and top-level coordination.
- `README.md` documents the current limitations and intended product direction.

Do not hand-edit generated sections of `canva.html` for normal feature work. Do not create or assume behavior based solely on class names in that file; they are generated and the actual codelet is absent.

## Product priorities

When requirements are incomplete, optimize in this order:

1. Accurate property and location information.
2. Fast map exploration and understandable filters.
3. Clear comparison between visible properties.
4. Responsive and accessible interaction.
5. Visual polish and animation.

The primary workflow is: choose an area, explore map results, refine filters, select a listing, and review its details. Preserve that flow when adding features.

## Expected domain model

Do not invent production listing data. Fixtures and samples must be clearly labeled. A future property model will likely need a stable ID, listing status, sale/rent purpose, title, property type, price and currency, coordinates, human-readable location, bedrooms, bathrooms, floor/lot area with units, images, description, amenities, agent or source attribution, and timestamps. Document any schema introduced and distinguish required fields from optional ones.

Coordinates, prices, units, and availability must be validated before display. Never expose private seller information, secrets, or precise location data that the product is not authorized to publish.

Optional property media belongs under a `media` object with `panoramaUrl`, `aerialVideoUrl`, and `walkthroughVideoUrl`. Remote URLs are untrusted input: permit only HTTP(S), construct DOM elements without injecting user HTML, use privacy-conscious embeds, and label bundled examples as samples.

## Engineering guidelines

- Prefer plain, maintainable HTML, CSS, and JavaScript until the application complexity justifies a framework or build system.
- Keep modules focused. Put configuration and provider integration behind explicit interfaces rather than coupling them to UI components.
- Never commit API keys or tokens. Use documented environment-based configuration when external services are introduced.
- Keep map and list selection synchronized and make shared state explicit.
- Account for loading, empty, no-results, partial-data, offline, and provider-error states.
- Preserve required map-provider and data-source attribution.
- Avoid introducing a dependency without documenting why it is needed and how to install, test, and update it.
- Update `README.md` whenever setup, architecture, dependencies, or product behavior changes.
- Preserve the module boundaries above. Data mutations go through `PropertyStore`, and map interactions go through `MapController`.
- Treat browser storage as disposable local state. Any move to production data requires a backend, authenticated authorization, server-side validation, migrations, and backups.
- Load seed records through `PropertyStore.create()` and validate JSON structure and coordinates before rendering. `data/data.json` changes apply when no version-matching local override exists or after local site data is cleared.
- The `admin` passcode is a visible local-access affordance, not authentication. Never extend it into a false security boundary or store real private listing data behind it.

## Admin behavior

- The lock button opens the admin access dialog; the documented local passcode is `admin`.
- The admin console manages properties, utility defaults, routes, and destination locations.
- Boundary pinning must require at least three finite latitude/longitude points before a property can be saved.
- New properties, routes, and destinations must appear on the public map without a reload.
- The home button must exit admin mode, close property details, cancel map-picking mode, and restore the overview.
- Route lines and destination markers stay hidden by default. Show only the selected property's routes after an explicit **Routes** action, and hide them again when selection closes or changes.
- Selecting a property keeps dimensions hidden until **Lot Layout** is pressed. That button toggles calculated labels for every polygon edge and the total perimeter. Treat these as geodesic estimates, never surveyed values.
- Seed and locally created records may be changed or removed in the browser application. These mutations must remain in `localStorage`; never rewrite `data/data.json` from the browser.
- Property media entered through the admin form must persist with its property. Missing media keeps its public action disabled; it must not open an empty or broken viewer.
- Clearly label all sample and user-entered map data as unverified until a production data-validation workflow exists.

## UX and accessibility

- Design mobile-first, then verify wide desktop layouts.
- All filters, listing cards, dialogs, and map-adjacent controls must be keyboard operable.
- Use semantic HTML, visible focus states, useful accessible names, and sufficient contrast.
- Do not rely on marker color alone to communicate listing state or category.
- Format currency, numbers, and area units consistently for the selected market.
- Avoid obstructing the map with permanent panels on small screens; preserve a clear way to return to results.
- Respect reduced-motion preferences and avoid unnecessary map movement.

## Verification

For every change, perform the checks that apply:

1. Serve the project over HTTP; do not validate only with `file://`.
2. Check the browser console for errors and failed network requests.
3. Test at mobile and desktop widths.
4. Verify keyboard access and visible focus for changed controls.
5. Exercise success, empty, loading, and failure states affected by the change.
6. Confirm that no credentials, private data, or unlicensed assets were added.

There is no automated test suite yet. When one is introduced, document the exact commands here and in `README.md`, and run the smallest relevant tests plus the full suite for cross-cutting changes.

## Definition of done

A change is complete when its user-facing behavior works through a local HTTP server, relevant edge states are handled, accessibility has not regressed, documentation reflects new setup or architectural decisions, and no secrets or unjustified generated artifacts are included.
