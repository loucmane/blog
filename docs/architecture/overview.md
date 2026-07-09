# Architecture Overview

The former animal-foundation, MDX/Git, Express-backend architecture is superseded.

The canonical target architecture is [Owner-Operated CMS-less Magazine Foundation](./cmsless-magazine-foundation.md). It defines an integrated reader and owner application, app-owned PostgreSQL content, versioned structured documents, owner-controlled media originals, and replaceable service adapters.

## Current Repository

- `packages/web` is a stale Next.js prototype with reusable fragments but obsolete product presentation and configuration.
- `packages/ui` contains some reusable design tokens and theme mechanics; its independent package boundary is under review.
- `packages/backend` is a placeholder Express demo and is not the accepted backend.
- `packages/shared` is incomplete and lacks a package manifest.

## Target Direction

- one full-stack web application for public magazine and protected owner workspace;
- app-owned relational content, revisions, scheduling, and audit data;
- versioned editor JSON rendered safely on the server;
- S3-compatible media originals with rebuildable renditions;
- database-backed search first;
- provider adapters for email, analytics, observability, media delivery, and deployment;
- independent backup, restore, export, and re-import verification.

Concrete versions and provider selections remain in [the stack matrix](../research/2026-07-stack-decision-matrix.md) and [ADRs](../decisions/). Risky choices are provisional until their spike gates pass.
