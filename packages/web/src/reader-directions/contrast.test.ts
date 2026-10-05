import { describe, expect, it } from 'vitest'

import { contrastRatio, relativeLuminance, wcagTextContrast } from './contrast'

describe('WCAG text contrast', () => {
  it('measures the extremes and the AA boundary for text', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 5)
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5)
    expect(contrastRatio('#767676', '#ffffff')).toBeGreaterThanOrEqual(wcagTextContrast)
    expect(contrastRatio('#777777', '#ffffff')).toBeLessThan(wcagTextContrast)
    expect(wcagTextContrast).toBe(4.5)
  })

  it('reads hex, rgb(), and oklch() colors', () => {
    expect(relativeLuminance('#fff')).toBeCloseTo(1, 5)
    expect(relativeLuminance('#FFFFFF')).toBeCloseTo(1, 5)
    expect(relativeLuminance('#ffffffff')).toBeCloseTo(1, 5)
    expect(relativeLuminance('rgb(255 255 255)')).toBeCloseTo(1, 5)
    expect(relativeLuminance('rgb(255, 0, 0)')).toBeCloseTo(0.2126, 4)
    expect(relativeLuminance('rgb(100% 0% 0%)')).toBeCloseTo(0.2126, 4)
    expect(relativeLuminance('oklch(1 0 0)')).toBeCloseTo(1, 3)
    expect(relativeLuminance('oklch(0% 0 0)')).toBeCloseTo(0, 5)
    expect(contrastRatio('oklch(62.8% 0.2577 29.23)', '#ff0000')).toBeCloseTo(1, 2)
    expect(contrastRatio('oklch(0.22 0.028 258)', 'oklch(0.985 0.008 86)')).toBeGreaterThan(14)
  })

  it('refuses colors whose contrast it cannot measure', () => {
    for (const value of [
      'red',
      '#ff000080',
      '#12345',
      'rgb(0 0 0 / 50%)',
      'rgb(300 0 0)',
      'oklch(0.5 0.1 200 / 0.4)',
      'hsl(0 0% 0%)',
      'var(--ink)',
      '',
    ]) {
      expect(() => relativeLuminance(value), value).toThrow(/cannot measure/)
    }
  })
})
