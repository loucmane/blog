# ADR 0007: Implement Content Persistence with PostgreSQL, Drizzle, and App-Owned Ports

- **Status:** accepted for Task 42 implementation
- **Decision owner:** project owner
- **Decision deadline:** Task 42 implementation
- **As-of date (UTC):** 2026-07-17
- **Review/expiry date:** before Task 46 live-provider adoption
- **Supersedes:** no accepted ADR; implements ADRs 0003 and 0004

## Decision

- **Question:** Which concrete dependencies and boundaries should implement the accepted
  app-owned content foundation?
- **Selected target:** PostgreSQL 18.4, hand-authored reviewable SQL migrations, Drizzle ORM
  0.45.2 as a typed projection, node-postgres 8.22.0, Zod 4.4.3, and AWS SDK S3 client
  3.1085.0 behind app-owned ports. Drizzle Kit is not installed in the Task 42 baseline.
- **Reversible boundary:** all product code remains in `packages/web`; providers are selected by
  adapters, SQL remains reviewable, and no production data or provider account is introduced.
- **Invalidation:** a deterministic Node 24/TypeScript 6/Next 16 incompatibility, unresolved
  security advisory, migration drift, failed PostgreSQL 18 restore, or inability to export and
  restore canonical media/content reopens this decision.

## Current Baseline

| Surface           | Current state                                                                                   | Evidence                                              | Constraint                                                       |
| ----------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------- |
| Product workspace | Next.js 16.2.10, React 19.2.7, TypeScript 6.0.3                                                 | `packages/web/package.json`                           | Keep one app workspace                                           |
| Persistence       | Framework fixtures only                                                                         | `packages/web/src/lib/framework-content.ts`           | Task 42 adds the accepted store                                  |
| Database proof    | PostgreSQL 18.4 spike passed                                                                    | `docs/research/task-37-architecture-spike-results.md` | No live-provider proof                                           |
| Root baseline     | Frozen install, typecheck, lint, format, tests, build, smoke, security, and browser checks pass | `/tmp/blog-task42-baseline/` local evidence           | Sandbox-only failures passed unchanged with required permissions |

## Decision Drivers

- Preserve app-owned structured content, revisions, audit history, media integrity, and exports.
- Use standard PostgreSQL and S3-compatible boundaries instead of provider-owned canonical state.
- Keep SQL reviewable, migrations transactional, and runtime queries typed.
- Prefer already-spiked stable versions over same-day releases without soak.
- Do not introduce editor UI, authentication, deployment, or production credentials.

## Evidence Matrix

| Option            | Latest stable | Selected     | Maintenance/security                                                                                                                                  | Compatibility and migration                                                                    | Lock-in/exit                                                           | Rollback and verification                                                                                                      | Primary sources                                                                                                                                                      |
| ----------------- | ------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Drizzle ORM       | 0.45.2        | 0.45.2       | Stable registry tag; runtime query/schema projection only                                                                                             | PostgreSQL plus direct, transactional SQL migration application                                | SQL remains authoritative and portable                                 | Remove the adapter before production data; compare the typed projection with reviewed SQL through deterministic contract tests | [ORM registry](https://www.npmjs.com/package/drizzle-orm), [PostgreSQL column types](https://orm.drizzle.team/docs/column-types/pg)                                  |
| Drizzle Kit       | 0.31.10       | not selected | Latest stable package resolves deprecated `@esbuild-kit` tooling and `esbuild` 0.18.20; the repository's dependency audit reports GHSA-67mh-4wv8-2f99 | Generation convenience does not justify adding a known-vulnerable development server toolchain | No runtime or data lock-in because migrations remain hand-authored SQL | Reconsider only after the latest stable graph is advisory-free and adds measurable value over the SQL contract test            | [Kit registry](https://www.npmjs.com/package/drizzle-kit), [GitHub reviewed advisory](https://github.com/advisories/GHSA-67mh-4wv8-2f99)                             |
| node-postgres     | 8.22.0        | same         | Mature maintained client; Node >=16                                                                                                                   | Node 24 compatible; transactions use one checked-out client                                    | PostgreSQL wire protocol                                               | Replace adapter while preserving repository ports and SQL                                                                      | [registry](https://www.npmjs.com/package/pg), [transactions](https://node-postgres.com/features/transactions), [pooling](https://node-postgres.com/features/pooling) |
| Zod               | 4.4.3         | same         | Stable latest tag with existing lockfile provenance                                                                                                   | TypeScript 6 compatible in the current graph                                                   | Schemas are application-owned                                          | Replace validator behind pure parse contracts                                                                                  | [registry](https://www.npmjs.com/package/zod), [documentation](https://zod.dev/)                                                                                     |
| AWS SDK S3 client | 3.1090.0      | 3.1085.0     | 3.1090.0 was published on the evidence date; 3.1085.0 was published 2026-07-10 and passed Task 37                                                     | Node >=20; explicit SHA-256 checksums and S3-compatible endpoints                              | Core object operations plus app-owned checksums                        | Swap endpoint/client and verify every original against the manifest                                                            | [registry](https://www.npmjs.com/package/@aws-sdk/client-s3), [checksum guide](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/s3-checksums.html)  |

## Compatibility Chain

| Boundary                                   | Evidence                                                                | Result                               | Gap                                    |
| ------------------------------------------ | ----------------------------------------------------------------------- | ------------------------------------ | -------------------------------------- |
| Node 24.18 / TypeScript 6 / Drizzle 0.45.2 | Task 37 used Node 24 and Drizzle 0.45.2; Task 42 reruns typecheck/tests | accepted                             | Hosted exact-head verification remains |
| Drizzle / pg 8.22 / PostgreSQL 18.4        | Drizzle declares `pg >=8`; Task 37 passed reads and migrations          | accepted                             | Live Neon pooling deferred             |
| S3 client 3.1085 / Node 24                 | Registry requires Node >=20; Task 37 passed two-endpoint checksum copy  | accepted                             | Live R2 multipart/export deferred      |
| Next server / database pool                | node-postgres pooling and transaction guidance                          | accepted behind a server-only module | Managed connection limits deferred     |

## Selected Option

This is the smallest stable implementation of the accepted architecture. It retains portable SQL
and S3 semantics, passed the risky local spike, and keeps provider selection outside the domain.
Hand-authored SQL plus a deterministic schema contract is preferred to adding Drizzle Kit's
advisory-bearing transitive toolchain. The deliberate exception to “latest” is the same-day AWS SDK
release; the week-old, spike-proven 3.1085.0 is the safer reversible target.

## Rejected Alternatives

| Alternative                    | Why rejected now                                                                               | Reconsider when                                                                                                          |
| ------------------------------ | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Provider-specific database SDK | Couples canonical queries to one host                                                          | A measurable feature cannot use standard PostgreSQL                                                                      |
| ORM-generated push migrations  | Weakens review and rollback evidence                                                           | Never for production; disposable local databases only                                                                    |
| Drizzle Kit 0.31.10            | Pulls deprecated `@esbuild-kit` packages and affected `esbuild` 0.18.20 into the audited graph | Its current stable dependency graph is advisory-free and its generation output is measurably safer than the SQL contract |
| File/MDX canonical content     | Breaks owner autosave/revision/scheduling requirements                                         | Not reconsidered for canonical storage                                                                                   |
| External search service        | Unnecessary before PostgreSQL relevance is measured                                            | Task 45 proves PostgreSQL insufficient                                                                                   |
| Same-day AWS SDK 3.1090.0      | No soak and no Task 37 evidence                                                                | A security fix or later verified adoption requires it                                                                    |

## Migration and Rollback

Land dependencies, pure domain code, SQL/Drizzle schema, adapters, and portability tests as
reviewable slices. No compatibility bridge may become an implicit production fallback. Before
production data, revert Task 42 and drop only the disposable Task 42 database. After data, restore
the pre-change logical backup and media manifest or apply an explicit forward repair.

## Verification Gates

- Two frozen installs with no second-run drift.
- Deterministic contract checks between the Drizzle projection and reviewed SQL migrations.
- Unit and adversarial domain/document tests.
- PostgreSQL 18.4 migration, rollback, export/import, dump/restore integration.
- S3-compatible upload/read/copy/checksum verification using synthetic objects.
- Existing typecheck, lint, format, coverage, browser/accessibility, build, smoke, dependency,
  Taskmaster, Aegis, witness, guard, secret, and diff gates.

## Open Evidence Gaps

- Live Neon pooling/PITR and provider-to-local restore remain Task 46.
- Live R2 multipart, credentials-off export, and cost evidence remain Task 46.
- Tiptap browser/editor and manual assistive-technology evidence remain Task 43.

## Sources

- Package registry and official documentation links in the evidence matrix — retrieved
  2026-07-17 UTC.
- [PostgreSQL version policy](https://www.postgresql.org/support/versioning/) and
  [PostgreSQL 18 text search](https://www.postgresql.org/docs/18/functions-textsearch.html) —
  retrieved 2026-07-17 UTC.
