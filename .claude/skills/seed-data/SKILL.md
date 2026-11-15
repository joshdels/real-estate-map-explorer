---
name: seed-data
description: Add or change the fictional sample dataset (listings, providers, groups, reviews) in public/data/data.json, with official areas computed from the boundary files. Use when asked for more sample listings, new sample providers, or seed changes.
---

# Change the sample dataset

`public/data/data.json` is fictional product-testing data served to every visitor. `public/data/boundaries/` is generated; never edit it by hand. (There is no `AGENTS.md` inside `public/` because everything there is published.)

## Rules

- Never add a real person, business, phone number, address, or listing. Provider names start with "Sample".
- Coordinates are `[latitude, longitude]`, on land, inside the Philippines.
- `adminArea` is computed, never typed by hand.
- Use only bundled images under `public/images/` or media you are licensed to use.

## Steps

1. Add the record. A property needs: `id` (`property-NNN`), `title`, `address`, `coordinates`, `polygon` (3+ points around the coordinates), `area`, `price` (PHP; monthly for rent), `status`, `utilities`, `purpose`, `propertyType`, `providerId`, `createdAt` (ISO), `review` (`pending` or `reviewed`), and optional `groupId`, `featured`, `assistedBy`, `media`.
2. Compute `adminArea` with the project code so it matches what the app does:

   ```bash
   npx vitest run tests/boundaries.test.ts   # confirms the boundary files load
   ```

   Then resolve the point with `BoundaryService.locate([lat, lng])` from `src/lib/geo/boundaries.ts` (a short Node or Vitest script using a file loader, as `tests/boundaries.test.ts` does) and copy the result into the record.
3. A `groupId` must belong to the same provider. Reviews need an integer `rating` 1-5, `createdAt`, and `status`.
4. If you added or renamed fields, bump `metadata.version` and `STORAGE_KEY` in `src/lib/repositories/local-repository.ts`.
5. Run `npm test`. The suite fails if a seed listing lacks an area, provider, or date.
6. Tell the user that a hosted Supabase `default` row will keep serving the old data until it is updated from a trusted connection.
