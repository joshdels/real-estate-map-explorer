# AGENTS.md — `supabase/`

Database schema. Adds to the root `AGENTS.md`.

- `migrations/20261110000000_create_app_datasets.sql` — one JSON dataset row (`slug = 'default'`), public read, authenticated write.
- `migrations/20261115000000_create_admin_boundaries.sql` — PostGIS tables `admin_regions`, `admin_provinces`, `admin_cities`, public read only, and `locate_admin_area(lat, lng)`.

## Rules

- Never edit an applied migration. Add a new timestamped file.
- Every table has RLS enabled. Reference data is read-only to `anon` and `authenticated`; write policies must name the role and condition explicitly.
- After changing `public/data/data.json`, the hosted `default` row must be updated from a trusted connection, or the live site keeps serving the old shape.
- Never place a service-role key or database URL in the repo or a `NEXT_PUBLIC_*` variable.
- Applying migrations or loading data to the hosted project is a user decision. Prepare the command, state the target, and let the user run or approve it.
- Regenerate `src/lib/supabase/database.types.ts` after schema changes.
