# Migration plan: Supabase → Django DRF (VPS) + Postgres

Status: planning. Frontend stays on Vercel/Next.js. Backend moves from Supabase to
a Django REST Framework API on a VPS, with Postgres (later PostGIS) as the database.

## The key constraint

Today everything runs on a **whole-dataset blob** model. `PropertyStore`
(`src/lib/store.ts`) calls `repository.load()` once, mutates in memory, then writes
the *entire* `Dataset` back via `repository.save(this.data)` (store.ts:161). Both the
Supabase and Local repositories just move one JSON blob. This fact shapes the whole
migration: ship fast on the blob contract first, normalize into tables after.

## The seam (why this is contained)

Only two things couple the app to Supabase, and both sit behind interfaces:

- **Data** — everything goes through `DataRepository` (`src/lib/types.ts`):
  `source`, `load(): Promise<Dataset>`, `save(data: Dataset): Promise<void>`.
  Implementations: `SupabaseRepository`, `LocalRepository`. Chosen in
  `src/lib/repositories/factory.ts`.
- **Auth** — `src/explorer/auth.ts` (OAuth Google/Facebook), the session refresh in
  `src/proxy.ts` + `src/lib/supabase/proxy.ts`, and `src/app/auth/callback/route.ts`.

Nothing in the explorer, store, hooks, or components touches Supabase directly, so
Phase 1 is a 1-file add + 1-file edit on the frontend.

---

## Phase 0 — Contract + env

**Contract choice (blob-first):**
- Stage 1: `GET /api/v1/dataset` → `Dataset` JSON, `PUT /api/v1/dataset` ← `Dataset`.
  No frontend logic changes beyond a new repository.
- Stage 2: granular REST (`/listings/`, `/providers/`, …). Requires refactoring
  `PropertyStore` away from "save whole blob". Do it after Stage 1 is live.

**New env var** (replaces the three `NEXT_PUBLIC_SUPABASE_*`):

```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

Keep the Supabase vars until cutover for rollback.

---

## Phase 1 — DRF up + DjangoRepository (blob, no schema yet)

**Backend**
- Model `AppDataset(JSONField payload, updated_at)` — mirrors Supabase
  `app_datasets.payload`.
- View: `GET`/`PUT /api/v1/dataset`. Validate on write by porting the rules in
  `src/lib/validation.ts` (`validateDataset`) to Python — the one piece of logic you
  must duplicate server-side.
- Seed once from `public/data/data.json` via a management command.

**Frontend**
1. New `src/lib/repositories/django-repository.ts` implementing `DataRepository`:

```ts
import type { DataRepository, Dataset } from "@/lib/types";
import { validateDataset } from "@/lib/validation";

export class DjangoRepository implements DataRepository {
  readonly source = "django" as const; // widen DataRepository.source union
  constructor(private api = process.env.NEXT_PUBLIC_API_URL!) {}

  async load(): Promise<Dataset> {
    const res = await fetch(`${this.api}/api/v1/dataset`, { credentials: "include" });
    if (!res.ok) throw new Error(`dataset load failed: ${res.status}`);
    return validateDataset(await res.json());
  }

  async save(data: Dataset): Promise<void> {
    const res = await fetch(`${this.api}/api/v1/dataset`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" }, // + CSRF header if cookie sessions
      body: JSON.stringify(validateDataset(data)),
    });
    if (!res.ok) throw new Error(`dataset save failed: ${res.status}`);
  }
}
```

2. Edit `src/lib/repositories/factory.ts` — when `NEXT_PUBLIC_API_URL` is set, build
   `DjangoRepository`; keep the existing `withTimeout` + `LocalRepository` fallback.
3. Widen `DataRepository.source` in `src/lib/types.ts` from `"supabase" | "local"` to
   include `"django"`.

Everything else is untouched. Ship and verify before touching auth.

---

## Phase 2 — Normalize into Postgres (backlog #2)

**2a. Schema** — one Django model per entity from `src/lib/types.ts`:
`Provider`, `Group` (FK provider), `Listing` (FK provider, FK group; `coordinates`,
`polygon`, `price`, `status`, `review`, `utilities`), `Review` (FK provider),
`Destination`, `Route`, plus a settings/singleton row for `metadata`/`utilities`/`agent`.
Enforce domain rules server-side:
- `review` state machine (`pending`/`reviewed`/`suspended`) + `isPublic` filtering.
- "a listing may only join a group owned by its own provider."
- weighted recommended-ranking prior (keep client-side in `src/lib/listings.ts`, or
  port to DRF; keep its test either way).

**2b. Backfill** — a rerunnable management command reading the Stage-1 payload (or
`public/data/data.json`) and upserting rows by `id`.

**Read/write shape** — recommended: assemble the `Dataset` blob on `GET /dataset`
(least frontend change), use granular `POST/PATCH/DELETE` for writes. Moving all
writes to granular endpoints means refactoring `PropertyStore` so each mutation
(`saveUtilities`, add/suspend/regroup listing, etc.) calls its own endpoint instead of
`save(this.data)` — do that here if at all.

---

## Phase 3 — Replace Supabase Auth (backlog #1)

Heaviest phase; budget most time here.

Coupled today:
- `src/explorer/auth.ts` — `AuthController`, `signInWithOAuth`, `onAuthStateChange`.
- `src/app/auth/callback/route.ts` — OAuth `code` → session cookie.
- `src/proxy.ts` + `src/lib/supabase/proxy.ts` — refresh session cookie per request.
- `src/lib/session.ts` — demo passcode roles (NOT auth; real roles land here).

Swap to:
- `django-allauth` (keeps Google/Facebook) + `dj-rest-auth`, or `simplejwt` for
  email/password.
- Rewrite `AuthController` to call DRF login/logout/`/me`.
- Rewrite callback route to hit DRF OAuth exchange, set an **httpOnly** cookie.
- Rewrite proxy to refresh that cookie against DRF. Keep it **cookie-based** — the
  explorer uses full-page navigation, so SSR must see the session.
- Add a `profiles`/role model (admin/employee/client→provider) + DRF permissions.

---

## Phase 4 — PostGIS area lookup (backlog #4)

Migration `20261115000000` already defines `locate_admin_area()`. On Postgres+PostGIS:
- Enable PostGIS, load boundary tables (the `boundaries` skill covers loading).
- Expose an `adminArea` lookup endpoint; compute it server-side on listing create
  instead of the client `BoundaryService.locate()`. Add barangay level.

---

## Cross-cutting: CORS, cookies, deploy, ops

- Vercel frontend + VPS API are different origins. Prefer **same-site**:
  `yourdomain.com` + `api.yourdomain.com` so cookies/CSRF behave. Otherwise
  `django-cors-headers` + `CORS_ALLOW_CREDENTIALS=True` + `SameSite=None; Secure`.
- CSRF: with cookie sessions, send `X-CSRFToken` from the fetch client, or use a JWT
  in an httpOnly cookie to sidestep it.
- TLS + serving: Caddy (auto-HTTPS) or nginx+certbot → Gunicorn/Uvicorn → Django;
  systemd process manager; **automated Postgres backups** (now your responsibility).
- Media (backlog #5): URLs are untrusted (HTTP(S)/root-relative only). Uploads =
  Django storage + size/type checks; keep the untrusted-URL rule.
- Secrets: only `NEXT_PUBLIC_*` may reach the browser. DB URL, `SECRET_KEY`, OAuth
  secrets stay on the VPS.

## Env var table

| Current (remove at cutover)                        | New                         |
| -------------------------------------------------- | --------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`                          | `NEXT_PUBLIC_API_URL`       |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` / `_ANON_KEY`| (none public; API same-origin) |
| — (VPS)                                             | `DATABASE_URL`, `DJANGO_SECRET_KEY`, `GOOGLE/FACEBOOK_OAUTH_*`, `CORS_ALLOWED_ORIGINS` |

## Cutover & rollback

- Keep `LocalRepository` fallback throughout (outage + offline-dev safety net).
- During Phase 2, keep the Stage-1 blob endpoint alive to flip back if normalized
  writes misbehave.
- Delete `src/lib/supabase/*`, `@supabase/ssr` + `@supabase/supabase-js`, and
  `src/lib/supabase/database.types.ts` only after Phase 3 is verified in production.

## Effort summary

- Phase 1 (data swap): 1 file added + 1 edited on the frontend; DRF blob endpoint.
- Phase 2 (Postgres): schema modeling + backfill — the real DB work.
- Phase 3 (auth): the heavy phase.
- Phase 4 (PostGIS): optional, unlocks accurate area lookup.
