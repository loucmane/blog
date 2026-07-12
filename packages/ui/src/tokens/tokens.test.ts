import { describe, expect, it } from 'vitest'

import { between, maxWidth, minWidth } from './breakpoints'
import { rgbToHex, withOpacity } from './colors'

describe('design token helpers', () => {
  it('converts RGB channels to a hexadecimal color', () => {
    expect(rgbToHex('42 157 143')).toBe('#2a9d8f')
  })

  it('rejects malformed RGB input', () => {
    expect(() => rgbToHex('42 157')).toThrow(TypeError)
    expect(() => rgbToHex('42 invalid 143')).toThrow(TypeError)
  })

  it('creates opacity-aware colors', () => {
    expect(withOpacity('42 157 143', 0.5)).toBe('rgb(42 157 143 / 0.5)')
  })

  it('creates deterministic breakpoint queries', () => {
    expect(minWidth('md')).toBe('(min-width: 768px)')
    expect(maxWidth('wide')).toBe('(max-width: 1440px)')
    expect(between('sm', 'xl')).toBe('(min-width: 640px) and (max-width: 1280px)')
  })
})
