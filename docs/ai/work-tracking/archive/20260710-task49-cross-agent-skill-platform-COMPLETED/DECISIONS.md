# Task 49 Build Cross-Agent Skill Platform Skeleton - Decisions

## Purpose
Record decisions before implementation, including options considered, rationale, and evidence.

## Decisions
- 2026-07-10 - Use Aegis-native current work as the portable workflow authority for this task. Taskmaster and Serena remain optional unless explicitly required.
- 2026-07-10 - Use `.claude/skills/` as the canonical skill root and repository-relative `.agents/skills/` symlinks as the Codex view; reject copied or absolute-linked skill bodies.
- 2026-07-10 - Keep catalog and review-map files in JSON-compatible YAML until a separately reviewed parser dependency is justified.
- 2026-07-10 - Enforce deterministic structure, schema, link, and test failures while keeping subjective skill findings advisory throughout initial dogfood.

## Progress Log
- **2026-07-10 14:06 CEST** - [S:20260710|W:task49-cross-agent-skill-platform|H:aegis:kickoff|E:.aegis/state/current-work.json] Decisions log initialized by Aegis kickoff.
- **2026-07-10 14:07 CEST** - [S:20260710|W:task49-cross-agent-skill-platform|H:explicit-owner-instruction:cross-agent-skill-platform:task49-scope|E:docs/ai/work-tracking/active/20260710-task49-cross-agent-skill-platform-ACTIVE/FINDINGS.md] Confirmed Task 49 is limited to the cross-agent platform skeleton, deterministic contracts, validators, relative Codex links, focused tests, CI validation, and advisory evidence plumbing; pilot skill bodies remain in Tasks 50 through 52
