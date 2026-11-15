# Application architecture

## Runtime overview

```text
Next.js App Router (src/app)
  layout.tsx ------------- metadata, global CSS, panorama runtime
  /, /providers, /property/[id], /dashboard, /staff
    `-- React components (src/components)
          `-- hooks (src/hooks): useDataset, useSession, useBoundaryIndex
                `-- src/lib
  /explore
    `-- components/explorer/MapExplorer (markup + lazy import)
          `-- src/explorer/main.ts (composition, listing portal)
                |-- MapController ----- MapLibre GL + Esri imagery + area outline
                |-- AdminConsole ------ listing workspace
                |-- DetailsPanel, MediaViewer, AuthController
                `-- src/lib

src/lib
  PropertyStore ---------- every dataset mutation
    `-- DataRepository
         |-- LocalRepository ----- seed JSON + localStorage
         `-- SupabaseRepository -- public.app_datasets
  validation ------------- validateDataset(): the gate for all stored data
  listings --------------- visibility, filters, ratings, recommended ranking
  geo/boundaries --------- BoundaryService over public/data/boundaries
  session ---------------- local demo roles and permission matrix
  local-records ---------- browser-only reports, assisted cases, activity log
```

Both UI styles share `src/lib`, so a rule such as "suspended listings are never public" is written once (`isPublic`) and used by the explorer and every React page. `validateDataset()` checks coordinates, prices, polygons, media protocols, enum fields, provider and group references, and review ratings, and fills defaults so datasets saved before a field existed still load.

## Trust boundaries

- The dataset is readable by anyone. It holds only publishable information.
- Roles are a session-storage demo. Any visitor can become an administrator with the public passcode, so no permission check here is a security control.
- Reports, assisted cases, and the activity log are per-browser local storage and are not shared between devices.
- Administrative outlines are simplified. An area match is a search aid, not a legal determination.

## Supabase boundary

`src/lib/supabase/client.ts` creates the typed browser client from public environment values. `server.ts` prepares the cookie-aware server client needed by a future authentication flow and is not imported into the browser bundle. Database types live beside the factories and should be regenerated after migrations change.

The migration enables RLS. Anonymous and authenticated visitors may read only the `default` published dataset. Writes require an authenticated Supabase user. The local demo passcodes never grant database authority.

A second migration adds PostGIS tables for regions, provinces, and cities with public read access and `locate_admin_area(lat, lng)`. They are loaded by `scripts/load-boundaries-db.sh` and are not yet used by the application.

## Fallback sequence

1. Missing public Supabase configuration selects `LocalRepository`.
2. A remote connection, schema, row, or validation failure loads the bundled seed.
3. Browser-local mutations use `real-estate-map-explorer.data.v7`.
4. A failed remote save retains validated state and switches persistence to local storage.

The fallback preserves demo availability but is not a production database substitute.

## Deployment

`next build` creates the production application in `.next/`. Deploy to a Node-compatible Next.js host and provide public Supabase configuration. Add an authenticated server-side administration path before storing real or private listing data.
