import { resolveRuntimeSiteUrl } from '../../lib/site-url'
import type { ContentRepository } from '../content/ports'
import { PostgresContentRepository } from '../database/postgres-content-repository'
import { PostgresSubscriptionStore } from '../database/postgres-subscriptions'
import { getOwnerRuntime } from '../owner/runtime'
import { getSubscriptionRuntime } from '../subscriptions/runtime'
import { SubscriptionService } from '../subscriptions/service'
import { consoleEmailSender } from './console'
import type { EmailMessageDependencies } from './messages'
import type { EmailSender } from './ports'

export interface EmailDeliveryDependencies extends EmailMessageDependencies {
  readonly sender: EmailSender
}

/**
 * Default delivery for the dispatcher's own content store. PostgreSQL subscriptions share that
 * repository; owner test mode must reuse its existing subscription store, never a fresh empty
 * one. Independent in-memory fixtures inject dependencies explicitly. No provider credentials
 * or network transport are needed; a future adapter replaces only the sender at this seam.
 */
export function emailDeliveryFor(content: ContentRepository): EmailDeliveryDependencies {
  let subscriptions: EmailMessageDependencies['subscriptions']
  if (content instanceof PostgresContentRepository) {
    subscriptions = new SubscriptionService(new PostgresSubscriptionStore(content))
  } else {
    if (getOwnerRuntime().repository !== content) {
      throw new Error('Email delivery requires subscriptions for the dispatcher content store.')
    }
    const runtime = getSubscriptionRuntime()
    if (!runtime) throw new Error('Email delivery requires the subscription runtime.')
    subscriptions = runtime.service
  }
  return { sender: consoleEmailSender, siteUrl: resolveRuntimeSiteUrl(), subscriptions }
}
