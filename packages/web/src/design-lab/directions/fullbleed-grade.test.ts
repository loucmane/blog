import { describe, expect, it } from 'vitest'

import {
  contrastRatio,
  deriveFullbleedGrade,
  fullbleedFallbackGrade,
  isSameOriginImageSource,
  relativeLuminance,
} from './fullbleed-grade'

const winterRoomPixels = [
  { blue: 241, green: 231, red: 220 },
  { blue: 55, green: 60, red: 37 },
  { blue: 135, green: 128, red: 112 },
  { blue: 187, green: 189, red: 186 },
] as const

describe('Fullbleed ambient grade', () => {
  it('derives a stable high-chroma palette and contrast-safe scrim from fixture pixels', () => {
    const first = deriveFullbleedGrade(winterRoomPixels)
    const second = deriveFullbleedGrade(winterRoomPixels)

    expect(first).toEqual(second)
    expect(first).toMatchObject({ source: 'sampled' })
    expect(first.primary).toMatch(/^#[0-9A-F]{6}$/)
    expect(first.secondary).toMatch(/^#[0-9A-F]{6}$/)
    expect(first.scrimOpacity).toBeGreaterThanOrEqual(0.42)
    expect(first.scrimOpacity).toBeLessThanOrEqual(0.86)
  })

  it('uses the fixed duo when pixels are missing, neutral, or fail the AA contrast guard', () => {
    expect(deriveFullbleedGrade([])).toEqual(fullbleedFallbackGrade)
    expect(deriveFullbleedGrade([{ blue: 120, green: 120, red: 120 }])).toEqual(
      fullbleedFallbackGrade,
    )
    expect(deriveFullbleedGrade([{ blue: 72, green: 0, red: 0 }])).toEqual(fullbleedFallbackGrade)
    const maximumLuminanceWhiteImage = Array.from({ length: 144 }, () => ({
      blue: 255,
      green: 255,
      red: 255,
    }))
    const signalWhite = { blue: 248, green: 247, red: 246 }
    const imageLuminance = Math.max(...maximumLuminanceWhiteImage.map(relativeLuminance))
    const scrimmedLuminance = imageLuminance * (1 - fullbleedFallbackGrade.scrimOpacity)
    const contrast = (relativeLuminance(signalWhite) + 0.05) / (scrimmedLuminance + 0.05)
    expect(contrast).toBeGreaterThanOrEqual(4.5)
  })

  it('keeps the cyan fallback member at AA contrast for text and actions on carbon', () => {
    const carbon = { blue: 20, green: 17, red: 16 }
    const cyan = { blue: 215, green: 184, red: 25 }

    expect(contrastRatio(cyan, carbon)).toBeGreaterThanOrEqual(4.5)
  })

  it('allows only HTTP images that resolve to the current origin', () => {
    const origin = 'https://north-house.test'
    expect(isSameOriginImageSource('/design-lab/winter-room.svg', origin)).toBe(true)
    expect(isSameOriginImageSource('https://north-house.test/media/lead.jpg', origin)).toBe(true)
    expect(isSameOriginImageSource('https://images.example.com/lead.jpg', origin)).toBe(false)
    expect(isSameOriginImageSource('data:image/png;base64,abc', origin)).toBe(false)
    expect(isSameOriginImageSource('not a valid source', 'not an origin')).toBe(false)
  })
})
