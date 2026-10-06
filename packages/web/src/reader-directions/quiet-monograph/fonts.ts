import { Cormorant_Garamond, Jost } from 'next/font/google'

const display = Cormorant_Garamond({
  adjustFontFallback: true,
  display: 'swap',
  preload: false,
  subsets: ['latin'],
  variable: '--font-qm-display',
  weight: ['400', '500'],
})

const text = Jost({
  adjustFontFallback: true,
  display: 'swap',
  preload: false,
  subsets: ['latin'],
  variable: '--font-qm-text',
  weight: ['300', '400', '500'],
})

export const fonts = [display, text]
