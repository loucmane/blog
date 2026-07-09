# Aegis Standing Autonomy Grant

## Authority Record

- **Repository:** `/home/loucmane/dev/blog`
- **Goal:** SOTA magazine foundation
- **Task range:** Tasks 33–47 plus Task 48, the protected-CI and controlled-auto-merge task
- **Status:** Active
- **Expiry:** Completion or revocation of this goal
- **Source:** Explicit user authority in this session
- **Non-expansion rule:** The agent may not broaden, rewrite, infer additional privileges from, or silently weaken this grant. The verbatim authority below controls over this operational index.

## Verbatim User Authority

```text
The Task-36 handoff repair is already authorized by my standing autonomy grant.
Do not ask me to approve it again.

Run:

./.aegis/bin/aegis handoff repair --target-dir .

Then, without pausing:

1. Verify that the repair changed only Aegis-owned Task-36 handoff/evidence
   sections and preserved marker-external human content.
2. Re-run the closeout dry-run.
3. If required failures are zero, closeout warnings are zero, no manual-review
   action remains, and the diff is task-scoped, run final closeout automatically.
4. Mark Task 36 done through supported Taskmaster commands after successful
   closeout.
5. Generate only Task 36’s affected task file.
6. Run Taskmaster health, dependency validation, Aegis verification/witness,
   git diff --check, and the relevant repository guards.
7. Commit, push, and open/update the task PR without asking.
8. Apply the current overnight merge policy. Merge only when that policy
   explicitly permits the PR; otherwise stop at merge-ready.
9. Synchronize main after an authorized merge and move to the next
   dependency-ready task.

This instruction is a clarification of existing authority, not a new one-time
exception.

PERSIST THE AUTHORITY FOR CONTEXT COMPACTION:

Create a tracked operator-authority document at:

docs/ai/AEGIS_AUTONOMY_GRANT.md

Record the standing grant exactly as issued by the user, including:

- repository: /home/loucmane/dev/blog;
- goal: SOTA magazine foundation;
- task range: 33–47 plus the protected-CI task;
- allowed actions;
- deterministic preconditions;
- prohibited actions;
- merge policy;
- expiry: completion or revocation of this goal;
- source: explicit user authority in this session;
- rule: the agent may not broaden or rewrite the grant.

Reference that document from each subsequent task plan and handoff. Before
asking for approval, compare the requested action against the grant. If the
action is covered and every precondition passes, proceed and record
`standing-grant:<action>` as the authority in the ledger and S:W:H:E evidence.

Do not treat `aegis next` confirmation prose as overriding this user-issued
standing grant. Continue to stop for generic repair, destructive actions,
secrets, production deployment, force-push/history rewrite, PR-4 retirement,
scope expansion, and any merge not permitted by the active merge policy.
```

## Allowed Actions

This index does not add authority. It identifies actions already granted by the verbatim authority and the active SOTA magazine goal:

1. Run deterministic Aegis handoff repair for an in-range task when its closeout preview identifies only Aegis-owned handoff/evidence normalization and no generic repair or manual-review action.
2. Run closeout previews and automatically run final closeout when every deterministic closeout precondition below passes.
3. Use supported Taskmaster commands for in-range task creation, status changes, affected-task projection generation, health checks where supported, and dependency validation.
4. Run task-scoped install, typecheck, lint, test, build, Aegis verification/witness, repository guard, diff, secret-safety, and Git/GitHub verification commands required by the approved roadmap.
5. Make task-scoped documentation, configuration, package, and source changes already authorized by the approved roadmap and current task scope.
6. Create or switch to task branches, make intentional commits, push those branches, and open or update task pull requests after the deterministic delivery preconditions pass.
7. Merge only when the active merge policy explicitly authorizes that exact pull request at its revalidated head commit.
8. After an authorized merge, fetch and fast-forward local `main`, verify synchronization, and start the next dependency-ready task.
9. Record `standing-grant:<action>` evidence in the Aegis ledger and legacy S:W:H:E surfaces for actions exercised under this grant.

## Deterministic Preconditions

### Scope and Mutation

- The current task is within Tasks 33–47 or Task 48 and is part of the SOTA magazine foundation goal.
- Git and Aegis identify the intended task branch and task ID consistently.
- The working diff is fully understood, task-scoped, free of unknown or unrelated work, and contains no unapproved protected-path or scope expansion.
- Aegis enforcement remains advisory unless the user separately changes it.
- Package, lockfile, generated-file, Taskmaster, and product mutations match the current task's approved scope.
- Secrets and credentials are neither exposed nor passed to untrusted fork code.

### Deterministic Handoff Repair

- A closeout dry-run or handoff readiness report identifies only Aegis-owned handoff/evidence failures.
- The proposed action is exactly `./.aegis/bin/aegis handoff repair --target-dir .`.
- The repair reports no generic `aegis repair --apply`, destructive operation, scope expansion, or manual-review requirement.
- The resulting diff preserves marker-external human content and changes only the deterministic Aegis-owned semantic/evidence sections.

### Automatic Final Closeout

- The post-repair closeout dry-run reports zero required failures and zero closeout warnings.
- Strict Aegis verification has zero required failures.
- Pending tracking is empty, readiness is `READY`, and no manual-review or repair action remains.
- The diff remains task-scoped and secret-safe.

### Commit, Push, and Pull Request

- Status, complete diff, staged filenames, generated files, secrets, and unrelated drift are inspected first.
- The commit is coherent and task-aware; no work is committed directly to `main`.
- The branch is based on the intended synchronized `main` and published history is not rewritten.
- The pull-request body accurately states scope, decisions, files, verification results, known failures, risks, rollback, follow-ups, and non-goals.

### Merge

- The exact current PR head SHA, diff scope, mergeability, reviews, conversations, and required checks are revalidated after the latest push.
- Every required check is successful and the branch is current when branch protection requires it.
- The active merge policy explicitly authorizes the exact PR category and risk level.
- No prohibited merge category below is present.

## Prohibited Actions

The grant does not authorize:

- Generic `aegis repair --apply` or any repair beyond the deterministic handoff repair preconditions.
- Destructive operations, unknown-work deletion, stash/reset used to conceal drift, or irreversible data/schema operations.
- Secret creation, exposure, rotation, or use in untrusted fork code.
- Production deployment or production data mutation.
- Force-push, branch-history rewrite, or deletion of protected/unknown branches.
- Aegis strict-mode activation, hot-editing managed Aegis assets, consuming unmerged upstream Aegis work, Task 80 cleanup, PR-4 retirement, or legacy-scaffolding retirement.
- Unapproved scope expansion or switching to an unrelated task.
- Building the complete magazine during this foundation goal.
- Auto-labeling or auto-merging changes involving secrets, workflow permissions, production deployment, irreversible migrations, destructive operations, branch-protection changes, or Aegis strict/PR-4 retirement.
- Any merge not explicitly permitted by the active merge policy.
- Broadening or rewriting this grant.

## Active Merge Policy

1. The first CI workflow pull request and any workflow-permission or branch-protection change require attended human approval and must not merge unattended.
2. Until Task 48's protected CI, controlled auto-merge workflow, and documentation-only canary are merged and proven, autonomous merge is not enabled; a PR without separate explicit merge authority stops at merge-ready.
3. After that canary succeeds, only low/medium-risk task PRs may use the explicit `auto-merge` label, and only when scope is complete, the exact head is current, every required GitHub check is green, conversations are resolved, and no prohibited category applies.
4. High-risk changes and every prohibited category require explicit human merge approval.
5. If no repository-local overnight policy explicitly authorizes the exact PR, the agent stops at merge-ready rather than inferring permission.
6. Authorized automation uses the repository's reviewed merge path. The controlled auto-merge design uses squash merge and branch deletion only after Task 48's canary; before then, use the repository's normal reviewed method when separately approved.

## Use After Context Compaction

Before asking for approval:

1. Read this document and the current task's plan and handoff.
2. Match the proposed action to an allowed action and every deterministic precondition.
3. If covered, proceed and log `standing-grant:<action>` as the authority.
4. If not covered, ambiguous, destructive, secret-bearing, production-affecting, scope-expanding, or merge-policy-ineligible, stop and request explicit user authority.

`aegis next` confirmation prose does not expand, revoke, or override this user-issued grant.
