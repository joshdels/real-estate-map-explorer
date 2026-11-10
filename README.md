# Real Estate Map Explorer

A Next.js App Router + TypeScript map-first application for exploring clearly labeled fictional property data. Leaflet renders Esri satellite imagery, Supabase is the prepared shared-data provider, and validated JSON/local storage keeps the demo available when Supabase is not configured.

> Bundled listings, boundaries, prices, routes, availability, contact details, and media are fictional and unverified. Boundary dimensions are geodesic estimates, not surveys.

## Requirements

- Node.js 22+
- npm 10+
- Internet access for Esri tiles and optional remote media

## Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

The app runs at `http://localhost:3000`. Supabase variables are optional; without them, the validated seed in `public/data/data.json` is used and admin changes persist in `localStorage`.

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm start
```

## Structure

```text
app/                         # App Router layout, page, loading and error boundaries
components/map-explorer.tsx  # Client boundary and accessible application markup
css/                         # Design tokens and responsive styles
public/data/data.json        # Fictional validated seed data
src/
├── main.ts                  # Client composition only
├── store.ts                 # Mutation and persistence boundary
├── map-controller.ts        # Leaflet rendering and map interaction
├── details.ts               # Public listing details
├── admin.ts                 # Local admin workflows
├── validation.ts            # Runtime validation and URL sanitation
├── lib/supabase/            # Typed browser/server Supabase clients
└── repositories/            # Local and Supabase adapters
supabase/                    # CLI config, migrations, and seed guidance
```

The imperative Leaflet UI remains behind one client component because Leaflet requires browser APIs. Next.js owns metadata, routing, production compilation, and future server/auth boundaries. `PropertyStore` remains the only data mutation boundary.

## Supabase setup

1. Create or link a Supabase project.
2. Apply `supabase/migrations/20261110000000_create_app_datasets.sql` through the Supabase CLI or SQL editor.
3. Insert a trusted `public.app_datasets` row with `slug = 'default'` and a validated payload shaped like `public/data/data.json`.
4. Copy `.env.example` to `.env.local` and set:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
```

Only the URL and anon key are browser-visible. Never use a service-role key in a `NEXT_PUBLIC_*` variable. RLS permits anonymous reads of the default dataset and requires an authenticated Supabase user for writes. The visible local passcode `admin` is a UI convenience, not backend authentication; until an auth flow exists, rejected remote writes fall back to local storage.

For local Supabase development, install the Supabase CLI and run `supabase start`, then `supabase db reset`. Regenerate `src/lib/supabase/database.types.ts` after schema changes when a project is linked.

## Deployment

Run `npm run build` and deploy to a Node-compatible Next.js platform such as Vercel. Configure the public Supabase variables in the deployment environment. `npm start` serves the production build.

Before publishing real inventory, add Supabase Auth and roles, server-side authorization and validation, normalized property tables if query needs justify them, audit history, backups, approved media storage, and a listing-verification workflow.

See `docs/ARCHITECTURE.md` for trust boundaries and fallback behavior.
