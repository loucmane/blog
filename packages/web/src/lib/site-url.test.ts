import { describe, expect, it } from 'vitest'

import { resolveSiteUrl } from './site-url'

describe('site URL resolution', () => {
  it('accepts explicit HTTP and HTTPS origins', () => {
    expect(resolveSiteUrl('https://magazine.example').href).toBe('https://magazine.example/')
    expect(resolveSiteUrl('http://127.0.0.1:3100').href).toBe('http://127.0.0.1:3100/')
  })

  it.each([undefined, '', 'not-a-url', 'javascript:alert(1)'])(
    'falls back safely for %s',
    (value) => {
      expect(resolveSiteUrl(value).href).toBe('http://localhost:3000/')
    },
  )
})
