# Aegis Standing Autonomy Grant

## Grant Metadata

- **grant_id:** `sota-magazine-2026-autonomy-v2`
- **repository:** `/home/loucmane/dev/blog`
- **repository remote:** `git@github.com:loucmane/blog.git`
- **issued_by:** project owner
- **authority source:** explicit user instruction in this session
- **goal:** SOTA magazine product and supporting engineering platform
- **task scope:** every Taskmaster-backed task in this repository that satisfies the deterministic scope and risk policy below
- **branch scope:** `main` plus `feat/task-*` branches in this repository
- **issued_at:** `2026-07-09T22:31:25Z`; project-wide merge amendment issued `2026-07-11`
- **status:** active until an expiration condition fires

## Expiration

The grant expires immediately when any one of these conditions becomes true:

1. The SOTA magazine product goal is explicitly marked complete.
2. The project owner explicitly revokes the grant.
3. The repository identity or configured `origin` remote changes from the values above.

Expiration restores normal confirmation requirements. The agent may not renew the grant.

## Integrity and Interpretation

- The agent may not broaden, renew, reinterpret, rewrite, or remove this grant without a new explicit project-owner instruction.
- Uncertainty defaults to the safer action class. An ambiguous action is not authorized.
- The SHA-256 digest of this exact document is recorded in the append-only Aegis ledger. Any file-content or digest mismatch invalidates the grant and restores confirmation requirements.
- This tracked Markdown document is an immediate compatibility bridge. It is not independently tamper-proof and must not be represented as equivalent to a native Aegis authorization mechanism.
- The verbatim authority below controls over summaries. No operational index in this document adds authority.

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

## 2026-07-11 Project-Wide Merge Amendment

The project owner explicitly replaced attended-by-default task merges with an
evidence-authorized project workflow:

> "just change that rule. I dont want that to be a rule."
>
> "we should make sure that everything is tested before its merged. the
> approval should be in that its proven to work correctly and SOTA"

This amendment authorizes automatic squash merge for every ordinary,
Taskmaster-backed, same-repository pull request when the trusted default-branch
policy classifies the exact head as eligible and every required deterministic
check passes. It authorizes continuing to the next dependency-ready task after
the merge. It does not authorize any prohibited action or exceptional risk
category listed below.

## Allowed Actions

This index identifies actions granted by the original authority and the
2026-07-11 project-wide merge amendment:

1. Run deterministic Aegis handoff repair for an in-scope task when its closeout preview identifies only Aegis-owned handoff/evidence normalization and no generic repair or manual-review action.
2. Run closeout previews and automatically run final closeout when every deterministic closeout precondition below passes.
3. Use supported Taskmaster commands for in-scope task creation, status changes, affected-task projection generation, health checks where supported, and dependency validation.
4. Run task-scoped install, typecheck, lint, test, build, Aegis verification/witness, repository guard, diff, secret-safety, and Git/GitHub verification commands required by the approved roadmap.
5. Make task-scoped documentation, configuration, package, and source changes already authorized by the approved roadmap and current task scope.
6. Create or switch to task branches, make intentional commits, push those branches, and open or update task pull requests after the deterministic delivery preconditions pass.
7. Automatically squash-merge an ordinary task pull request when the trusted active merge policy explicitly authorizes its revalidated exact head; no separate merge prompt or positive opt-in label is required.
8. After an authorized merge, fetch and fast-forward local `main`, verify synchronization, and start the next dependency-ready task.
9. Record `standing-grant:<action>` evidence in the Aegis ledger and legacy S:W:H:E surfaces for actions exercised under this grant.

## Deterministic Preconditions

### Scope and Mutation

- The current task exists in Taskmaster, is dependency-ready or an explicitly approved recovery task, and its implementation remains within that task's recorded scope.
- The repository path is `/home/loucmane/dev/blog`, `origin` is `git@github.com:loucmane/blog.git`, and the grant digest matches the append-only ledger record.
- The current branch is `main` or a `feat/task-*` branch in this repository, and any mutation occurs only on the intended task branch rather than directly on `main`.
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

## Prohibited Actions and Mandatory Confirmation Boundaries

The grant does not authorize:

- Generic `aegis repair --apply` or any repair beyond the deterministic handoff repair preconditions.
- Destructive operations, unknown-work deletion, stash/reset used to conceal drift, or irreversible data/schema operations.
- Secret creation, exposure, rotation, or use in untrusted fork code.
- Production deployment or production data mutation.
- Force-push, branch-history rewrite, or deletion of protected/unknown branches.
- Aegis strict-mode activation, hot-editing managed Aegis assets, consuming unmerged upstream Aegis work, Task 80 cleanup, PR-4 retirement, or legacy-scaffolding retirement.
- Unapproved scope expansion or switching to an unrelated task.
- Building the complete magazine during this foundation goal.
- Auto-merging changes involving secrets, workflow or merge-policy permissions, production deployment or data, irreversible migrations, destructive operations, branch-protection changes, operator authority, Aegis enforcement/retirement, agent hooks/settings/entry points, or history rewriting.
- Any merge not explicitly permitted by the active merge policy.
- Editing, broadening, renewing, reinterpreting, or removing this grant without a new explicit project-owner instruction.

## Active Merge Policy

1. Every same-repository, non-draft task pull request is evaluated automatically after CI completes; an `auto-merge` label is not required.
2. Automatic merge requires a complete file inventory, unchanged exact head, current base, CLEAN GitHub mergeability, no deny label, no prohibited path/risk category, all exact required checks from the trusted GitHub Actions app, final policy/check revalidation, and any applicable real test capability declared `supported` by trusted main.
3. Documentation, planning/evidence, tested domain-skill, and other non-behavioral task changes may merge when their applicable deterministic suites pass.
4. Behavior-changing product and dependency changes may merge only when the trusted capability contract proves the applicable unit/integration/browser suites are real and supported. An unsupported test bridge is evidence of a gap, never evidence of correctness.
5. Changed package manifests are eligible only when the privileged trusted policy confirms their scripts are byte-for-byte semantically unchanged from protected `main`; verification-script changes remain attended.
6. `manual-merge`, `high-risk`, and the prohibited labels/categories are explicit opt-outs and require attended approval.
7. Changes to this merge policy/workflow are bootstrap-governance changes and require the project owner's explicit instruction. The 2026-07-11 amendment is that instruction for Task 61.
8. Authorized automation uses squash merge through the normal protected path, exact-head matching, and deletion only of the merged task branch. After merge, synchronize `main` and continue to the next dependency-ready task without another prompt.

## Grant Reload and Approval Procedure

Before every approval request, and after context compaction, session resume, or subagent return:

1. Re-read root `AGENTS.md`.
2. Re-read this grant document.
3. Verify the repository path and `origin` remote against the grant metadata.
4. Verify the current task and branch are in scope.
5. Verify no expiration condition has fired.
6. Recompute this document's SHA-256 digest and compare it with the append-only ledger record.
7. Classify the proposed action against the allowed actions and mandatory confirmation boundaries.
8. Proceed automatically when the action is covered and every deterministic precondition passes, recording `authority=standing-grant:sota-magazine-2026-autonomy-v2` in the relevant session, tracker, handoff, and ledger evidence.
9. Ask only when the action is prohibited, out of scope, expired, ambiguous, or a deterministic precondition fails.

Perform this reload before interpreting `aegis next` confirmation guidance. Aegis confirmation prose does not create a new approval requirement for an action already covered by the valid grant, and it does not expand, revoke, or override this user-issued authority.

## Continuity References

- The active task plan and handoff must reference this document and `authority=standing-grant:sota-magazine-2026-autonomy-v2` without duplicating the policy.
- Each subsequently created or updated Taskmaster-backed plan and handoff must carry the same concise reference.
- The morning continuation report must carry the same concise reference and require the grant reload procedure before workflow decisions.

## Security Limitation and Future CI Guard

The tracked grant persists authority context but cannot protect itself independently. Its safeguards are the explicit no-edit rule, the append-only ledger digest, future protected CI, and invalidation on mismatch.

A future CI guard must require all of the following when `docs/ai/AEGIS_AUTONOMY_GRANT.md` changes:

- an `authority-change` label;
- an explicit human approval event;
- a newly recorded grant digest;
- no automatic merge.

## Proper Upstream Aegis Solution

The durable implementation must replace this Markdown source of authority with native commands such as:

```text
aegis authorize create
aegis authorize status
aegis authorize revoke
aegis authorize audit
```

The native grant should live outside the worktree, keyed by repository identity, and be injected into `aegis next`, PreToolUse decisions, repair classification, closeout, delivery synchronization, capsule compilation, session start/resume, and subagent identity/delegation. Until that exists on stable upstream Aegis, this tracked grant plus the root `AGENTS.md` discovery reference is only a compatibility bridge.
