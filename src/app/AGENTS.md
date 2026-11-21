# AGENTS.md — `src/app/` (routes)

Next.js App Router. Adds to the root and `src/AGENTS.md`. Read `node_modules/next/dist/docs/` before using an API you have not used in this repo: this Next.js version has breaking changes.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Branded homepage: area search, audience paths, recent and suggested listings, top providers |
| `/explore` | Map explorer and listing index (list and map views, filters, share, report) and the listing workspace |
| `/list-property` | Focused split workspace: map boundary drawing beside the property form |
| `/become-a-provider` | Public provider story and onboarding overview with links to profile setup and listing creation |
| `/property/[id]` | Listing detail, with a route-level aerial loading fallback |
| `/providers`, `/providers/[id]` | Provider directory and public profile with groups and reviews |
| `/dashboard` | Provider portal with left navigation for listings, groups, highlights, and the public profile |
| `/staff` | Admin and employee console |

## Rules

- Route files stay thin: `metadata` / `generateMetadata`, `generateStaticParams`, and a component from `@/components`. No data logic, no `"use client"`.
- `params` is a `Promise`; `await` it.
- Server code may read only `@/lib/seed` for metadata and static params. It resolves to an empty dataset in production mode so fictional records cannot enter metadata, JSON-LD, or the sitemap. Live Django API data is loaded in client components through `useDataset()`.
- Pages with scrolling content wrap in `<div className="page-shell">` with `SiteHeader` and `SiteFooter`. Only `/explore` uses the scroll-locked `.app-shell`.
- Mark private surfaces (`/dashboard`, `/staff`) `robots: { index: false }`.
- Link to `/explore` with a plain `<a>`, not `next/link`.
- `layout.tsx` owns the single global `@phosphor-icons/web/regular` import used by imperative explorer controls. Do not add CDN icon stylesheets or load additional Phosphor weights globally without a measured need.
