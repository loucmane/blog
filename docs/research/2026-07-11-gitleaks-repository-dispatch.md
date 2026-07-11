# Gitleaks Repository Dispatch Compatibility

## Decision

Keep `gitleaks/gitleaks-action` pinned at its existing immutable commit for
`push` and `pull_request`. For the trusted `post-controlled-auto-merge-ci`
`repository_dispatch`, install and execute the official Gitleaks `8.30.1`
Linux x64 CLI artifact.

The official release publishes SHA-256
`551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb`
for `gitleaks_8.30.1_linux_x64.tar.gz`. The workflow embeds that digest,
downloads only the versioned release asset over HTTPS, verifies the archive
before extraction, and rejects any version mismatch before scanning.

Primary source:
[Gitleaks v8.30.1 release](https://github.com/gitleaks/gitleaks/releases/tag/v8.30.1).

## Root Cause

Task 66 proved the exact-commit post-merge dispatch path but run
`29165481805` failed because `gitleaks/gitleaks-action` rejects
`repository_dispatch` before scanning. No secret was detected. The trusted
context resolver, exact merge-SHA checkout, workspace verification, governance
verification, controlled squash merge, and dispatch all passed.

## Security Contract

- The context job must allow the event and resolve a trusted exact commit
  before the secret-scan job can start.
- Every scan checkout uses `needs.context.outputs.checkout_ref` with complete
  history and credentials disabled.
- Standard events retain the existing action wrapper and immutable action SHA.
- Dispatch uses only the checksum-verified official CLI; no mutable tag,
  container, package installation, `curl | sh`, PR artifact, or PR-controlled
  script is executed.
- The CLI verifies `HEAD` equals the trusted context output and scans all
  fetched history. Gitleaks retains its default optional `.gitleaks.toml`
  discovery, while the repository's tracked `.gitleaksignore` is selected
  explicitly by absolute workspace path.
- A final event-path assertion fails the job when the expected scanner was
  skipped, failed, or replaced, and denies every unknown event.

## Verification and Rollback

Contract tests require both scanner paths, the immutable pins, checksum gate,
exact-ref assertion, full-history flags, and fail-closed outcome enforcement.
Malformed dispatch evidence remains denied by the pure trusted-context
evaluator before downstream jobs run.

Rollback is a normal protected revert of Task 67. That restores the known
unsupported dispatch behavior and therefore requires post-merge verification
to be treated as failed until a replacement is delivered; skipping Gitleaks is
not an acceptable rollback state.
