# AGENTS.md — `css/` (Styling & Theming)

Scoped rules for styling. These add to the root `AGENTS.md`.

## Files

- `tokens.css` — design tokens on `:root`. Use these for new work rather than hardcoding.
- `components.css` — component styling (header, cards, details, admin, feature buttons, detail page, footer).
- `layout.css` — positioning, responsive view modes, and media queries.

## Theme

- The theme is **Canva-style blue + violet. There is no green theme.**
  - Primary (bluish indigo): `--color-brand: #4f57e3`, dark `#3b41c7`.
  - Accent (violet): `--color-accent: #8b5cf6`.
- When adding colors, prefer tokens. If you must hardcode, match the blue/violet family — never reintroduce greens.
- Colorful media-action classes (keep these hues): `.feature-panoramaUrl` (blue→purple), `.feature-layout` (red), `.feature-aerialVideoUrl` (teal), `.feature-walkthroughVideoUrl` (green button — action accent only, not theme), `.feature-images` (purple), `.feature-route` (dark green). These are shared by the details panel and the `/property/[id]` page.

## Layout & view modes

- Mobile-first, then verify wide desktop.
- View mode is driven by `body.show-map-view`:
  - **Absent** = dashboard: full-width centered listing grid, map hidden.
  - **Present** = map view: **map on the left, property list on the right**; the hero intro is hidden; side cards are flat rows.
- Search and filters live in the listing panel (`.listing-search`), not in the header and not floating over the map. Map zoom controls are MapLibre's native control (top-right). The hero intro (`.portal-intro`) shows only on the dashboard.

## Critical: scope the scroll lock

- Only the interactive map shell may lock the viewport: use `body:has(.app-shell)` / `html:has(.app-shell)` for `overflow: hidden` and `height: 100dvh`.
- **Never** put `overflow: hidden` or a fixed `100dvh` height on bare `html`/`body` — that leaks onto other routes (e.g. the property detail page) and freezes their scrolling.

## Accessibility

- Visible focus states, sufficient contrast, and respect `prefers-reduced-motion` (already handled globally in `layout.css`).
