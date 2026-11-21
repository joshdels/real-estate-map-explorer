# AGENTS.md — `src/lib/` (domain logic)

Framework-free TypeScript. Adds to the root and `src/AGENTS.md`. Everything here must run under Vitest without React.

| Module | Owns |
| --- | --- |
| `types.ts` | The domain model. Document required vs optional fields here. |
| `validation.ts` | `validateDataset()` and URL checks. The only gate between stored data and the UI. |
| `store.ts` | `PropertyStore`: every dataset mutation, with repository fallback to local storage. |
| `repositories/` | `DjangoRepository`, `LocalRepository` (seed + `localStorage`), and the development-only API timeout fallback. |
| `listings.ts` | Public visibility, filtering, sorting, provider ratings, recommended ranking, price and label formatting. |
| `geo/boundaries.ts` | Point-in-polygon lookup and `BoundaryService` over `public/data/boundaries/`. |
| `session.ts` | Local demo roles and the permission matrix (`can()`). Not authentication. |
| `local-records.ts` | Browser-only reports, assisted-listing cases, and activity log. |
| `share.ts`, `brand.ts`, `seed.ts` | Share links, brand copy, the validated bundled seed. |
| `django-auth.ts` | Email/password login, current-user lookup, and logout through Django REST Framework. |

## Rules

- New dataset fields: add to `types.ts`, sanitize in `validation.ts` with a safe default, and add a validation test. Old stored data must still load.
- When the seed changes shape, bump `metadata.version` in `data.json` and `STORAGE_KEY` in `repositories/local-repository.ts` so stale browser overrides are ignored.
- After `Object.assign`-style patches in the store, re-run `validateDataset()` (see `updateProperty`).
- Coordinates are `[latitude, longitude]` in the domain model and `[longitude, latitude]` in GeoJSON. Convert at the boundary and say which in a comment.
- Never read server secrets here. `NEXT_PUBLIC_API_URL` is the only browser-visible API setting.
- `NEXT_PUBLIC_APP_MODE=production` disables the bundled seed and every local repository fallback. Do not weaken this production boundary.
