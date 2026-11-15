# AGENTS.md — `src/styles/`

Adds to the root and `src/AGENTS.md`.

## Files

- `tokens.css` — design tokens on `:root`. Use these instead of hardcoding.
- `components.css` — explorer components, details, workspace, feature buttons, listing detail page, footer.
- `layout.css` — explorer positioning, view modes, and media queries.
- `site.css` — scrolling pages (home, providers, dashboard, staff), shared card tools, badges, and the area filter.

## Theme

- Indigo and violet: `--color-brand: #4f57e3`, `--color-brand-dark: #3b41c7`, `--color-accent: #8b5cf6`, night `--color-night`. **No green theme.**
- Neon yellow `--color-neon: #fff04a` is limited to about 8 to 10 percent of a composition. Use it only for important words, hero numbers, and short indicator lines on dark surfaces. Never turn it into a large background, card color, or general button color.
- Headings use `--font-display` (Georgia). Body uses the Inter / system stack.
- Gold (`--color-gold`) is reserved for ratings and provider highlights. Amber panels (`.demo-warning`, `.sample-band`) are reserved for honesty notices.
- Media-action button hues (`.feature-*`) are fixed; do not recolor them.

## Layout

- Mobile-first. Page content sits in a `--content-width` column with a 20 px gutter. Full-width bands use `.page-section-tint`.
- `/explore` view mode is driven by `body.show-map-view`: absent = listing grid, present = map left and list right.
- Only the explorer may lock scrolling, through `body:has(.app-shell)`. Never put `overflow: hidden` or a fixed height on bare `html` / `body`.
- An element with `display` set in CSS ignores the `hidden` attribute. Add a `[hidden] { display: none; }` rule when you style a toggled element.

## Accessibility

- Text contrast at least 4.5:1, controls at least 40 px tall, visible `:focus-visible` outlines, and `prefers-reduced-motion` respected.
- Phosphor icons inherit `currentColor`. Size them through the surrounding component class (normally 18–20 px); never override the webfont's `font-family`, `font-style`, `font-weight`, `:before`, or `:after` rules.
