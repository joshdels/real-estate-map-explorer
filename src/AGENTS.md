# AGENTS.md — `src/`

Application source. Adds to the root `AGENTS.md`. Each subfolder has its own rules.

## Layers (imports flow downward only)

```text
app/         routes: metadata, static params, page composition
components/  React UI, grouped by feature
hooks/       React hooks that connect components to lib/
explorer/    imperative MapLibre explorer (attached to components/explorer markup)
lib/         pure TypeScript: types, validation, store, ranking, geo, session
styles/      CSS
```

- `lib/` imports nothing from the other folders and has no React or DOM-framework code.
- `hooks/` and `explorer/` may import `lib/`. `components/` may import `hooks/` and `lib/`. `app/` imports `components/` and `lib/`.
- Never import `app/` from anywhere, and never import `explorer/` from React components except the single lazy `import("@/explorer/main")` in `components/explorer/map-explorer.tsx`.
- Django authentication is called directly from browser clients and stored in HTTP-only cookies.
- Phosphor crosses the React / imperative boundary deliberately: components use `@phosphor-icons/react`, while explorer DOM modules use `phosphorIcon()` and the globally loaded regular webfont. Do not make either layer depend on the other to render an icon.
- User-facing copy uses plain language for buyers and property providers. Avoid technical or agency jargon except in required credits and notices, and avoid em dashes or en dashes in interface text.

## Naming

- Files are kebab-case (`listing-card.tsx`, `use-dataset.ts`). Components are PascalCase exports, hooks start with `use`.
- One feature folder per surface under `components/`. Do not create `utils.ts` or `helpers.ts` catch-alls; name the module after what it does.
