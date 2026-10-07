// Offline maintenance tool, never imported by the registry or runtime.
// Reproduces next/font/google's adjustFontFallback from the installed Next metric table.
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { calculateSizeAdjustValues } = require('next/dist/server/font-utils')

for (const family of ['Fraunces', 'Martian Mono']) {
  const metrics = calculateSizeAdjustValues(family)
  console.log(family, {
    family: metrics.fallbackFont,
    ascentOverride: `${metrics.ascent}%`,
    descentOverride: `${metrics.descent}%`,
    lineGapOverride: `${metrics.lineGap}%`,
    sizeAdjust: `${metrics.sizeAdjust}%`,
  })
}
