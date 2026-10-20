import { createHash } from 'node:crypto'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

import postcss from 'postcss'
import { expect, it } from 'vitest'

import sources from '../../../public/reader-directions/swiss-index/fonts/sources.json'
import { readerDirectionFontCss } from '../contract'
import { articleImageSizes } from './article'
import { swissIndexDirection } from './index'

const require = createRequire(import.meta.url)
const parse = require('next/dist/compiled/@next/font/dist/fontkit').default as (bytes: Buffer) => {
  familyName: string
  postscriptName: string
  italicAngle: number
  unitsPerEm: number
  ascent: number
  descent: number
  lineGap: number
  'OS/2': { usWeightClass: number; fsSelection: { italic: boolean } }
  glyphForCodePoint(code: number): { advanceWidth: number }
  hasGlyphForCodePoint(code: number): boolean
}
const folder = path.join(process.cwd(), 'packages/web/public/reader-directions/swiss-index/fonts')

// SHA-256 of the exact output from contract.ts, first pinned at base 68dde2b and updated for the
// local bold and italic fallback faces (blog-0044.63) and the versioned font URLs (blog-0044.37).
// A range extension must not alter static CSS.
it('keeps swiss-index font output byte-for-byte compatible', () => {
  expect(
    createHash('sha256').update(readerDirectionFontCss(swissIndexDirection)!).digest('hex'),
  ).toBe('f0ba019edd54f4956450e26af1e0878cb92f5deb5e3d38ccd104cf68333190f0')
})

// The hash declared in fonts.ts versions each URL, and the server caches versioned font URLs for a
// year as immutable. New bytes fail here until fonts.ts declares their hash, which also gives them
// a new URL, so a returning reader never keeps a stale face.
it('versions every font URL with the SHA-256 of the file it serves', () => {
  const css = readerDirectionFontCss(swissIndexDirection)!
  for (const source of swissIndexDirection.fonts.flatMap((font) => font.sources)) {
    const sha256 = createHash('sha256')
      .update(fs.readFileSync(path.join(folder, source.file)))
      .digest('hex')
    expect(source.sha256, source.file).toBe(sha256)
    expect(css).toContain(
      `url("/reader-directions/swiss-index/fonts/${source.file}?v=${sha256.slice(0, 16)}")`,
    )
  }
})

/** The CSS ch unit of the regular face, the advance of "0", as a fraction of the font size. */
function regularCh() {
  const font = parse(fs.readFileSync(path.join(folder, 'schibsted-grotesk-latin-400-normal.woff2')))
  return font.glyphForCodePoint('0'.codePointAt(0)!).advanceWidth / font.unitsPerEm
}

/** The width in pixels that a `sizes` value describes on a screen `width` pixels wide. */
function described(sizes: string, width: number) {
  const pixels = (length: string) => {
    const [, value, unit] = /^(\d+(?:\.\d+)?)(rem|vw)$/.exec(length)!
    return Number(value) * (unit === 'vw' ? width / 100 : 16)
  }
  for (const entry of sizes.split(', ')) {
    const [, minimum, length] = /^(?:\(min-width: (\d+)px\) )?(.+)$/.exec(entry)!
    if (minimum && width < Number(minimum)) continue
    const calc = /^calc\((\S+) ([+-]) (\S+)\)$/.exec(length!)
    if (!calc) return pixels(length!)
    const [, first, sign, second] = calc
    return pixels(first!) + (sign === '-' ? -1 : 1) * pixels(second!)
  }
  throw new Error(`${sizes} describes no width at ${width}px`)
}

it('emits the used weights and genuine 400 and 700 italics, with optional display and reproducible metrics', () => {
  const css = postcss.parse(readerDirectionFontCss(swissIndexDirection)!)
  const faces: Record<string, string>[] = []
  css.walkAtRules('font-face', (face) => {
    expect(face.parent).toBe(css)
    const properties: Record<string, string> = {}
    face.walkDecls((declaration) => {
      properties[declaration.prop] = declaration.value
    })
    faces.push(properties)
  })
  const web = faces.filter((face) => face.src?.startsWith('url('))
  const sans = '"reader-swiss-index__font-si-sans"'
  const mono = '"reader-swiss-index__font-si-mono"'
  // The italics join the grotesk family, so emphasis in text and in bold text finds a real face.
  expect(web.map((face) => [face['font-family'], face['font-weight'], face['font-style']])).toEqual(
    [
      [sans, '400', 'normal'],
      [sans, '700', 'normal'],
      [sans, '800', 'normal'],
      [sans, '400', 'italic'],
      [sans, '700', 'italic'],
      [mono, '400', 'normal'],
      [mono, '500', 'normal'],
    ],
  )
  for (const face of web) {
    expect(face['font-display']).toBe('optional')
    expect(face.src).toMatch(
      /^url\("\/reader-directions\/swiss-index\/fonts\/[a-z0-9-]+\.woff2\?v=[a-f0-9]{16}"\) format\("woff2"\)$/,
    )
    expect(face.src).toContain(`-${face['font-weight']}-${face['font-style']}.woff2?v=`)
  }
  const { calculateSizeAdjustValues } = require('next/dist/server/font-utils') as {
    calculateSizeAdjustValues(family: string): {
      fallbackFont: string
      ascent: string
      descent: string
      lineGap: string
      sizeAdjust: string
    }
  }
  // The grotesk has bold and italic web faces, so its fallback has all four local faces, bold from
  // 600. The mono's heaviest face is its 500, so its local bold face starts there.
  const local = faces.filter((face) => face.src?.startsWith('local('))
  const sansFallback = '"reader-swiss-index__font-si-sans fallback"'
  const monoFallback = '"reader-swiss-index__font-si-mono fallback"'
  expect(
    local.map((face) => [face['font-family'], face['font-weight'], face['font-style']]),
  ).toEqual([
    [sansFallback, undefined, undefined],
    [sansFallback, '600 1000', undefined],
    [sansFallback, undefined, 'italic'],
    [sansFallback, '600 1000', 'italic'],
    [monoFallback, undefined, undefined],
    [monoFallback, '500 1000', undefined],
  ])
  for (const [fallback, family] of [
    [sansFallback, 'Schibsted Grotesk'],
    [monoFallback, 'IBM Plex Mono'],
  ] as const) {
    const metrics = calculateSizeAdjustValues(family)
    // Every face keeps the family's metrics and names the local face of its weight and style.
    for (const face of local.filter((face) => face['font-family'] === fallback)) {
      const style = `${face['font-weight'] ? ' Bold' : ''}${face['font-style'] ? ' Italic' : ''}`
      expect(face).toMatchObject({
        'ascent-override': `${metrics.ascent}%`,
        'descent-override': `${metrics.descent}%`,
        'line-gap-override': `${metrics.lineGap}%`,
        'size-adjust': `${metrics.sizeAdjust}%`,
      })
      expect(face.src?.split(',')[0]).toBe(`local("${metrics.fallbackFont}${style}")`)
    }
  }
})

it('keeps bold and italic synthesis as a safety net for the fallback, and sets no narrow width', () => {
  const presentation = postcss.parse(swissIndexDirection.styles!)
  // The fallback has local bold and italic faces, but a host without them paints a cold view in
  // the generic family, and the mono has no italic. Synthesis keeps bold and italic text bold and
  // italic there, so the page never sets `none`.
  const synthesis: string[][] = []
  presentation.walkDecls('font-synthesis', (declaration) => {
    synthesis.push([(declaration.parent as postcss.Rule).selector, declaration.value])
  })
  expect(synthesis).toEqual([['& .si-page', 'weight style']])
  // The italics are normal width; a narrower context would match an upright face and slant it.
  const widths: string[] = []
  presentation.walkDecls('font-stretch', (declaration) => {
    widths.push(declaration.toString())
  })
  expect(widths).toEqual([])
})

it('ships authentic Latin fonts, exact weights and styles, complete licences and verified provenance', () => {
  const declared = swissIndexDirection.fonts.flatMap((font) => font.sources)
  const files = declared.map(({ file }) => file).sort()
  // Only declared faces are vendored and recorded.
  expect(
    fs
      .readdirSync(folder)
      .filter((file) => file.endsWith('.woff2'))
      .sort(),
  ).toEqual(files)
  expect(
    sources
      .filter(({ file }) => file.endsWith('.woff2'))
      .map(({ file }) => file)
      .sort(),
  ).toEqual(files)
  const regular = parse(
    fs.readFileSync(path.join(folder, 'schibsted-grotesk-latin-400-normal.woff2')),
  )
  const sizes = new Map<string, number>()
  for (const source of sources) {
    const bytes = fs.readFileSync(path.join(folder, source.file))
    expect(bytes.length).toBe(source.bytes)
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(source.sha256)
    expect(source.package).toMatch(/^@fontsource\/(schibsted-grotesk|ibm-plex-mono)$/)
    expect(source.version).toBe('5.3.0')
    expect(source.npmIntegrity).toMatch(/^sha512-/)
    if (source.file.endsWith('.woff2')) {
      sizes.set(source.file, bytes.length)
      expect(bytes.subarray(0, 4).toString()).toBe('wOF2')
      const font = parse(bytes)
      const face = declared.find(({ file }) => file === source.file)!
      const italic = face.style === 'italic'
      expect(font.familyName).toMatch(
        source.file.startsWith('schibsted-grotesk')
          ? /^Schibsted Grotesk(?: |$)/
          : /^IBM Plex Mono(?: |$)/,
      )
      expect(font['OS/2'].usWeightClass).toBe(face.weight)
      // A genuine italic is drawn slanted, so the browser never has to slant an upright face.
      expect(font['OS/2'].fsSelection.italic).toBe(italic)
      if (italic) {
        expect(font.italicAngle).toBeLessThan(0)
        // The browser checks identify the painted italics by these names.
        expect(font.postscriptName).toBe(
          face.weight === 700 ? 'SchibstedGrotesk-BoldItalic' : 'SchibstedGrotesk-Italic',
        )
        // The upright faces' vertical metrics, so one set of fallback overrides serves both styles.
        expect(font).toMatchObject({
          unitsPerEm: regular.unitsPerEm,
          ascent: regular.ascent,
          descent: regular.descent,
          lineGap: regular.lineGap,
        })
      } else {
        expect(font.italicAngle).toBe(0)
      }
      for (const character of 'AaZzÅåÄäÖö0129')
        expect(font.hasGlyphForCodePoint(character.codePointAt(0)!)).toBe(true)
    } else {
      expect(bytes.toString()).toContain('SIL OPEN FONT LICENSE Version 1.1')
      expect(bytes.toString()).toContain('TERMINATION')
      expect(bytes.toString()).toContain('DISCLAIMER')
    }
  }
  // Spec section 10. Home sets only the five normal faces, and a typical story adds the 400
  // italic for emphasis in its text. A story with bold emphasis as well loads all seven faces.
  const total = [...sizes.values()].reduce((sum, size) => sum + size, 0)
  const boldItalic = sizes.get('schibsted-grotesk-latin-700-italic.woff2')!
  const home = total - boldItalic - sizes.get('schibsted-grotesk-latin-400-italic.woff2')!
  expect(home).toBe(104_192)
  expect(home).toBeLessThanOrEqual(105_000)
  expect(total - boldItalic).toBeLessThanOrEqual(130_000)
  expect(total).toBe(156_080)
  // Spec section 10: at most 157,000 B with both italics (raised from 155,000, operator 2026-10-20).
  expect(total).toBeLessThanOrEqual(157_000)
})

it('has no checklist glyphs in any face, so the styles draw the checklist boxes', () => {
  for (const { file } of swissIndexDirection.fonts.flatMap((font) => font.sources)) {
    const font = parse(fs.readFileSync(path.join(folder, file)))
    for (const glyph of ['☐', '☑']) {
      expect(font.hasGlyphForCodePoint(glyph.codePointAt(0)!), `${glyph} in ${file}`).toBe(false)
    }
  }
})

it('sizes body figures at the reading measure, 65ch of the regular face at the 20px body size', () => {
  const ch = regularCh()
  // --si-body is 1.25rem from 800px; the 65ch measure in rem, rounded up to a quarter.
  const measure = Math.ceil(65 * ch * 1.25 * 4) / 4
  // Where the column is narrower than the measure, it sets the width instead: columns 2–4,
  // calc(70.5vw - 0.375rem), from 1024px; the one-column page, 94vw, from 667px.
  const desktop = Math.ceil((measure * 16 + 6) / 0.705)
  const tablet = Math.ceil((measure * 16) / 0.94)
  expect(tablet).toBeGreaterThan(800)
  expect(desktop).toBeLessThan(1430)
  expect(articleImageSizes.body).toBe(
    `(min-width: ${desktop}px) ${measure}rem, (min-width: 1024px) calc(70.5vw - 0.375rem), (min-width: ${tablet}px) ${measure}rem, (min-width: 667px) 94vw, calc(100vw - 2.5rem)`,
  )
  // One gallery hint serves every layout, so it describes the widest: a carousel at text width.
  expect(articleImageSizes.gallery).toBe(articleImageSizes.body)
})

it('sizes gallery images for the widest layout, the one-column carousel, so no layout under-fetches', () => {
  const ch = regularCh()
  for (let width = 320; width <= 2560; width++) {
    // Section 4's grid: the page between clamp(1.25rem, 3vw, 3rem) gutters, at most 84rem; from
    // 1024px four columns with 1.5rem gaps, the body in columns 2–4; one column below.
    const gutter = Math.min(Math.max(20, 0.03 * width), 48)
    const page = Math.min(width - 2 * gutter, 1344)
    const column = width >= 1024 ? (3 * (page - 3 * 24)) / 4 + 2 * 24 : page
    // The body is 65ch at --si-body, clamp(1.125rem, 1rem + 0.5vw, 1.25rem), or the column.
    const size = Math.min(Math.max(18, 16 + 0.005 * width), 20)
    const text = Math.min(65 * ch * size, column)
    // A carousel sets one image across the text; grid and diptych two, 1.5rem apart, from 600px.
    const shown = { carousel: text, grid: width >= 600 ? (text - 24) / 2 : text }
    const hint = described(articleImageSizes.gallery, width)
    for (const [layout, slot] of Object.entries(shown)) {
      // To a hundredth of a pixel: the hint and the model compute the same calc() differently.
      expect(hint, `${layout} at ${width}px`).toBeGreaterThanOrEqual(slot - 0.01)
    }
  }
})
