/**
 * Reviewed per-export authorization inventory. Paths are relative to src; guard symbols include
 * their importing module. The contract test follows local calls and checks imported provenance.
 * Behavioral rejection tests remain the proof of guard order and absence of business side effects.
 */
export interface RouteClassification {
  readonly access:
    | 'public-read'
    | 'owner-session'
    | 'internal-secret'
    | 'webhook'
    | 'auth-framework'
    | 'public-submission'
    | 'token-capability'
    | 'same-origin-cookie'
    | 'local-development'
  readonly guards: readonly (readonly string[])[]
  readonly evidence: readonly string[]
  readonly reason: string
}

const ownerGuard = ['server/owner/api.ts#withOwner', 'server/owner/session.ts#requireOwnerSession']
const ownerOrigin = ['server/owner/api.ts#assertOwnerMutationRequest']
const sharedSecret = ['lib/request-security.ts#secureTokenMatches']
const internalEvidence = ['packages/web/tests/security/internal-route-authorization.test.ts']
const ownerEvidence = ['packages/web/tests/security/owner-route-authorization.test.ts']
const read = (evidence: string): RouteClassification => ({
  access: 'public-read',
  guards: [],
  evidence: [evidence],
  reason: 'Public read; no privileged mutation.',
})
const ownerRead = (evidence: string): RouteClassification => ({
  access: 'owner-session',
  guards: [ownerGuard],
  evidence: [evidence],
  reason: 'Owner authorization before private data access.',
})
const ownerMutation: RouteClassification = {
  access: 'owner-session',
  guards: [ownerGuard, ownerOrigin],
  evidence: ownerEvidence,
  reason: 'Configured owner identity and same-origin request before business side effects.',
}
const internal: RouteClassification = {
  access: 'internal-secret',
  guards: [sharedSecret],
  evidence: internalEvidence,
  reason:
    'Purpose-specific bearer secret before business side effects; failed authentication is rate limited.',
}
const auth: RouteClassification = {
  access: 'auth-framework',
  guards: [['server/owner/auth.ts#getOwnerAuth']],
  evidence: ['packages/web/tests/security/auth-framework-route.test.ts'],
  reason:
    'Better Auth owns per-action authentication, CSRF and rate limits. Sign-in must remain reachable without an owner session.',
}

export const routeClassifications: Readonly<Record<string, RouteClassification>> = {
  'app/api/subscriptions/route.ts#POST': {
    access: 'public-submission',
    guards: [['server/subscriptions/requests.ts#answerSubscriptionRequest']],
    evidence: [
      'packages/web/tests/security/public-route-authorization.test.ts',
      'packages/web/src/server/subscriptions/requests.test.ts',
    ],
    reason:
      'Anonymous intake: same-origin, bounded validated consent payload, network/address limits; no owner privilege is granted.',
  },
  'app/api/vitals/route.ts#POST': {
    access: 'public-submission',
    guards: [['server/analytics/requests.ts#answerVitalsRequest']],
    evidence: [
      'packages/web/tests/security/public-route-authorization.test.ts',
      'packages/web/src/app/api/vitals/route.test.ts',
    ],
    reason:
      'Anonymous telemetry: same-origin and bounded/redacted event payload before constructing a sink.',
  },
  'app/subscriptions/confirm/route.ts#POST': {
    access: 'token-capability',
    guards: [['server/subscriptions/requests.ts#answerConfirmation']],
    evidence: [
      'packages/web/tests/security/public-route-authorization.test.ts',
      'packages/web/src/server/subscriptions/service.test.ts',
    ],
    reason:
      'Service validates the stored, purpose-bound confirmation token before changing subscriber state.',
  },
  'app/subscriptions/unsubscribe/route.ts#POST': {
    access: 'token-capability',
    guards: [['server/subscriptions/requests.ts#answerUnsubscribe']],
    evidence: [
      'packages/web/tests/security/public-route-authorization.test.ts',
      'packages/web/src/server/subscriptions/service.test.ts',
    ],
    reason:
      'Purpose-bound unsubscribe capability supports first-party forms and RFC 8058 mail clients; no origin requirement on these token-authorized requests.',
  },
  'app/api/preview/route.ts#POST': {
    access: 'token-capability',
    guards: [['lib/request-security.ts#previewTokenMatches']],
    evidence: [
      'packages/web/tests/security/preview-authorization.test.ts',
      'packages/web/tests/security/route-rate-limits.test.ts',
    ],
    reason:
      'Expiring, slug-bound preview capability before draft-mode or scoped-cookie effects; only rejected attempts are rate limited.',
  },
  'app/api/preview/disable/route.ts#POST': {
    access: 'same-origin-cookie',
    guards: [['lib/request-security.ts#requestOriginMatches']],
    evidence: ['packages/web/tests/security/preview-authorization.test.ts'],
    reason:
      'Same-origin request may only revoke this browser’s preview cookies; it grants no access and needs no live owner session.',
  },
  'app/owner/sign-in/local-action.ts#signInAsLocalOwner': {
    access: 'local-development',
    guards: [
      ['server/owner/local-fixture.ts#localOwnerFixture'],
      ['lib/request-security.ts#requestOriginMatches'],
    ],
    evidence: ['packages/web/tests/reader/local-owner-sign-in.test.ts'],
    reason:
      'Explicit test runtime, strong fixture configuration, loopback host and same-origin request. Not available in production.',
  },
  'reader-lab/actions.ts#openReaderDirection': {
    access: 'owner-session',
    guards: [
      ['server/owner/session.ts#resolveOwnerSession'],
      ['lib/request-security.ts#requestOriginMatches'],
    ],
    evidence: [
      'packages/web/src/reader-lab/actions.test.ts',
      'packages/web/tests/reader/reader-lab.test.ts',
    ],
    reason:
      'Configured owner identity and same-origin request before content reads or setting the direction cookie.',
  },
  'reader-lab/actions.ts#switchReaderDirection': {
    access: 'owner-session',
    guards: [
      ['server/owner/session.ts#resolveOwnerSession'],
      ['lib/request-security.ts#requestOriginMatches'],
    ],
    evidence: [
      'packages/web/src/reader-lab/actions.test.ts',
      'packages/web/tests/reader/reader-lab.test.ts',
    ],
    reason:
      'Only the configured owner can set a direction; a missing or foreign session may only clear the override as revocation cleanup, after same-origin validation.',
  },
  'reader-lab/actions.ts#exitReaderLab': {
    access: 'same-origin-cookie',
    guards: [['lib/request-security.ts#requestOriginMatches']],
    evidence: [
      'packages/web/src/reader-lab/actions.test.ts',
      'packages/web/tests/reader/reader-lab.test.ts',
    ],
    reason:
      'Same-origin cleanup only clears the lab override; no content write or privilege grant.',
  },
  'reader-lab/compare-actions.ts#openComparedDirection': {
    access: 'owner-session',
    guards: [
      ['server/owner/session.ts#resolveOwnerSession'],
      ['lib/request-security.ts#requestOriginMatches'],
    ],
    evidence: [
      'packages/web/src/reader-lab/actions.test.ts',
      'packages/web/src/reader-lab/compare.test.tsx',
    ],
    reason:
      'Configured owner identity and same-origin request before loading a comparison or changing cookies.',
  },
  'app/api/auth/[...all]/route.ts#GET': auth,
  'app/api/auth/[...all]/route.ts#POST': auth,
  'app/api/auth/[...all]/route.ts#PUT': auth,
  'app/api/auth/[...all]/route.ts#PATCH': auth,
  'app/api/auth/[...all]/route.ts#DELETE': auth,
  'app/api/health/route.ts#GET': read('packages/web/src/app/api/health/route.test.ts'),
  'app/api/media/[id]/route.ts#GET': read('packages/web/tests/reader/media-variant-routes.test.ts'),
  'app/feed.xml/route.ts#GET': read('packages/web/src/app/feed.xml/route.test.ts'),
  'app/robots.txt/route.ts#GET': read('packages/web/src/app/robots.txt/route.test.ts'),
  'app/sitemap.xml/route.ts#GET': read('packages/web/src/app/sitemap.xml/route.test.ts'),
  'app/sitemaps/[page]/route.ts#GET': read('packages/web/src/app/sitemaps/[page]/route.test.ts'),
  'app/subscriptions/confirm/route.ts#GET': read(
    'packages/web/src/server/subscriptions/requests.test.ts',
  ),
  'app/subscriptions/unsubscribe/route.ts#GET': read(
    'packages/web/src/server/subscriptions/requests.test.ts',
  ),
  'app/api/internal/lab-seed/route.ts#POST': internal,
  'app/api/internal/publication-jobs/route.ts#POST': internal,
  'app/api/revalidate/route.ts#POST': internal,
  'app/api/owner/fixture-session/route.ts#POST': internal,
  'app/api/internal/outbox/drain/route.ts#POST': {
    ...internal,
    guards: [['server/outbox/drain.ts#answerOutboxDrainRequest']],
  },
  'app/api/owner/setup/route.ts#POST': {
    access: 'internal-secret',
    guards: [['server/owner/setup.ts#handleOwnerSetup']],
    evidence: [
      'packages/web/tests/security/setup-route-authorization.test.ts',
      'packages/web/src/server/owner/setup.test.ts',
    ],
    reason:
      'One-time setup token and origin gate; its existing persistent five-failure throttle may write only security bookkeeping on denial, never an account or session.',
  },
  'app/api/owner/stories/route.ts#GET': ownerRead(
    'packages/web/src/app/api/owner/stories/routes.test.ts',
  ),
  'app/api/owner/stories/route.ts#POST': ownerMutation,
  'app/api/owner/stories/[id]/route.ts#GET': ownerRead(
    'packages/web/src/app/api/owner/stories/routes.test.ts',
  ),
  'app/api/owner/stories/[id]/route.ts#PATCH': ownerMutation,
  'app/api/owner/stories/[id]/actions/route.ts#POST': ownerMutation,
  'app/api/owner/media/route.ts#GET': ownerRead(
    'packages/web/tests/reader/media-variant-routes.test.ts',
  ),
  'app/api/owner/media/route.ts#POST': ownerMutation,
  'app/api/owner/media/[id]/route.ts#GET': ownerRead(
    'packages/web/tests/reader/media-variant-routes.test.ts',
  ),
  'app/api/owner/subscribers/summary/route.ts#GET': {
    access: 'owner-session',
    guards: [['server/subscriptions/owner-http.ts#subscriberRoute']],
    evidence: ['packages/web/src/server/subscriptions/owner-http.test.ts'],
    reason: 'Shared subscriber handler requires the configured owner before accessing its store.',
  },
  'app/api/owner/subscribers/export/route.ts#POST': {
    ...ownerMutation,
    guards: [['server/subscriptions/owner-http.ts#subscriberRoute']],
  },
  'app/api/owner/subscribers/erase/route.ts#POST': {
    ...ownerMutation,
    guards: [['server/subscriptions/owner-http.ts#subscriberRoute']],
  },
  'reader/components/resolve-error-presentation.ts#resolveErrorPresentation': {
    access: 'public-read',
    guards: [['reader-lab/presentation.ts#resolveReaderPresentation']],
    evidence: ['packages/web/tests/reader/failure-views.test.ts'],
    reason:
      'Read-only action; the resolver requires an owner session for lab identifiers and otherwise returns public defaults. No content or identity is returned.',
  },
}
