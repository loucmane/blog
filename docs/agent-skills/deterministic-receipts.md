# Deterministic check receipts

A blocking skill finding needs a receipt from a registered check with a completed
nonzero exit on the review's head. Both ingestion modes enforce this rule before
calling Gas City or writing a worklog. A category, `subjective: false`, or an
arbitrary `command:` citation alone is insufficient. Non-blocking findings need
no receipt, and subjective findings remain advisory.

## Registry

`config/agent-skills/deterministic-checks.json` is the reviewed mapping from check
identity to exact argv, permitted finding categories and timeout in milliseconds.
All categories must be in `blockingEligibleCategories`. Registry edits require
normal code review; findings and CLI arguments cannot supply commands or expand
this mapping.

| Check ID                | Exact argv                                               | Permitted categories       | Timeout |
| ----------------------- | -------------------------------------------------------- | -------------------------- | ------- |
| `agent-skills-platform` | `["node", "scripts/agent-skills/validate-platform.mjs"]` | schema, link, script       | 60 s    |
| `agent-skills-ci`       | `["pnpm", "ci:agent-skills"]`                            | schema, link, script, test | 300 s   |
| `unit-capability`       | `["pnpm", "test:capability", "unit"]`                    | test                       | 60 s    |
| `format-check`          | `["pnpm", "format:check"]`                               | lint                       | 300 s   |
| `typecheck`             | `["pnpm", "typecheck"]`                                  | typecheck                  | 300 s   |
| `lint`                  | `["pnpm", "lint"]`                                       | lint                       | 300 s   |

These are existing commands from `package.json`. The platform command validates
the skill configuration, links and script references; `unit-capability` checks
unit-test capability, not unit-test outcomes. The broader eligible-category
policy is not itself a registry: categories without a registered check cannot
currently support blocking ingestion. The four historical v1 completion check
IDs remain unchanged and are not execution receipts.

## Coordinator host workflow

Only the coordinator runs the runner on the host, from the repository root using
the pinned Node 24 runtime. Managed workers exercise injected runners in tests.
Review the checkout, registry and package scripts first; this runner executes
trusted repository code and is not a sandbox.

```bash
node scripts/agent-skills/run-check.mjs agent-skills-platform
```

The runner executes the registry argv with `shell: false`, stdin disconnected,
an 8 MiB output buffer limit and the registered timeout. Package managers may
interpret their existing package scripts internally. The child environment has
only `PATH`, `CI=true`, `LANG=C`, `LC_ALL=C`, `TZ=UTC`,
`COREPACK_ENABLE_NETWORK=0`, and `NODE_DISABLE_COMPILE_CACHE=1`. PATH contains the running Node directory, this
host's `/home/loucmane/.local/bin`, `/usr/local/bin`, `/usr/bin` and `/bin`;
it does not inherit the caller's PATH, Git routing variables or credentials.
Required tools and dependencies must already be provisioned.

Git probes have a ten-second timeout and use `--no-optional-locks`. The runner
records HEAD and tracked/untracked dirty state before execution, rechecks both
afterwards, and refuses a changed HEAD. A dirty tree is recorded as
`cleanTree: false`; it is never presented as a clean commit check. Ignored files,
including the receipt directory, do not affect Git's clean-tree observation.

A completed check produces
`reports/agent-skills/receipts/<checkId>-<headSha>.json` and prints its path and
receipt as JSON. The CLI returns the check's exit code, including a nonzero code
when it successfully recorded a failing run. Spawn errors, signals, timeouts,
truncated/unavailable output and unverifiable Git state produce no receipt.
Existing receipts are never overwritten. Reusing a check/head pair requires the
coordinator to retain the prior evidence and deliberately reconcile its location
before another run; retries do not silently replace evidence.

The schema-version-1 receipt contains:

- `checkId` and the exact `argv` copied from the registry;
- `headSha` from Git and boolean `cleanTree` (clean at both observations);
- `exitCode`, including zero for a successful run;
- `startedAt` and `finishedAt` as UTC ISO timestamps;
- `outputSha256`, the SHA-256 of stdout bytes followed by stderr bytes.

Output text is not persisted or copied to the evidence sinks by this runner.
Retain any reviewed diagnostic logs separately when they are needed to explain
the finding or independently recompute the output hash.

## Finding citation and ingestion

Put the receipt reference in each blocking finding's `evidence` array:

```json
{
  "id": "schema-check",
  "severity": "error",
  "category": "schema",
  "message": "Describe the actual diagnostic from the registered check.",
  "subjective": false,
  "blocking": true,
  "evidence": ["receipt:reports/agent-skills/receipts/agent-skills-platform-<full-head-sha>.json"]
}
```

Use the actual forty-character lowercase Git SHA in both the filename and the
review envelope's `headSha`. A top-level evidence entry alone does not satisfy a
finding's citation. Ingestion requires every blocking finding and every receipt
it cites to verify. Receipt paths must match the runner's repository-relative
filename under `reports/agent-skills/receipts/`. Paths escaping that directory,
symlink components and non-regular files are rejected.

For each receipt, ingestion checks registry membership, category permission,
exact argv equality, matching review head and filename, a completed nonzero
exit code, and valid execution metadata. Passing runs cannot justify a blocking
failure. Dirty receipts are accepted as dirty evidence, not upgraded into proof
about a clean commit. The plan's `deterministicReceipts` array exposes each
verified finding ID, check ID, path, receipt-file SHA-256 and dirty-state flag.

```bash
node scripts/agent-skills/ingest-result.mjs reports/agent-skills/review.json --bead blog-example
```

After reviewing that dry run and the actual diagnostic, the coordinator can use
the same invocation with `--execute`. Both modes verify receipts; neither runs
the checks. See [ingestion and retry behavior](ingestion.md). Review structure
validation and `buildBeadsIngestPlan` stay separate: their historical synthetic
fixtures and offline plans do not claim execution evidence.

## Trust and limits

Receipts are consistency evidence written by the host runner, **not
cryptographic attestation**. Someone able to rewrite both registry and receipts
can manufacture internally consistent data. Ingestion verifies the receipt's
claims against the trusted local registry; it does not authenticate its author,
rerun the command, recover the output from its hash, or establish that a specific
diagnostic proves the finding. The coordinator must inspect that relationship,
particularly for aggregate checks and missing-tool or configuration failures.

The head comparison binds to the review's supplied SHA, not automatically to the
current ingestion checkout. A dirty tree, ignored inputs, installed tools and
dependencies can affect execution without changing HEAD; dirty state is only a
before/after observation. The runner is not a hermetic build or a workspace
lock. Execute and ingest serially in a trusted checkout, review `cleanTree`, and
rerun on the intended clean head when commit-level evidence is needed.

Keep result files, receipt files and the reviewed dry-run plan in durable
evidence storage. Generated `reports/agent-skills/` files remain ignored and
must not be committed. The existing Beads receipt hashes the review result;
the plan additionally hashes deterministic receipt bytes, but the Beads metadata
format is unchanged. No receipt grants merge, publish or policy authority.
