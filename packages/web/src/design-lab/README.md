# Design Lab Direction Contract

The design lab keeps one authenticated owner-publishing lifecycle behind multiple visual
directions. Direction renderers receive typed story state and typed owner actions; they do
not fetch, persist, authenticate, or invent publication state.

## Add A Direction

1. Add one renderer module under `directions/` with `desk`, `write`, and `reader` components,
   or use the archive-direction adapter for a previously approved visual system.
2. Render only the provided `DesignLabStory` and call only the provided `DesignLabActions`.
3. Register the module once in `registry.ts` with complete direction metadata.
4. Run the design-lab contract tests and the backend-connected browser journey.

The registry generates the grouped direction picker automatically. A new direction does not
need new API routes, persistence logic, publication logic, or test credentials. Fourteen
directions currently share the same protected story lifecycle:

- Round 1: Blue Pencil, Light Table, Edition Zero, Margin Studio, and Pressroom.
- Round 2: Galley 27, Aperture, and Live Issue.
- Round 3: Mercury, Cutline, and Edition OS.
- Round 4 finalists: Folio, Contact, and Halo.

## Boundaries

- `owner-api-client.ts` is the only browser transport adapter.
- `story-document.ts` is the only persisted-document mapping layer.
- `design-lab.tsx` owns lifecycle orchestration, autosave serialization, dialogs, and owner
  feedback.
- `directions/` owns visual composition only.
- `contract.ts` rejects incomplete metadata, missing views, invalid identifiers, and duplicate
  registrations.
- `/owner/design-lab` requires an owner session and is excluded from indexing.

## Verification

```bash
pnpm exec vitest run packages/web/src/design-lab/contract.test.ts \
  packages/web/src/design-lab/story-document.test.ts
PLAYWRIGHT_PORT=3112 pnpm exec playwright test tests/e2e/design-lab.spec.ts
```

`PLAYWRIGHT_PORT` is optional; the default remains `3100`. The override supports concurrent
isolated worktrees without stopping another local Next server.
