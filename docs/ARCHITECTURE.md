# Application architecture

## Runtime overview

```text
Next.js App Router
  app/layout.tsx -------- metadata, global CSS, panorama runtime
  app/page.tsx
    `-- components/MapExplorer (client boundary)
          `-- src/main.ts (composition)
                |-- MapController ----- Leaflet + Esri imagery
                |-- DetailsPanel ------ selected-listing UI
                |-- MediaViewer ------- panorama/video/gallery
                |-- AdminConsole ------ local management workflow
                `-- PropertyStore ----- typed application state
                      `-- DataRepository
                           |-- LocalRepository -> seed JSON + localStorage
                           `-- SupabaseRepository -> public.app_datasets
```

Leaflet and DOM controllers execute only after the client component mounts. UI code does not access persistence directly. `PropertyStore` owns mutations and `validateDataset()` checks coordinates, prices, collections, polygon boundaries, and media protocols at data boundaries.

## Supabase boundary

`src/lib/supabase/client.ts` creates the typed browser client from public environment values. `server.ts` prepares the cookie-aware server client needed by a future authentication flow and is not imported into the browser bundle. Database types live beside the factories and should be regenerated after migrations change.

The migration enables RLS. Anonymous and authenticated visitors may read only the `default` published dataset. Writes require an authenticated Supabase user. The local `admin` passcode never grants database authority.

## Fallback sequence

1. Missing public Supabase configuration selects `LocalRepository`.
2. A remote connection, schema, row, or validation failure loads the bundled seed.
3. Browser-local mutations use `real-estate-map-explorer.data.v6`.
4. A failed remote save retains validated state and switches persistence to local storage.

The fallback preserves demo availability but is not a production database substitute.

## Deployment

`next build` creates the production application in `.next/`. Deploy to a Node-compatible Next.js host and provide public Supabase configuration. Add an authenticated server-side administration path before storing real or private listing data.
