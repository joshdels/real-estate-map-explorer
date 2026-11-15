# AGENTS.md — `src/components/` (React UI)

Adds to the root and `src/AGENTS.md`.

## Folders

- `layout/` — `SiteHeader`, `SiteFooter` for scrolling pages.
- `listings/` — `ListingCard`, `ListingTools` (share / report), `Stars`, `AreaSearch`.
- `home/`, `providers/`, `property/`, `dashboard/`, `staff/` — one surface each.
- `explorer/map-explorer.tsx` — static markup for the map explorer. Behavior is attached by `src/explorer/`.

## Rules

- Components render state and call hooks. Ranking, filtering, formatting, and permission checks come from `@/lib`; do not re-implement them inline.
- Read data with `useDataset()` and change it with its `mutate(store => ...)`. Read the demo session with `useSession()`.
- **Read form and event values before any `await`.** React resets controlled inputs after the handler returns, so `event.target.value` inside an async callback is stale. Copy it to a `const` first.
- Do not call `setState` synchronously in an effect body (lint error). Use lazy `useState` initializers or `useSyncExternalStore`.
- First render must match the server: no `window`, storage, or `Date.now()` during render. The session is `null` until after hydration.
- Every interactive element needs an accessible name; icon-only or repeated buttons get `aria-label` including the listing title. Status messages go in a `role="status"` region.
- No inline styles. Use classes from `src/styles/` and tokens from `tokens.css`.
- Label sample and user-entered data as unverified. "Staff reviewed" never means verified.
- Keep interface and marketing copy ready for buyers and property providers. Use plain benefits and direct actions, avoid technical or government jargon outside required credits, and do not use em dashes or en dashes.
- Use named, tree-shakable components from `@phosphor-icons/react` for UI icons. Default to regular weight and `currentColor`; use CSS classes and design tokens for size/color rather than inline styles. Do not use emoji or Unicode symbols as interface icons.
- Decorative icons beside text get `aria-hidden="true"`. An icon-only button still needs a precise `aria-label`. Keep a visible label for actions whose icon is not universally understood.

## Explorer markup is a contract

Element `id`s in `explorer/map-explorer.tsx` are queried by `src/explorer/*.ts` through `qs()`, which throws when one is missing. Renaming or removing an `id` requires updating its consumer in the same change. Keep that file declarative, and keep its links as plain `<a>` tags.
