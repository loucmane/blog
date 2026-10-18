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

it('emits the genuine variable axes, used mono weights, optional display and reproducible fallback metrics', () => {
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
    ['400', undefined, 'normal'],
    ['500', undefined, 'normal'],
  ])
  for (const face of web) {
    expect(face['font-display']).toBe('optional')
    expect(face.src).toMatch(
      /^url\("\/reader-directions\/cinematic-feature\/fonts\/[a-z0-9-]+\.woff2"\) format\("woff2"\)$/,
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
  for (const [index, family] of ['Archivo', 'Martian Mono'].entries()) {
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

it('ships authentic Latin glyphs, both Archivo axes, exact mono weights and complete verified licences', () => {
  const parse = require('next/dist/compiled/@next/font/dist/fontkit').default as (
    bytes: Buffer,
  ) => {
    familyName: string
    italicAngle: number
    'OS/2': { usWeightClass: number }
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
    expect(source.package).toMatch(/^@fontsource(?:-variable)?\/(archivo|martian-mono)$/)
    expect(source.version).toBe('5.3.0')
    expect(source.npmIntegrity).toMatch(/^sha512-/)
    if (source.file.endsWith('.woff2')) {
      total += bytes.length
      expect(bytes.subarray(0, 4).toString()).toBe('wOF2')
      const font = parse(bytes)
      expect(font.italicAngle).toBe(0)
      if (source.file.startsWith('archivo')) {
        expect(font.familyName).toMatch(/^Archivo(?: |$)/)
        expect(font.variationAxes).toMatchObject({
          wght: { min: 100, max: 900 },
          wdth: { min: 62, max: 125, default: 100 },
        })
      } else {
        expect(font.familyName).toMatch(/^Martian Mono(?: |$)/)
        expect(font['OS/2'].usWeightClass).toBe(
          declared.find(({ file }) => file === source.file)!.weight,
        )
      }
      for (const character of 'AaZzÅåÄäÖö0129')
        expect(font.hasGlyphForCodePoint(character.codePointAt(0)!)).toBe(true)
    } else {
      for (const text of ['SIL OPEN FONT LICENSE Version 1.1', 'TERMINATION', 'DISCLAIMER'])
        expect(bytes.toString()).toContain(text)
    }
  }
  expect(total).toBe(111_100)
})
