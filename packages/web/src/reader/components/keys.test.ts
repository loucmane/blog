import { describe, expect, it } from 'vitest'

import { withContentKeys } from './keys'

describe('content keys', () => {
  it('derives stable keys from content and numbers repeated items', () => {
    const items = [{ kind: 'divider' }, { kind: 'paragraph', text: 'One' }, { kind: 'divider' }]

    const keyed = withContentKeys(items)
    const keys = keyed.map(({ key }) => key)

    expect(keyed.map(({ item }) => item)).toEqual(items)
    expect(new Set(keys).size).toBe(3)
    expect(keys[2]).toBe(`${keys[0]}-1`)
    expect(withContentKeys(items).map(({ key }) => key)).toEqual(keys)
  })
})
