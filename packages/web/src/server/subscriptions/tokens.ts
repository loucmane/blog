import { createHash, randomBytes } from 'node:crypto'

import type { SubscriptionTokenPurpose } from './domain'

const day = 24 * 60 * 60_000
const tokenBytes = 32
// 32 random bytes in base64url, which Node writes without padding.
const tokenPattern = /^[A-Za-z0-9_-]{43}$/

/**
 * How long a token works after it is issued. A confirmation link is sent once, when the request is
 * fresh; an unsubscribe link sits in a newsletter for as long as someone may keep the email.
 */
export const subscriptionTokenLifetimesMs: Readonly<Record<SubscriptionTokenPurpose, number>> = {
  confirm: 3 * day,
  unsubscribe: 365 * day,
}

const linkPaths: Readonly<Record<SubscriptionTokenPurpose, string>> = {
  confirm: '/subscriptions/confirm',
  unsubscribe: '/subscriptions/unsubscribe',
}

/** A new token: 32 random bytes. It goes into one email and is never stored; its hash is. */
export function createSubscriptionToken(): string {
  return randomBytes(tokenBytes).toString('base64url')
}

/** Whether a value has the shape of a token, so nothing else is ever hashed or looked up. */
export function isSubscriptionToken(value: unknown): value is string {
  return typeof value === 'string' && tokenPattern.test(value)
}

/**
 * The stored form of a token: its SHA-256 under a label that names its purpose. The same token
 * hashes differently for each purpose, so it can only ever find a row of the action it was made for.
 */
export function hashSubscriptionToken(token: string, purpose: SubscriptionTokenPurpose): string {
  return createHash('sha256')
    .update(`magazine-subscription-token:${purpose}:${token}`)
    .digest('hex')
}

/** The path, token included, of the route a token's link leads to. */
export function subscriptionLinkPath(purpose: SubscriptionTokenPurpose, token: string): string {
  return `${linkPaths[purpose]}?${new URLSearchParams({ token })}`
}

/** The link an email carries for a token; the email handlers (blog-0045.10) send these. */
export function subscriptionLink(
  siteUrl: URL,
  purpose: SubscriptionTokenPurpose,
  token: string,
): URL {
  return new URL(subscriptionLinkPath(purpose, token), siteUrl)
}
