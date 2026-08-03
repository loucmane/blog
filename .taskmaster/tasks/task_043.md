# Task ID: 43

**Title:** Implement Owner Publishing Foundation

**Status:** in-progress

**Dependencies:** 42 ✓

**Priority:** high

**Description:** Build the protected owner shell and foundational draft, autosave, recovery, revision, preview, media, schedule, publish, update, unpublish, and authentication workflows.

**Details:**

This task establishes owner-operable foundations, not the complete dashboard. Require understandable failure states, accessibility, idempotency, audit, browser smoke coverage, and no normal dependency on developer or hosting tools.

**Test Strategy:**

No test strategy provided.

## Subtasks

### 43.1. Integrate Backend-Connected Design Bakeoff Harness

**Status:** in-progress
**Dependencies:** None

Move the proven Folio, Contact, and Halo owner-publishing bakeoffs from temporary files into a tracked modular design-lab surface backed by the Task 43 owner APIs.

**Details:**

Create a reusable bakeoff registry and fail-closed renderer contract; keep owner lifecycle, persistence, media, publication, and story mapping shared; register Folio, Contact, and Halo as pure visual directions; add focused contract and browser coverage; keep the design lab non-production and exclude package, lockfile, workflow, Aegis runtime, and unrelated product changes.
