# Authorization and rate limits

The reviewed inventory is
[`route-classification.ts`](../../packages/web/src/server/security/route-classification.ts).
It records every exported HTTP handler under `src/app`, including subscription
links outside `/api`, and every server action anywhere under `src`. Each entry
names its access class, recognized imported guard calls, rationale and rejection
tests. The initial inventory has 36 HTTP handlers and six server actions.

## Access classes

| Class                | Existing entrypoints                                                                                     | Required boundary                                                                                                                                                                                                |
| -------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `public-read`        | Feed, robots, sitemaps, health, public media, subscription confirmation pages; error-presentation action | Read-only public output. Media checks publication visibility; the error-presentation resolver returns lab identifiers only for the configured owner and public defaults otherwise.                               |
| `owner-session`      | Owner story/media/subscriber reads and mutations; open/switch/compare Reader Lab actions                 | A session for the configured owner, not merely any authenticated user. Mutations also validate origin before business effects.                                                                                   |
| `internal-secret`    | Revalidation, publication jobs, lab seed, outbox drain, fixture sessions; initial owner setup            | Purpose-specific secret checked before business effects. Setup additionally requires origin and its one-time latch. Lab/fixture availability remains environment restricted.                                     |
| `auth-framework`     | All five Better Auth catch-all methods                                                                   | Better Auth owns endpoint-specific session, origin and rate-limit rules; sign-in remains accessible without an existing session.                                                                                 |
| `webhook`            | None currently                                                                                           | Reserved for a reviewed inbound webhook with its provider-specific verification and replay policy. No generic webhook bypass exists.                                                                             |
| `public-submission`  | Subscription intake and Web Vitals                                                                       | Intentional anonymous intake with same-origin validation and bounded, validated payloads; subscriptions also have network/address throttles.                                                                     |
| `token-capability`   | Preview enable, confirmation, unsubscribe                                                                | Valid capability for that purpose/resource. Preview is signed, slug-bound and expiring; subscription tokens are checked by the service. RFC 8058 unsubscribe must support mail clients without a browser Origin. |
| `same-origin-cookie` | Preview disable, Reader Lab exit                                                                         | Same-origin request may clear only that browser's preview/lab cookies, including after its owner session expires.                                                                                                |
| `local-development`  | Local owner sign-in action                                                                               | Explicit test mode, strong fixture configuration, loopback request host and same origin. Production cannot use this action.                                                                                      |

The last four classes describe existing access rules more precisely than the
initial five-class vocabulary. They add no runtime authorization exceptions.
`switchReaderDirection` requires the owner to set an override, but intentionally
clears it after a session expires. Tests distinguish that revocation cleanup from
a privilege grant. Owner setup may commit security-attempt/latch bookkeeping on
denial; it must never create an account, credential or session on denial.

## Adding or changing a route

1. Add an explicit handler export or server action. The scan includes GET, HEAD,
   POST, PUT, PATCH, DELETE and OPTIONS; every method except GET/HEAD and every
   server action needs a recognized guard, including a read-only server action.
2. Apply the appropriate guard before parsing private mutation inputs, reading
   private data or performing business effects. Owner mutation authorization
   includes both configured-owner identity and origin. For a delegated handler,
   review its complete guard chain and retain its behavioral tests.
3. Add `src-relative-file#exportName` to the inventory. List actual imported guard
   symbols and rejection evidence. Each guard group requires at least one of its
   alternatives. Inline server actions use `file#inline@line:column`; prefer named
   action-module exports for stable review. Unresolved re-exports, wildcard route
   exports and destructured exports fail closed and need explicit local handlers.
4. Test missing and wrong identity/secret, cross-site requests where relevant,
   and absence of business effects. Exercise a valid request too. For cookie-only
   cleanup, prove its narrow effect. For framework authentication, exercise the
   real installed handler, with production origin checks enabled before import.
5. Run the security tests and normal checks. Keep the inventory and behavioral
   evidence in the same review when a guard or trusted wrapper changes.

`packages/web/tests/security/route-inventory.test.ts` fails for missing/stale
classifications, empty scans, missing guards and unreviewable export forms. Its
planted unguarded POST proves both discovery and guard failure. Other controls
prove that a sibling GET's guard, a comment, a string, an unused helper or a
lookalike local function does not satisfy the check. Aliased imports/exports and
local wrapper calls are parsed with the TypeScript AST.

This is an enforced structural invariant in the unit suite, not a general
control-flow verifier. Imported wrappers are reviewed trust boundaries. The
behavioral rejection tests establish guard order and absence of side effects;
the scanner alone cannot prove those properties for arbitrary code. CI/host
results must be reported separately from local checks.

## Thresholds and responses

The shared implementation is
[`security/rate-limit.ts`](../../packages/web/src/server/security/rate-limit.ts).
Subscription callers retain their existing import through a compatibility
re-export. Thresholds are constants; this change adds no configuration variables
or persistent state.

| Operation                      | Allowance                                                                                                                 | Counted identity                                | Placement                                                                                                                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Owner media POST               | 120 attempts per 10 minutes                                                                                               | Authenticated owner ID                          | After owner/origin validation, before multipart parsing, image decoding or storage. Invalid upload input still counts.                                                                  |
| Preview enable POST            | 120 rejected attempts per 10 minutes                                                                                      | Request network                                 | Only the 400/401 rejection branches, after configuration, content-type and bounded-body checks. Valid tokens are never counted or limited.                                              |
| Failed internal authentication | 60 failures per 10 minutes, independently for revalidation, publication jobs, lab seed, outbox drain and fixture sessions | Fixed endpoint name plus request network        | Only a rejected credential spends allowance. Valid scheduler credentials still work after failures exhaust their bucket. Disabled/misconfigured endpoints retain their closed response. |
| Subscription intake (existing) | 10 requests per 10 minutes per network; 3 per hour per email address                                                      | Normalized network and canonical email          | Existing request/consent validation chain.                                                                                                                                              |
| Owner setup (existing)         | 5 failures per 15 minutes                                                                                                 | Setup-secret-specific persistent attempt bucket | Existing transaction and permanent setup latch; unchanged.                                                                                                                              |
| Better Auth (existing)         | General setting: 30 per 60 seconds; framework endpoint rules may be stricter                                              | Framework request identity                      | Existing Better Auth handler; unchanged.                                                                                                                                                |

Exhausted new limits return **429**, a whole-second **Retry-After** until the
window ends (at least one second), a fixed generic message and
`Cache-Control: private, no-store`. They do not echo or log tokens, network
addresses, email addresses or submitted bodies. Outbox rejections retain their
request correlation ID. No upload, cookie grant, publication, cache expiry,
seed or dispatcher operation occurs on a rejected request.

The new fixed windows are **per process**, capped at 10,000 entries per limiter.
Keys are HMACs under a fresh random process-local key. Expired counters are pruned
on access; capacity pressure evicts the oldest. Restarts, multiple replicas and
eviction therefore reduce the effective protection. These are bounded local
abuse controls, not distributed quotas. No shared-state migration is needed for
this slice; any future distributed limit is a separate design decision.

Network identification uses the existing proxy contract: `x-real-ip`, then the
first `x-forwarded-for` entry. IPv4-mapped addresses normalize to IPv4 and IPv6
counts by /64. **Deployment assumption:** the trusted ingress must overwrite
these headers; the application cannot authenticate arbitrary forwarded headers.
For the new preview/internal limits, absent or invalid metadata uses a shared
`unattributed` failure bucket, so omitting headers cannot bypass rejection
throttling. Exhausting this shared bucket cannot block a valid preview token or
internal credential. Preview configuration errors (503), unsupported content
types (415) and oversized requests (413) retain their responses without spending
the failure allowance. The request-size cap still bounds preview parsing cost.
Subscription fallback behavior remains unchanged. Host browser/integration
acceptance must confirm normal repeated previews succeed and uploads stay below
the documented threshold.
