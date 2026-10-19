import { describe, expect, it } from 'vitest'

import { safeHref } from './safe-url'

describe('safe link addresses', () => {
  it.each([
    'https://studio.example/credits',
    'http://studio.example/',
    'mailto:pictures@studio.example',
  ])('keeps the web or email address %s as it was given', (value) => {
    expect(safeHref(value)).toBe(value)
  })

  it.each([
    'javascript:alert(1)',
    'JavaScript:alert(document.cookie)',
    ' javascript:alert(1)',
    'java\tscript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
    '//studio.example/credits',
    '/credits',
    'studio.example',
    '',
  ])('refuses %j, which is not a full web or email address', (value) => {
    expect(safeHref(value)).toBeNull()
  })

  it.each([null, undefined, 42, { href: 'https://studio.example/' }])(
    'refuses %j, which is not text',
    (value) => {
      expect(safeHref(value)).toBeNull()
    },
  )
})
