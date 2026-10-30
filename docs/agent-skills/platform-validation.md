# Reproducing platform validation

Use Node 24.18.0. These checks use Node built-ins and Git; they require no
package installation, network, credentials, or running Gas City instance.
The governance job must also pass with no `node_modules` directories.

## Managed workers

From the assigned repository root, run each command separately:

```sh
node scripts/agent-skills/validate-platform.mjs
node --test --test-isolation=none --test-timeout=60000 tests/agent-skills/*.test.mjs
node scripts/agent-skills/check-v1-completion.mjs --check
node scripts/agent-skills/evaluate-forward.mjs --check
```

Use the pinned Node executable if the launch PATH selects another version.
`--test-isolation=none` runs the same assertions in the current process. In the
managed sandbox, the default test runner's child pipes can lose per-test output:
a successful run of two files reported only two file-level results instead of
28 individual tests. Do not treat that reduced count as complete evidence.
Keep the host's normal process-isolated run as a separate acceptance check.

| Evidence | Worker reproduction |
| --- | --- |
| Platform schema, registered skills, routes and links | Full validator JSON, including `errors` and `summary` |
| Git ignore rules and tracked entries | Real Git fixture repositories; ignored runtime links are excused, unknown and force-tracked entries are rejected |
| Missing or unresponsive Git | Missing executable, nonzero fake Git, and delayed-then-hung fake Git retain every candidate diagnostic and `passed: false` |
| Catalog CLI decisions and exit codes | Real child Node process with regular-file stdin/stdout/stderr descriptors |
| Whole skill suite without installed dependencies | Current-process test run; record counts, failures, cancellations and skips |
| Completion and frozen forward artifacts | `--check` regenerates expected artifacts in memory and requires equality with the stored bytes |

When a lane setup supplies dependencies, temporarily move its dependency
directories aside for the no-dependency check and restore them in `finally`.
Use a unique temporary root next to the tests, and retain only the summarized
evidence in the worklog. Do not install packages to make governance checks pass.

## Subprocess behavior and failure contract

`gitIgnoredPaths` runs `git check-ignore --quiet -- <literal-path>` separately
for each candidate, with explicit repository/worktree arguments and stdin
disconnected. It interprets status 0 as ignored and status 1 as not ignored.
It does not decode quoted filenames, implement ignore patterns, use `--no-index`,
or maintain an allowlist of runtime skill names. Whitespace, newlines, quotes,
backslashes and Unicode remain literal arguments. Git decides whether tracked
files or symlinks count as ignored.

All candidate probes share one five-second deadline. A subprocess error,
unexpected exit or timeout discards even previously collected ignore decisions.
The validator then emits a Git-evidence diagnostic plus every unregistered
candidate, and exits nonzero. A status of zero accompanied by a subprocess
error is still missing evidence. SIGKILL bounds a Git process that ignores
SIGTERM. No production scratch directory is needed.

The fixture Git helper also disconnects unused stdin and bounds its commands.
The catalog CLI test uses file descriptors because the sandbox can return
empty child Node stdout through pipes. These are transport choices; the CLI
still receives its catalog on stdin and emits its decision on stdout.
Temporary fixtures live under `tests/agent-skills/.<name>-*` and are removed
after the test. Tests use built-in modules only.

If Git execution or fixture writes are actually denied, retain the diagnostic
and require a host rerun. Never skip the assertion, ignore EPERM, substitute a
cached pass, or classify unknown entries as runtime skills without Git evidence.

## Host acceptance

The coordinator must run the following on the exact reviewed tree using the
pinned Node version, with no installed dependencies for the governance check:

```sh
node scripts/agent-skills/validate-platform.mjs
node --test --test-timeout=60000 tests/agent-skills/*.test.mjs
node scripts/agent-skills/check-v1-completion.mjs --check
node scripts/agent-skills/evaluate-forward.mjs --check
```

The first two checks are the components of `pnpm ci:agent-skills`. Retain the
full validator JSON, test summary, tree/commit identity and any diagnostics in
the bead's worklog. Do not present worker evidence as an independent host run.
If completion artifacts are stale, regenerate them only within the authorized
write set, inspect both JSON and Markdown, and rerun `--check`; an incomplete
verdict must remain visible.

Host process isolation, independent review and final acceptance remain host
responsibilities. This change does not claim application builds, browser tests,
deployment verification, signed commits or publishing. Worker delivery evidence
for this change is in [blog-n4y6.9](../worklog/blog-n4y6.9.md).
