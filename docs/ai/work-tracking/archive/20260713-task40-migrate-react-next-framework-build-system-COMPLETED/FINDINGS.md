# Task 40 Migrate React Framework and Build System - Findings

## Purpose
Record discoveries, gaps, risks, failed assumptions, and evidence-backed observations for Task 40.

## Findings
- 2026-07-14 - The official npm registry still identifies Next.js `16.2.10`,
  React/React DOM `19.2.7`, `@types/react` `19.2.17`, and
  `@types/react-dom` `19.2.3` as the latest stable releases. Next `16.x` remains
  Active LTS, requires Node `>=20.9.0`, and supports React `^19.0.0`; the
  repository's Node `24.18.0` baseline is compatible. Primary evidence:
  `https://registry.npmjs.org/next/latest`,
  `https://registry.npmjs.org/react/latest`,
  `https://registry.npmjs.org/react-dom/latest`,
  `https://nextjs.org/support-policy`, and
  `https://react.dev/versions`.
- 2026-07-14 - The pre-migration Next `15.5.20` / React `19.1.0` baseline passed
  frozen install, typecheck, lint, 22 unit/integration tests, all package/app
  builds, dependency audit with zero advisories, production HTTP smoke, and four
  desktop/mobile Playwright journeys. Registry access and loopback binding were
  rerun outside the sandbox after deterministic `EPERM` failures; those were
  execution-environment restrictions, not product failures.
- 2026-07-14 - The baseline production server emitted two actionable migration
  warnings: `experimental.typedRoutes` moved to top-level `typedRoutes`, and
  `next start` conflicts with `output: 'standalone'`. Task 40 must remove the
  stale configuration ambiguity and prove one explicit portable Node start path.
- 2026-07-14 - Before this resumed session, an owner-authorized managed Aegis
  rollout installed the current runtime and `.codex/hooks.json` (`3334c040…`).
  The owner confirmed strict verification completed with zero required failures
  and that unrelated source dirt did not contaminate installed assets. The
  rollout is pre-existing infrastructure, not Task 40: preserve it intact,
  leave it unstaged, and keep user-owned `.codex/` untouched and uninspected.
- 2026-07-14 - Next 16's streamed App Router `notFound()` response retains HTTP
  200 once a loading boundary flushes. The stale root and public-story loading
  boundaries were removed so unknown public stories return true HTTP 404s;
  private preview keeps an explicit component-level Suspense boundary after
  authorization, where confidentiality is independently enforced by withheld
  draft content and slug-bound scope.
- 2026-07-14 - Next's production server issued Draft Mode redirects and secure
  cookies for its canonical `localhost` origin. The initial browser harness used
  `127.0.0.1`, so the host-only cookie correctly did not cross the origin
  boundary. Aligning the harness to `localhost` proves the production behavior
  without weakening `Secure`, `HttpOnly`, or `SameSite=none`.
- 2026-07-14 - The UI package's Rollup build reports that it drops module-level
  `use client` directives. The Next application consumes the package's source
  exports through `transpilePackages`, and both Turbopack production build and
  browser behavior pass. Task 41 owns the workspace packaging/design-system
  boundary and should decide whether a distributable client-boundary artifact
  is still required.
- 2026-07-14 - Browserslist reports stale `caniuse-lite` data during build. It
  does not invalidate Task 40 behavior, and updating unrelated transitive data
  would violate the reversible framework-only scope; retain it as Task 41 or
  dependency-maintenance follow-up evidence.
- 2026-07-14 - Standard Aegis verification, capsule/brief, witness, and the
  repository Aegis CI contract pass. Strict verification fails only
  `mutation.pending_tracking_empty` because advisory hooks accumulated 97
  pending events, including read-only commands. Root `AGENTS.md` explicitly
  says advisory work requires no per-mutation reconciliation and forbids
  manually draining advisory pending events as routine ceremony. Task 40 must
  not clear that queue or run generic repair to manufacture a strict pass.
- 2026-07-14 - Closeout dry-run does not require a pristine Git tree, but it
  inherits the same pending-event/strict-verification conflict and therefore
  reports 11 required failures with zero warnings. The remaining evidence
  status failures are downstream of keeping verification honestly in progress;
  no final closeout or Taskmaster done transition was attempted.
- 2026-07-14 - The two pending-event findings above are retained as historical
  dogfood evidence. Stable Aegis source
  `144bd4463dcec9c326b023ff53b45aa71660727e` made a trustworthy
  advisory-only queue non-blocking without deleting it; strict verification and
  final closeout subsequently passed with zero required failures or warnings.
- 2026-07-14 - Independent implementation and adversarial reviews found that
  preview authorization was transported in a query string, Draft Mode was not
  bound to one slug, redirects could trust a hostile Host, publish-state
  invalidation used stale-while-revalidate, malformed slugs could reach
  persistent cache construction, production metadata could fall back to
  localhost, and archived acceptance evidence overstated managed deployment
  proof. The follow-up hardening moves preview authorization to POST, adds a
  five-minute slug-bound HMAC scope, uses the configured canonical origin,
  applies private/no-referrer preview headers, expires publish-state tags
  immediately, bounds cache keys, uses a non-routable production origin sentinel
  until deployment configuration is proved, and adds initial-HTML and byte-budget
  coverage.
- 2026-07-14 - Task 40 now proves static reader HTML and dynamic private-preview
  HTML locally, plus a 150 kB initial-document budget and absence of editor
  runtimes on reader resources. It does not claim production p75 Core Web Vitals
  or a provider-managed preview; those require deployed evidence and remain Task
  46 acceptance gates.
- 2026-07-14 - Exact-head adversarial review found that the first remediation
  still accepted one global preview secret, reused it for the browser scope,
  parsed unbounded form bodies, and used a build-frozen public origin for
  request-time redirects. The final boundary uses a five-minute per-story
  signed token, domain-separated cookie signing, a streamed 2 KiB JSON parser,
  and a server-only runtime origin. Cross-slug replay, oversized declared and
  chunked bodies, hostile Host values, and absent cookies on denial are covered
  by built-server tests. Deployment ingress rate limiting remains a Task 46
  control rather than a misleading process-local substitute.
- 2026-07-14 - Behavior-level testing exposed two framework interactions that
  source assertions missed: invalidating an ISR route with
  `dynamicParams=false` caused `NoFallbackError`, and a route-level loading
  boundary converted unknown-story 404s to streamed 200s. The final design
  permits on-demand regeneration only after the known-story data-cache guard,
  removes broad loading boundaries, proves true public and unauthorized-preview
  404 responses before any streaming boundary, and verifies a changed
  cache-generation marker after immediate tag expiry. The authenticated raw
  stream is bound to the exact preview response cookies so a streamed 404
  fallback cannot masquerade as successful preview streaming.
- 2026-07-14 - Next 16 generates `next-env.d.ts` references to `.next/types`.
  A direct clean-checkout `tsc --noEmit` is therefore not reproducible. The web
  typecheck now runs the documented `next typegen && tsc --noEmit` sequence,
  and the root delegates to that script.
- 2026-07-14 - Final adversarial review identified logout CSRF, an unbounded
  authenticated revalidation body, and missing expiry/cookie regression proof.
  Preview exit now requires browser-supplied same-origin Fetch Metadata plus an
  exact origin when the browser supplies one. Chromium initially emitted
  `Origin: null` because the preview page used `no-referrer`; the final design
  uses `same-origin` referrer policy, rejects explicit opaque origins, and
  retains missing-Origin compatibility only with trusted same-origin Fetch
  Metadata. Revalidation now accepts only bounded 1 KiB JSON, and unit/browser
  tests cover exact token expiry, hardened custom and Next Draft Mode cookie
  flags, hostile cross-site/opaque-origin exit, and oversized authenticated
  revalidation.
- 2026-07-14 - Final security re-review also found that weak or reused runtime
  secrets could fail open. Preview token, preview cookie, and revalidation
  secrets now require 32–512 UTF-8 bytes and must be distinct across purposes;
  invalid configuration returns 503 before enabling Draft Mode or reading an
  authenticated revalidation body.
- 2026-07-14 - Extending the serious/critical Axe scan from the homepage to the
  public story and authenticated preview exposed the story eyebrow's bright
  teal `text-secondary` token at 2.96:1 contrast against the warm background.
  Both labels now use the existing deep-teal `text-primary` token; all 16
  desktop/mobile browser journeys pass with zero serious or critical findings
  across the three surfaces.
- 2026-07-14 - PR #33's first hosted run failed closed before installation
  because Task 38's canonical runtime projections still described the
  pre-migration package scripts, manifests, lockfile, workspace override, and
  accessibility-contract bytes. Task 40 now advances only those exact
  projection values in `config/runtime.json`; checker logic, workflow semantics,
  action pins, and the Node 24.18.0/pnpm 11.11.0/Corepack 0.35.0 contract are
  unchanged. The active runtime contract and all 13 adversarial tests pass.

## Progress Log
- **2026-07-13 16:38 CEST** - [S:20260713|W:task40-migrate-react-next-framework-build-system|H:aegis:kickoff|E:.aegis/state/current-work.json] Findings log initialized by Aegis kickoff.
- **2026-07-14 07:22 CEST** - [S:20260713|W:task40-migrate-react-next-framework-build-system|H:agent:baseline|E:docs/ai/work-tracking/active/20260713-task40-migrate-react-next-framework-build-system-ACTIVE/FINDINGS.md] Revalidated the exact stable Next/React target from primary sources, recorded a green pre-migration baseline and its two framework warnings, and isolated the unrelated managed-runtime update before implementation. authority=standing-grant:sota-magazine-2026-autonomy-v2
- **2026-07-14 08:18 CEST** - [S:20260714|W:task40-migrate-react-next-framework-build-system|H:agent:verification-findings|E:docs/ai/work-tracking/active/20260713-task40-migrate-react-next-framework-build-system-ACTIVE/reports/migrate-react-next-framework-build-system/verification.md] Recorded non-blocking Task 41 packaging and Browserslist follow-ups after green Task 40 behavior verification. authority=standing-grant:sota-magazine-2026-autonomy-v2
- **2026-07-14 08:20 CEST** - [S:20260714|W:task40-migrate-react-next-framework-build-system|H:aegis:closeout-dry-run|E:.aegis/reports/verification-report.json] Recorded the strict-verification/closeout conflict caused solely by advisory pending events; no queue drain, repair, final closeout, or rollout mutation was performed. authority=standing-grant:sota-magazine-2026-autonomy-v2
- **2026-07-14 14:46 CEST** - [S:20260714|W:task40-migrate-react-next-framework-build-system|H:agent:security-review|E:docs/ai/work-tracking/archive/20260713-task40-migrate-react-next-framework-build-system-COMPLETED/reports/migrate-react-next-framework-build-system/verification.md] Recorded and resolved both independent reviewers' actionable correctness and trust-boundary findings; retained provider preview and p75 production metrics as explicit Task 46 gates rather than overstating Task 40 evidence. authority=standing-grant:sota-magazine-2026-autonomy-v2
- **2026-07-14 15:31 CEST** - [S:20260714|W:task40-migrate-react-next-framework-build-system|H:agent:exact-head-remediation|E:tests/e2e/homepage.spec.ts] Closed the second exact-head review findings with per-story preview tokens, bounded streamed parsing, runtime redirect origin separation, clean-checkout type generation, raw streaming proof, and behavior-level cache regeneration; the built browser matrix passed 16/16. authority=standing-grant:sota-magazine-2026-autonomy-v2
- **2026-07-14 16:14 CEST** - [S:20260714|W:task40-migrate-react-next-framework-build-system|H:agent:final-security-remediation|E:packages/web/src/lib/request-security.ts] Closed the final low-severity review findings with same-origin preview-exit enforcement, bounded authenticated revalidation, expiry/cookie assertions, and browser-trace-verified handling of `Origin: null`; 72 unit/integration and 16 built-browser checks pass. authority=standing-grant:sota-magazine-2026-autonomy-v2
- **2026-07-14 16:37 CEST** - [S:20260714|W:task40-migrate-react-next-framework-build-system|H:agent:adversarial-rereview-remediation|E:packages/web/src/lib/request-security.ts] Rejected explicit opaque origins, changed private preview referrers to same-origin-only, enforced strong distinct runtime secrets, asserted both custom and Next Draft Mode cookie flags, and revalidated 72 unit/integration plus 16 built-browser checks. authority=standing-grant:sota-magazine-2026-autonomy-v2
- **2026-07-14 16:42 CEST** - [S:20260714|W:task40-migrate-react-next-framework-build-system|H:agent:accessibility-rereview-remediation|E:tests/e2e/homepage.spec.ts] Expanded Axe coverage to the public story and authenticated preview, fixed the resulting story-label contrast defect, and passed all 16 desktop/mobile journeys with zero serious or critical findings on every scanned surface. authority=standing-grant:sota-magazine-2026-autonomy-v2
- **2026-07-14 16:52 CEST** - [S:20260714|W:task40-migrate-react-next-framework-build-system|H:github:hosted-runtime-contract-remediation|E:config/runtime.json] PR #33's exact-head workspace check exposed stale Task 38 projections; updated only the verified Task 40 canonical digests and Next/PostCSS override, then passed the active Node 24 runtime contract and all 13 adversarial tests. authority=standing-grant:sota-magazine-2026-autonomy-v2

<!-- AEGIS:BEGIN generated-sweh-projection -->
<!-- AEGIS:projection-state {"event_count": 6, "last_event_id": "24f30c91403544fe82fa7df384ee0c3e", "schema": "legacy-shadow-sweh-projection-v1"} -->

## Generated S:W:H:E Projection

_Generated from the passive Aegis ledger. Human-authored content outside this block is preserved._

- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-40-migrate-react-next-framework-build-system H:session E:ledger:2d46fc883f1...] Session began via compact.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-40-migrate-react-next-framework-build-system H:session E:ledger:eafebcf10a0...] Session began via compact.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-40-migrate-react-next-framework-build-system H:session E:ledger:8ac1563216d...] Session began via compact.
- [S:019f417f-980b-79e1-b1f0-46bbc740a7bf W:feat/task-40-migrate-react-next-framework-build-system H:task-truth E:ledger:ebcbe0fe6f9...] Task truth recorded for task truth: changed.
- [S:2026-07-13-001-task40-migrate-react-next-framework-build-system W:task-40-migrate-react-next-framework-build-system H:scope E:ledger:e783a9fd48b...] Scope recorded for 40. Paths: .plan_state/sync.log, .prettierignore, .taskmaster/tasks/task_040.md.
- [S:2026-07-13-001-task40-migrate-react-next-framework-build-system W:task-40-migrate-react-next-framework-build-system H:witness E:ledger:24f30c91403...] Delivery witness PASS recorded at 4f80ab9; report: .aegis/reports/witness-report.json.

<!-- AEGIS:END generated-sweh-projection -->
