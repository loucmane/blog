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
  italicAngle: number
  unitsPerEm: number
  'OS/2': { usWeightClass: number }
  glyphForCodePoint(code: number): { advanceWidth: number }
  hasGlyphForCodePoint(code: number): boolean
}
const folder = path.join(process.cwd(), 'packages/web/public/reader-directions/swiss-index/fonts')

it('emits only the used weights and normal styles, with optional display and reproducible metrics', () => {
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
  expect(web.map((face) => [face['font-weight'], face['font-style']])).toEqual([
    ['400', 'normal'],
    ['700', 'normal'],
    ['800', 'normal'],
    ['400', 'normal'],
    ['500', 'normal'],
  ])
  for (const face of web) {
    expect(face['font-display']).toBe('optional')
    expect(face.src).toMatch(
      /^url\("\/reader-directions\/swiss-index\/fonts\/[a-z0-9-]+\.woff2"\) format\("woff2"\)$/,
    )
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
  const local = faces.filter((face) => face.src?.startsWith('local('))
  expect(local).toHaveLength(2)
  for (const [index, family] of ['Schibsted Grotesk', 'IBM Plex Mono'].entries()) {
    const metrics = calculateSizeAdjustValues(family)
    expect(local[index]).toMatchObject({
      src: `local("${metrics.fallbackFont}")`,
      'ascent-override': `${metrics.ascent}%`,
      'descent-override': `${metrics.descent}%`,
      'line-gap-override': `${metrics.lineGap}%`,
      'size-adjust': `${metrics.sizeAdjust}%`,
    })
  }
})

it('ships authentic Latin fonts, exact weights, complete licences and verified provenance', () => {
  let total = 0
  const declared = swissIndexDirection.fonts.flatMap((font) => font.sources)
  expect(
    sources
      .filter(({ file }) => file.endsWith('.woff2'))
      .map(({ file }) => file)
      .sort(),
  ).toEqual(declared.map(({ file }) => file).sort())
  for (const source of sources) {
    const bytes = fs.readFileSync(path.join(folder, source.file))
    expect(bytes.length).toBe(source.bytes)
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(source.sha256)
    expect(source.package).toMatch(/^@fontsource\/(schibsted-grotesk|ibm-plex-mono)$/)
    expect(source.version).toBe('5.3.0')
    expect(source.npmIntegrity).toMatch(/^sha512-/)
    if (source.file.endsWith('.woff2')) {
      total += bytes.length
      expect(bytes.subarray(0, 4).toString()).toBe('wOF2')
      const font = parse(bytes)
      const face = declared.find(({ file }) => file === source.file)!
      expect(font.familyName).toMatch(
        source.file.startsWith('schibsted-grotesk')
          ? /^Schibsted Grotesk(?: |$)/
          : /^IBM Plex Mono(?: |$)/,
      )
      expect(font['OS/2'].usWeightClass).toBe(face.weight)
      expect(font.italicAngle).toBe(0)
      for (const character of 'AaZzÅåÄäÖö0129')
        expect(font.hasGlyphForCodePoint(character.codePointAt(0)!)).toBe(true)
    } else {
      expect(bytes.toString()).toContain('SIL OPEN FONT LICENSE Version 1.1')
      expect(bytes.toString()).toContain('TERMINATION')
      expect(bytes.toString()).toContain('DISCLAIMER')
    }
  }
  expect(total).toBe(104_192)
  expect(total).toBeLessThan(105_000)
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
  const font = parse(fs.readFileSync(path.join(folder, 'schibsted-grotesk-latin-400-normal.woff2')))
  const ch = font.glyphForCodePoint('0'.codePointAt(0)!).advanceWidth / font.unitsPerEm
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
  // Grid and diptych galleries set two images across that width, with a 1.5rem gap, from 600px.
  const half = (measure - 1.5) / 2
  expect(articleImageSizes.gallery).toBe(
    `(min-width: ${desktop}px) ${half}rem, (min-width: 1024px) calc(35.25vw - 0.9375rem), (min-width: ${tablet}px) ${half}rem, (min-width: 667px) calc(47vw - 0.75rem), (min-width: 600px) calc(50vw - 2rem), calc(100vw - 2.5rem)`,
  )
})
