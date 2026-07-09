# Owner-Operated Editorial Magazine

This repository is being revived as a premium magazine and blog with an app-owned publishing workflow for a nontechnical owner. The owner will create, preview, schedule, publish, revise, and export content from the application—without Git, Markdown files, terminals, hosting consoles, or a traditional external CMS.

## Current Status

The checked-in application is a stale prototype and is not the target product. Task 33 is establishing canonical product truth, validating architecture, reconciling the delivery roadmap, recording the old baseline, and modernizing the foundation in reversible pull requests.

No legacy animal-foundation, "Mom's Blog," generic demo, or Git/MDX publishing requirement is authoritative.

## Canonical Documents

- [Product requirements](./.taskmaster/docs/prd.txt)
- [Product vision](./docs/product/vision.md)
- [Owner workflow](./docs/product/owner-workflow.md)
- [Content model](./docs/product/content-model.md)
- [Nonfunctional requirements](./docs/product/nonfunctional-requirements.md)
- [Target architecture](./docs/architecture/cmsless-magazine-foundation.md)
- [Stack decision matrix](./docs/research/2026-07-stack-decision-matrix.md)
- [Foundation roadmap](./docs/migration/2026-foundation-roadmap.md)

## Repository Shape

The current pnpm workspace contains:

- `packages/web` — stale Next.js reader prototype; intended to become the public magazine and owner workspace.
- `packages/ui` — small shared theme/component package under review for consolidation into an app-local design system.
- `packages/backend` — placeholder Express API scaffold; not accepted as the target backend.
- `packages/shared` — incomplete shared source without an independent package manifest.

The target architecture and package boundaries are provisional until the documented spikes and pre-upgrade baseline are complete.

## Delivery Rules

- Work uses task-scoped branches and reviewed pull requests.
- Dependency migrations are independently reversible.
- Product checks are not weakened to hide baseline or migration failures.
- Human approval is required before every merge.
- Aegis remains advisory and records machine-readable plus human-readable evidence.

## Documentation

Use [the documentation index](./docs/README.md) to distinguish canonical, provisional, and historical material.

## License

Private repository. All rights reserved.
