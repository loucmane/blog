// Offline maintenance tool, never imported by the registry or runtime.
// Reproduces next/font/google's adjustFontFallback from the installed Next metric table.
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'

const require = createRequire(import.meta.url)
const { calculateSizeAdjustValues } = require('next/dist/server/font-utils')

for (const family of ['Archivo', 'Martian Mono']) {
  const metrics = calculateSizeAdjustValues(family)
  console.log(family, {
    family: metrics.fallbackFont,
    ascentOverride: `${metrics.ascent}%`,
    descentOverride: `${metrics.descent}%`,
    lineGapOverride: `${metrics.lineGap}%`,
    sizeAdjust: `${metrics.sizeAdjust}%`,
  })
}

// Measure the shipped faces as well as reproducing the shared family fallback.
// Static italic sources have no variable axes; their normal width is OS/2 class 5.
const parse = require('next/dist/compiled/@next/font/dist/fontkit').default
for (const file of [
  'archivo-latin-wdth-normal.woff2',
  'archivo-latin-400-italic.woff2',
  'archivo-latin-700-italic.woff2',
]) {
  const font = parse(
    readFileSync(
      new URL(`../../../public/reader-directions/cinematic-feature/fonts/${file}`, import.meta.url),
    ),
  )
  console.log(file, {
    version: font.version,
    style: font.subfamilyName,
    weight: font['OS/2'].usWeightClass,
    widthClass: font['OS/2'].usWidthClass,
    italicAngle: font.italicAngle,
    axes: font.variationAxes,
    unitsPerEm: font.unitsPerEm,
    ascent: font.ascent,
    descent: font.descent,
    lineGap: font.lineGap,
    xHeight: font.xHeight,
    capHeight: font.capHeight,
  })
}
