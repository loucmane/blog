import { createHash } from 'node:crypto'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

import postcss from 'postcss'
import { expect, it } from 'vitest'

import sources from '../../../public/reader-directions/cinematic-feature/fonts/sources.json'
import { readerDirectionFontCss } from '../contract'
import { cinematicFeatureDirection } from './index'

const require = createRequire(import.meta.url)

it('emits genuine variable axes, static italics, used mono weights, optional display and reproducible fallback metrics', () => {
  const css = postcss.parse(readerDirectionFontCss(cinematicFeatureDirection)!)
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
  expect(
    web.map((face) => [face['font-weight'], face['font-stretch'], face['font-style']]),
  ).toEqual([
    ['100 900', '62% 125%', 'normal'],
    ['400', undefined, 'italic'],
    ['700', undefined, 'italic'],
    ['400', undefined, 'normal'],
    ['500', undefined, 'normal'],
  ])
  for (const face of web) {
    expect(face['font-display']).toBe('optional')
    expect(face.src).toMatch(
      /^url\("\/reader-directions\/cinematic-feature\/fonts\/[a-z0-9-]+\.woff2"\) format\("woff2"\)$/,
    )
  }
  const presentation = postcss.parse(cinematicFeatureDirection.styles!)
  let synthesis: string | undefined
  presentation.walkRules('& .cf-page', (rule) => {
    rule.walkDecls('font-synthesis', (declaration) => {
      synthesis = declaration.value
    })
  })
  expect(synthesis).toBe('weight style')
  let italicStretch: string | undefined
  presentation.walkRules("& .cf-body :is(h2, h3, [data-block='pull-quote']) em", (rule) => {
    rule.walkDecls('font-stretch', (declaration) => {
      italicStretch = declaration.value
    })
  })
  expect(italicStretch).toBe('100%')
  const { calculateSizeAdjustValues } = require('next/dist/server/font-utils') as {
    calculateSizeAdjustValues(family: string): {
      fallbackFont: string
      ascent: string
      descent: string
      lineGap: string
      sizeAdjust: string
    }
  }
  // Archivo's range reaches 900 and it has 400 and 700 italics, so its fallback has all four local
  // faces, bold from 600. The mono's heaviest face is its 500, so its local bold face starts there.
  // The local faces are normal width, like the italics, and carry no stretch descriptor.
  const local = faces.filter((face) => face.src?.startsWith('local('))
  const sansFallback = '"reader-cinematic-feature__font-cf-sans fallback"'
  const monoFallback = '"reader-cinematic-feature__font-cf-mono fallback"'
  expect(
    local.map((face) => [
      face['font-family'],
      face['font-weight'],
      face['font-stretch'],
      face['font-style'],
    ]),
  ).toEqual([
    [sansFallback, undefined, undefined, undefined],
    [sansFallback, '600 1000', undefined, undefined],
    [sansFallback, undefined, undefined, 'italic'],
    [sansFallback, '600 1000', undefined, 'italic'],
    [monoFallback, undefined, undefined, undefined],
    [monoFallback, '500 1000', undefined, undefined],
  ])
  for (const [fallback, family] of [
    [sansFallback, 'Archivo'],
    [monoFallback, 'Martian Mono'],
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

it('ships authentic Latin glyphs, Archivo axes and static italics, exact mono weights and complete verified licences', () => {
  const parse = require('next/dist/compiled/@next/font/dist/fontkit').default as (
    bytes: Buffer,
  ) => {
    familyName: string
    subfamilyName: string
    version: string
    italicAngle: number
    unitsPerEm: number
    ascent: number
    descent: number
    lineGap: number
    xHeight: number
    capHeight: number
    'OS/2': { usWeightClass: number; usWidthClass: number }
    variationAxes: Record<string, { min: number; max: number; default: number }>
    hasGlyphForCodePoint(code: number): boolean
  }
  const folder = path.join(
    process.cwd(),
    'packages/web/public/reader-directions/cinematic-feature/fonts',
  )
  const declared = cinematicFeatureDirection.fonts.flatMap((font) => font.sources)
  expect(
    sources
      .filter(({ file }) => file.endsWith('.woff2'))
      .map(({ file }) => file)
      .sort(),
  ).toEqual(declared.map(({ file }) => file).sort())
  let total = 0
  for (const source of sources) {
    const bytes = fs.readFileSync(path.join(folder, source.file))
    expect(bytes.length).toBe(source.bytes)
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(source.sha256)
    if (source.gitBlob) {
      expect(createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex')).toBe(
        source.gitBlob,
      )
      expect(source.url).toBe(
        `https://github.com/fontsource/font-files/blob/main/fonts/google/archivo/files/${source.file}`,
      )
      expect(source.license).toBe('Archivo-OFL.txt')
    } else {
      expect(source.package).toMatch(/^@fontsource(?:-variable)?\/(archivo|martian-mono)$/)
      expect(source.version).toBe('5.3.0')
      expect(source.npmIntegrity).toMatch(/^sha512-/)
    }
    if (source.file.endsWith('.woff2')) {
      total += bytes.length
      expect(bytes.subarray(0, 4).toString()).toBe('wOF2')
      const font = parse(bytes)
      const declaration = declared.find(({ file }) => file === source.file)!
      const italic = declaration.style === 'italic'
      expect(font.italicAngle).toBe(italic ? -10 : 0)
      if (source.file.startsWith('archivo')) {
        expect(font.familyName).toMatch(/^Archivo(?: |$)/)
        // Measured from each binary, including both newly staged italic faces.
        expect(font).toMatchObject({
          version: 'Version 2.001',
          unitsPerEm: 1000,
          ascent: 878,
          descent: -210,
          lineGap: 0,
          xHeight: 526,
          capHeight: 686,
        })
        if (italic) {
          expect(font.subfamilyName).toContain('Italic')
          expect(font.variationAxes).toEqual({})
          expect(font['OS/2'].usWeightClass).toBe(declaration.weight)
          expect(font['OS/2'].usWidthClass).toBe(5)
          expect(source.fontVersion).toBe(font.version)
        } else {
          expect(font.variationAxes).toMatchObject({
            wght: { min: 100, max: 900 },
            wdth: { min: 62, max: 125, default: 100 },
          })
        }
      } else {
        expect(font.familyName).toMatch(/^Martian Mono(?: |$)/)
        expect(font['OS/2'].usWeightClass).toBe(declaration.weight)
      }
      for (const character of 'AaZzÅåÄäÖö0129')
        expect(font.hasGlyphForCodePoint(character.codePointAt(0)!)).toBe(true)
    } else {
      for (const text of ['SIL OPEN FONT LICENSE Version 1.1', 'TERMINATION', 'DISCLAIMER'])
        expect(bytes.toString()).toContain(text)
    }
  }
  expect(total).toBe(142_924)
  expect(total).toBeLessThanOrEqual(180_000)
})
