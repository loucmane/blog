import type { OutboxEvent } from '../content/domain'
import type { ContentRepository } from '../content/ports'
import { loadPublishedStory } from '../content/reader'
import { storyPath } from '../distribution/canonical'
import type { SubscriptionService } from '../subscriptions/service'
import { subscriptionLink } from '../subscriptions/tokens'
import type { OutboundEmail } from './ports'

/** The subscription operations delivery needs, independent of the database or email transport. */
export interface EmailMessageDependencies {
  readonly siteUrl: URL
  readonly subscriptions: Pick<SubscriptionService, 'prepareConfirmation' | 'issueUnsubscribeToken'>
}

function payloadId(event: OutboxEvent, field: string): string {
  const value = event.payload[field]
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`The ${event.type} event carries no ${field}.`)
  }
  return value
}

function html(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

/** A confirmation asks for opt-in; a pending subscription has no unsubscribe token yet. */
export async function confirmationMessage(
  dependencies: EmailMessageDependencies,
  event: OutboxEvent,
): Promise<OutboundEmail | null> {
  const subscriberId = payloadId(event, 'subscriberId')
  if (event.aggregateId !== subscriberId) throw new Error('Confirmation subscriber does not match.')
  const issued = await dependencies.subscriptions.prepareConfirmation({
    consentId: payloadId(event, 'consentId'),
    subscriberId,
  })
  if (!issued) return null
  const link = subscriptionLink(dependencies.siteUrl, 'confirm', issued.token).href
  return {
    recipient: issued.email,
    subject: 'Confirm your newsletter subscription',
    text: `Confirm your subscription: ${link}\n\nIf you did not ask to subscribe, ignore this email.`,
    html: `<p><a href="${html(link)}">Confirm your subscription</a></p><p>If you did not ask to subscribe, ignore this email.</p>`,
    listUnsubscribe: null,
    listUnsubscribePost: null,
  }
}

/**
 * An issue event is one recipient's copy, with payload { subscriberId, articleId, revisionId }.
 * Only the named published revision is eligible; a late event never sends a draft, a withdrawn
 * story or a replacement revision. Publication alone does not queue a subscriber broadcast.
 */
export async function issueMessage(
  dependencies: EmailMessageDependencies,
  content: ContentRepository,
  event: OutboxEvent,
): Promise<OutboundEmail | null> {
  const subscriberId = payloadId(event, 'subscriberId')
  const articleId = payloadId(event, 'articleId')
  const revisionId = payloadId(event, 'revisionId')
  if (event.aggregateId !== articleId) throw new Error('Issue article does not match.')
  const story = await content.transaction(async (transaction) => {
    const article = await transaction.getArticle(articleId)
    if (!article) return null
    const published = await loadPublishedStory(transaction, article.slug)
    return published?.article.id === articleId && published.revision.id === revisionId
      ? published
      : null
  })
  if (!story) return null
  const issued = await dependencies.subscriptions.issueUnsubscribeToken({ subscriberId })
  if (!issued) return null
  const link = new URL(storyPath(story.article.slug), dependencies.siteUrl).href
  const unsubscribe = subscriptionLink(dependencies.siteUrl, 'unsubscribe', issued.token).href
  const title = story.revision.document.title.replace(/[\r\n]+/g, ' ')
  return {
    recipient: issued.email,
    subject: title,
    text: `${title}\n\nRead the story: ${link}\n\nUnsubscribe: ${unsubscribe}`,
    html: `<h1>${html(title)}</h1><p><a href="${html(link)}">Read the story</a></p><p><a href="${html(unsubscribe)}">Unsubscribe</a></p>`,
    listUnsubscribe: `<${unsubscribe}>`,
    listUnsubscribePost: 'List-Unsubscribe=One-Click',
  }
}
