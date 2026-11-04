import { z } from 'zod'

import { readBoundedJson, requestOriginMatches } from '@/lib/request-security'

import { defaultConsentSource, isConsentSource, subscriptionConsent } from './consent'
import { canonicalEmailAddress, type SubscriptionTokenPurpose } from './domain'
import { renderSubscriptionPage, type SubscriptionPage } from './pages'
import { requestNetwork, type SubscriptionRequestLimiter } from './rate-limit'
import type { ConfirmOutcome, SubscriptionService, UnsubscribeOutcome } from './service'
import { isSubscriptionToken, subscriptionLinkPath } from './tokens'

/*
 * The HTTP side of subscriptions (blog-0045.9). `app/api/subscriptions` hands its POST requests to
 * `answerSubscriptionRequest`; `app/subscriptions/confirm` and `app/subscriptions/unsubscribe`
 * answer the links the emails carry. The answers are JSON and plain pages: the designed form and
 * pages belong to the subscription surfaces (blog-0045.15).
 */

export const maxSubscriptionRequestBytes = 2_048

const privateHeaders = {
  'cache-control': 'private, no-store',
  'referrer-policy': 'no-referrer',
  'x-robots-tag': 'noindex, nofollow',
} as const

const subscriptionRequestSchema = z
  .object({
    consentTextVersion: z.string().max(64),
    email: z.string().max(320),
    source: z.string().max(64).optional(),
  })
  .strict()

function json(
  status: number,
  body: Readonly<Record<string, string>>,
  headers: Readonly<Record<string, string>> = {},
): Response {
  return new Response(JSON.stringify(body), {
    headers: { ...privateHeaders, 'content-type': 'application/json; charset=utf-8', ...headers },
    status,
  })
}

function errorCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    if (typeof error.code === 'string') return error.code
  }
  return error instanceof Error ? error.name : 'unknown'
}

/**
 * The answer to every accepted request: the same bytes for an address that is new, waiting to
 * confirm, confirmed or unsubscribed. It says what to do in each case without saying which case it
 * is, so the form cannot be used to learn who subscribes.
 */
export function subscriptionAccepted(): Response {
  return json(202, {
    message:
      'Thank you. If this address still has to confirm its subscription, look for our email with the link to confirm it.',
  })
}

/** The answer while subscriptions have no store to write to. */
export function subscriptionsUnavailable(): Response {
  return json(503, { error: 'Subscriptions are unavailable right now. Try again later.' })
}

function tooManyRequests(retryAfterSeconds: number): Response {
  return json(
    429,
    { error: 'Too many requests. Wait a few minutes, then try again.' },
    { 'retry-after': String(retryAfterSeconds) },
  )
}

export interface SubscriptionRequestDependencies {
  readonly limiter: SubscriptionRequestLimiter
  /** The time a request is counted at, in milliseconds since the epoch. */
  readonly now?: () => number
  readonly service: Pick<SubscriptionService, 'subscribe'>
  /** The origin the form is served from; a request from anywhere else is refused. */
  readonly siteUrl: URL
}

/**
 * Answers a subscription request: a JSON POST from the site's own pages, counted against its
 * network's limit before anything else is read (when the proxy reports a network), and against its
 * address's limit once the address is known. A request that passes both goes to the service, and
 * whatever the service makes of it, the answer is `subscriptionAccepted`.
 */
export async function answerSubscriptionRequest(
  request: Request,
  dependencies: SubscriptionRequestDependencies,
): Promise<Response> {
  if (
    !requestOriginMatches(
      request.headers.get('origin'),
      dependencies.siteUrl,
      request.headers.get('sec-fetch-site'),
    )
  ) {
    return json(403, { error: 'Subscribe with the form on this site.' })
  }
  const contentType = request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase()
  if (contentType !== 'application/json') {
    return json(415, { error: 'Subscription requests must use JSON.' })
  }
  const now = (dependencies.now ?? Date.now)()
  const network = requestNetwork(request.headers)
  const networkWait = network === null ? null : dependencies.limiter.network.hit(network, now)
  if (networkWait !== null) return tooManyRequests(networkWait)

  const body = await readBoundedJson(request, maxSubscriptionRequestBytes)
  if (!body.ok) {
    return body.reason === 'too-large'
      ? json(413, { error: 'The subscription request is too large.' })
      : json(400, { error: 'The subscription request is not valid.' })
  }
  const fields = subscriptionRequestSchema.safeParse(body.value)
  const source = fields.success ? (fields.data.source ?? defaultConsentSource) : ''
  if (!fields.success || !isConsentSource(source)) {
    return json(400, { error: 'The subscription request is not valid.' })
  }
  const email = canonicalEmailAddress(fields.data.email)
  if (!email) return json(400, { error: 'Enter a valid email address.' })
  if (fields.data.consentTextVersion !== subscriptionConsent.version) {
    return json(409, {
      error: 'The consent statement has changed. Reload the page, then try again.',
    })
  }
  const addressWait = dependencies.limiter.address.hit(email, now)
  if (addressWait !== null) return tooManyRequests(addressWait)

  try {
    await dependencies.service.subscribe({
      consentTextVersion: fields.data.consentTextVersion,
      email,
      source,
    })
  } catch (error) {
    // The code alone: a database error can quote the address it refused.
    console.error(`A subscription request could not be stored (${errorCode(error)}).`)
    return subscriptionsUnavailable()
  }
  return subscriptionAccepted()
}

interface LinkAnswer {
  readonly page: SubscriptionPage
  readonly status: number
}

interface LinkAnswers<Outcome extends string> {
  /** The page a link opens: it asks for the button press that acts. */
  readonly ask: { readonly button: string; readonly heading: string; readonly message: string }
  readonly outcomes: Readonly<Record<Outcome, LinkAnswer>>
  readonly purpose: SubscriptionTokenPurpose
}

const confirmationAnswers: LinkAnswers<ConfirmOutcome> = {
  ask: {
    button: 'Confirm my subscription',
    heading: 'Confirm your subscription',
    message: 'Press the button to confirm that this address should receive the newsletter.',
  },
  outcomes: {
    'already-confirmed': {
      page: {
        heading: 'Subscription confirmed',
        message: 'This subscription is already confirmed.',
      },
      status: 200,
    },
    confirmed: {
      page: {
        heading: 'Subscription confirmed',
        message:
          'Thank you. The newsletter will come to this address, and every issue has a link to unsubscribe.',
      },
      status: 200,
    },
    expired: {
      page: {
        heading: 'This link has expired',
        message: 'A confirmation link works for three days. Subscribe again to get a new one.',
      },
      status: 410,
    },
    invalid: {
      page: {
        heading: 'This link does not work',
        message: 'It may have been used already. Subscribe again to get a new confirmation link.',
      },
      status: 404,
    },
  },
  purpose: 'confirm',
}

const unsubscribeAnswers: LinkAnswers<UnsubscribeOutcome> = {
  ask: {
    button: 'Unsubscribe',
    heading: 'Unsubscribe from the newsletter',
    message: 'Press the button and the newsletter will no longer be sent to this address.',
  },
  outcomes: {
    'already-unsubscribed': {
      page: {
        heading: 'You are unsubscribed',
        message: 'The newsletter is no longer sent to this address.',
      },
      status: 200,
    },
    expired: {
      page: {
        heading: 'This link has expired',
        message: 'Use the unsubscribe link in a more recent newsletter.',
      },
      status: 410,
    },
    invalid: {
      page: {
        heading: 'This link does not work',
        message: 'Use the unsubscribe link in a more recent newsletter.',
      },
      status: 404,
    },
    unsubscribed: {
      page: {
        heading: 'You are unsubscribed',
        message:
          'The newsletter will no longer be sent to this address. You can subscribe again at any time.',
      },
      status: 200,
    },
  },
  purpose: 'unsubscribe',
}

const unavailableAnswer: LinkAnswer = {
  page: {
    heading: 'Please try again',
    message: 'This could not be done just now. Open the link again in a few minutes.',
  },
  status: 503,
}

function page({ page: content, status }: LinkAnswer): Response {
  return new Response(renderSubscriptionPage(content), {
    headers: { ...privateHeaders, 'content-type': 'text/html; charset=utf-8' },
    status,
  })
}

function linkToken(request: Request): string | null {
  return new URL(request.url).searchParams.get('token')
}

/**
 * GET: the page a link opens, with one button that posts the link back. Opening it changes
 * nothing, so a mail scanner or a prefetch that follows the link cannot act on it.
 */
function askPage(request: Request, answers: LinkAnswers<'invalid'>): Response {
  const token = linkToken(request)
  if (!isSubscriptionToken(token)) return page(answers.outcomes.invalid)
  return page({
    page: {
      form: { action: subscriptionLinkPath(answers.purpose, token), button: answers.ask.button },
      heading: answers.ask.heading,
      message: answers.ask.message,
    },
    status: 200,
  })
}

/** POST: acts on the link's token in one step, and says what became of it. */
async function act<Outcome extends string>(
  request: Request,
  answers: LinkAnswers<Outcome>,
  run: ((token: string | null) => Promise<Outcome>) | null,
): Promise<Response> {
  if (!run) return page(unavailableAnswer)
  let outcome: Outcome
  try {
    outcome = await run(linkToken(request))
  } catch (error) {
    console.error(`A subscription link could not be answered (${errorCode(error)}).`)
    return page(unavailableAnswer)
  }
  return page(answers.outcomes[outcome])
}

/** Opens a confirmation link. */
export function answerConfirmationLink(request: Request): Response {
  return askPage(request, confirmationAnswers)
}

/** Confirms the subscription the link's token was issued for. */
export function answerConfirmation(
  request: Request,
  service: Pick<SubscriptionService, 'confirm'> | null,
): Promise<Response> {
  return act(request, confirmationAnswers, service && ((token) => service.confirm({ token })))
}

/** Opens an unsubscribe link. */
export function answerUnsubscribeLink(request: Request): Response {
  return askPage(request, unsubscribeAnswers)
}

/**
 * Ends the subscription the link's token belongs to. It answers the page's button and also a mail
 * client's one-click unsubscribe (RFC 8058), which posts `List-Unsubscribe=One-Click` to the same
 * link: the token travels in the link either way, and the body is not read.
 */
export function answerUnsubscribe(
  request: Request,
  service: Pick<SubscriptionService, 'unsubscribe'> | null,
): Promise<Response> {
  return act(request, unsubscribeAnswers, service && ((token) => service.unsubscribe({ token })))
}
