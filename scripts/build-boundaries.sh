#!/usr/bin/env bash
# Builds the web-sized Philippine administrative boundary index used by the
# area filter. Source: PSA/NAMRIA administrative boundaries (COD-AB shapefiles
# phl_admin1..3). The source is ~1.6 GB, so it is simplified to roughly 1 MB
# per layer and never committed.
#
# Usage: scripts/build-boundaries.sh /path/to/boundary-shapefiles
# Requires: GDAL (ogr2ogr) and Node.js 22+.
set -euo pipefail

SOURCE="${1:?Pass the directory that contains phl_admin1.shp, phl_admin2.shp and phl_admin3.shp}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/public/data/boundaries"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# Tolerances are in degrees: 0.003 is about 330 m, 0.001 is about 110 m.
ogr2ogr -f GeoJSON -simplify 0.003 -lco COORDINATE_PRECISION=4 \
  -select adm2_pcode,adm2_name,adm1_pcode,adm1_name,center_lat,center_lon \
  "$WORK/adm2.geojson" "$SOURCE/phl_admin2.shp"
ogr2ogr -f GeoJSON -simplify 0.001 -lco COORDINATE_PRECISION=4 \
  -select adm3_pcode,adm3_name,adm2_pcode,adm1_pcode,center_lat,center_lon \
  "$WORK/adm3.geojson" "$SOURCE/phl_admin3.shp"

node "$ROOT/scripts/build-boundary-index.mjs" "$WORK" "$OUT"
du -sh "$OUT"
