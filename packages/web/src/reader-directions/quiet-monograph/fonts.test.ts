import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'

import postcss from 'postcss'
import { expect, it } from 'vitest'

import { readerDirectionFontCss } from '../contract'
import { quietMonographDirection } from './index'

it('preserves Next fallback metrics and optional display for exactly the used normal weights', () => {
  const css = postcss.parse(readerDirectionFontCss(quietMonographDirection)!)
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
  expect(web.map((face) => face['font-weight'])).toEqual(['400', '500', '300', '400', '500'])
  for (const face of web) {
    expect(face['font-display']).toBe('optional')
    expect(face['font-style']).toBe('normal')
    expect(face.src).toMatch(
      /^url\("\/reader-directions\/quiet-monograph\/fonts\/[a-z0-9-]+\.woff2"\) format\("woff2"\)$/,
    )
  }
  expect(faces.filter((face) => face.src?.startsWith('local('))).toEqual([
    {
      'font-family': '"reader-quiet-monograph__font-qm-display fallback"',
      src: 'local("Times New Roman")',
      'ascent-override': '95.27%',
      'descent-override': '29.59%',
      'line-gap-override': '0.00%',
      'size-adjust': '96.98%',
    },
    {
      'font-family': '"reader-quiet-monograph__font-qm-text fallback"',
      src: 'local("Arial")',
      'ascent-override': '111.45%',
      'descent-override': '39.06%',
      'line-gap-override': '0.00%',
      'size-adjust': '96.01%',
    },
  ])
})

it('ships genuine Latin WOFF2 assets at the declared weights, with licences and a bounded size', () => {
  const require = createRequire(import.meta.url)
  const fontFromBuffer = require('next/dist/compiled/@next/font/dist/fontkit').default as (
    bytes: Buffer,
  ) => {
    familyName: string
    'OS/2': { usWeightClass: number }
    hasGlyphForCodePoint(code: number): boolean
  }
  const folder = path.join(
    process.cwd(),
    'packages/web/public/reader-directions/quiet-monograph/fonts',
  )
  let totalBytes = 0
  for (const font of quietMonographDirection.fonts) {
    for (const source of font.sources) {
      const bytes = fs.readFileSync(path.join(folder, source.file))
      expect(bytes.subarray(0, 4).toString()).toBe('wOF2')
      const parsed = fontFromBuffer(bytes)
      expect(parsed.familyName).toMatch(
        source.file.startsWith('jost') ? /^Jost(?: |$)/ : /^Cormorant Garamond(?: |$)/,
      )
      expect(parsed['OS/2'].usWeightClass).toBe(source.weight)
      for (const character of 'AaZzÅåÄäÖö0129')
        expect(parsed.hasGlyphForCodePoint(character.codePointAt(0)!)).toBe(true)
      totalBytes += bytes.length
    }
  }
  expect(totalBytes).toBeLessThan(80_000)
  for (const license of ['Cormorant-Garamond-OFL.txt', 'Jost-OFL.txt']) {
    expect(fs.readFileSync(path.join(folder, license), 'utf8')).toContain(
      'SIL OPEN FONT LICENSE Version 1.1',
    )
  }
})
