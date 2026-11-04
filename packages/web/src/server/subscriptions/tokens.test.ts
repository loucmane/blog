import { createHash } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import {
  createSubscriptionToken,
  hashSubscriptionToken,
  isSubscriptionToken,
  subscriptionLink,
  subscriptionLinkPath,
  subscriptionTokenLifetimesMs,
} from './tokens'

describe('subscription tokens', () => {
  it('makes a new 256-bit token every time, in a form a link carries as it is', () => {
    const tokens = Array.from({ length: 50 }, createSubscriptionToken)

    expect(new Set(tokens).size).toBe(50)
    for (const token of tokens) {
      expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/)
      expect(Buffer.from(token, 'base64url')).toHaveLength(32)
      expect(isSubscriptionToken(token)).toBe(true)
    }
  })

  it.each([
    ['nothing', undefined],
    ['a number', 7],
    ['an empty string', ''],
    ['a short value', 'abc'],
    ['a padded value', `${'a'.repeat(42)}=`],
    ['a longer value', 'a'.repeat(44)],
    ['characters outside base64url', `${'a'.repeat(42)}+`],
  ])('does not take %s for a token', (_case, value) => {
    expect(isSubscriptionToken(value)).toBe(false)
  })

  it('stores only a SHA-256 of the token, under a label that scopes it to one purpose', () => {
    const token = createSubscriptionToken()
    const confirm = hashSubscriptionToken(token, 'confirm')
    const unsubscribe = hashSubscriptionToken(token, 'unsubscribe')

    expect(confirm).toMatch(/^[0-9a-f]{64}$/)
    expect(confirm).toBe(
      createHash('sha256').update(`magazine-subscription-token:confirm:${token}`).digest('hex'),
    )
    // The same token can never find a row of the other purpose, and the hash never shows it.
    expect(unsubscribe).not.toBe(confirm)
    expect(confirm).not.toContain(token)
    expect(hashSubscriptionToken(token, 'confirm')).toBe(confirm)
  })

  it('links each purpose to its own route on the site', () => {
    const token = createSubscriptionToken()

    expect(subscriptionLinkPath('confirm', token)).toBe(`/subscriptions/confirm?token=${token}`)
    expect(subscriptionLink(new URL('https://magazine.example/'), 'unsubscribe', token).href).toBe(
      `https://magazine.example/subscriptions/unsubscribe?token=${token}`,
    )
  })

  it('lets a confirmation link work for three days and an unsubscribe link for a year', () => {
    const day = 24 * 60 * 60_000

    expect(subscriptionTokenLifetimesMs).toEqual({ confirm: 3 * day, unsubscribe: 365 * day })
  })
})
