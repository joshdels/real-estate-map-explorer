# Application architecture

## Runtime overview

```text
index.html
    |
    v
src/main.ts (composition only)
    |-- MapController -------- Leaflet + Esri imagery
    |-- DetailsPanel --------- selected-listing UI
    |-- MediaViewer ---------- panorama/video/swipe gallery
    |-- AdminConsole --------- local management workflow
    `-- PropertyStore -------- typed application state
             |
             v
       DataRepository
         |       |
         |       `-- LocalRepository -> data/data.json + localStorage
         `---------- SupabaseRepository -> public.app_datasets
```

`PropertyStore` is the only mutation boundary. UI modules never access storage or Supabase directly. `validateDataset()` validates coordinates, prices, required collections, and remote media protocols at every data-entry boundary.

## Fallback sequence

1. If either `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is absent, start with `LocalRepository`.
2. If Supabase configuration, network access, the `default` row, or validation fails, load `/data/data.json`.
3. Local mutations are stored under `real-estate-map-explorer.data.v6`.
4. If a remote save fails, the current validated state is retained and persisted locally.

This fallback preserves availability, but local changes are browser-specific and are not a production database substitute.

## Supabase security

The browser receives only the public anon key. Row-level security permits public reads of the published `default` dataset and restricts writes to authenticated Supabase users. The existing visible `admin` passcode is only a local UI affordance and must never authorize backend writes. A later production administration release should add Supabase Auth, role claims, audit records, and normalized property/media tables if query volume requires them.

## Media model

Optional media lives on each property:

```ts
media: {
  panoramaUrl?: string;
  aerialVideoUrl?: string;
  walkthroughVideoUrl?: string;
  images?: string[];
}
```

All values must be HTTP(S). The gallery builds DOM nodes without injecting remote HTML, supports previous/next buttons, keyboard arrows, and horizontal touch swipes.

## Deployment

Vite produces static assets in `dist/`. Deploy that folder to any static host. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as build-time environment variables. If omitted, the deployed application intentionally uses the bundled JSON/local-storage fallback.
