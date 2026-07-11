# Task 67 Support Gitleaks on trusted post-merge dispatch - Findings

## Purpose
Record discoveries, gaps, risks, failed assumptions, and evidence-backed observations for Task 67.

## Findings
- 2026-07-11 - GitHub run `29165481805` resolved and checked out exact merge SHA `4fc834fc4596a019298cc6a2438c4cb41f4972ae`; workspace and governance passed, while `gitleaks/gitleaks-action` exited before scanning because it does not support `repository_dispatch`.
- 2026-07-11 - The official Gitleaks 8.30.1 release publishes SHA-256 `551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb` for `gitleaks_8.30.1_linux_x64.tar.gz`; the verified CLI supports `gitleaks git --log-opts` and explicit `.gitleaksignore` selection.
- 2026-07-11 - The repository intentionally has `.gitleaksignore` but no `.gitleaks.toml`. A local preflight rejected an initial forced `--config .gitleaks.toml`; the final workflow preserves Gitleaks default-config discovery and binds the tracked ignore file by absolute workspace path.

## Progress Log
- **2026-07-11 21:58 CEST** - [S:20260711|W:task67-gitleaks-repository-dispatch|H:aegis:kickoff|E:.aegis/state/current-work.json] Findings log initialized by Aegis kickoff.
- **2026-07-11 21:58 CEST** - [S:20260711|W:task67-gitleaks-repository-dispatch|H:agent:scope|E:docs/ai/work-tracking/active/20260711-task67-gitleaks-repository-dispatch-ACTIVE/FINDINGS.md] Confirmed Task 67 scope: preserve push/pull_request Gitleaks action; add checksum-verified pinned official CLI only for trusted repository_dispatch; tests/evidence only otherwise; no product, package-version, lockfile, runtime, authority, deployment, or secret changes. authority=standing-grant:sota-magazine-2026-autonomy-v2 plus explicit owner workflow-remediation approval.
