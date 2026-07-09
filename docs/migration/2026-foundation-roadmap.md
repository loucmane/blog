# 2026 Magazine Foundation Roadmap

**Status:** Proposed Task 33 execution sequence

**Updated:** 2026-07-09

## Delivery Principles

- Baseline before upgrades.
- One independently reversible concern per implementation PR.
- No dependency upgrade in the planning/architecture PR.
- Stable supported releases only unless separately approved.
- Re-query versions and advisories at execution time.
- Preserve legacy evidence while replacing its authority.
- Explicit human approval before every merge.

## Phase 0: Repo, Task, and Document Truth

**Outcome:** One canonical product definition and an executable planning graph.

- archive the former PRD with a superseded notice;
- publish product vision, owner workflow, content model, quality requirements, architecture, research, ADRs, deployment, recovery, and migration plan;
- classify every legacy Taskmaster task and preserve it under a legacy tag;
- create canonical product tasks and validate dependencies;
- record stale Aegis completed-observation and Taskmaster migration behavior as dogfood evidence without destructive normalization;
- deliver as the first planning/architecture-only draft PR.

**Gate:** documentation links resolve, Taskmaster graph validates, Aegis evidence is useful, diff contains no package or product implementation change.

## Phase 1: Baseline and Update Strategy

**Outcome:** Reproducible evidence of the stale prototype before migration.

- record operating system, Node, Corepack, pnpm, and package metadata;
- run `pnpm install --frozen-lockfile` from the committed lockfile;
- run explicit or existing typecheck, lint, tests, package builds, and production build;
- classify every failure as existing defect, environment issue, missing script, or product regression risk;
- record dependency advisories and duplicate versions without changing them;
- approve exact modernization batch order.

**Gate:** baseline report is committed/reviewed; lockfile and source changes from verification are absent or explained and reverted.

## Phase 2: Content Model and Storage Proof

**Outcome:** Accepted or rejected document/database architecture based on fixtures.

- run editor round-trip and server-render spike;
- run document migration spike;
- run database migration, search, dump, and restore spike;
- finalize content, revision, media, redirect, audit, subscriber, and job schemas;
- update ADRs and Taskmaster from evidence.

**Gate:** lossless export/re-import, safe rendering, unknown-node retention, and independent restore pass.

## Phase 3: Owner Authoring Foundation

**Outcome:** Implementation-ready owner workflow primitives, not the complete workspace.

- prove authentication and account recovery;
- prove autosave, conflict, recovery, and revision promotion;
- prove media original upload, metadata, rendition, and restore;
- prove preview and idempotent immediate/scheduled publication;
- define accessible editor and owner-shell acceptance tests.

**Gate:** high-risk owner workflow spikes pass and production implementation tasks are decomposed.

## Phase 4: Public Magazine Foundation

**Outcome:** Modern reader framework, design system, and representative article path.

- migrate React/Next and remove obsolete product/config assumptions;
- migrate Tailwind and owned shadcn/Base UI components;
- resolve whether the standalone UI package is removed;
- implement representative server-rendered article, layout, typography, responsive media, and metadata fixtures;
- verify no editor bundle on reader routes.

**Gate:** builds, smoke tests, responsive visual review, WCAG checks, and performance budgets pass.

## Phase 5: Publishing and Distribution Foundation

**Outcome:** Portable service boundaries for discovery and operation.

- database search and related-story foundations;
- RSS, sitemap, canonical/redirect, structured data, and social-card foundations;
- app-owned newsletter consent plus email adapter;
- privacy-conscious analytics and Web Vitals;
- server observability and publishing-job visibility.

**Gate:** service outages do not corrupt or block canonical publication; data export and privacy controls pass.

## Phase 6: Production Readiness

**Outcome:** A validated modern foundation ready for owner-publishing feature delivery.

- managed deployment and Node fallback;
- CI, dependency automation, security review, preview/prod separation;
- backup, restore, provider exit, and rollback drills;
- accessibility, responsive, performance, and security assessments;
- cost envelope, alerts, and operational runbooks;
- close Task 33 only after merged evidence and a clear next owner-workflow goal.

**Gate:** all definition-of-done evidence exists and every merge was explicitly approved and synchronized.

## Modernization PR Batches

After the planning PR and baseline report:

1. **Runtime/pnpm/CI:** Node 24, pnpm 11, version files, engines, Corepack, CI skeleton.
2. **TypeScript/lint/format/tests:** TS6, ESLint10, Prettier, Vitest, Testing Library, Playwright/axe scaffolding.
3. **React/framework:** React 19.2, Next 16.2, config cleanup, representative route proof.
4. **Tailwind/design system:** Tailwind4, shadcn/Base UI, visual/accessibility parity.
5. **Workspace cleanup:** remove placeholder backend/shared/UI boundaries only when replacements and consumers are verified.
6. **Content/persistence foundation:** only after accepted spikes; add database, editor, auth, media, search, scheduling, and service adapters in scoped tasks.

Each batch reruns frozen install, typecheck, lint, tests, package/app builds, relevant Playwright, visual, accessibility, performance, rollback, and clean-status gates.

## Stop Boundaries

- Ask before applying Aegis repair or closeout actions.
- Ask before push/PR if required by the Aegis contract.
- Always stop for explicit human merge approval.
- Stop on unknown dirty work, divergent main, unreviewed secret/generated files, or a failed rollback/restore gate.
- Do not retire Aegis legacy scaffolding during Task 33.
