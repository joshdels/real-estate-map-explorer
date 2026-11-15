# AGENTS.md — `src/lib/` (domain logic)

Framework-free TypeScript. Adds to the root and `src/AGENTS.md`. Everything here must run under Vitest without React.

| Module | Owns |
| --- | --- |
| `types.ts` | The domain model. Document required vs optional fields here. |
| `validation.ts` | `validateDataset()` and URL checks. The only gate between stored data and the UI. |
| `store.ts` | `PropertyStore`: every dataset mutation, with repository fallback to local storage. |
| `repositories/` | `LocalRepository` (seed + `localStorage`), `SupabaseRepository`, and the factory with timeout fallback. |
| `listings.ts` | Public visibility, filtering, sorting, provider ratings, recommended ranking, price and label formatting. |
| `geo/boundaries.ts` | Point-in-polygon lookup and `BoundaryService` over `public/data/boundaries/`. |
| `session.ts` | Local demo roles and the permission matrix (`can()`). Not authentication. |
| `local-records.ts` | Browser-only reports, assisted-listing cases, and activity log. |
| `share.ts`, `brand.ts`, `seed.ts` | Share links, brand copy, the validated bundled seed. |
| `supabase/` | Typed browser, server, and proxy clients. |

## Rules

- New dataset fields: add to `types.ts`, sanitize in `validation.ts` with a safe default, and add a validation test. Old stored data must still load.
- When the seed changes shape, bump `metadata.version` in `data.json` and `STORAGE_KEY` in `repositories/local-repository.ts` so stale browser overrides are ignored.
- After `Object.assign`-style patches in the store, re-run `validateDataset()` (see `updateProperty`).
- Coordinates are `[latitude, longitude]` in the domain model and `[longitude, latitude]` in GeoJSON. Convert at the boundary and say which in a comment.
- Never read `process.env` secrets here; only `NEXT_PUBLIC_*` values in `supabase/client.ts`.
- Regenerate `supabase/database.types.ts` after schema changes.
