# AGENTS.md — `tests/`

Vitest suites. Adds to the root `AGENTS.md`.

- Run one file while iterating (`npx vitest run tests/listings.test.ts`), then `npm test` before finishing.
- Default environment is jsdom. Files that read from disk (`boundaries.test.ts`) opt into node with `// @vitest-environment node`.
- Import source through the alias: `@/lib/...`.
- Test behavior a user or staff member depends on: ranking order, visibility of suspended listings, permission matrix, validation of hostile input, boundary lookups for known places.
- Build small datasets inline and pass them through `validateDataset()`; use `seedDataset` only to assert properties of the bundled seed.
- A failing test is information. Fix the code or the wrong expectation; never weaken an assertion just to pass.
- UI flows are checked in a real browser (see the `verify` skill); there are no component tests yet.
