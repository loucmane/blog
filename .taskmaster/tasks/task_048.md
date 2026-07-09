# Task ID: 48

**Title:** Bootstrap Protected CI and Controlled Auto-Merge

**Status:** pending

**Dependencies:** 36

**Priority:** high

**Description:** Establish GitHub Actions CI, protected public main, and a separately reviewed controlled auto-merge path before any package or code modernization.

**Details:**

Depend on Task 36 frozen baseline. Adapt the proven HP-Fetcher CI and auto-merge workflow designs without carrying app-specific paths, secrets, D1 migrations, environment files, lockfile paths, or Vite variables. Bootstrap CI first at committed Node 22 and pnpm 9 using actual baseline-supported root workspace scripts: frozen install, valid typecheck, lint, tests, package/application builds, Taskmaster health/dependency validation, Aegis witness/guard validation, secret scanning, dependency review, and only honestly supported Playwright/accessibility checks. Keep CI permissions contents:read, protect fork PR secrets, publish failure artifacts, and use concurrency cancellation. Deliver workflow CI as its own human-reviewed PR; after merge inspect exact check names and configure main to require PRs, current required checks, conversation resolution, compatible linear history, and block force-push/deletion. Adapt auto-merge separately with contents:write and pull-requests:write only, explicit auto-merge label, workflow_run plus labeled race handling, direct check-run inspection excluding its merge job, squash merge, branch deletion, and a documentation-only canary. Never auto-label or auto-merge workflow/security/secret/deployment/migration/destructive/branch-protection/Aegis-retirement changes.

**Test Strategy:**

No test strategy provided.
