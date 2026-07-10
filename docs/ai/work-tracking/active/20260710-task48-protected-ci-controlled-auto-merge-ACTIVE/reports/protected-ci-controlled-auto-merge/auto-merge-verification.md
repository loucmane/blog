# Task 48 Controlled Auto-Merge Verification

**Branch:** `feat/task-48-controlled-auto-merge`
**Base:** `origin/main` at `4a6f03e954a19e73a2f6c7514815dc4dea50f65a`
**Authority:** `standing-grant:sota-magazine-2026-autonomy-v1`

## Local Results

| Gate | Result | Evidence |
| --- | --- | --- |
| Protected main | Passed | GitHub API read-back: pull requests required, zero approvals, strict exact checks, resolved conversations, linear history, administrators enforced, force pushes/deletion disabled. |
| Focused policy tests | Passed | `pnpm ci:auto-merge-policy`: all original 26 tests plus 5 trust-boundary regressions passed (20 policy and 11 workflow tests). |
| Privileged trust boundary | Passed | The label path is exclusively `pull_request_target:labeled`; one checkout targets `${{ github.event.repository.default_branch }}` under `trusted`; no pull-request ref, artifact, package command, secret, or untrusted script is fetched or executed. |
| Workflow syntax | Passed | actionlint `v1.7.12` for `.github/workflows/ci.yml` and `.github/workflows/auto-merge.yml`. |
| Live check-run payload | Passed | PR #9's real paginated check-run response evaluated `allow` for all four exact checks from `github-actions`. |
| Frozen install | Passed with environment warning | `pnpm install --frozen-lockfile` exited zero and left `pnpm-lock.yaml` SHA-256 unchanged; sandbox DNS prevented only pnpm's optional registry metadata request. |
| Typecheck | Passed | `pnpm typecheck`. |
| Lint | Passed | `pnpm lint`. |
| Unit/integration capability | Unsupported-tracked | `pnpm test:capability unit`; Task 39 owns the missing real suite. |
| Browser/accessibility capability | Unsupported-tracked | `pnpm test:capability browser`; Task 39 owns the missing real suite. |
| Package and application builds | Passed | `pnpm build`. |
| Taskmaster health | Passed | `pnpm ci:taskmaster`: 16 tasks, 22 dependencies, no errors. |
| Taskmaster dependency validation | Passed | `task-master validate-dependencies --tag master`; only the known incidental notice toggle was restored. |
| Aegis capsule | Passed | `pnpm ci:aegis`. |
| Strict Aegis verification | Passed | 31 checks, zero required failures; advisory enforcement remains unchanged. |
| Aegis witness | Passed, final-head rerun pending | CI-mode witness passed for the corrected working diff at pre-correction HEAD `792a3a0`; it must be rerun after the correction commit to bind evidence to the new exact head. |
| Repository guards | Passed | `pnpm ci:guard` accepted the exact 16-path Task-47 legacy contract; raw `codex-guard validate --include-untracked` passed after supported plan sync and generated-artifact cleanup. |
| Secret scan | Passed | Gitleaks `v8.30.1` found no leak in the exact `origin/main` task diff and no leak across 142 commits. |
| Hosted required checks | Pending refresh | PR #10's checks must rerun against the corrected exact head after push. |

## Mandatory Hosted Boundary

This pull request changes workflow permissions and cannot merge unattended. After all hosted checks and review-thread inspection pass, stop for explicit owner approval at the exact current head. Protected linear history requires the proposed merge method to be squash.

## Canary Boundary

Task 48 remains open after this pull request. The workflow must be merged with separate approval and then proven on a new documentation-only pull request carrying a manually applied `auto-merge` label.
