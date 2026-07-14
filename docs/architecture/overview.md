# Architecture Overview

The former animal-foundation, MDX/Git, Express-backend architecture is superseded.

The canonical target architecture is [Owner-Operated CMS-less Magazine Foundation](./cmsless-magazine-foundation.md). It defines an integrated reader and owner application, app-owned PostgreSQL content, versioned structured documents, owner-controlled media originals, and replaceable service adapters.

## Current Repository

- `packages/web` is the single product workspace for the public magazine and protected owner experience.
- The design system is app-local owned source using Tailwind CSS 4 and selected stable Base UI primitives.
- The former standalone UI build, Express placeholder, and incomplete shared package were removed after consumer and replacement verification.
- Product persistence, content workflows, and service adapters remain future roadmap work; removing placeholders does not imply those capabilities exist.

## Target Direction

- one full-stack web application for public magazine and protected owner workspace;
- app-owned relational content, revisions, scheduling, and audit data;
- versioned editor JSON rendered safely on the server;
- S3-compatible media originals with rebuildable renditions;
- database-backed search first;
- provider adapters for email, analytics, observability, media delivery, and deployment;
- independent backup, restore, export, and re-import verification.

Concrete versions and provider selections remain in [the stack matrix](../research/2026-07-stack-decision-matrix.md) and [ADRs](../decisions/). Risky choices are provisional until their spike gates pass.
