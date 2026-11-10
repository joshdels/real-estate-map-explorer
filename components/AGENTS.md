# AGENTS.md — `components/` (Frontend UI)

Scoped rules for the React/Next client UI. These add to the root `AGENTS.md`; the root still applies.

## What lives here

- `map-explorer.tsx` is a `"use client"` **composition shell**. It renders the static DOM structure (elements with stable `id`s and `class`es) and then lazy-imports `@/src/main` to attach behavior. It must stay declarative.
- Do **not** put business logic, data access, map logic, or storage here. Behavior belongs in `src/*.ts` modules, which query this DOM by `id` through `qs()`.

## The DOM is a contract

- Element `id`s are the integration surface between this markup and `src/`. Examples the logic depends on: `#property-list`, `#property-search-input`, `#property-location-input`, `#details-panel`, `#admin-panel`, `#map`, `#report-feed`, `#property-gallery`.
- Renaming or removing an `id`/`class` here **breaks** its consumer in `src/`. If you change one, update the matching `qs()` call and any CSS selector in the same change.
- Server-rendered pages (e.g. `/property/[id]`) live in `app/`, not here. Per-property detail is a full page route; this shell powers the interactive map/dashboard only.

## UI rules

- Semantic HTML, visible focus, useful `aria` names, keyboard operability for every control (filters, cards, dialogs, map-adjacent buttons).
- Do not communicate listing state or category by marker/button color alone — always pair with text.
- No inline styles. Reuse existing classes. Colorful media actions use `feature-button feature-<mediaKey|type>` (defined in `css/`). The view toggle uses `.view-switch`. Search and filters live in the listing panel (`.listing-search`), not the header — the header holds brand, view toggle, and the "List your property" CTA only.
- Mark all sample/user data as clearly fictional and unverified, per the root doc.

## Verify

Run over HTTP (not `file://`), check the console, test mobile + desktop widths and keyboard access for any control you touch. Run `npm run typecheck` and `npm run build` for cross-cutting changes.
