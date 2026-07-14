# Task 40 Verification Report

## Scope

This report covers the exact-pinned Next.js 16 and React 19.2 migration, reader/server/preview/cache behavior, and Task 40 delivery contracts. The concurrent owner-authorized managed Aegis rollout is pre-existing infrastructure and is excluded from the Task 40 staging inventory.

## Selected Targets

- Next.js `16.2.10` (Active LTS)
- React and React DOM `19.2.7`
- `@types/react` `19.2.17`
- `@types/react-dom` `19.2.3`
- Next's stable default Turbopack build path
- Generic Node production start through `next start`

Primary-source rationale is recorded in `FINDINGS.md`, `DECISIONS.md`, and `docs/decisions/0005-use-nextjs-16-for-unified-magazine-framework.md`.

## Verification Results

- Two consecutive `pnpm install --frozen-lockfile` runs passed with unchanged root, UI, web, workspace, and lockfile hashes.
- `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build` passed.
- A temporary clean `git archive` reconstruction with no pre-existing `.next` output passed an offline frozen install and the root typecheck; the web script generated route declarations before invoking `tsc`.
- Vitest passed 72 tests across 11 files after exact-head review remediation. The earlier coverage run passed the repository's inherited allowlist and thresholds; its percentages are not represented as Task 40 code coverage.
- Playwright passed 16 of 16 desktop/mobile journeys, including per-story signed preview authorization, cross-slug replay denial, hostile-Host redirect resistance, declared and chunked request-body limits, true HTTP 404 responses before unauthorized preview streaming, exact-cookie-bound raw first-chunk preview streaming, same-origin preview exit with cross-site and opaque-origin denial, custom and Next Draft Mode cookie flags, bounded authenticated revalidation, behaviorally observed cache regeneration, bounded malformed routes, true unknown-story 404s, initial static and dynamic HTML, a 150 kB initial-document budget, reader metadata/images, keyboard operation, and no reader editor resources.
- Accessibility verification reported zero serious or critical Axe violations on the homepage, public story, and authenticated private preview. Expanding the scan beyond the homepage exposed a 2.96:1 contrast defect in the story eyebrow labels; those labels now use the existing deep-teal primary token and the complete desktop/mobile browser matrix passes.
- Generic Node production smoke returned HTTP 200.
- Dependency security audit reported zero advisories; the focused security-hotfix suite passed 7 of 7 assertions.
- Quality contract passed 29 of 29 assertions; auto-merge policy passed 65; workflow contract passed 46; cross-agent skill platform passed 29.
- Taskmaster health passed for 36 tasks, 3 subtasks, and 76 dependency references; full dependency validation reported zero invalid references.
- Aegis capsule/brief check and repository Aegis CI verification passed while enforcement remained advisory.
- Completed-state guard regression passed 5 of 5 tests.
- Independent implementation and adversarial reviews were completed. No critical, high, or medium security finding remains. Preview entry requires a short-lived per-story signed token; browser scope uses a separate signing key; all configured secrets require 32–512 UTF-8 bytes and distinct purposes; unauthenticated bodies are streamed under a 2 KiB limit; preview exit requires same-origin browser Fetch Metadata and rejects explicit opaque origins; authenticated revalidation is bounded to 1 KiB JSON; redirects use a server-only runtime origin; deployment-specific canonical metadata is fixed at build time; publish-state tags expire immediately and demonstrably regenerate cached content; malformed/unknown slugs cannot create persistent data-cache keys; and production metadata cannot fall back to localhost.

## Aegis Delivery Boundary

- The managed Aegis runtime was refreshed through its attended preview/apply workflow to stable source commit `144bd4463dcec9c326b023ff53b45aa71660727e`; the managed rollout remains excluded from Task 40 staging.
- `aegis brief --check` passed, and strict verification passed all 42 checks with zero required failures while enforcement remained advisory. The final run used a read-only temporary clone at manifest-pinned source `144bd4463dcec9c326b023ff53b45aa71660727e` because unrelated dirt in the live upstream checkout temporarily removed an importer; the Blog and upstream worktrees were not changed by that verification source snapshot.
- `mutation.pending_tracking_empty` retained its compatibility identifier but passed because the queue was valid, trusted, advisory-only evidence. No queue drain, generic repair, strict-mode activation, or evidence deletion occurred.
- Deterministic handoff repair added only generated verification-evidence sections and preserved human-authored progress content.
- Final closeout passed with zero required failures and zero warnings, archived the Task 40 work-tracking envelope, and Taskmaster Task 40 was marked done through supported commands.

## Known Non-Blocking Follow-ups

- The UI Rollup build drops module-level `use client` directives. The Next app consumes source exports through `transpilePackages` and passes Turbopack/browser checks; Task 41 owns the long-term workspace package boundary.
- Browserslist reports stale compatibility data. It is unrelated transitive maintenance and is deliberately excluded from Task 40.
- The same-origin CSP retains inline script/style compatibility until a measured nonce or hash strategy can preserve static reader caching.
- Provider-managed preview/deployment proof remains Task 46; Task 40 proves the generic Node fallback locally.
- Production p75 Core Web Vitals remain Task 46 evidence. Task 40 proves initial static/dynamic HTML and a deterministic local document budget; it does not claim deployed p75 measurements.

## Rollback

Revert the Task 40 commits together, or revert the eventual squash commit, to restore the prior Next 15/React 19.1 dependency graph, web configuration, routes, and tests. The managed Aegis rollout is not part of this rollback and must remain untouched.
