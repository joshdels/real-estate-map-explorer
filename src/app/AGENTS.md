# AGENTS.md — `src/app/` (routes)

Next.js App Router. Adds to the root and `src/AGENTS.md`. Read `node_modules/next/dist/docs/` before using an API you have not used in this repo: this Next.js version has breaking changes.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Branded homepage: area search, audience paths, recent and suggested listings, top providers |
| `/explore` | Map explorer and listing index (list and map views, filters, share, report) and the listing workspace |
| `/list-property` | Focused split workspace: map boundary drawing beside the property form |
| `/become-a-provider` | Public provider story and onboarding overview with links to profile setup and listing creation |
| `/property/[id]` | Listing detail |
| `/providers`, `/providers/[id]` | Provider directory and public profile with groups and reviews |
| `/dashboard` | Client dashboard: listings, groups, highlights, profile |
| `/staff` | Admin and employee console |
| `/auth/callback` | Supabase OAuth callback |

## Rules

- Route files stay thin: `metadata` / `generateMetadata`, `generateStaticParams`, and a component from `@/components`. No data logic, no `"use client"`.
- `params` is a `Promise`; `await` it.
- Server code may read only the bundled seed (`@/lib/seed`) for metadata and static params. Live data (Supabase or browser storage) is loaded in client components through `useDataset()`, so a listing created in the browser still renders.
- Pages with scrolling content wrap in `<div className="page-shell">` with `SiteHeader` and `SiteFooter`. Only `/explore` uses the scroll-locked `.app-shell`.
- Mark private surfaces (`/dashboard`, `/staff`) `robots: { index: false }`.
- Link to `/explore` with a plain `<a>`, not `next/link`.
- `layout.tsx` owns the single global `@phosphor-icons/web/regular` import used by imperative explorer controls. Do not add CDN icon stylesheets or load additional Phosphor weights globally without a measured need.
