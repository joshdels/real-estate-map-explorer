# Real Estate Map Explorer

A Vite + TypeScript, map-first application for exploring fictional sample properties. Leaflet renders Esri satellite imagery, Supabase can provide the shared dataset, and a validated JSON/local-storage provider keeps the application available when Supabase is not configured or cannot be reached.

> All bundled listings, boundaries, prices, routes, availability, contact details, and media are fictional or sample content. They are not verified listings or surveys.

## Features

- Interactive property markers, boundaries, estimated edge lengths, and route overlays
- Responsive desktop drawer and collapsible two-thirds-height mobile/tablet sheet
- Property facts, utilities, panorama, aerial video, walkthrough video, and image gallery
- Gallery buttons, keyboard arrow keys, and left/right touch swipes
- Admin workflows for properties, image URLs, utilities, routes, and destinations
- Typed validation for coordinates, prices, required collections, and HTTP(S) media
- Supabase-first repository with automatic JSON/local-storage fallback

The local admin passcode remains `admin`. It is a visible convenience only and is not authentication. Supabase row-level security does not trust it.

## Requirements

- Node.js 20.19+ or 22.12+
- npm 10+
- Internet access for Esri tiles and optional remote media

## Local development

```bash
npm install
copy .env.example .env.local
npm run dev
```

The environment file is optional. Without a filled `.env.local`, the application loads `data/data.json` and persists admin changes in browser `localStorage`.

```bash
npm run typecheck
npm test
npm run build
npm run preview
```

## Supabase setup

1. Create a Supabase project.
2. Run [`supabase/schema.sql`](./supabase/schema.sql) in the SQL editor.
3. Insert a row into `public.app_datasets` with `slug = 'default'` and `payload` equal to the validated structure in [`data/data.json`](./data/data.json), using a trusted dashboard or server-side migration.
4. Copy `.env.example` to `.env.local` and fill in the public project values:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

Never place a service-role key in a `VITE_*` variable; Vite exposes it to the browser. The included policies allow public reads and require authenticated Supabase users for writes. Until an authentication UI is added, failed remote admin writes safely continue in local storage.

## Fallback behavior

- Missing environment variables: JSON/local provider starts immediately.
- Supabase request, schema, row, or validation failure: JSON/local provider is used.
- Remote save failure: the current validated dataset is saved locally.
- Invalid local override: the bundled JSON seed is restored.

Local overrides use `real-estate-map-explorer.data.v6`. Clear site data to restore the bundled seed.

## Media schema

```json
{
  "media": {
    "panoramaUrl": "https://example.com/panorama.jpg",
    "aerialVideoUrl": "https://example.com/aerial.mp4",
    "walkthroughVideoUrl": "https://example.com/walkthrough.mp4",
    "images": [
      "https://example.com/front.jpg",
      "https://example.com/interior.jpg"
    ]
  }
}
```

The admin accepts one image URL per line. Only HTTP(S) URLs survive validation. Remote hosts must permit browser loading or embedding.

## Architecture

The maintained application source is `src/`; `index.html` is the Vite entry point:

```text
src/
├── main.ts                    # Composition and coordination
├── types.ts                   # Domain contracts
├── validation.ts              # Runtime validation and URL sanitation
├── store.ts                   # Mutation boundary and fallback persistence
├── map-controller.ts          # Leaflet rendering and interactions
├── details.ts                 # Public listing details
├── media-viewer.ts            # Panorama, video, and swipe gallery
├── admin.ts                   # Admin forms and pinning workflows
└── repositories/
    ├── factory.ts
    ├── local-repository.ts
    └── supabase-repository.ts
```

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for the design diagram, trust boundaries, fallback sequence, and deployment design.

## Production deployment

Run `npm run build` and deploy `dist/` to a static host. Configure optional Supabase values as build-time environment variables.

Before using real listings, add Supabase Auth and roles, server-side authorization and validation, audit history, backups, an approved media-storage policy, and a data-verification workflow. Do not publish private seller details or unauthorized precise locations.

## Known limitations

- Routes are straight reference lines, not road-network directions.
- Boundary measurements are geodesic estimates, not surveyed values.
- The initial Supabase table stores one JSON document. Normalize it when server-side queries, concurrent editing, or per-record auditing are needed.
- Pannellum remains loaded from its official CDN; Leaflet and Supabase are bundled by Vite.

See [`AGENTS.md`](./AGENTS.md) for contribution rules.
