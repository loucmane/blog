# Owner-Operated Editorial Magazine

This repository is being revived as a premium magazine and blog with an app-owned publishing workflow for a nontechnical owner. The owner will create, preview, schedule, publish, revise, and export content from the application—without Git, Markdown files, terminals, hosting consoles, or a traditional external CMS.

## Current Status

The repository now contains a verified Next.js foundation for the reader and future owner workspace. Product capabilities remain intentionally incomplete while the modernization roadmap advances in reversible pull requests.

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

The pnpm workspace contains one product package:

- `packages/web` — the full-stack Next.js application for the public magazine and protected owner workspace. Its Tailwind theme and shadcn-style components are app-local, owned source.

The obsolete standalone UI build, Express placeholder, and incomplete shared package have been removed. New package boundaries require a proven second consumer or an independently deployable runtime.

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
