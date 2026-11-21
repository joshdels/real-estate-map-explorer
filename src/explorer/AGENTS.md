# AGENTS.md — `src/explorer/` (map explorer modules)

Imperative browser modules behind `/explore`. Adds to the root and `src/AGENTS.md`. They attach to the markup in `src/components/explorer/map-explorer.tsx`.

- `main.ts` — composition and the listing portal (filters, cards, share, report, URL parameters). Keep feature logic out of it.
- `map-controller.ts` — the only owner of the MapLibre instance: markers, selection, routes, measurements, draft boundary, and the administrative-area outline (`showArea`).
- `admin.ts` — the listing workspace: property form, utilities, routes, destinations, local reports.
- `details.ts`, `media-viewer.ts`, `auth.ts`, `config.ts`, `dom.ts` — details panel, media dialog, Supabase OAuth buttons, map config, `qs()`.

## Rules

- Filtering, ranking, and viewport bounds checks come from `@/lib/listings`. Filter-matching listings become markers; the side list is narrowed further to the visible map bounds.
- Marker clicks open a preview without moving the camera. `focus()` frames and highlights only for programmatic selection such as a deep link.
- The map is hidden in list view. Queue framing with the portal's `frame()` helper instead of calling `fitBounds` on a hidden map.
- Accepted URL parameters: `q`, `region`, `province`, `city`, `purpose`, `type`, `sort`, `view=map`, `view=list`, `property=<id>`, `workspace`. The map is the default view.
- `initializeApp()` runs once per page load. Navigation into and out of `/explore` must be a full page load.
- MapLibre needs the same-origin worker: `maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs")`. Refresh `public/maplibre-gl-worker.mjs` when upgrading `maplibre-gl`.
- Build DOM with `createElement` and `textContent`. Never assign user or dataset text to `innerHTML`.
- New listings get `adminArea` from `boundaries.locate()`; save the listing even when the lookup fails.
- Create dynamic icons with `phosphorIcon(name)` from `dom.ts`; use regular Phosphor class names from the official catalog. Do not insert SVG strings, use `innerHTML`, or fall back to emoji/Unicode pictograms. Static explorer markup may use matching `ph ph-*` classes.
