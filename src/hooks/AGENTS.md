# AGENTS.md — `src/hooks/`

React hooks that connect components to `src/lib`. Adds to the root and `src/AGENTS.md`.

- `use-dataset.ts` — `useDataset()` returns `{ data, ready, failed, mutate }`. `data` is the bundled seed during development server render and first paint, but an empty dataset in production mode, then the live `PropertyStore` snapshot. `getStore()` creates one store per page load.
- `use-session.ts` — `useSession()` returns the local demo session and a refresh function. Backed by `useSyncExternalStore`; call refresh after `setSession()` / `clearSession()`.
- `use-boundary-index.ts` — `useBoundaryIndex()` loads the region / province / city lookup once.

## Rules

- One hook per file, named `use-<thing>.ts`, with `"use client"` at the top.
- Hooks hold wiring only. Put calculations in `src/lib` so they can be unit tested without React.
- Guard async effects with an `active` flag and clean up subscriptions.
- Snapshots passed to `useSyncExternalStore` must be referentially stable while unchanged.
