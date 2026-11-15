# AGENTS.md — `scripts/`

Data tooling. Adds to the root `AGENTS.md`. See the `boundaries` skill for the full workflow.

- `build-boundaries.sh <shapefile dir>` — simplifies the PSA / NAMRIA shapefiles (`phl_admin2`, `phl_admin3`) with GDAL and writes `public/data/boundaries/` through `build-boundary-index.mjs`.
- `load-boundaries-db.sh <shapefile dir>` — loads regions, provinces, and cities into PostGIS. Needs `SUPABASE_DB_URL` in the environment and the `20261115000000` migration applied.

## Rules

- The source shapefiles are about 1.6 GB and stay outside the repo. Commit only the generated files under `public/data/boundaries/` (about 4 MB).
- Scripts take paths and connection strings as arguments or environment variables. Never hardcode a machine path or a credential.
- Scripts must be re-runnable: the build replaces its output directory and the loader replaces existing rows in one transaction.
- Running the loader against a hosted database changes shared data. Do it only when the user asks, and confirm the target first.
- Keep to Bash, GDAL, psql, and Node built-ins; do not add npm dependencies for tooling.
