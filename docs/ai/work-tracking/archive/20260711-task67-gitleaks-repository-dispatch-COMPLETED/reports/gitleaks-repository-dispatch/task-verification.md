# Task 67 Verification

**Branch:** `feat/task-67-gitleaks-repository-dispatch`
**Base:** `main` at `4fc834fc4596a019298cc6a2438c4cb41f4972ae`
**Authority:** `standing-grant:sota-magazine-2026-autonomy-v2` plus explicit
owner approval for the Task 67 workflow remediation

## Scope

- Preserve the immutable-SHA-pinned `gitleaks/gitleaks-action` path for `push`
  and `pull_request`.
- Add a checksum-pinned official Gitleaks CLI path only for the trusted
  `post-controlled-auto-merge-ci` `repository_dispatch` event.
- Add deterministic workflow contracts, Taskmaster Task 67, research/rollback
  documentation, and sanctioned Aegis/legacy evidence.
- No product source, application dependency, package version, lockfile, Aegis
  runtime, authority, deployment, production data, or secret change.

## Root Cause and Remediation

GitHub run `29165481805` verified exact merge commit
`4fc834fc4596a019298cc6a2438c4cb41f4972ae`; workspace and governance passed,
but `gitleaks/gitleaks-action` exited before scanning with
`ERROR: The [repository_dispatch] event is not yet supported`.

The dispatch path now downloads official Gitleaks `8.30.1` for Linux x64 and
verifies embedded SHA-256
`551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb`
before extraction or execution. The CLI verifies `HEAD` equals
`needs.context.outputs.checkout_ref`, scans all fetched history, preserves
default optional `.gitleaks.toml` discovery, and explicitly uses the tracked
`.gitleaksignore`.

## Deterministic Results

| Check | Result |
| --- | --- |
| Focused workflow/context suite | PASS - 46/46, including 9 executable event-outcome cases and 12 adversarial dispatch cases |
| Auto-merge policy suite | PASS - 65/65 |
| actionlint 1.7.12 | PASS for all workflows |
| Cross-agent skill platform | PASS - 4 skills, 4 routes, 5 test files |
| Taskmaster health | PASS - 35 tasks, 3 subtasks, 75 dependency references |
| Taskmaster dependency validation | PASS - no invalid dependencies |
| Aegis strict verification | PASS - 31 checks, 0 required failures, expected advisory-mode warning only |
| Aegis capsule and CI guard | PASS |
| Completed-state guard regressions | PASS - 5/5 |
| Legacy guard baseline | PASS - exact 16-item Task 47 bridge preserved |
| Frozen pnpm install | PASS - lockfile unchanged |
| Typecheck | PASS |
| Dependency security hotfix | PASS |
| Dependency audit | PASS - 0 advisories at every severity |
| Lint | PASS |
| Unit capability contract | PASS - existing `unsupported-tracked` bridge owned by Task 39 |
| Browser capability contract | PASS - existing `unsupported-tracked` bridge owned by Task 39 |
| Workspace build | PASS - backend, UI, and web |
| Production smoke | PASS - HTTP 200 HTML response |
| Official Gitleaks 8.30.1 full-history scan | PASS - 187 commits, approximately 45.14 MB, no leaks |
| `git diff --check` | PASS |

The dependency audit and production smoke initially encountered the existing
sandbox-only `spawnSync pnpm EPERM` and loopback-listener `EPERM` restrictions.
Each passed unchanged with the narrow approved escalation. An initial local CLI
preflight intentionally failed when it forced nonexistent `.gitleaks.toml`;
the final implementation preserves default configuration discovery and its
full-history scan passes.

## Security Assertions

- The workflow remains globally `contents: read`; no permission or secret was
  added.
- The context job must succeed before the secret-scan job can run, and every
  scan checkout uses the exact trusted context output with `fetch-depth: 0` and
  credentials disabled.
- Push and pull-request events retain the existing immutable action pin.
- Repository dispatch alone can install the official CLI; the versioned asset
  is checksum-verified before extraction and version-verified before use.
- No mutable latest URL, container tag, package installation, `curl | sh`, PR
  artifact, or PR-controlled script/binary is executed.
- The dispatch CLI checks the checked-out SHA, scans full fetched history, and
  retains the existing ignore fingerprints.
- A final `always()` enforcement step rejects failed, skipped, mixed, or unknown
  event paths. Executable tests prove the three allowed outcomes and six deny
  cases.
- Malformed or unsupported dispatch context continues to fail in the trusted
  resolver before downstream jobs start.

## Attended Boundary and Post-Merge Canary

Task 67 changes `.github/workflows/ci.yml`, so the pull request must stop at an
attended exact-head squash-merge boundary. After merge, send the real
`post-controlled-auto-merge-ci` dispatch for the exact merge SHA and require
context, workspace, governance, and Gitleaks to pass. A skipped or failed
Gitleaks job is a failed canary and must not receive manual fallback success.

## Rollback

Revert the Task 67 workflow, contract-test, Taskmaster, documentation, and
evidence changes through the normal protected path. This restores the known
unsupported dispatch state; post-merge verification must then remain failed
until a reviewed alternative restores actual Gitleaks execution. Never roll
back by skipping the security job.
