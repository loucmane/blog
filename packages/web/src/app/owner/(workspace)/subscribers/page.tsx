import type { Metadata } from 'next'
import { headers } from 'next/headers'

import { correlationIdFrom, createLogger } from '@/server/observability/logger'
import { requireOwnerPageSession } from '@/server/owner/session'
import {
  OwnerSubscriberOperations,
  subscriberMessages,
} from '@/server/subscriptions/owner-operations'
import { getSubscriptionRuntime } from '@/server/subscriptions/runtime'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Subscribers', robots: { index: false, follow: false } }

const inputClass =
  'mt-2 block min-h-11 w-full rounded-md border border-border bg-background px-3 py-2'
const buttonClass = 'min-h-11 rounded-md bg-primary px-4 py-3 font-semibold text-primary-foreground'

export default async function OwnerSubscribersPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ readonly result?: string }>
}) {
  await requireOwnerPageSession()
  const logger = createLogger({ correlationId: correlationIdFrom(await headers()) })
  const runtime = getSubscriptionRuntime()
  let summary = null
  try {
    if (runtime) summary = await new OwnerSubscriberOperations(runtime.store, logger).summary()
  } catch (error) {
    logger.error('subscriber.summary.failed', { error })
  }
  const { result } = await searchParams
  const message =
    result && Object.hasOwn(subscriberMessages, result)
      ? subscriberMessages[result as keyof typeof subscriberMessages]
      : null
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header className="space-y-3">
        <h1 className="font-serif text-3xl font-semibold">Subscribers</h1>
        {summary ? (
          <p>
            {summary.confirmed} confirmed, {summary.pending} waiting for confirmation, and{' '}
            {summary.unsubscribed} unsubscribed.{' '}
            {summary.newestSubscriptionAt ? (
              <>
                The newest subscription was requested on{' '}
                <time dateTime={summary.newestSubscriptionAt}>
                  {summary.newestSubscriptionAt.slice(0, 10)}
                </time>
                .
              </>
            ) : (
              'There are no subscriptions yet.'
            )}
          </p>
        ) : (
          <p role="status">{subscriberMessages.unavailable}</p>
        )}
        <p>
          Email addresses are not listed here. Use an address supplied by the subscriber to handle
          their request.
        </p>
      </header>
      {message && (
        <p role="status" className="rounded-md border border-border bg-card p-4">
          {message}
        </p>
      )}
      <section
        aria-labelledby="export-title"
        className="space-y-4 rounded-lg border border-border bg-card p-6"
      >
        <h2 id="export-title" className="font-serif text-2xl font-semibold">
          Export one subscriber
        </h2>
        <p>
          Download their subscription and consent history as a JSON file. Keep this personal
          information private.
        </p>
        <form action="/api/owner/subscribers/export" method="post" className="space-y-4">
          <label className="block" htmlFor="export-email">
            Email address to export
            <input
              id="export-email"
              name="email"
              type="email"
              autoComplete="off"
              maxLength={254}
              required
              className={inputClass}
            />
          </label>
          <button type="submit" className={buttonClass}>
            Download subscriber data
          </button>
        </form>
      </section>
      <section
        aria-labelledby="erase-title"
        className="space-y-4 rounded-lg border border-border bg-card p-6"
      >
        <h2 id="erase-title" className="font-serif text-2xl font-semibold">
          Delete one subscriber’s personal data
        </h2>
        <p id="erase-explanation">
          This removes their email address and subscription links and stops their subscription. This
          cannot be undone here. We keep an anonymized record of the consent wording and when
          consent was given and withdrawn, along with the subscription history.
        </p>
        <form
          action="/api/owner/subscribers/erase"
          method="post"
          aria-describedby="erase-explanation"
          className="space-y-4"
        >
          <label className="block" htmlFor="erase-email">
            Email address to delete
            <input
              id="erase-email"
              name="email"
              type="email"
              autoComplete="off"
              maxLength={254}
              required
              className={inputClass}
            />
          </label>
          <label className="block" htmlFor="confirm-email">
            Type the email address again to confirm
            <input
              id="confirm-email"
              name="confirmation"
              type="email"
              autoComplete="off"
              maxLength={254}
              required
              className={inputClass}
            />
          </label>
          <button type="submit" className={buttonClass}>
            Delete personal data
          </button>
        </form>
      </section>
    </div>
  )
}
