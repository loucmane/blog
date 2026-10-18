import { createHash } from 'node:crypto'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

import postcss from 'postcss'
import { expect, it } from 'vitest'

import sources from '../../../public/reader-directions/swiss-index/fonts/sources.json'
import { readerDirectionFontCss } from '../contract'
import { swissIndexDirection } from './index'

const require = createRequire(import.meta.url)

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
  const parse = require('next/dist/compiled/@next/font/dist/fontkit').default as (
    bytes: Buffer,
  ) => {
    familyName: string
    italicAngle: number
    'OS/2': { usWeightClass: number }
    hasGlyphForCodePoint(code: number): boolean
  }
  const folder = path.join(process.cwd(), 'packages/web/public/reader-directions/swiss-index/fonts')
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
