import { Cormorant_Garamond, Jost } from 'next/font/google'

// Keep the adjusted fallback for this navigation if a font misses first layout.
// Swapping later reflows the article heading even with Next's metric overrides.
const display = Cormorant_Garamond({
  adjustFontFallback: true,
  display: 'optional',
  preload: false,
  subsets: ['latin'],
  variable: '--font-qm-display',
  weight: ['400', '500'],
})

const text = Jost({
  adjustFontFallback: true,
  display: 'optional',
  preload: false,
  subsets: ['latin'],
  variable: '--font-qm-text',
  weight: ['300', '400', '500'],
})

export const fonts = [display, text]
