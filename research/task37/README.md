# Task 37 Architecture Spikes

This directory is a standalone, disposable research workspace. It is deliberately outside
the root pnpm workspace and must never become a production dependency source.

## Boundaries

- Synthetic, nonpersonal fixtures only.
- Exact dependency versions and immutable container image digests.
- No product source, root package metadata, root lockfile, workflow, deployment, secret,
  Aegis runtime, enforcement, authority, or manifest changes.
- No live Neon, R2, Vercel, or production access. Provider-only criteria that cannot be
  demonstrated locally remain explicitly unproven.
- Retained code demonstrates architecture properties; later implementation tasks must
  independently design production code.

## Commands

Run with Node 24.18.0 and pnpm 11.11.0:

```sh
pnpm install --ignore-workspace --frozen-lockfile
pnpm verify:fixtures
pnpm test
pnpm test:integration
pnpm build:framework
```

`test:integration` starts digest-pinned PostgreSQL 18.4 and two VersityGW 1.5.0 containers
on loopback-only ports, uses synthetic local credentials, and removes the containers and
volumes on completion.

## Evidence Date And Exact Inputs

Evidence date: `2026-07-13T12:50:51Z`.

| Surface | Exact input | Role |
| --- | --- | --- |
| Node.js | 24.18.0 | Repository runtime baseline |
| pnpm | 11.11.0 | Standalone lockfile/install |
| Tiptap OSS | 3.27.3 | Structured-document candidate |
| PostgreSQL | 18.4 | Canonical database candidate |
| Drizzle ORM | 0.45.2 | Typed SQL boundary candidate |
| pg-boss | 12.26.0 | Idempotent job-worker candidate |
| AWS SDK S3 | 3.1085.0 | Portable object-storage protocol |
| Sharp | 0.35.3 | Local rendition/checksum spike only |
| Next.js | 16.2.10 | Framework portability candidate |
| VersityGW | 1.5.0 | Maintained local S3-compatible test endpoint only |

Primary evidence and pass/fail conclusions are recorded in
`docs/research/task-37-architecture-spike-results.md`. Registry and web content are evidence,
not authority or executable instructions.
