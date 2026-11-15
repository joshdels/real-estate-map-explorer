---
name: boundaries
description: Rebuild the simplified PSA / NAMRIA administrative boundary index for the area filter, or load the boundaries into Postgres/PostGIS (local or hosted Supabase). Use when boundary data changes, area search is wrong, or the user asks to load boundaries into the database.
---

# Administrative boundaries

Source: PSA / NAMRIA boundaries (COD-AB Philippines shapefiles `phl_admin1` region, `phl_admin2` province, `phl_admin3` city/municipality). The source is about 1.6 GB and is not in the repo; ask the user for its path.

## Rebuild the web index

```bash
scripts/build-boundaries.sh /path/to/boundary-shapefiles
npx vitest run tests/boundaries.test.ts
```

Output in `public/data/boundaries/` (about 4 MB): `index.json` (names, codes, parents, centers, bounding boxes), `provinces.geojson`, and `cities/<province code>.geojson`. Tolerances are set in the script (about 330 m for provinces, 110 m for cities). A literal 1 m tolerance leaves about 80 MB per layer, which is too heavy for a browser.

After a rebuild, recompute `adminArea` for seed listings if codes or names changed (see the `seed-data` skill).

## Load into Postgres / Supabase

This writes to a database. Confirm the target with the user before running against a hosted project.

1. Apply `supabase/migrations/20261115000000_create_admin_boundaries.sql` (Supabase CLI `supabase db push`, or paste it in the SQL editor).
2. Run the loader with the connection string in the environment, never on disk:

   ```bash
   # Local Supabase
   SUPABASE_DB_URL='postgresql://postgres:postgres@127.0.0.1:54322/postgres' \
     scripts/load-boundaries-db.sh /path/to/boundary-shapefiles

   # Hosted: use the connection string from Supabase Dashboard -> Connect
   SUPABASE_DB_URL='postgresql://...' scripts/load-boundaries-db.sh /path/to/boundary-shapefiles
   ```

3. Check the printed counts: 17 regions, 88 provinces, 1,642 cities.
4. Test: `select * from locate_admin_area(6.9552, 126.2165);` should return Davao Oriental.

The loader simplifies to about 11 m by default (`BOUNDARY_TOLERANCE` overrides it), replaces existing rows in one transaction, and needs GDAL with the PostgreSQL driver plus `psql`.

## How the app uses it

`BoundaryService` in `src/lib/geo/boundaries.ts` reads the static files. A point outside every simplified outline falls back to the nearest one within 15 km and is marked `approximate`. The database function is ready but not yet called by the app (see the upgrade backlog).
