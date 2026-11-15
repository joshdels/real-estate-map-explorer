---
name: verify
description: Run the full verification for this project: typecheck, lint, tests, production build, and a real-browser check of the changed flow. Use before reporting any change as done, or when asked to check that the app works.
---

# Verify a change

Run every step that applies. Report each result plainly, including failures.

## 1. Static checks

```bash
npm run typecheck
npm run lint        # 0 errors required; existing <img> warnings are known
npm test
```

If typecheck reports errors under `.next/`, the cache is stale: delete `.next` and `tsconfig.tsbuildinfo`, then rerun.

## 2. Build (cross-cutting changes)

```bash
npm run build
```

Expect these routes: `/`, `/explore`, `/providers`, `/providers/[id]`, `/property/[id]`, `/dashboard`, `/staff`, `/auth/callback`.

## 3. Browser check over HTTP

```bash
npm run dev          # or: npm run build && npm start
```

Never validate with `file://`. In the browser:

1. Open the changed page at 390 px and 1280 px wide. There must be no horizontal page scroll.
2. Check the console and network panel: no errors, no failed requests.
3. Use the keyboard only for the changed controls: reachable, visible focus, sensible names.
4. Exercise the states the change touches: loading, empty, no results, failure.

Headless Chrome needs software WebGL for the map: `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`.

## 4. Core flows to re-test when shared code changed

- `/` shows recent and suggested listings, and the area search lists regions.
- `/explore?view=map&province=PH04021&city=PH0402119` shows 2 listings, 2 markers, and a dashed outline.
- Report a listing from a card, then `/staff` (passcode `staff`) shows it under Flags; suspending hides the listing from `/explore`, its provider page, and `/property/<id>`.
- Employees cannot restore or delete; `admin` can.
- `/dashboard`: open a provider, change status, group, and highlight; reload and confirm they persisted.
- `/explore?workspace=1&view=map` opens the workspace for the current session.

Local data lives in browser storage. Clear site data to return to the seed.

## 5. Hygiene

- No secrets, database URLs, or private contact details in the diff.
- `README.md` and the nearest `AGENTS.md` match the new behavior.
