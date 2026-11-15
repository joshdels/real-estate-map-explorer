---
name: add-feature
description: Decide where new code belongs and build a feature in the project conventions (route, component, hook, lib logic, styles, tests). Use when adding a page, a listing field, a filter, a dashboard or staff action, or any new behavior.
---

# Add a feature

## 1. Place the code

| You are adding | Put it in |
| --- | --- |
| A rule, calculation, filter, ranking, permission | `src/lib/` as a pure function, with a test |
| A dataset field | `src/lib/types.ts` + sanitize in `src/lib/validation.ts` + test |
| A data change | A `PropertyStore` method in `src/lib/store.ts` |
| Client wiring to data or browser state | A hook in `src/hooks/use-<thing>.ts` |
| UI for a scrolling page | `src/components/<feature>/` |
| A new URL | `src/app/<route>/page.tsx`, thin, composing a component |
| Map or workspace behavior on `/explore` | `src/explorer/` plus markup ids in `src/components/explorer/map-explorer.tsx` |
| Styles | `src/styles/site.css` (pages) or `components.css` / `layout.css` (explorer), using tokens |

Read the `AGENTS.md` in each folder you touch.

## 2. Build in this order

1. Types and validation, with a test for bad input.
2. Logic in `src/lib`, with tests for the behavior that matters.
3. Store method if data changes.
4. Hook, then component, then route.
5. Styles: mobile first.
6. Empty, loading, and failure states.

## 3. Checks that catch this project's usual mistakes

- Does a suspended listing leak? Use `publicListings()` / `isPublic()` on every public surface.
- Does a client see or edit another provider's listings? Scope by `session.providerId`.
- Is an action staff-only or admin-only? Gate it with `can(session, action)` and add the action to `StaffAction`.
- Did you read `event.target.value` after an `await`? Copy it first.
- Is private information going into the dataset? It is world-readable; keep it out.
- Is a link into or out of `/explore` a plain `<a>`?
- Did the seed shape change? Bump `metadata.version` and `STORAGE_KEY`.

## 4. Finish

Run the `verify` skill. Update `README.md`, the nearest `AGENTS.md`, and remove the item from the upgrade backlog in the root `AGENTS.md` if you delivered one.
