# Magazine Security Surface

Baseline: `554c23cf7346f59bf032a1ccc4fb683338c16289` (Task 59). Re-read the cited code
at the reviewed revision. Code facts below describe that baseline, not production assurance.
Review questions describe work to assess, not already implemented controls.

## Identity, Recovery, and Authorization

| Source                                             | Existing control or behavior                                                                                                                                                                          | Review consequence                                                                                                                                                      |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/web/src/server/owner/auth.ts`            | Better Auth with a transactional PostgreSQL Drizzle adapter; public password signup disabled; password length 14–128; passkey origin and RP ID from the configured site.                              | Trace the dependency's actual handler behavior and enrollment authorization when these change; do not claim multi-factor enforcement.                                   |
| `packages/web/src/app/api/auth/[...all]/route.ts`  | GET/POST/PUT/PATCH/DELETE delegate to the Better Auth handler; exceptions use the owner error mapper.                                                                                                 | This auth entry point is not wrapped by `withOwner`; review the library's per-action protections rather than applying a blanket owner guard that would prevent sign-in. |
| `packages/web/src/server/owner/session.ts`         | A Better Auth session is accepted for the workspace only when its user's lowercased email equals the configured owner email.                                                                          | Authentication alone is not owner authorization. There is no editor/admin role hierarchy here.                                                                          |
| `packages/web/src/server/owner/setup.ts`           | Strong setup token, origin check, JSON type and 4,096-byte streamed limit before database locks; digest comparison; transaction and permanent completion latch in `idempotency_records`.              | Setup is a separate unauthenticated bootstrap boundary. Check replay, concurrent setup, partial auth state, rollback, and no pre-commit cookie delivery.                |
| `packages/web/migrations/0002_owner_auth.sql`      | User, session, account, verification and passkey tables; unique email/session token/credential ID, user cascades, nonnegative passkey counter. No roles column or database singleton-user constraint. | The application owner-email gate and setup latch do not imply the database can hold only one user. Table access protects credential material.                           |
| `packages/web/migrations/0002_owner_auth.down.sql` | Drops auth tables and reverses this migration's publishing/revision changes.                                                                                                                          | A rollback after use destroys auth records; restoration and authorization to run it belong to backend/operations work.                                                  |

Account recovery lives in `packages/web/src/server/owner/auth.ts`: reset tokens are configured
for 30 minutes and password reset revokes sessions. Delivery accepts only the configured
owner email and a reset URL with the configured site origin. It posts the email and reset
URL to a configured HTTPS webhook using a bearer secret and a ten-second timeout. This
introduces a sensitive external recipient; inspect access, message retention, redirect
behavior, and logs without triggering delivery. Delivery errors (missing configuration,
unexpected origin, webhook failure, timeout) are thrown but Better Auth swallows and logs
them; the reset endpoint still reports success, so a failed delivery is visible only in logs.

`packages/web/src/server/owner/recovery.ts` is **local draft recovery**, not account recovery.
It validates serialized draft shape and size on serialization; parsing rejects invalid dates,
timestamps over five minutes in the future, and copies older than seven days.
`packages/web/src/components/owner/story-editor.tsx` stores these copies in localStorage and
removes specific keys after successful saves or explicit recovery actions. Parser expiry
does not delete browser data or prove logout cleanup. Treat title, dek and document content
as private and review shared-device behavior and deletion separately.

## Session, Credentials, Requests, and Headers

- `packages/web/src/server/owner/auth.ts` sets a `magazine-owner` cookie prefix, secure
  cookies for HTTPS, 14-day sessions, one-day freshness and 12-hour update age. Do not infer
  that every sensitive handler enforces freshness, or claim cookie flags not shown here;
  inspect Better Auth behavior and response tests for those guarantees.
- `packages/web/src/server/owner/config.ts` requires PostgreSQL, a configured owner email,
  a strong auth secret, HTTPS outside allowed non-production loopback, and HTTPS plus a
  strong secret when a recovery webhook is supplied. The webhook parser reduces the URL
  to its origin. Owner test mode requires `NODE_ENV=test`, loopback and a strong test token.
- `packages/web/src/server/owner/session.ts` signs fixture sessions with HMAC; production
  sessions use Better Auth. `packages/web/src/server/owner/runtime.ts` uses in-memory
  content/objects only for the explicit fixture; otherwise PostgreSQL and optional S3 stores.
  S3 credential fields must be paired; actual IAM and bucket privacy are deployment evidence,
  not guarantees of this wiring.
- `packages/web/src/server/owner/api.ts`: `withOwner` resolves the owner and adds
  `private, no-store`. **It does not check mutation origin itself.** Mutation callers must
  use `assertOwnerMutationRequest`. `readOwnerJson` enforces JSON and 2,100,000 streamed
  bytes before schema validation. Expected content errors may forward their messages and
  conflicts include current server state; unexpected failures use fixed fallback messages.
  Review expected-error construction too, not just the fallback.
- `packages/web/src/lib/request-security.ts` compares fixed-size SHA-256 digests for accepted
  token inputs. Configured secret checks use a 32–512 UTF-8 byte length bound, not an entropy
  test. `requestOriginMatches` rejects cross-site fetch metadata and mismatched origins;
  absent Origin is allowed only with `Sec-Fetch-Site: same-origin`. Preview tokens and scopes
  use separate HMAC domains, bind a slug, and expire after 300 seconds. The preview scope
  cookie is HttpOnly, SameSite Strict, scoped to `/preview`, and Secure on HTTPS.
- Header implementation is in `packages/web/next.config.ts`, with tests in
  `packages/web/src/lib/security-headers.test.ts`. There is no separate security-headers
  implementation module under src/lib at this baseline. CSP has self defaults, forbids
  objects and embedding the app in frames, **allows inline scripts and styles**, and adds
  unsafe-eval in development.
  It also emits HSTS, nosniff, DENY, permissions and referrer policies. Owner responses have
  private/no-store, same-origin referrer policy and noindex headers; verify runtime responses
  when assessing deployment. Headers do not replace authentication or sanitization.

For per-route checks, follow handlers into guards and services. Include service-token routes
such as `packages/web/src/app/api/internal/publication-jobs/route.ts` and preview/revalidation
routes when touched; the automatic review route is a selection aid, not a complete access
inventory. Future role work needs a subject/action/resource matrix and deny cases for every
new role, with separate grants for draft reading, publication, media, recovery and account
administration. No multi-user authorization policy is implemented by this skill.

## Rich Content and Media

`packages/web/src/server/content/document.ts` validates versioned structured JSON (currently
v4), known nodes/marks, strict attributes and parent/child shapes, and a 2,000,000-byte
document bound. Document link and credit URL protocols are http, https and mailto (the media
asset's own creditUrl in owner/contracts.ts and portability.ts is any URL, unrestricted); embeds require HTTPS
on listed YouTube/Vimeo hosts. Unknown or invalid content is quarantined with its original
payload. This is validation and quarantine, not arbitrary-HTML sanitization. Original
quarantine data remains sensitive and should not be pasted into a review.

`packages/web/src/server/owner/contracts.ts` uses strict request objects, but accepts
`document` as unknown; trace subsequent document validation rather than treating Zod's
outer request shape as the sanitization boundary. `packages/web/src/components/owner/content-renderer.tsx`
renders React nodes and text, and turns embeds into source links. Check reader rendering
separately when relevant; this owner renderer alone proves nothing about other sinks.

| Stage/source                                             | What the code does                                                                                                                                                                                                                                      | Limit or question                                                                                                                                                                                               |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/web/src/app/api/owner/media/route.ts`          | POST checks mutation origin, then owner session; requires numeric Content-Length at most 50 MiB + 64 KiB, reads `formData()`, checks file size and metadata, measures bytes, then stores. GET is owner guarded.                                         | Declared length plus a post-parse file check is not a streamed multipart byte ceiling. Check platform limits and memory pressure independently.                                                                 |
| `packages/web/src/server/content/media.ts`               | Allows declared AVIF/GIF/JPEG/PNG/WebP, 1 byte–50 MiB, required alt/credit, valid dimensions/focal points; uses ID and checksum object keys and verifies stored checksum.                                                                               | Checksums prove byte consistency, not safe content. Original storage validates declared MIME, not actual signature, and preserves original bytes/metadata. No malware scan or EXIF erasure is implemented here. |
| `packages/web/src/server/content/media-variants.ts`      | Measurement checks signatures before metadata reading, returning unknown facts on mismatch/unreadable header. Variant rendering separately rejects signature mismatch and animation, bounds pixels, applies render timeout and per-process concurrency. | **Measurement failure does not reject original upload.** Decoder restrictions on variants are not original acceptance restrictions or global quotas.                                                            |
| `packages/web/src/server/content/media-variant-rules.ts` | Allowed widths/formats, encoding revision, pixel ceiling of 8192 × 8192; animated/oversized originals are excluded from variants.                                                                                                                       | Animation and large originals may still be served as originals. Review denial-of-service protection across replicas and caches.                                                                                 |
| `packages/web/src/app/api/owner/media/[id]/route.ts`     | Requires owner session and serves original bytes with private/no-store and nosniff.                                                                                                                                                                     | Treat original URLs and metadata as private; do not substitute public object URLs.                                                                                                                              |
| `packages/web/src/app/api/media/[id]/route.ts`           | Requires membership in the current public-media view before asset lookup, query parsing, redirect or 304; responses require cache revalidation and use nosniff. Unavailable variants redirect to the original.                                          | Unpublish must revoke original and variant access, including conditional requests. Storage errors log the error object; assess redaction without copying raw logs.                                              |

## Abuse Controls and Gaps

Authentication rate limiting **exists**: `ownerAuthOptions` in
`packages/web/src/server/owner/auth.ts` enables max 30/window 60 in Better Auth. This config
does not establish its deployment-wide storage, per-endpoint overrides or proxy identity
semantics; inspect the dependency/runtime before making such claims.

Setup has a separate persistent limit in `packages/web/src/server/owner/setup.ts`: at most
five invalid-token attempts per 15-minute bucket derived from the configured token, with
429 and Retry-After 900 when exhausted. The singleton lock rechecks admission. Lock and
statement timeouts are three seconds. This is not a general per-user or per-IP API limiter.

General distributed throttling for owner content mutations or public media requests is not
established by the inspected handlers. Request byte limits, render concurrency and auth
limits do not prove it. State the uncovered paths and cost (database, webhook, decode,
storage), expected failure response, and owner for a proposed policy; do not silently add
services or assert live protection.

## Privacy and Retention

Inventory purpose, storage, recipients, access, expiry, physical deletion, backup copies and
verification for each data class:

- Auth migrations store owner name/email, session token/expiry/IP/user-agent, account
  credential/token columns, verification values and passkey metadata. Column names do not
  prove hashing, encryption, population or cleanup semantics; follow the auth adapter.
- Local recovery drafts persist in browser storage; reset links traverse the recovery
  webhook. Neither has the same retention semantics as an auth session expiry.
- Original images can carry metadata, and alt/captions/credits can contain personal data.
  Unpublish revokes reader visibility, not stored bytes or backups.
- Logs, publishing audit records and failure artifacts need minimization and access control;
  do not infer universal redaction from one safe error response.
- `docs/product/nonfunctional-requirements.md` documents minimization, purpose, retention,
  deletion and privacy-conscious analytics. These requirements are not proof of a deployed
  analytics system, consent workflow, deletion job or a legal compliance determination.
- `docs/deployment/backup-restore.md` distinguishes private operational backups (including
  auth records) from portable exports. Independent encryption/retention and recurring
  production drills remain provisional there; it does not specify concrete daily/weekly/
  monthly durations. `packages/web/src/server/content/portability.ts` exports a strict
  content bundle, not owner auth tables. Do not represent a full database dump as secret-free.

Record undefined retention and deletion policies as unresolved security decisions, with an
owner, affected data classes, next evidence and a reversal/restore consequence. Keep data
removal implementation with backend and operational execution with its authorized task.

## Dependency and Supply Chain

- `scripts/ci/check-dependency-security.mjs` rejects vulnerabilities of any severity except
  approved bounded exceptions. Exceptions require exact versions, dev-only paths, reason,
  approver and dates; maximum three. Expired, widened, unverified or now-fixable exceptions
  fail. Registry lookup failure cannot prove that a patch is unavailable.
- `tests/ci/security-hotfix.test.mjs` exercises malformed audits, severity policy, exception
  expiry/path/version/release checks, pinned versions, and CI enforcement. Run these offline
  unit tests where permitted; the audit script's CLI itself runs network-dependent audit
  and registry lookups, so a no-network review cannot claim a current clean audit.
- `.github/workflows/ci.yml` pins actions, uses read-only top-level contents permissions,
  disables checkout credential persistence, runs frozen install and dependency security,
  and includes gitleaks/dependency review. Re-read individual job permissions and event
  trust before making a blanket claim about all workflows. A pin alone does not prove
  provenance or trustworthy artifact contents.
- `.gitleaksignore` contains two exact historical generated-build fingerprints. Do not
  widen them to suppress new detections. Review redacted scanner output for the actual diff;
  do not copy detected values.
- Review `package.json`, `packages/web/package.json`, `pnpm-lock.yaml` and
  `config/runtime.json` together for changed dependencies, scripts, resolutions and audit
  exceptions. New versions or provider choices belong to `stack-research-adr`; this skill
  does not install dependencies or approve an exception.

## Useful Verification Sources

Read relevant tests before selecting a command: `packages/web/src/server/owner/setup.test.ts`,
`packages/web/src/server/owner/owner-foundation.test.ts`,
`packages/web/src/lib/request-security.test.ts`, `packages/web/src/lib/security-headers.test.ts`,
and `tests/ci/security-hotfix.test.mjs`. Use the active task's permitted runner and fixtures.
Static review, a unit-test pass and a production verification are distinct evidence; report
missing prerequisites without widening permissions or using real identities.
