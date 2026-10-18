import { createHash } from 'node:crypto'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

import postcss from 'postcss'
import { expect, it } from 'vitest'

import sources from '../../../public/reader-directions/expressive-colour/fonts/sources.json'
import { readerDirectionFontCss } from '../contract'
import { expressiveColourDirection } from './index'

const require = createRequire(import.meta.url)

it('emits genuine italic and variable weight faces, optional display and reproducible fallback metrics', () => {
  const css = postcss.parse(readerDirectionFontCss(expressiveColourDirection)!)
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
    ['400 900', undefined, 'normal'],
    ['400 900', undefined, 'italic'],
    ['400', undefined, 'normal'],
    ['500', undefined, 'normal'],
  ])
  for (const face of web) {
    expect(face['font-display']).toBe('optional')
    expect(face.src).toMatch(
      /^url\("\/reader-directions\/expressive-colour\/fonts\/[a-z0-9-]+\.woff2"\) format\("woff2"\)$/,
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
  for (const [index, family] of ['Fraunces', 'Martian Mono'].entries()) {
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

it('ships verified Latin subsets, actual SOFT axes, genuine italic and complete licences', () => {
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
    'packages/web/public/reader-directions/expressive-colour/fonts',
  )
  const declared = expressiveColourDirection.fonts.flatMap((font) => font.sources)
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
    expect(source.package).toMatch(/^@fontsource(?:-variable)?\/(fraunces|martian-mono)$/)
    expect(source.version).toBe('5.3.0')
    expect(source.npmIntegrity).toMatch(/^sha512-/)
    if (source.file.endsWith('.woff2')) {
      total += bytes.length
      expect(bytes.subarray(0, 4).toString()).toBe('wOF2')
      const font = parse(bytes)
      if (source.file.startsWith('fraunces')) {
        expect(source.originalBytes).toBeGreaterThan(source.bytes)
        expect(source.originalSha256).toMatch(/^[a-f0-9]{64}$/)
        expect(source.processing).toMatchObject({
          fontTools: '4.63.0',
          brotli: '1.1.0',
          axes: { wght: [400, 400, 900], SOFT: [30, 30, 100] },
        })
        expect(source.processing?.maxGeometryErrorFontUnits).toBeLessThanOrEqual(3)
        expect(font.familyName).toBe('Fraunces')
        expect(Object.keys(font.variationAxes).sort()).toEqual(['SOFT', 'wght'])
        // Ship only the design's used ranges, retaining body SOFT 30 and display SOFT 100.
        expect(font.variationAxes).toMatchObject({
          wght: { min: 400, default: 400, max: 900 },
          SOFT: { min: 30, default: 30, max: 100 },
        })
        expect(font.italicAngle).toBe(source.file.includes('italic') ? -16 : 0)
      } else {
        expect(font.familyName).toMatch(/^Martian Mono(?: |$)/)
        expect(font.italicAngle).toBe(0)
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
  // Regression budget: keep genuine italic + both mono weights without the unused axes.
  expect(total).toBe(147_368)
  expect(total).toBeLessThan(150_000)
})
