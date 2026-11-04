import { describe, expect, it } from 'vitest'

import { canonicalEmailAddress } from './domain'

describe('canonical email addresses', () => {
  it.each([
    ['reader@example.com', 'reader@example.com'],
    ['  Reader.Name+News@Example.COM ', 'reader.name+news@example.com'],
    ["o'brien_99@mail.example.org", "o'brien_99@mail.example.org"],
    ['first.last@sub-domain.example.co.uk', 'first.last@sub-domain.example.co.uk'],
    ['reader@bücher.example', 'reader@xn--bcher-kva.example'],
    ['reader@BÜCHER.example', 'reader@xn--bcher-kva.example'],
  ])('writes %j as %j', (typed, canonical) => {
    expect(canonicalEmailAddress(typed)).toBe(canonical)
  })

  it('gives one form to every way an address is typed', () => {
    const forms = ['Reader@Example.com', 'reader@EXAMPLE.COM', ' READER@example.com'].map(
      canonicalEmailAddress,
    )

    expect(new Set(forms)).toEqual(new Set(['reader@example.com']))
  })

  it.each([
    ['not a string', 42],
    ['an empty value', ''],
    ['no at sign', 'reader.example.com'],
    ['no local part', '@example.com'],
    ['no domain', 'reader@'],
    ['a one-label domain', 'reader@localhost'],
    ['an IP literal', 'reader@[192.0.2.1]'],
    ['a numeric domain', 'reader@192.0.2.1'],
    ['a numeric top-level label', 'reader@example.123'],
    ['a space in the local part', 'first last@example.com'],
    ['a leading dot', '.reader@example.com'],
    ['a trailing dot', 'reader.@example.com'],
    ['two dots in a row', 'first..last@example.com'],
    ['a quoted local part', '"reader"@example.com'],
    ['a second at sign', 'reader@home@example.com'],
    ['a non-ASCII local part', 'léa@example.com'],
    ['an underscore in the domain', 'reader@mail_server.example.com'],
    ['a label starting with a hyphen', 'reader@-example.com'],
    ['a trailing dot after the domain', 'reader@example.com.'],
    ['a control character', 'reader\u0000@example.com'],
    ['a line break', 'reader@example.com\nBcc: other@example.com'],
    ['a local part over 64 characters', `${'a'.repeat(65)}@example.com`],
    [
      'an address over 254 characters',
      `reader@${'a'.repeat(63)}.${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(60)}.com`,
    ],
  ])('refuses %s', (_case, value) => {
    expect(canonicalEmailAddress(value)).toBeNull()
  })
})
