# Open Lot Plans

A Next.js App Router + TypeScript application for an open-data Philippine land marketplace: lot plans and open areas for development offered for sale on a satellite map and searchable by official PSA / NAMRIA region, province, and city. Sellers (owners, brokers, developers) manage and group their lot listings, buyers rate sellers, and staff review listings and handle reports.

> Bundled listings, providers, reviews, boundaries, prices, routes, availability, contact details, and media are fictional and unverified. Boundary dimensions are geodesic estimates, not surveys. Administrative outlines are simplified and are not legal boundaries. The role system is a local demo, not authentication.

## What is in the product

| Route | Who it is for | What it does |
| --- | --- | --- |
| `/` | Everyone | Brand and positioning, area search, a static region map for finding land, suggested listings, and top providers |
| `/explore` | Buyers | Satellite map by default, with a switch to the lot-plan index. Marker clicks open a compact preview without moving the map, and the side results follow the visible map area. Filter by region, province, city, price, status, and keyword. Sort by recommended, newest, or price. Each card has **Share** and **Report** |
| `/list-property` | Clients and staff | Focused split workspace with the map and approximate lot-boundary drawing on the left and the validated land listing form on the right |
| `/become-a-provider` | Owners, brokers, and developers | Positions the provider as the expert and links to profile setup and listing creation |
| `/property/[id]` | Buyers | Lot-plan imagery, lot size, intended land use, terrain, road access, seller and rating, official area, media, mini map, share and report. Opening a lot shows immediate loading progress |
| `/providers`, `/providers/[id]` | Buyers | Providers ordered by rating; a profile can show an interactive illustrative masterplan, highlighted listings, listing groups, and reviews |
| `/dashboard` | Clients | Provider portal with a left navigation rail, listing status, group and highlight controls, public profile editing, and listing creation |
| `/staff` | Admin and employees | Review queue, reported listings and flagged reviews, assisted-listing cases, suspended listings, providers, activity log |

### How ranking works

“Recommended” and “Suggested” order listings by the provider's review rating. Every provider starts from a neutral 3.5 with the weight of three reviews, so a single 5-star review cannot outrank a provider with many strong reviews. Highlighted and staff-reviewed listings get a small boost; reserved and sold listings drop. Flagged and removed reviews do not count. The logic is in `src/lib/listings.ts` and covered by `tests/listings.test.ts`.

### Official area search

`public/data/boundaries/` holds a simplified copy of the PSA / NAMRIA administrative boundaries (17 regions, 88 provinces, 1,642 cities and municipalities, about 4 MB). The homepage uses a separate lightweight region layer that keeps only the region code and name. A listing's region, province, and city are found from its map pins when it is created. Selecting an area filters the list and the markers and draws the outline on the map. Rebuild with:

```bash
scripts/build-boundaries.sh /path/to/boundary-shapefiles   # needs GDAL and Node 22+
```

The source shapefiles are about 1.6 GB and are not in the repository. A literal 1 m simplification still leaves about 80 MB per layer, so the web copy uses about 110 m for cities and 330 m for provinces. Points that fall in a simplification gap use the nearest outline within 15 km and are marked approximate.

To load the boundaries into Postgres (local or hosted Supabase), apply `supabase/migrations/20261115000000_create_admin_boundaries.sql`, then:

```bash
SUPABASE_DB_URL='postgresql://...' scripts/load-boundaries-db.sh /path/to/boundary-shapefiles
```

This creates `admin_regions`, `admin_provinces`, `admin_cities` and the `locate_admin_area(lat, lng)` function. The app does not call the database function yet; it reads the static files.

### Roles (local demo only)

| Role | How to enter | Can do |
| --- | --- | --- |
| Client | `/dashboard`, pick or create a provider profile | Manage that provider's listings, groups, and profile |
| Employee | `/staff`, passcode `staff` | Mark listings reviewed, suspend listings, dismiss reports, keep or remove flagged reviews, manage assisted cases, add providers |
| Administrator | `/staff`, passcode `admin` | Everything above, plus restore or delete suspended listings, mark providers staff reviewed, view the activity log |

The passcodes are public and stored in session storage. They protect nothing. Reports, assisted cases, and the activity log are kept in the browser's local storage, so staff see only flags raised on the same device. New listings are public immediately and labeled “not yet reviewed by staff”; “Staff reviewed” means a staff member looked at the listing, not that ownership, price, or boundaries were verified. Real use needs Supabase Auth, per-user ownership, and server-side authorization (see the upgrade backlog in `AGENTS.md`).

### Search engine optimization

Listing and provider pages server-render from the seed and are statically generated, so crawlers and answer engines (AEO / GEO) see full content without running scripts. Each public page sets a canonical URL and Open Graph tags, and carries schema.org JSON-LD: listings emit a `Product` with `Offer`, a `Place` with coordinates and address, the seller `Organization` with its aggregate rating, a breadcrumb trail, and a generated `FAQPage`; providers and the homepage emit matching graphs (`src/lib/seo.ts`, `src/components/seo/json-ld.tsx`). `src/app/sitemap.ts`, `robots.ts`, and `manifest.ts` expose `/sitemap.xml`, `/robots.txt`, and the web manifest. Set `NEXT_PUBLIC_SITE_URL` to the production origin (no trailing slash) so canonical URLs, Open Graph, and the sitemap use the real domain; it defaults to `http://localhost:3000`. Browser-created listings are marked `noindex` since the server cannot render their content.

## Requirements

- Node.js 22+
- npm 10+
- Internet access for Esri tiles and optional remote media

The interface uses the MIT-licensed Phosphor icon family. React surfaces import tree-shakable SVG components from `@phosphor-icons/react`; the imperative MapLibre explorer uses the regular weight from `@phosphor-icons/web`. Both packages are installed by `npm install` and should be updated together with the normal dependency review and verification commands below.

Reusable buttons, loaders, and skeletons use Mantine. Its theme is set in `src/components/ui/app-ui.tsx`, while product colors and motion stay in `src/styles/`. Update `@mantine/core` and `@mantine/hooks` together, then run the full checks below.

The homepage hero uses the generated aerial land image at `public/images/hero-open-lots.webp` under a dark indigo overlay. The explorer shows an animated loading screen until the dataset, area list, and first map render are ready. Property links use the same aerial treatment and progress bar while the lot detail route opens.

Error pages share that hero treatment. `src/components/layout/error-scene.tsx` is the branded surface (large code number, short message, a Back to homepage and an Explore lots action); `app/not-found.tsx` handles unmatched URLs (404), `app/error.tsx` handles runtime errors in a page (500, with Try again), and `app/global-error.tsx` is the self-contained fallback for a root-layout failure.

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
src/
├── app/                      # App Router routes (thin: metadata + composition)
├── components/               # React UI by feature: layout, listings, home, providers,
│                             #   property, dashboard, staff, explorer (markup)
├── hooks/                    # useDataset, useSession, useBoundaryIndex
├── lib/                      # Framework-free logic
│   ├── types.ts, validation.ts, store.ts, listings.ts
│   ├── session.ts, local-records.ts, share.ts, brand.ts, seed.ts
│   ├── geo/boundaries.ts     # point lookup over the boundary files
│   ├── repositories/         # local and Supabase adapters
│   └── supabase/             # typed browser/server clients
├── explorer/                 # Imperative MapLibre explorer (map, workspace, media)
├── styles/                   # tokens.css, components.css, layout.css, site.css
└── proxy.ts                  # Next.js 16 proxy: Supabase session refresh
public/data/data.json         # Fictional seed
public/data/boundaries/       # Generated boundary index
scripts/                      # Boundary build and database load
supabase/                     # Migrations
tests/                        # Vitest suites
.claude/skills/               # Shared agent workflows
```

`@/` resolves to `src/`. `PropertyStore` is the only data mutation boundary: React components reach it through `useDataset()`, the explorer through `src/explorer/main.ts`. The map explorer stays imperative behind one client component because MapLibre needs browser APIs; it attaches once per page load, so links into and out of `/explore` are full navigations.

MapLibre 6 loads `public/maplibre-gl-worker.mjs` from the same origin because Next.js does not reliably emit MapLibre's module worker URL. The file is the unmodified worker distributed with the pinned `maplibre-gl` dependency; refresh it from `node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs` whenever MapLibre is upgraded.

### Working with coding agents

`AGENTS.md` (root and one per major folder) is the single source of instructions for Claude Code, Codex / GPT, and other agents. Each `CLAUDE.md` only imports the `AGENTS.md` beside it. Shared workflows are in `.claude/skills/` (`verify`, `add-feature`, `seed-data`, `boundaries`, `design-review`, `improve`); Claude Code loads them automatically and other agents can read the `SKILL.md` files directly.

## Supabase setup

1. Create or link a Supabase project.
2. Apply `supabase/migrations/20261110000000_create_app_datasets.sql` through the Supabase CLI or SQL editor.
3. Insert a trusted `public.app_datasets` row with `slug = 'default'` and a validated payload shaped like `public/data/data.json`. Update this row whenever `data.json` changes; an older payload still loads, but without providers, groups, reviews, or official areas.
4. Copy `.env.example` to `.env.local` and set:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Find both values in the Supabase dashboard under **Project Settings → API** (or **Settings → API Keys** in the current dashboard). Only the URL and publishable key are browser-visible. The legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` name remains supported for existing deployments. Never use a secret or service-role key in a `NEXT_PUBLIC_*` variable. RLS permits anonymous reads of the default dataset and requires an authenticated Supabase user for writes. The visible local passcodes (`admin`, `staff`) are a UI convenience, not backend authentication; until an auth flow exists, rejected remote writes fall back to local storage.

The app tests the remote dataset during startup and falls back to the validated local sample after six seconds if Supabase is unavailable or incomplete, so a provider issue does not leave the map blocked.

### Google sign-in

1. In Google Auth Platform, create a **Web application** OAuth client. Add the app origin (for example `http://localhost:3000`) under authorized JavaScript origins.
2. In Supabase **Authentication → Providers → Google**, copy the displayed Supabase callback URL into Google's authorized redirect URIs, enter the Google Client ID and Client Secret, and enable the provider.
3. In Supabase **Authentication → URL Configuration**, set the Site URL and add `http://localhost:3000/auth/callback` (plus the production equivalent) to the redirect allow list.

The app uses Supabase's PKCE callback at `/auth/callback` and refreshes cookie sessions through the Next.js 16 proxy. Google-authenticated users satisfy the existing `authenticated` RLS write policies. The documented demo passcodes remain local-only and cannot grant Supabase write access.

### Facebook sign-in

1. Create a Facebook app in the [Meta for Developers dashboard](https://developers.facebook.com/) and add the Facebook Login product.
2. In **Facebook Login → Settings**, add the Supabase callback URL shown under **Supabase Authentication → Providers → Facebook** as a valid OAuth redirect URI. It follows `https://<project-ref>.supabase.co/auth/v1/callback`; local Supabase uses `http://localhost:54321/auth/v1/callback`.
3. Enable both `public_profile` and `email` for the app's authentication use case. Supabase requires the email permission for a complete user identity.
4. Copy the Facebook App ID and App Secret into the Facebook provider settings in Supabase and enable the provider.
5. Keep `http://localhost:3000/auth/callback` and the production callback route in the Supabase redirect allow list.

Facebook apps begin in development mode, where only app administrators, developers, and testers can sign in. Complete Meta's required app details and review steps before enabling Facebook sign-in for the public. The application uses the same Supabase PKCE callback and RLS-backed authenticated role for Google and Facebook; it never exposes the Facebook App Secret to the browser.

For local Supabase development, install the Supabase CLI and run `supabase start`, then `supabase db reset`. Regenerate `src/lib/supabase/database.types.ts` after schema changes when a project is linked.

## Deployment

Run `npm run build` and deploy to a Node-compatible Next.js platform such as Vercel. Configure the public Supabase variables in the deployment environment. `npm start` serves the production build.

Before publishing real inventory, add Supabase Auth and roles, server-side authorization and validation, normalized property tables if query needs justify them, audit history, backups, approved media storage, and a listing-verification workflow.

See `docs/ARCHITECTURE.md` for trust boundaries and fallback behavior.

## Business planning

The commercial plan starts with a supply-first launch in one Philippine province and prioritizes affordable, underrepresented property inventory. These documents are planning artifacts; they do not imply that the current fictional demo data or local admin workflow is ready for real transactions.

- [`docs/BUSINESS_PLAN.md`](docs/BUSINESS_PLAN.md) — market position, customer groups, business model, trust model, and expansion rules
- [`docs/PRICING_AND_OFFERS.md`](docs/PRICING_AND_OFFERS.md) — proposed B2C and B2B packages, launch offers, and pricing validation
- [`docs/GROWTH_ROADMAP.md`](docs/GROWTH_ROADMAP.md) — execution plan from the first user to 100 registered users and later provincial expansion
- [`docs/METRICS_AND_OPERATIONS.md`](docs/METRICS_AND_OPERATIONS.md) — metric definitions, funnel, service standards, data requirements, and operating scorecards
