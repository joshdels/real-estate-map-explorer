# AGENTS.md

Shared instructions for every coding agent (Claude Code, Codex/GPT, and others). `CLAUDE.md` files only import the `AGENTS.md` beside them, so edit `AGENTS.md` and both tools stay in sync. Each major folder has its own `AGENTS.md` with local rules; read the one nearest the file you are changing.

## Mission

**Open Lot Plans** is an open-data land marketplace for the Philippines. It showcases lot plans and open areas for development that are offered for sale on a satellite map tied to official PSA / NAMRIA boundaries, so buyers can compare land clearly and sellers (owners, brokers, developers) can reach them faster. It does not market houses, condominiums, finished units, or rentals.

Three audiences, each with a clear path:

| Audience | Goal | Surface |
| --- | --- | --- |
| Land buyers | Find a lot or open development area in a known place and understand the available information | `/`, `/explore`, `/property/[id]`, `/providers` |
| Clients (sellers) | List, group, highlight, and sell their lot plans and development land | `/dashboard`, `/list-property` |
| Staff (admin, employee) | Keep listings accurate: review, flags, assisted listings | `/staff` |

All bundled listings, providers, reviews, and prices are fictional samples. Never describe sample data, simplified boundaries, or a "staff reviewed" badge as verified.

## Where things live

```text
src/app/          Next.js App Router routes (thin: metadata + composition)
src/components/   React components, grouped by feature
src/hooks/        React hooks (useDataset, useSession, useBoundaryIndex)
src/lib/          Framework-free domain logic, validation, persistence, geo
src/explorer/     Imperative MapLibre explorer modules (map, workspace, media)
src/styles/       Design tokens and CSS
public/data/      Fictional seed dataset and the simplified boundary index (published as-is; see the seed-data skill)
scripts/          Boundary build and database load scripts
supabase/         Migrations and seed guidance
tests/            Vitest suites
docs/             Architecture and business planning
.claude/skills/   Step-by-step workflows, readable by any agent
```

- `@/` resolves to `src/`. Import with `@/lib/...`, `@/components/...`, `@/hooks/...`.
- `public/data/data.json` is the only seed. `src/lib/brand.ts` is the only place for brand copy.
- `canva.html` (if present) is a generated reference export. Do not edit or rely on it.

## Product priorities

When requirements are incomplete, optimize in this order:

1. Accurate land, lot-plan, and location information.
2. Fast map exploration and understandable filters.
3. Clear comparison between visible properties.
4. Responsive and accessible interaction.
5. Visual polish and animation.

The primary workflow is: choose an area, explore map results, refine filters, select a listing, review its details, contact or share. Preserve that flow when adding features.

## Domain rules

- **Listings** (`Property` in `src/lib/types.ts`): required `id`, `title`, `address`, `coordinates`, `polygon` (3+ points), `area`, `price`, `status`, `utilities`. Optional management fields: `purpose` (sale/rent), `propertyType`, `providerId`, `groupId`, `featured`, `createdAt`, `review`, `assistedBy`, `adminArea`, `media`. `validateDataset()` fills defaults and drops invalid values; never render unvalidated data.
- **Review state**: `pending` and `reviewed` listings are public; `suspended` listings are hidden everywhere (use `isPublic()` / `publicListings()`). New listings publish immediately as `pending`.
- **Providers, groups, reviews** live in the dataset. A listing may only join a group owned by its own provider. Only `published` reviews count toward ratings.
- **Recommended ranking** (`src/lib/listings.ts`) orders by a weighted provider rating that starts every provider at a neutral prior, so one review cannot outrank many. Change it only with a test.
- **Official areas**: `adminArea` comes from `BoundaryService.locate()` using `public/data/boundaries/`. Outlines are simplified; label them as not surveyed and keep the PSA / NAMRIA credit visible.
- **Roles** are a local demo (`src/lib/session.ts`): passcode `admin` = administrator, `staff` = employee, and clients pick a provider profile. This is not authentication. Never store real private data behind it or extend it into a security boundary.
- **Privacy**: the dataset is world-readable. Reports, assisted-listing cases, and the activity log stay in browser storage (`src/lib/local-records.ts`). Never put seller contact details, IDs, or secrets in the dataset, seed, or repo.
- Media URLs are untrusted: HTTP(S) or root-relative only, built with DOM/React APIs, never injected HTML.

## Engineering guidelines

- All dataset mutations go through `PropertyStore`. React code reaches it with `useDataset().mutate`; the explorer receives it in `src/explorer/main.ts`. UI code never writes storage directly.
- Put logic in `src/lib` as pure functions with tests. Components render and call hooks; routes compose components.
- Links *into* `/explore` are plain `<a>` tags and links *out of* it are too: the explorer attaches behavior once per page load and needs a full navigation.
- Handle loading, empty, no-results, partial-data, offline, and provider-error states.
- Preserve map-provider (Esri) and boundary (PSA / NAMRIA) attribution.
- Do not add a dependency without documenting why and how to install, test, and update it.
- Never commit API keys, database URLs, or tokens. Only `NEXT_PUBLIC_*` values may reach the browser.
- Update `README.md` and the nearest `AGENTS.md` when setup, structure, or behavior changes.

## Explorer and workspace behavior

- The header **List your lot** button opens `/list-property`, a dedicated split workspace with the drawing map on the left and the lot listing form on the right. It opens the access dialog first when no session exists.
- The workspace manages properties, utility defaults, routes, destinations, and local reports.
- Boundary pinning requires at least three finite latitude/longitude points before a property can be saved.
- New properties, routes, and destinations appear on the public map without a reload.
- Route lines and destination markers stay hidden until an explicit **Routes** action, and hide again when selection closes or changes.
- **Lot Layout** toggles calculated edge lengths and perimeter. These are geodesic estimates, never surveyed values.
- Persist through the configured repository, falling back to `localStorage` when Supabase is unavailable or rejects a write. Never rewrite `public/data/data.json` from the browser.
- Missing media keeps its action disabled; it must not open an empty viewer.
- Opening a lot detail page shows the shared aerial loading screen and progress bar immediately, including links created by the explorer.

## UX and accessibility

- Mobile-first, then verify wide desktop. No horizontal page scroll at 390 px.
- Every filter, card action, dialog, table control, and map-adjacent control is keyboard operable with a visible focus state and an accessible name.
- Never communicate status by color alone; pair it with text.
- Format money with `formatPrice()` (PHP, rent shown per month) and dates in `Asia/Manila`.
- Respect reduced motion and avoid unnecessary map movement.

### Product language

- Write for buyers, owners, brokers, developers, and staff. Use short, familiar words that explain the benefit or next action.
- Avoid internal, technical, government, and mapping jargon in marketing copy. Say "search by region, province, and city" instead of leading with boundary datasets or agency names. Keep PSA / NAMRIA wording only where the required data credit or accuracy notice appears.
- Avoid em dashes and en dashes in interface copy. Use a full stop, comma, colon, or a new sentence instead.
- Do not use vague headings such as "Kept clean" or system terms such as "flag workflow" when a clear user outcome is available.
- Do not add extra small helper text: no eyebrows, mini captions, sub-labels, or repeated accuracy notes next to a control that does not need one. Keep one accuracy or data notice per surface, not one under every element. When in doubt, remove the extra line rather than add it.

### Visual accent

- Neon yellow `--color-neon` is a controlled highlight, not a second theme. Keep it to roughly 8 to 10 percent or less of a composition.
- Use neon only for small points of emphasis on dark indigo surfaces, such as hero statistics, short indicator lines, or a selected data point. Do not use it for large backgrounds, body text, cards, footer sections, or routine controls.

### Icon system

- Phosphor is the product icon system. React UI imports named icons from `@phosphor-icons/react`; the imperative explorer creates regular-weight icons with `phosphorIcon()` from `src/explorer/dom.ts` and `@phosphor-icons/web/regular`.
- Use regular weight at 18–20 px for ordinary controls, `fill` or `bold` only for selected states, and duotone sparingly for prominent feature or empty-state artwork. Keep one visual weight within a control group.
- Do not introduce emoji, Unicode pictograms, a second icon library, hand-copied SVG paths, or icon fonts from a CDN. Brand marks and third-party logos are separate assets, not substitutes from Phosphor.
- Icons that repeat a visible label are decorative (`aria-hidden="true"`). Icon-only controls require a specific accessible name. Keep text beside unfamiliar actions such as Lot Layout, Drone Aerial, and Routes.

## Verification

For every change, run what applies (the `verify` skill has the full procedure):

1. `npm run typecheck`, `npm run lint`, `npm test`.
2. `npm run build` for cross-cutting changes.
3. Serve over HTTP (`npm run dev`), check the console and failed requests, and exercise the changed flow at mobile and desktop widths with the keyboard.
4. Confirm no credentials, private data, or unlicensed assets were added.

A change is done when the behavior works over HTTP, edge states are handled, accessibility has not regressed, docs match, and tests pass. Report failures plainly; do not claim a check you did not run.

## Skills (shared workflows)

Workflows live in `.claude/skills/<name>/SKILL.md`. Claude Code loads them automatically. Other agents: open the file and follow it.

| Skill | Use it when |
| --- | --- |
| `verify` | Before calling any change done |
| `add-feature` | Deciding where new code belongs |
| `seed-data` | Adding or changing sample listings, providers, or reviews |
| `boundaries` | Rebuilding the boundary index or loading it into Postgres |
| `design-review` | Changing visuals, copy, or brand |
| `improve` | Picking and delivering the next upgrade from the backlog |

## Upgrade backlog

Ordered by value. When you finish one, remove it and note what changed in `README.md`.

1. **Real accounts and roles.** Replace the demo passcodes with Supabase Auth, a `profiles` table with roles, and RLS so clients edit only their own listings and only staff can moderate.
2. **Normalized tables.** Move listings, providers, groups, reviews, reports, and assisted cases out of the single `app_datasets` JSON row into tables with server-side validation.
3. **Server-side reports and moderation.** Reports are per-browser today, so staff only see flags raised on their own device.
4. **PostGIS area lookup.** Use `locate_admin_area()` (migration `20261115000000`) once the boundary tables are loaded, and add barangay level.
5. **Media uploads.** Supabase Storage with size/type checks instead of pasted URLs.
6. **Listing edit form.** Listings can be created, re-grouped, re-statused, and removed, but not edited field by field.
7. **Buyer tools.** Saved listings, side-by-side comparison, and inquiry forms routed to the provider.
8. **Map scale.** Marker clustering and viewport-based loading before the listing count grows.
9. **Sample agent card.** The seed `agent` block looks like a real name and phone number; confirm it is fictional or replace it.

SEO is in place: listing and provider pages server-render from the seed with canonical URLs, Open Graph, and schema.org JSON-LD (`src/lib/seo.ts`, `src/components/seo/json-ld.tsx`), plus `sitemap.ts`, `robots.ts`, and `manifest.ts`. When the normalized tables land, regenerate the sitemap and structured data from the database instead of the seed, and set `NEXT_PUBLIC_SITE_URL` to the production origin.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
