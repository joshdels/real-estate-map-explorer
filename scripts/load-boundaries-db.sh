#!/usr/bin/env bash
# Loads the PSA/NAMRIA administrative boundaries into Postgres/PostGIS
# (local Supabase or a hosted Supabase project). Apply the
# 20261115000000_create_admin_boundaries.sql migration first.
#
# Usage:
#   SUPABASE_DB_URL='postgresql://postgres:<password>@127.0.0.1:54322/postgres' \
#     scripts/load-boundaries-db.sh /path/to/boundary-shapefiles
#
# For a hosted project, copy the "Session pooler" or direct connection string
# from Supabase Dashboard -> Connect. Never commit it and never put it in a
# NEXT_PUBLIC_* variable. Re-running replaces the existing boundary rows.
# Requires: GDAL (ogr2ogr) with the PostgreSQL driver, and psql.
set -euo pipefail

SOURCE="${1:?Pass the directory that contains phl_admin1.shp, phl_admin2.shp and phl_admin3.shp}"
: "${SUPABASE_DB_URL:?Set SUPABASE_DB_URL to the Postgres connection string}"
# About 11 m. Detailed enough for point lookups, small enough for a hosted database.
TOLERANCE="${BOUNDARY_TOLERANCE:-0.0001}"

load() {
  local layer="$1" sql="$2"
  echo "Loading $layer ..."
  ogr2ogr -f PostgreSQL "PG:$SUPABASE_DB_URL" "$SOURCE/$layer.shp" \
    -nln "public.${layer}_staging" -overwrite -lco GEOMETRY_NAME=geom \
    -nlt MULTIPOLYGON -t_srs EPSG:4326 -simplify "$TOLERANCE" -makevalid \
    -dialect SQLite -sql "$sql"
}

load phl_admin1 "select geometry, adm1_pcode as code, adm1_name as name from phl_admin1"
load phl_admin2 "select geometry, adm2_pcode as code, adm2_name as name, adm1_pcode as region_code from phl_admin2"
load phl_admin3 "select geometry, adm3_pcode as code, adm3_name as name, adm2_pcode as province_code, adm1_pcode as region_code from phl_admin3"

psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 <<'SQL'
begin;
set local search_path = public, extensions;
truncate public.admin_cities, public.admin_provinces, public.admin_regions;
insert into public.admin_regions (code, name, geom)
  select code, name, st_multi(st_collectionextract(geom, 3)) from public.phl_admin1_staging;
insert into public.admin_provinces (code, name, region_code, geom)
  select code, name, region_code, st_multi(st_collectionextract(geom, 3)) from public.phl_admin2_staging;
insert into public.admin_cities (code, name, province_code, region_code, geom)
  select code, name, province_code, region_code, st_multi(st_collectionextract(geom, 3)) from public.phl_admin3_staging;
drop table public.phl_admin1_staging, public.phl_admin2_staging, public.phl_admin3_staging;
commit;
analyze public.admin_regions;
analyze public.admin_provinces;
analyze public.admin_cities;
select 'regions' as layer, count(*) from public.admin_regions
union all select 'provinces', count(*) from public.admin_provinces
union all select 'cities', count(*) from public.admin_cities;
SQL
