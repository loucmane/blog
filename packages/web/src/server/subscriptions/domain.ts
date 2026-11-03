import { domainToASCII } from 'node:url'

/**
 * Where a subscriber stands. A request makes a subscriber pending; following the emailed link
 * confirms them; an unsubscribe link ends the subscription, and a new request starts another.
 */
export const subscriberStatuses = ['confirmed', 'pending', 'unsubscribed'] as const
/** What a token lets its holder do. Each token does one of these, once. */
export const subscriptionTokenPurposes = ['confirm', 'unsubscribe'] as const
/** What the subscription history records. It is only ever appended to. */
export const subscriptionEventTypes = [
  'confirmation-requested',
  'confirmed',
  'unsubscribed',
] as const

export type SubscriberStatus = (typeof subscriberStatuses)[number]
export type SubscriptionTokenPurpose = (typeof subscriptionTokenPurposes)[number]
export type SubscriptionEventType = (typeof subscriptionEventTypes)[number]

export interface Subscriber {
  /** When the current subscription was confirmed; null while it waits for confirmation. */
  readonly confirmedAt: string | null
  readonly createdAt: string
  /**
   * The address in canonical form, one subscriber per address. It is null only once erasure
   * (blog-0045.12) has removed it from a subscriber who is no longer subscribed.
   */
  readonly emailCanonical: string | null
  /** Made by the application, never by an email provider. */
  readonly id: string
  readonly status: SubscriberStatus
  /** When the last subscription ended; null while one is pending or confirmed. */
  readonly unsubscribedAt: string | null
  readonly updatedAt: string
}

/**
 * Consent as it was given: when, where, and to which wording of the consent statement. An
 * unsubscription sets `withdrawnAt` and keeps the record.
 */
export interface SubscriberConsent {
  readonly consentTextVersion: string
  readonly grantedAt: string
  readonly id: string
  readonly source: string
  readonly subscriberId: string
  readonly withdrawnAt: string | null
}

export interface SubscriptionEvent {
  /** The consent a request recorded or a confirmation confirmed; null for an unsubscription. */
  readonly consentId: string | null
  readonly createdAt: string
  readonly id: string
  readonly subscriberId: string
  readonly type: SubscriptionEventType
}

/** A token as stored: its hash and what it may do, never the token itself. */
export interface SubscriptionToken {
  /** The consent a confirmation token confirms; null for an unsubscribe token. */
  readonly consentId: string | null
  readonly consumedAt: string | null
  readonly createdAt: string
  readonly expiresAt: string
  readonly purpose: SubscriptionTokenPurpose
  readonly subscriberId: string
  readonly tokenHash: string
}

const maxAddressLength = 254
const maxLocalPartLength = 64
const maxDomainLength = 253
// The characters HTML's email input accepts in a local part, as RFC 5322 dot-atoms.
const localPartPattern = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/
const domainLabelPattern = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/

/**
 * The canonical form of an address a newsletter can be sent to, or null for anything else. The
 * local part takes the characters HTML's email input accepts; the domain is turned into its ASCII
 * form and needs at least two labels, the last not a number, so no IP literal or local host name
 * gets through. Both parts are lowercased, so an address has one form however it was typed.
 */
export function canonicalEmailAddress(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const address = value.trim()
  if (address.length > maxAddressLength) return null
  const at = address.lastIndexOf('@')
  if (at < 1) return null
  const local = address.slice(0, at)
  if (local.length > maxLocalPartLength || !localPartPattern.test(local)) return null
  const domain = domainToASCII(address.slice(at + 1))
  if (domain.length === 0 || domain.length > maxDomainLength) return null
  const labels = domain.split('.')
  if (labels.length < 2 || !labels.every((label) => domainLabelPattern.test(label))) return null
  if (/^\d+$/.test(labels.at(-1) ?? '')) return null
  const canonical = `${local.toLowerCase()}@${domain}`
  return canonical.length > maxAddressLength ? null : canonical
}
