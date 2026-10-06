import { Cormorant_Garamond, Jost } from 'next/font/google'
import { expect, it, vi } from 'vitest'

vi.mock('next/font/google', () => ({
  Cormorant_Garamond: vi.fn(() => ({ variable: 'qm-display-variable' })),
  Jost: vi.fn(() => ({ variable: 'qm-text-variable' })),
}))

it('keeps adjusted fallbacks and prevents late font swaps without preloading inactive directions', async () => {
  await import('./fonts')
  for (const loader of [Cormorant_Garamond, Jost]) {
    expect(loader).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        adjustFontFallback: true,
        display: 'optional',
        preload: false,
      }),
    )
  }
})
