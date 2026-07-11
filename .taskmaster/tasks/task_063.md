# Task ID: 63

**Title:** Eliminate Critical and High Dependency Vulnerabilities

**Status:** done

**Dependencies:** 36 ✓, 48 ✓

**Priority:** high

**Description:** Remove the current critical and high dependency vulnerability baseline before broad SOTA framework modernization, without suppressing advisories or weakening verification.

**Details:**

Inventory GitHub Dependabot and pnpm audit findings. Upgrade Next.js within major 15 to a patched release with matching Next lint packages. Refresh or narrowly override vulnerable transitive packages only to documented fixed releases. Add deterministic audit-policy and production-web smoke verification. Preserve Tasks 38, 39, and 40 as the owners of Node/pnpm, full test-tooling, and major framework modernization. Require frozen install, typecheck, lint, package/application builds, targeted security and smoke tests, Taskmaster/Aegis/guard validation, and before/after alert evidence. Do not bulk-update unrelated majors, dismiss advisories, or weaken checks.

**Test Strategy:**

No test strategy provided.
