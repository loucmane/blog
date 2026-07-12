# Task ID: 38

**Title:** Modernize Node pnpm and CI Runtime

**Status:** done

**Dependencies:** 36 ✓, 48 ✓

**Priority:** high

**Description:** Migrate the reproducible runtime foundation to the approved Node LTS, pinned pnpm, developer version files, engines, Corepack, and least-privilege CI.

**Details:**

Re-query stable versions and advisories at execution. Use a dedicated reversible PR. Require clean frozen install, CI/local parity, full-SHA action pins, package/app builds, and no unexplained lockfile drift.

**Test Strategy:**

No test strategy provided.
