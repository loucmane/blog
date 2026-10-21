# Quality, Reliability, and Observability Map

Snapshot: blog-0060 starting commit `58989afb2e5d308b9de70f31eabbddf916b4d049`. Read the files
at the reviewed revision. This map records configured checks and where CI runs them at the
snapshot; it is not a record of any successful run. When the code disagrees with the map, the
code is the evidence and the map is stale.

## Test Layers And CI Execution

| Layer | Configuration | Scope | CI execution |
| --- | --- | --- | --- |
| Unit and component | Vitest through `vitest.config.ts`: node environment by default, setup in `tests/setup/vitest.ts`, `passWithNoTests: false` | `packages/**/*.{test,spec}.*` except `*.integration.test.ts`; every `.tsx` test starts with `// @vitest-environment jsdom` | Enforced gate: `pnpm test:coverage` in the "Unit and integration tests" step |
| Coverage | `@vitest/coverage-v8` with an explicit `coverage.include` list in `vitest.config.ts` | thresholds of branches 75, functions 80, lines 80, and statements 80 over the listed files only | Enforced gate in the same step; an unlisted file is not measured at all |
| Capability and result contracts | node:test files under `tests/ci/` | `tests/ci/test-capability.test.mjs`, `tests/ci/test-results.test.mjs`, `tests/ci/accessibility-baseline.test.mjs`, and the lint contract | Enforced gate: `pnpm test:quality-contract` in the "Unit and integration tests" step |
| Skill contracts | node:test files under `tests/agent-skills/` | platform validation and each skill's fixture test | Enforced gate: the governance job's "Cross-agent skill platform contracts" step, which runs without a dependency install, so these tests import only Node built-ins |
| PostgreSQL and S3 integration | `corepack pnpm test:content:integration` | `packages/web/scripts/run-content-integration.mjs` starts `packages/web/tests/content/docker-compose.yml`, waits for both S3-compatible `/health` endpoints, and runs `packages/web/src/server/database/postgres.integration.test.ts` with `TASK42_CONTENT_INTEGRATION=1` | Local check, not run by CI: despite its name, the "Unit and integration tests" step runs no Docker suite |
| Shared browser journeys | Playwright through `playwright.config.ts`: desktop-chromium and mobile-chromium projects, `workers: 1`, `forbidOnly` and one retry when `CI` is set, traces and video kept on failure, a production build served with `NODE_ENV=test` | `tests/e2e/*.spec.ts` | Enforced gate: `pnpm test:browser` in the "Playwright and accessibility" step, which runs only after the build, the Chromium install, and the "Accessibility baseline ratchet" step succeed |
| Direction lanes | lane Playwright configs, one per direction, such as `packages/web/src/reader-directions/quiet-monograph/playwright.config.ts` | that folder's `*.e2e.ts` files in one Chromium project named after the direction, on the shared web server | Local check, not run by CI: `corepack pnpm exec playwright test --config packages/web/src/reader-directions/<direction>/playwright.config.ts`; `scripts/ci/check-test-results.mjs` accepts only the shared project inventory, so it cannot validate a lane report |

Static checks run in the same workspace job: `pnpm typecheck`, `pnpm lint` with
`--max-warnings 0` and the jsx-a11y recommended rules on React files, and `pnpm format:check`.
Lint and formatting cover only the paths listed in `package.json`; `tests/agent-skills/` is
outside both.

## CI Gates That Fail Closed

The workspace job in `.github/workflows/ci.yml` runs its check steps with `continue-on-error`
to collect evidence, then the "Enforce workspace results" step fails the job unless every
listed outcome is success. A step skipped because its prerequisite failed is not a success.

| CI step | Commands | Fails when | Does not establish |
| --- | --- | --- | --- |
| Unit and integration tests | `pnpm test:capability unit`, `pnpm test:quality-contract`, `pnpm test:coverage` | a capability requirement is missing; a contract test fails; `scripts/ci/check-test-results.mjs` finds a failed, skipped, or todo result, an empty file, or a critical unit contract that did not pass exactly once; coverage falls below a threshold | the Docker integration suite or any browser behavior |
| Accessibility baseline ratchet | `node scripts/ci/check-accessibility-baseline.mjs` with the trusted base, the bootstrap digest, and the head commit | `scripts/ci/check-accessibility-baseline.mjs` finds an added or rewritten accepted fingerprint, changed metadata, or a changed project inventory | that any page is free of violations; it is an anti-regression check, not an audit |
| Playwright and accessibility | `pnpm test:capability browser`, `pnpm test:browser` | the browser capability is incomplete; any test fails, is skipped, is flaky, or is unexpected; a runner error occurs; a critical journey does not run exactly once per project | the direction lane suites, other browsers, or deployed behavior |
| Production web smoke | `pnpm test:smoke:web` | `scripts/ci/web-production-smoke.mjs` does not receive HTTP 200, `text/html`, at least 512 characters, and a complete html document from `/` | owner sign-in, publication, dependency health, or any deployed revision |
| Enforce workspace results | the outcome loop over every workspace step | any listed outcome other than success | anything about a step it does not list |

`playwright.config.ts` retries once in CI, but the browser result validator requires every
runner attempt to pass and zero flaky tests, so a pass on retry still fails the gate. Both
result validators read the runner's JSON report from `ci-artifacts/`; validate the report of
the same run, never an older file left there.

## Capability Contract

`scripts/ci/check-test-capability.mjs`, declared supported by
`config/ci/verification-capabilities.json`, fails closed when commands, direct dependencies,
configuration, or active representative tests disappear. It pins:

- the browser projects desktop-chromium and mobile-chromium;
- three critical browser journeys in `tests/e2e/homepage.spec.ts`: "serves the reader shell
  and enforces the accessibility baseline", "keeps the theme chooser operable from the
  keyboard", and "preserves forced-colors focus and reduced-motion behavior";
- six critical unit contracts, in the theme menu, framework content, request security,
  security headers, site URL, and color converter tests;
- the denied modifiers fail, fails, fixme, only, runIf, skip, skipIf, and todo, anywhere in
  `packages/` unit tests or `tests/e2e/` browser tests, plus `forbidOnly` under CI.

It also reads the historical Task 39 lifecycle field in `.taskmaster/tasks/tasks.json`; never
update that frozen state to satisfy it. Owner acceptance journeys are not critical journeys,
so the capability and result validators would not notice one being renamed or deleted.

## Owner Acceptance Journeys

Every journey in `tests/e2e/owner-workspace.spec.ts` runs in both browser projects through
the shared config. All but the sign-in journey use the fixture owner session, and axe scans
for serious and critical violations run where noted.

| Journey | What it proves |
| --- | --- |
| keeps sign-in private, understandable, and accessible | the sign-in page answers 200 with private caching and `noindex`, offers a passkey, and has no serious or critical violation |
| supports keyboard-only authoring, reduced motion, and 200-percent-equivalent reflow | keyboard order through title, summary, and body; no horizontal scroll at 640 px; toolbar targets of at least 44 px; reduced motion; axe |
| supports the owner publishing journey, offline recovery, media, and safe lifecycle actions | create, private preview, an image with alt text and credit, an offline edit that saves after reconnecting, publish, unpublish with a reason, schedule and a worker run under an injected clock, cancel, delete and restore, with axe on the story list, the preview, and the final state |
| publishes edits made while an older autosave is still in flight | the newest visible edits become the published revision |
| replays a committed lifecycle action after its response is lost | the retry reuses the same idempotency key and the story ends published |
| preserves unsaved edits before restoring exactly one revision | controls lock during the restore, the unsaved copy stays in history, and exactly two revisions are added |
| preserves both versions when two owner windows conflict | a save from another window surfaces as a conflict, and the owner's copy is saved again on request |
| recovers an unsaved local copy after the owner reloads | a newer local recovery copy is offered after a reload and opens without losing work, with axe |

The worker run uses the `x-magazine-test-now` header against the publication-jobs route under
`packages/web/src/app/api/internal/publication-jobs/`, so scheduling is tested without
waiting on the wall clock.

## Accessibility Automation

| Check | Scope | Class |
| --- | --- | --- |
| `tests/e2e/homepage.spec.ts` | axe with the wcag2a, wcag2aa, wcag21a, wcag21aa, and wcag22aa tags on the reader shell: no critical violation and serious violations exactly equal to the project's baseline; no serious or critical violation on the theme menu, a story, and the private preview; keyboard operation of the theme menu; a 2 px solid focus outline under forced colors with reduced motion | Enforced gate |
| `tests/e2e/accessibility-baseline.json` | accepted serious fingerprints per project, owned by Task 41; both projects are currently empty | Enforced gate through the ratchet |
| `tests/e2e/reader.spec.ts` | no axe violation of any impact on home, article, and section at 390 and 1440 px | Enforced gate |
| `tests/e2e/reader-lab.spec.ts` | no axe violation on the Reader Lab and every registered direction with the lab bar at 390 and 1440 px; keyboard focus on the lab bar | Enforced gate |
| `tests/e2e/owner-workspace.spec.ts` | no serious or critical violation across sign-in, authoring, preview, recovery, and lifecycle states | Enforced gate |
| jsx-a11y recommended rules | static React markup rules in the Lint step | Enforced gate |
| Manual review | screen readers, 200% zoom, text spacing, forced colors, and print, recorded with versions per delivery, as planned in `docs/design/reader-bakeoff/quiet-monograph.md` | Documented contract |

`docs/decisions/0006-typescript-quality-tooling-foundation.md` records that automated results
do not replace manual assessment, and `docs/product/nonfunctional-requirements.md` targets
WCAG 2.2 AA for reader and owner experiences. A scan proves only the pages and states it
reaches.

## Performance Budgets

| Budget | Value | Checked by | Class |
| --- | --- | --- | --- |
| Field Core Web Vitals at the 75th percentile | LCP at most 2.5 s, INP at most 200 ms, CLS at most 0.1 | nothing yet; `docs/product/nonfunctional-requirements.md` states the target and blog-0045.11 plans collection | Documented contract |
| Anonymous story HTML | under 150,000 bytes, with the story text and hero alt in the initial HTML and no editor markup | "delivers the reader story in initial HTML within the foundation byte budget" in `tests/e2e/homepage.spec.ts` | Enforced gate |
| No editor code on reader routes | no tiptap, prosemirror, lexical, or editor resource on a story | `tests/e2e/homepage.spec.ts` | Enforced gate |
| Direction style, inline payload, font, and lead-image bytes | per direction, for example the cinematic lead image at DPR 1 and 2 in `packages/web/src/reader-directions/cinematic-feature/media-budget.test.ts`, the 24 KiB cinematic styles in `packages/web/src/reader-directions/cinematic-feature/layout.test.ts`, the 25,500 B payload in `packages/web/src/reader-directions/expressive-colour/list-pages.test.tsx`, and the font budget in `packages/web/src/reader-directions/quiet-monograph/fonts.test.ts` | Vitest in the unit step | Enforced gate |
| Direction font requests, first-view image bytes, direction story HTML, and layout shift | per direction, from its spec under `docs/design/reader-bakeoff/`, for example in `packages/web/src/reader-directions/quiet-monograph/quiet-monograph.e2e.ts`; cold and warm layout shift in `packages/web/src/reader-directions/cinematic-feature/cinematic-feature.e2e.ts` and `packages/web/src/reader-directions/expressive-colour/expressive-colour.e2e.ts` | the direction's lane config | Local check, not run by CI |
| Lab LCP, CLS, TBT, and Lighthouse scores | proposed per direction, for example lab LCP at most 2.5 s, CLS under 0.01, and TBT at most 200 ms as an INP proxy in `docs/design/reader-bakeoff/quiet-monograph.md` | `scripts/lab-lighthouse.mjs` | Measurement, and a documented contract for the proposed values |

`scripts/lab-lighthouse.mjs`, documented in `scripts/lab-lighthouse.md`, audits home, the
long-table article, and the Interiors section for a signed-in owner in one direction on
simulated mobile against a production build served with `NODE_ENV=test`. It fails when a
route's identity, status, direction, lab bar, or metric is missing, and publishes a new run
folder only after all three routes pass. `packages/web/tests/tooling/lab-lighthouse.test.mjs`
tests the harness through fakes inside the unit suite; it does not measure anything. Scores
are measurements, not enforced budgets. TBT is not INP, the harness collects no field data,
and the signed-in lab bar is part of every audit, so it is not anonymous visitor evidence.

## Observability Today

| Surface | Current state | Status |
| --- | --- | --- |
| Server error logging | `packages/web/src/app/api/media/[id]/route.ts` calls `console.error` and answers 500, never 404, when a visible image cannot be read; `packages/web/tests/reader/media-variant-routes.test.ts` asserts both. It is the only server-side error log in application code under `packages/web/src/` | Enforced gate for that route only |
| Error boundaries | `packages/web/src/app/error.tsx` renders the baseline failure view through `packages/web/src/reader/components/failure-boundary.tsx`, which reports nothing; there is no global error boundary and no instrumentation hook | No reporting |
| Authentication library logging | disabled with `logger: { disabled: true }` in `packages/web/src/server/owner/setup.ts` | Disabled |
| Structured logs, correlation ids, and redaction | none | Planned in blog-0045.12 |
| Error-reporting sink and traces | none; `docs/deployment/target-platform.md` names OpenTelemetry with a configurable exporter and optional Sentry | Documented contract and unresolved quality decision |
| Publishing-job visibility | none for the owner or a maintainer | Planned in blog-0045.12 |
| Field Web Vitals | none | Planned in blog-0045.11 |

`docs/product/nonfunctional-requirements.md` requires structured logs, trace correlation,
health checks, publishing-job visibility, actionable alerts, and service-level indicators for
public availability, owner publishing, scheduled-job delay, media processing, and backup
freshness. None of them exists yet, and telemetry must redact draft content, tokens, email
addresses, and media URLs with credentials.

## Health And Readiness

- `packages/web/src/app/api/` holds auth, internal, media, owner, preview, and revalidate
  routes only. No application health or readiness route exists.
- `packages/web/tests/content/docker-compose.yml` (the disposable integration stack) and
  `packages/web/scripts/lab-trial.compose.yml` (the persistent local trial) declare container
  health checks for local PostgreSQL and S3-compatible services, and
  `packages/web/scripts/run-content-integration.mjs` and `packages/web/scripts/lab-trial.mjs`
  wait for them. That is test and trial readiness, not application health.
- `scripts/ci/web-production-smoke.mjs` starts `next start` with `NODE_ENV=production` on a
  free local port, requests `/`, and writes `ci-artifacts/web-production-smoke.json`. It
  checks no dependency, no owner path, and no deployed revision.

## Planned Surfaces

These rows come from the draft Phase 5 plan in
`docs/planning/phase-5-publishing-distribution.md`, slices S10 and S11, and its decomposition
in `docs/planning/phase-5/decomposition-r2.md`. They describe planned work, not shipped
behavior.

| Status | Path | Owning bead and contract |
| --- | --- | --- |
| Planned | `packages/web/src/app/api/health/route.ts` | blog-0045.12: database, search, email adapter, and job-queue status with a timeout per check, degraded distinct from down, and no secret leakage |
| Planned | `packages/web/src/server/observability/logger.ts` | blog-0045.12: structured JSON with a correlation id from an inbound header or generated per request, carried through dispatcher handlers, and a pure redaction function with its own test table |
| Planned | `packages/web/src/server/observability/jobs.ts` | blog-0045.12: owner-readable job states and a maintainer view with attempts, last error, and next attempt time; a dead letter is never invisible |
| Planned | `packages/web/src/app/api/vitals/route.ts` | blog-0045.11: sampled LCP, INP, and CLS beacons aggregated to the 75th percentile per route pattern per day, never collected on preview or owner routes |

Production hardening, hosted point-in-time recovery, independent encrypted retention,
recurring restore drills, measured recovery objectives, and the rollback rehearsal are
blog-0046.

## Production Verification

- `docs/deployment/target-platform.md` is provisional and blocked on a deployment spike. Its
  sequence: verify a clean commit and frozen install; run typecheck, lint, tests, builds,
  browser smoke, and accessibility checks; back up before a destructive migration; apply
  reviewed migrations with an explicit identity; deploy with immutable revision metadata;
  run health and smoke checks against the exact deployed revision; verify owner sign-in,
  draft access, the public read path, media, the scheduling worker, and telemetry redaction;
  promote traffic only after the gates pass; record deployment and rollback evidence.
- Today only the CI production smoke and the manual smoke check before seeding in
  `docs/deployment/reader-lab-preview.md` exist: deployment protection, `noindex` and private
  caching on application responses, a required owner sign-in, zero pending migrations, and
  function logs inspected without copying secrets. Preview evidence covers that environment
  and its synthetic content only.
- No production deployment exists. Bind any verification to the deployed revision, not to a
  branch name or a pull-request head.

## Backup And Restore Drills

| Evidence | What it establishes | Class |
| --- | --- | --- |
| `packages/web/src/server/content/backup.ts` and `packages/web/src/server/content/backup.test.ts` | standard `pg_dump` and `pg_restore` plans with no credentials in arguments; a restore passes only with an identical canonical fingerprint of data and media and no failed media | Enforced gate |
| `packages/web/src/server/database/postgres.integration.test.ts` | "migrates, rolls back failures, projects search, and restores database plus media" against disposable PostgreSQL and two S3-compatible stores | Local check, not run by CI |
| `docs/deployment/backup-restore.md` | the eleven-step isolated restore drill, failure handling, provider exit, and evidence retention | Documented contract |

A drill record names the backup identity, timestamps, checksums, tool versions, restore
environment, verification results, recovered data age, elapsed restore time, failures, and
follow-up tasks, and never the backup payload. A failed restore is a production-readiness
blocker. The 24-hour RPO and four-hour RTO in `docs/product/nonfunctional-requirements.md`
are provisional until a drill measures them.

## Incident And Rollback Readiness

- `docs/deployment/target-platform.md`: application rollback deploys the last known-good
  immutable revision; backward-incompatible schema changes use expand, migrate, and contract
  so rollback stays possible inside the compatibility window; a failed provider is disabled
  through its adapter; data rollback uses a verified restore or forward repair, never an
  unexamined destructive reset. A rollback rehearsal is listed acceptance evidence.
- `docs/deployment/reader-lab-preview.md`: rollback redeploys the last known-good reviewed
  commit to the Preview branch, which does not undo migrations, seed content, or stored
  objects; teardown needs operator confirmation.
- `packages/web/scripts/migrate.mjs` keeps a checksum ledger with dry-run and apply modes;
  migration design belongs to `content-platform-backend`.
- The operability contract requires runbooks for a failed publish, a failed schedule, a
  database restore, a media restore, a provider outage, credential rotation, and owner
  account recovery. Only the preview procedure and the restore-drill contract exist; the
  other runbooks, the service-level indicators, and the alerts do not.

## Commands

Run only what the active task's execution scope permits. The browser, smoke, integration,
and Lighthouse commands need a host with Chromium, a production build, or Docker.

```sh
corepack pnpm test:capability
corepack pnpm test:quality-contract
corepack pnpm test:coverage
corepack pnpm test:browser
corepack pnpm test:smoke:web
corepack pnpm test:content:integration
corepack pnpm ci:agent-skills
node scripts/ci/check-test-results.mjs unit ci-artifacts/vitest-results.json
node scripts/ci/check-test-results.mjs browser ci-artifacts/playwright-results.json
```

The two result commands validate supplied reports; they do not run Vitest or Playwright.
`tests/agent-skills/quality-reliability-observability.test.mjs` compares this map's browser
projects, critical and owner journeys, coverage thresholds, story HTML budget, CI step names,
and local-check classification with the repository, so update this map in the same change
that moves one of them.
