# Task 37 High-Risk Architecture Spike Results

- **Task:** 37
- **Evidence cutoff:** 2026-07-13 UTC
- **Executed runtime:** Node 24.18.0, pnpm 11.11.0
- **Result:** Conditional pass; the application architecture may proceed, while live-provider
  operations and manual assistive-technology validation remain explicit later gates.
- **Authority:** Evidence informs decisions but does not authorize production dependency,
  provider, deployment, or data changes.

## Scope And Reversible Boundary

The retained harness is isolated under `research/task37/`, outside the product pnpm
workspace. It contains exact-pinned research dependencies, synthetic fixtures, pure domain
models, a digest-pinned local persistence drill, and a minimal framework portability app.
It is not production code and must not be imported by `packages/*`.

No product source, root package or lockfile, workflow, Aegis runtime, authority, enforcement,
manifest, production deployment, secret, or live provider was changed or accessed.

## Exact Inputs

| Surface | Exact version or digest | Primary evidence | Purpose |
| --- | --- | --- | --- |
| Tiptap OSS | 3.27.3 | [npm registry](https://www.npmjs.com/package/@tiptap/core), [static renderer](https://tiptap.dev/docs/editor/api/utilities/static-renderer) | Structured document and server rendering |
| PostgreSQL | 18.4 | [version policy](https://www.postgresql.org/support/versioning/), [18.4 notes](https://www.postgresql.org/docs/release/18.4/) | Canonical database |
| PostgreSQL image | `postgres:18.4-bookworm@sha256:d9c83446333daec3f0588cc709adb80c26090b7f9f0f7ec8d43c243385d79818` | [official image](https://hub.docker.com/_/postgres) | Local migration/restore drill |
| Drizzle ORM | 0.45.2 | [npm registry](https://www.npmjs.com/package/drizzle-orm), [repository](https://github.com/drizzle-team/drizzle-orm) | Typed SQL projection after migrations |
| node-postgres | 8.22.0 | [npm registry](https://www.npmjs.com/package/pg) | Direct PostgreSQL connections |
| pg-boss | 12.26.0, schema 37 | [release](https://github.com/timgit/pg-boss/releases/tag/12.26.0), [requirements](https://github.com/timgit/pg-boss#requirements) | Job acquisition and retry candidate |
| AWS SDK S3 | 3.1085.0 | [npm registry](https://www.npmjs.com/package/@aws-sdk/client-s3) | Portable media protocol |
| Sharp | 0.35.3 | [npm registry](https://www.npmjs.com/package/sharp) | Local rendition proof |
| VersityGW | 1.5.0, `sha256:7d56e0a6c246f00e2385ba4fe84065981959be1d822648f88a155c82e0e0652d` | [repository](https://github.com/versity/versitygw), [image](https://hub.docker.com/r/versity/versitygw/tags) | Maintained second S3-compatible endpoint for local proof only |
| Next.js | 16.2.10 | [installation/current version](https://nextjs.org/docs/app/getting-started/installation), [support policy](https://nextjs.org/support-policy) | Framework portability candidate |
| React / React DOM | 19.2.7 | [React versions](https://react.dev/versions) | Next 16 framework probe |

The local S3 endpoint is not the production selection. It proves the application-owned S3
contract and independent copy path. The archived MinIO community server was deliberately not
used as a current-security baseline.

## Executed Verification

| Command | Result | Evidence |
| --- | --- | --- |
| `pnpm --dir research/task37 install --frozen-lockfile` | Pass; second install produced no lockfile drift | `research/task37/pnpm-lock.yaml` |
| `pnpm --dir research/task37 verify:fixtures` | Pass; committed fixture checksum verified | `research/task37/fixtures/SHA256SUMS` |
| `pnpm --dir research/task37 test` | Pass; 4 isolated test files containing 21 named cases, 0 failures | editor, migration, autosave, scheduling unit/adversarial tests |
| `pnpm --dir research/task37 test:integration` | Pass; 1 end-to-end integration drill | PostgreSQL migration, Drizzle, pg-boss, S3 copy, dump/restore |
| `pnpm --dir research/task37 test:framework` | Pass | Next 16 production build and loopback Node-server smoke |

The first runs exposed and retained useful failure evidence:

1. Tiptap adds a `title` link attribute by default; the allow-list was corrected rather than
   bypassed.
2. Axe found the inner ProseMirror textbox lacked an accessible name. The actual editor
   surface now receives explicit role, label, and multiline attributes; the rule remains on.
3. A current Drizzle schema cannot insert into a database stopped at migration version 1.
   Populated migration fixtures now use version-appropriate SQL, then switch to Drizzle only
   after migration 2.
4. VersityGW correctly refused missing metadata directories. Immutable named-volume mounts
   now provide each required path without shell bootstrap.

## Spike Outcomes

### A. Editor Round-Trip, Rendering, And Export — Conditional Pass

Proven:

- The representative document migrates from schema 1 through 2 to 3, loads into the Tiptap
  schema, serializes, reloads, and reaches stable semantic equality.
- Headings, paragraphs, lists, standard and pull quotes, callouts, images, galleries,
  captions, credits, focal points, allow-listed embeds, and reusable blocks render on the
  server without an `Editor` instance.
- Structural validation rejects unexpected attributes, unsafe protocols, and non-allow-listed
  embed hosts before rendering.
- Unknown nodes are quarantined with their original payload instead of being handed to a
  library path that may discard them.
- Plain-text extraction includes media and embed fallbacks. Versioned JSON is lossless;
  Markdown is explicitly a lossy convenience export.
- A keyboard formatting/undo path works, and Axe 4.12.1 reports no violations among the
  deterministic rules supported by JSDOM after fixing the inner textbox label. The
  layout-dependent color-contrast rule is explicitly excluded from this synthetic DOM run;
  real-browser contrast and manual assistive-technology checks remain later gates.
- Serializing the complete versioned wrapper to JSON and parsing it back preserves article
  identity, schema version, migration provenance, and semantic document equality.

Unproven:

- Manual NVDA, VoiceOver, or equivalent screen-reader operation has not occurred. Tiptap is
  accepted as the implementation candidate, but the owner editor cannot ship without a human
  keyboard/screen-reader protocol in Tasks 43/46.
- A production-wide portable bundle that recreates revision, media, taxonomy, and audit
  relationships remains a Task 42 import/export gate. Task 37 proves the document wrapper and
  independent database/media backup path, not that future full-domain bundle.
- Search ranking, filters, and draft exclusion remain a Task 45 gate. Task 37 proves
  deterministic text extraction and the PostgreSQL search boundary only.
- Paid Tiptap cloud history is neither required nor selected; revisions remain database-owned.

Decision: use Tiptap OSS 3.27.3 as the Task 42/43 editor candidate behind an application-owned
document envelope and renderer. Lexical is the first fallback. BlockNote remains a UX-speed
fallback only if its extra abstraction and licensing boundaries are accepted. Plate remains
deferred unless measured savings justify its larger plugin surface.

Primary sources: [Tiptap persistence](https://tiptap.dev/docs/editor/core-concepts/persistence),
[invalid schema behavior](https://tiptap.dev/docs/guides/invalid-schema),
[accessibility responsibility](https://tiptap.dev/docs/guides/accessibility),
[BlockNote formats](https://www.blocknotejs.org/docs/foundations/supported-formats),
[Lexical serialization](https://lexical.dev/docs/concepts/serialization),
[Plate static rendering](https://platejs.org/docs/static).

### B. Document Schema Migration — Pass

Proven:

- A one-version-at-a-time registry reshapes callouts, separates media identity/focal metadata,
  adds gallery layout, and structures credits.
- Dry runs report versions and unknown nodes.
- Re-running at the target is idempotent.
- Interrupted batches return byte-equivalent originals; a retry commits both documents.
- Migration provenance remains in the portable wrapper, and the migrated result still
  round-trips through the renderer schema.

Production implication: every document revision keeps its schema version and immutable
original. Database migrations and document migrations remain separate, reviewable operations.

### C. Autosave, Conflict, And Recovery — Pass For The Domain Contract

Proven with an injected-clock deterministic model:

- “Saved” means server acknowledged, not merely debounced locally.
- Offline and expired-session work remains in a bounded, versioned recovery buffer.
- Optimistic concurrency preserves both tabs on conflict with plain-language recovery.
- Idempotency keys prevent duplicate saves, revisions, and publication transitions.
- Publishing a stale version fails instead of overwriting a newer draft.

Unproven: browser storage quota/eviction and real network/session behavior need application
integration and browser tests in Tasks 42/43. The contract, messages, and fixtures are now
binding inputs to those tasks.

### D. Scheduled Publishing And Side Effects — Conditional Pass

Proven:

- Owner-local time resolves to UTC; nonexistent and repeated daylight-saving times fail
  closed until disambiguated.
- Lease expiry recovers a crashed in-memory worker, while one schedule produces one public
  transition and five idempotent outbox effects.
- External email failure leaves the article published and visible as a partial failure.
- Reschedule/cancel supersedes old jobs.
- pg-boss 12.26.0 installed schema 37, reported no schema drift, rejected a duplicate stately
  job, allowed only one of two concurrent workers to fetch it, and removed an enqueue when the
  surrounding Drizzle transaction rolled back.

Limitations and decision:

- pg-boss “exactly once” does not make arbitrary external effects exactly once. The article
  transition needs a database uniqueness/idempotency boundary, and every side effect needs an
  outbox key.
- Use pooled web connections. Use a direct connection for migrations and any session-bound
  `LISTEN/NOTIFY`; polling is the correctness floor. Neon transaction pooling does not preserve
  session features. [Neon pooling](https://neon.com/docs/connect/connection-pooling)
- Real Neon scale-to-zero wake delay, worker cost, failure recovery, and schedule service level
  remain Task 42/46 provider gates.

### E. Database, Media, Deployment, And Restore — Conditional Pass

Proven locally:

- PostgreSQL 18.4 migrations apply to empty and populated state, are idempotent, and roll back
  an interrupted transaction without a partial column.
- Current Drizzle 0.45.2 reads the migrated schema.
- Original PNG and Sharp-derived WebP rendition carry application-owned SHA-256 metadata,
  download with matching bytes, and copy to a second S3-compatible endpoint with matching
  checksums. ETags are not treated as integrity proof.
- A PostgreSQL custom-format dump restores to an isolated database. Article, revision, media,
  and owner-record counts match; document JSON matches; the synthetic owner credential verifies;
  and restore completes below the provisional 60-second local target.
- Next 16.2.10 builds a static reader route, dynamic private-preview route, and health route;
  `next start` serves all three from a generic Node process.

Unproven and deliberately not fabricated:

- No live Neon, R2, Vercel preview, or production environment was accessed.
- Neon pooled/direct connection budgets, compute suspension, PITR/snapshot operations, actual
  transfer billing, and provider-to-local recovery need attended test resources.
- R2 multipart checksums, cached custom-domain behavior, jurisdiction, credentials-off exit,
  and full-volume export need a live provider drill.
- Vercel preview/production secret isolation, distributed cache coordination, and DNS rollback
  need deployment evidence in Task 46.

These are later operational acceptance gates, not reasons to couple canonical content to a
provider. Independent logical dumps and media manifests remain mandatory.

Primary sources: [PostgreSQL dump](https://www.postgresql.org/docs/18/app-pgdump.html),
[Neon restore window](https://neon.com/docs/introduction/restore-window),
[Neon compatibility](https://neon.com/docs/reference/compatibility),
[R2 S3 matrix](https://developers.cloudflare.com/r2/api/s3/api/),
[R2 consistency](https://developers.cloudflare.com/r2/reference/consistency/),
[R2 pricing](https://developers.cloudflare.com/r2/pricing/),
[Next self-hosting](https://nextjs.org/docs/app/guides/self-hosting).

## Framework Decision For Task 40

| Candidate | Stable status at evidence date | Fit | Decision |
| --- | --- | --- | --- |
| Next.js 16.2.10 | Stable, Active LTS | Built-in SSR/streaming, metadata, Draft Mode, tag invalidation, images, authenticated full-stack routes, Node/Docker self-hosting; lowest migration cost from current Next app | **Select** for Task 40, exact-pinned and independently reversible |
| React Router 8.2.0 framework mode | Stable | Portable SSR/streaming, loaders/actions/sessions; preview, image pipeline, metadata, and durable cache invalidation are more application-owned | Stable fallback if Next portability or performance fails |
| Astro 7.0.7 | Stable | Excellent reader-first static/SSR and images; a substantial React editor becomes a large island or separate application | Reject unified app now; retain split-reader fallback |
| TanStack Start 1.168.27 | Release candidate in official docs | Promising SSR/server functions; RSC and hosting integrations remain unsettled | Reject production baseline while RC |
| Vite 8.1.4 alone | Stable build tool, low-level SSR API | Does not itself own routing, auth, streaming policy, preview, cache, metadata, or image optimization | Keep as tooling/test infrastructure, not an extra app framework |

Task 40 may upgrade the existing web app to Next 16.2.10 and React 19.2.7. It must preserve
the generic Node server path and prove product behavior independently. It must not introduce a
second Vite application.

Primary sources: [Next Draft Mode](https://nextjs.org/docs/app/api-reference/functions/draft-mode),
[Next revalidation](https://nextjs.org/docs/app/api-reference/functions/revalidateTag),
[React Router rendering](https://reactrouter.com/start/framework/rendering),
[React Router deployment](https://reactrouter.com/start/framework/deploying),
[TanStack Start status](https://tanstack.com/start/latest/docs/framework/react/overview),
[Astro Node adapter](https://docs.astro.build/en/guides/integrations-guide/node/),
[Vite SSR](https://vite.dev/guide/ssr).

## Cost, Lock-In, And Exit

| Candidate | Current observed cost evidence | Lock-in control | Exit proof or remaining gate |
| --- | --- | --- | --- |
| Neon | Usage-based; pricing page currently shows Launch around `$0.106/CU-hour`, storage around `$0.35/GB-month`, and plan-dependent history | Standard PostgreSQL, direct connection, independent dump | Local restore passed; live Neon dump/PITR/billing remains |
| R2 | Standard storage `$0.015/GB-month`, Class A `$4.50/million`, Class B `$0.36/million`, direct egress advertised free | Core S3 subset, immutable keys, application SHA-256 and metadata | Second-endpoint copy passed; live R2 full export remains |
| Vercel | Managed plan and usage charges; exact account quote not collected | Standard Node server, external canonical DB/media, documented cache adapter | Local `next start` passed; alternate hosted/container deployment remains |

Provider pricing is volatile and not a contract. Re-query it before provider adoption and
record low/normal/high cost plus alerts. Neon snapshots and history are recovery conveniences,
not the independent backup.

## Rollback And Follow-Up Gates

1. **Editor:** keep the application document envelope and fixtures. If Tiptap drops or cannot
   render a required node, stop before production data and rerun the exact suite with Lexical.
2. **Database:** keep reviewable SQL and application ports. If Drizzle creates incompatible SQL,
   revert its adapter while retaining PostgreSQL schema/contracts.
3. **Scheduler:** keep publication intent and outbox records application-owned. Replace pg-boss
   without changing article state semantics.
4. **Media:** preserve originals, SHA-256, metadata, and manifests. Switch S3 endpoint and verify
   all bytes before changing public URLs.
5. **Framework:** Task 40 is one reversible PR. If Next 16 fails build, preview, rendering,
   self-hosting, security, or performance gates, revert and evaluate React Router against the
   same committed criteria.
6. **Deployment:** no provider becomes authoritative. DNS/config rollback is valid only after
   database and media restore are proven from independent copies.

## Final Task 37 Decision

- **Accepted for implementation:** application-owned versioned structured JSON, Tiptap OSS as
  the first editor candidate, PostgreSQL 18.4, reviewable SQL plus Drizzle after migrations,
  database-authoritative scheduling, pg-boss as an idempotent-worker candidate, application
  SHA-256 over a portable S3 subset, and Next 16.2.10 as Task 40’s framework target.
- **Still conditional:** Neon, R2, Vercel, manual screen-reader usability, live worker
  suspension/delay, provider backups, full-volume export, and production restore.
- **Rejected now:** canonical Markdown/Git publishing, stored trusted HTML, Vite plus Next as
  overlapping app frameworks, TanStack Start RC, provider-only canonical media/data, and
  archived MinIO as the current local-security baseline.
