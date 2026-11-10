# AGENTS.md — `src/` (Client Logic)

Scoped rules for the browser modules. These add to the root `AGENTS.md`.

## Module boundaries (do not blur)

- `main.ts` — composition and top-level coordination only. It wires modules to DOM `id`s and owns the listing portal (search/filter/render of `#property-list`). Keep feature logic out of here.
- `map-controller.ts` — owns all MapLibre rendering and interaction. UI code goes through it; nothing else touches the map instance.
- `details.ts` — the in-app details panel (currently not opened by the main flow; the full detail is the `/property/[id]` route).
- `admin.ts` — admin console (properties, utilities, routes, locations, **reports**).
- `store.ts` + `repositories/` — persistence. **UI modules must not write storage directly**; mutate through `PropertyStore`, which persists via the configured repository and falls back to `localStorage`.
- `dom.ts` provides `qs()`; every element it fetches must exist in `components/map-explorer.tsx`.

## Selection vs. navigation

- `MapController.select(property)` flies to the lot **and** fires the `onPropertySelect` callback. In `main.ts` that callback **navigates to `/property/<id>`** (the full detail page) — a marker click leaves the SPA.
- `MapController.focus(property)` flies/highlights **without** firing the callback. Use it for programmatic selection (e.g. the `?property=<id>` deep link) so it does not trigger navigation.
- `fitBounds` padding assumes the list panel is on the **right** — keep the larger padding on `right`.

## Reports

- Listing reports are stored under `localStorage` key `spl-listing-reports` (see `PropertyStore.reportListing` / `listReports` / `resolveReport`). They are per-browser and separate from the validated dataset — do not push them into `data.json` or the repository.
- The same key is written by the client `app/property/[id]/PropertyActions.tsx`; keep the shape in sync (`id`, `propertyId`, `title`, `reason`, `createdAt`).

## Validation

- Load records through `PropertyStore.initialize()` and validate structure, coordinates, prices, and media URLs before rendering. Remote media URLs are untrusted: HTTP(S) only, no injected HTML.

## Verify

Run `npm run typecheck` and the relevant Vitest file while iterating, then the full suite before completion.
