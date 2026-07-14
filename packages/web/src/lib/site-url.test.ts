import { describe, expect, it } from 'vitest'

import { resolveCanonicalSiteUrl, resolveRuntimeSiteUrl, resolveSiteUrl } from './site-url'

describe('site URL resolution', () => {
  it('accepts explicit HTTP and HTTPS origins', () => {
    expect(resolveSiteUrl('https://magazine.example', { environment: 'production' }).href).toBe(
      'https://magazine.example/',
    )
    expect(resolveSiteUrl('http://127.0.0.1:3100', { environment: 'development' }).href).toBe(
      'http://127.0.0.1:3100/',
    )
    expect(resolveSiteUrl('http://localhost:3100', { environment: 'production' }).href).toBe(
      'http://localhost:3100/',
    )
  })

  it('keeps build-time canonical and server runtime origins as separate contracts', () => {
    expect(
      resolveCanonicalSiteUrl('https://canonical.magazine.example', {
        environment: 'production',
      }).href,
    ).toBe('https://canonical.magazine.example/')
    expect(
      resolveRuntimeSiteUrl('https://runtime.magazine.example', {
        environment: 'production',
      }).href,
    ).toBe('https://runtime.magazine.example/')
  })

  it.each([
    undefined,
    '',
    'not-a-url',
    'javascript:alert(1)',
    'https://user:secret@magazine.example',
    'https://magazine.example/path',
    'https://magazine.example?preview=true',
  ])('falls back locally for invalid development origin %s', (value) => {
    expect(resolveSiteUrl(value, { environment: 'development' }).href).toBe(
      'http://localhost:3000/',
    )
  })

  it.each([undefined, '', 'not-a-url', 'http://magazine.example'])(
    'fails closed without a valid HTTPS production origin for %s',
    (value) => {
      expect(resolveSiteUrl(value, { environment: 'production' }).href).toBe(
        'https://unconfigured.magazine.invalid/',
      )
    },
  )
})
