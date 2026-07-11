# Task 67 Support Gitleaks on trusted post-merge dispatch - Decisions

## Purpose
Record decisions before implementation, including options considered, rationale, and evidence.

## Decisions
- 2026-07-11 - Use Aegis-native current work as the portable workflow authority for this task. Taskmaster and Serena remain optional unless explicitly required.
- 2026-07-11 - Preserve the immutable-SHA-pinned action for `push` and `pull_request`; use the official Gitleaks 8.30.1 Linux x64 CLI only for trusted `repository_dispatch`, pinned by the release's published SHA-256 and scanned against the exact context-resolved commit with full history.
- 2026-07-11 - Fail closed with explicit step-outcome enforcement instead of treating a skipped event-specific scanner as success. No scanner path may execute PR-controlled code, artifacts, packages, or mutable downloads.

## Progress Log
- **2026-07-11 21:58 CEST** - [S:20260711|W:task67-gitleaks-repository-dispatch|H:aegis:kickoff|E:.aegis/state/current-work.json] Decisions log initialized by Aegis kickoff.
- **2026-07-11 21:58 CEST** - [S:20260711|W:task67-gitleaks-repository-dispatch|H:agent:scope|E:docs/ai/work-tracking/active/20260711-task67-gitleaks-repository-dispatch-ACTIVE/FINDINGS.md] Confirmed Task 67 scope: preserve push/pull_request Gitleaks action; add checksum-verified pinned official CLI only for trusted repository_dispatch; tests/evidence only otherwise; no product, package-version, lockfile, runtime, authority, deployment, or secret changes. authority=standing-grant:sota-magazine-2026-autonomy-v2 plus explicit owner workflow-remediation approval.
