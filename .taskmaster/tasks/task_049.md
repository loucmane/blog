# Task ID: 49

**Title:** Build Cross-Agent Skill Platform Skeleton

**Status:** done

**Dependencies:** 48 ✓

**Priority:** high

**Description:** Establish the project-owned cross-agent skill infrastructure shared by Claude and Codex.

**Details:**

Create .claude/skills as the canonical project skill root and repository-relative .agents/skills symlinks for Codex. Add config/agent-skills/catalog.yaml, review-map.yaml, upstream.lock.json, schemas/agent-skills/review-result.schema.json, deterministic validators under scripts/agent-skills, focused tests under tests/agent-skills, generated evidence under reports/agent-skills, and CI validation. Treat subjective skill findings as advisory, ingest evidence through supported Aegis operations, fail closed on malformed configuration or links, and do not broaden workflow permissions.

**Test Strategy:**

No test strategy provided.
