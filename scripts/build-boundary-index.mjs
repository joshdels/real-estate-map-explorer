// Splits the simplified PSA/NAMRIA GeoJSON into the files served to the browser:
//   index.json            region / province / city-municipality lookup (no geometry)
//   provinces.geojson     province outlines, used to find a point's province
//   cities/<adm2>.geojson city and municipality outlines, loaded per province
// Run through scripts/build-boundaries.sh.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const [workDir, outDir] = process.argv.slice(2);
if (!workDir || !outDir) throw new Error("Usage: build-boundary-index.mjs <workDir> <outDir>");

const read = (name) => JSON.parse(readFileSync(path.join(workDir, name), "utf8"));
const round = (value) => Math.round(value * 1e4) / 1e4;

// Drops slivers that collapsed during simplification and returns a bbox.
function clean(geometry) {
  if (!geometry) return null;
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  const kept = polygons
    .map((rings) => rings.filter((ring) => ring.length >= 4))
    .filter((rings) => rings.length > 0);
  if (kept.length === 0) return null;
  const bbox = [Infinity, Infinity, -Infinity, -Infinity];
  for (const rings of kept)
    for (const [lng, lat] of rings[0]) {
      if (lng < bbox[0]) bbox[0] = lng;
      if (lat < bbox[1]) bbox[1] = lat;
      if (lng > bbox[2]) bbox[2] = lng;
      if (lat > bbox[3]) bbox[3] = lat;
    }
  return { geometry: { type: "MultiPolygon", coordinates: kept }, bbox: bbox.map(round) };
}

const byName = (a, b) => a.name.localeCompare(b.name, "en");
const regions = new Map();
const provinces = [];
const provinceFeatures = [];

for (const feature of read("adm2.geojson").features) {
  const p = feature.properties;
  const shape = clean(feature.geometry);
  if (!shape) continue;
  regions.set(p.adm1_pcode, { code: p.adm1_pcode, name: p.adm1_name });
  provinces.push({
    code: p.adm2_pcode,
    name: p.adm2_name,
    region: p.adm1_pcode,
    center: [round(p.center_lat), round(p.center_lon)],
    bbox: shape.bbox,
  });
  provinceFeatures.push({ type: "Feature", properties: { code: p.adm2_pcode }, geometry: shape.geometry });
}

const cities = [];
const cityFeatures = new Map();
for (const feature of read("adm3.geojson").features) {
  const p = feature.properties;
  const shape = clean(feature.geometry);
  if (!shape) continue;
  cities.push({
    code: p.adm3_pcode,
    name: p.adm3_name,
    province: p.adm2_pcode,
    center: [round(p.center_lat), round(p.center_lon)],
    bbox: shape.bbox,
  });
  if (!cityFeatures.has(p.adm2_pcode)) cityFeatures.set(p.adm2_pcode, []);
  cityFeatures.get(p.adm2_pcode).push({ type: "Feature", properties: { code: p.adm3_pcode }, geometry: shape.geometry });
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(path.join(outDir, "cities"), { recursive: true });
const collection = (features) => JSON.stringify({ type: "FeatureCollection", features });

writeFileSync(
  path.join(outDir, "index.json"),
  JSON.stringify({
    source: "PSA / NAMRIA administrative boundaries (COD-AB Philippines), simplified for web display",
    notice: "Simplified outlines for search and orientation only. Not a legal or surveyed boundary.",
    regions: [...regions.values()].sort((a, b) => a.code.localeCompare(b.code)),
    provinces: provinces.sort(byName),
    cities: cities.sort(byName),
  }),
);
writeFileSync(path.join(outDir, "provinces.geojson"), collection(provinceFeatures));
for (const [province, features] of cityFeatures)
  writeFileSync(path.join(outDir, "cities", `${province}.geojson`), collection(features));

console.log(`regions ${regions.size}, provinces ${provinces.length}, cities/municipalities ${cities.length}`);
