import { describe, expect, it } from 'vitest'

import {
  addressNetwork,
  createSubscriptionRequestLimiter,
  FixedWindowRateLimiter,
  requestNetwork,
  subscriptionRateLimits,
} from './rate-limit'

const minute = 60_000

describe('fixed-window rate limiter', () => {
  it('allows the limit in each window and says how long to wait past it', () => {
    const limiter = new FixedWindowRateLimiter({ limit: 2, windowMs: 10 * minute })
    const start = Date.parse('2026-11-03T09:00:00.000Z')

    expect(limiter.hit('192.0.2.1', start)).toBeNull()
    expect(limiter.hit('192.0.2.1', start + minute)).toBeNull()
    expect(limiter.hit('192.0.2.1', start + 2 * minute)).toBe(8 * 60)
    expect(limiter.hit('192.0.2.1', start + 10 * minute - 1)).toBe(1)
    // Other values count on their own, and a new window starts once the last one has ended.
    expect(limiter.hit('192.0.2.2', start + 2 * minute)).toBeNull()
    expect(limiter.hit('192.0.2.1', start + 10 * minute)).toBeNull()
  })

  it('keeps no counted value readable and drops each counter once its window has ended', () => {
    const limiter = new FixedWindowRateLimiter({ limit: 1, windowMs: minute })
    const start = 1_000_000
    const values = ['198.51.100.7', 'reader@example.com']
    for (const value of values) limiter.hit(value, start)

    // The counters are all the limiter keeps of a request: keyed digests, never the value.
    const counters = (limiter as unknown as { windows: Map<string, unknown> }).windows
    const held = [...counters.keys()]
    expect(held).toHaveLength(2)
    for (const key of held) expect(key).toMatch(/^[A-Za-z0-9_-]{43}$/)
    for (const value of values) expect(JSON.stringify([...counters])).not.toContain(value)

    limiter.hit('203.0.113.9', start + minute)
    expect(limiter.size).toBe(1)
  })

  it('drops the oldest windows when it holds as many as it may', () => {
    const limiter = new FixedWindowRateLimiter({ limit: 1, windowMs: minute }, 2)

    limiter.hit('first', 0)
    limiter.hit('second', 1)
    limiter.hit('third', 2)

    expect(limiter.size).toBe(2)
    // The first window went, so its value starts afresh; the second is still spent.
    expect(limiter.hit('first', 3)).toBeNull()
    expect(limiter.hit('third', 3)).not.toBeNull()
  })

  it('refuses to hold no windows', () => {
    expect(() => new FixedWindowRateLimiter({ limit: 1, windowMs: minute }, 0)).toThrow(RangeError)
  })

  it('limits subscription requests per network and per address, each in its own limiter', () => {
    const limiter = createSubscriptionRequestLimiter()

    expect(subscriptionRateLimits).toEqual({
      address: { limit: 3, windowMs: 60 * minute },
      network: { limit: 10, windowMs: 10 * minute },
    })
    for (let request = 0; request < 3; request += 1) {
      expect(limiter.address.hit('reader@example.com', 0)).toBeNull()
    }
    expect(limiter.address.hit('reader@example.com', 0)).toBe(60 * 60)
    expect(limiter.network.hit('reader@example.com', 0)).toBeNull()
  })
})

describe('request networks', () => {
  it.each([
    ['192.0.2.1', '192.0.2.1'],
    ['::ffff:192.0.2.1', '192.0.2.1'],
    ['::ffff:c000:201', '192.0.2.1'],
    ['2001:db8:85a3:8d3:1319:8a2e:370:7348', '2001:0db8:85a3:08d3::/64'],
    ['2001:DB8:85A3:8D3::1', '2001:0db8:85a3:08d3::/64'],
    ['2001:db8::1', '2001:0db8:0000:0000::/64'],
    ['::1', '0000:0000:0000:0000::/64'],
    ['fe80::1%eth0', 'fe80:0000:0000:0000::/64'],
    ['2001:db8:1:2:3:4:192.0.2.1', '2001:0db8:0001:0002::/64'],
  ])('counts %s as %s', (address, network) => {
    expect(addressNetwork(address)).toBe(network)
  })

  it('puts every IPv6 address of one /64 in the same network', () => {
    expect(addressNetwork('2001:db8:1:2::a')).toBe(addressNetwork('2001:db8:1:2:ffff::b'))
    expect(addressNetwork('2001:db8:1:2::a')).not.toBe(addressNetwork('2001:db8:1:3::a'))
  })

  it.each(['', 'unknown', 'example.com', '192.0.2', '2001:db8::1::2', '192.0.2.1, 198.51.100.1'])(
    'does not take %j for an address',
    (value) => {
      expect(addressNetwork(value)).toBeNull()
    },
  )

  it('reads the proxy headers, x-real-ip first, then the first x-forwarded-for entry', () => {
    expect(
      requestNetwork(
        new Headers({ 'x-forwarded-for': '198.51.100.1, 10.0.0.1', 'x-real-ip': '192.0.2.1' }),
      ),
    ).toBe('192.0.2.1')
    expect(requestNetwork(new Headers({ 'x-forwarded-for': ' 198.51.100.1 , 10.0.0.1' }))).toBe(
      '198.51.100.1',
    )
    expect(
      requestNetwork(new Headers({ 'x-forwarded-for': '2001:db8::1', 'x-real-ip': 'garbage' })),
    ).toBe('2001:0db8:0000:0000::/64')
    expect(requestNetwork(new Headers({ 'x-forwarded-for': 'unknown' }))).toBeNull()
    expect(requestNetwork(new Headers())).toBeNull()
  })
})
