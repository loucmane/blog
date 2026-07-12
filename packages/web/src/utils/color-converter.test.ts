import { describe, expect, it } from 'vitest'

import { rgbToHsl } from './color-converter'

describe('rgbToHsl', () => {
  it.each([
    ['255 0 0', '0 100% 50%'],
    ['0 255 0', '120 100% 50%'],
    ['0 0 255', '240 100% 50%'],
    ['128 128 128', '0 0% 50%'],
  ])('converts %s to %s', (rgb, expected) => {
    expect(rgbToHsl(rgb)).toBe(expected)
  })

  it('rejects missing or nonnumeric channels', () => {
    expect(() => rgbToHsl('255 0')).toThrow(TypeError)
    expect(() => rgbToHsl('255 blue 0')).toThrow(TypeError)
  })
})
