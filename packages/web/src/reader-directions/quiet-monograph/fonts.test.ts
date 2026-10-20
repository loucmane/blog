import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'

import postcss from 'postcss'
import { expect, it } from 'vitest'

import sources from '../../../public/reader-directions/quiet-monograph/fonts/sources.json'
import { readerDirectionFontCss } from '../contract'
import { quietMonographDirection } from './index'

const folder = path.join(
  process.cwd(),
  'packages/web/public/reader-directions/quiet-monograph/fonts',
)

// SHA-256 of the exact output from contract.ts, first pinned at base 68dde2b and updated for the
// local bold and italic fallback faces (blog-0044.63). A range extension must not alter static CSS.
it('keeps quiet-monograph font output byte-for-byte compatible', () => {
  expect(
    createHash('sha256').update(readerDirectionFontCss(quietMonographDirection)!).digest('hex'),
  ).toBe('b6bb10662a34971b9cb4ccbd4975a783162dbea2fdccfe758e7b025096f069e6')
})

it('preserves Next fallback metrics and optional display for exactly the used faces', () => {
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
  const display = '"reader-quiet-monograph__font-qm-display"'
  const text = '"reader-quiet-monograph__font-qm-text"'
  // Both families have 400, 500 and a genuine 400 italic. Jost 300 is gone.
  expect(web.map((face) => [face['font-family'], face['font-weight'], face['font-style']])).toEqual(
    [
      [display, '400', 'normal'],
      [display, '500', 'normal'],
      [display, '400', 'italic'],
      [text, '400', 'normal'],
      [text, '500', 'normal'],
      [text, '400', 'italic'],
    ],
  )
  for (const face of web) {
    expect(face['font-display']).toBe('optional')
    expect(face.src).toMatch(
      /^url\("\/reader-directions\/quiet-monograph\/fonts\/[a-z0-9-]+\.woff2"\) format\("woff2"\)$/,
    )
    expect(face.src).toContain(`-${face['font-weight']}-${face['font-style']}.woff2"`)
  }
  // Each family's metric-adjusted fallback has a regular, a bold and an italic local face. The
  // bold starts at 500, the emphasis weight, which browsers never synthesize as bold. The italics
  // are 400 only, as on warm views, so there is no bold italic face.
  const displayFallback = {
    'font-family': '"reader-quiet-monograph__font-qm-display fallback"',
    'ascent-override': '95.27%',
    'descent-override': '29.59%',
    'line-gap-override': '0.00%',
    'size-adjust': '96.98%',
  }
  const textFallback = {
    'font-family': '"reader-quiet-monograph__font-qm-text fallback"',
    'ascent-override': '111.45%',
    'descent-override': '39.06%',
    'line-gap-override': '0.00%',
    'size-adjust': '96.01%',
  }
  expect(faces.filter((face) => face.src?.startsWith('local('))).toEqual([
    {
      ...displayFallback,
      src: 'local("Times New Roman"),local("TimesNewRomanPSMT"),local("Liberation Serif")',
    },
    {
      ...displayFallback,
      'font-weight': '500 1000',
      src: 'local("Times New Roman Bold"),local("TimesNewRomanPS-BoldMT"),local("Liberation Serif Bold")',
    },
    {
      ...displayFallback,
      'font-style': 'italic',
      src: 'local("Times New Roman Italic"),local("TimesNewRomanPS-ItalicMT"),local("Liberation Serif Italic")',
    },
    { ...textFallback, src: 'local("Arial"),local("ArialMT"),local("Liberation Sans")' },
    {
      ...textFallback,
      'font-weight': '500 1000',
      src: 'local("Arial Bold"),local("Arial-BoldMT"),local("Liberation Sans Bold")',
    },
    {
      ...textFallback,
      'font-style': 'italic',
      src: 'local("Arial Italic"),local("Arial-ItalicMT"),local("Liberation Sans Italic")',
    },
  ])
})

it('ships genuine Latin faces at the declared weights and styles, with provenance, licences and the font budget', () => {
  const require = createRequire(import.meta.url)
  const fontFromBuffer = require('next/dist/compiled/@next/font/dist/fontkit').default as (
    bytes: Buffer,
  ) => {
    familyName: string
    italicAngle: number
    'OS/2': { usWeightClass: number; fsSelection: { italic: boolean } }
    hasGlyphForCodePoint(code: number): boolean
  }
  const declared = quietMonographDirection.fonts.flatMap((font) => font.sources)
  const files = declared.map(({ file }) => file).sort()
  // Only declared faces are vendored and recorded: Jost 300 has neither a file nor a record.
  expect(
    fs
      .readdirSync(folder)
      .filter((file) => file.endsWith('.woff2'))
      .sort(),
  ).toEqual(files)
  expect(sources.map(({ file }) => file).sort()).toEqual(files)
  const sizes = new Map<string, number>()
  for (const source of declared) {
    const bytes = fs.readFileSync(path.join(folder, source.file))
    const record = sources.find(({ file }) => file === source.file)!
    const family = source.file.startsWith('jost') ? 'jost' : 'cormorant-garamond'
    expect(record.url).toBe(
      `https://github.com/fontsource/font-files/blob/main/fonts/google/${family}/files/${source.file}`,
    )
    expect(bytes.length).toBe(record.bytes)
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(record.sha256)
    expect(createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex')).toBe(
      record.gitBlobSha,
    )
    expect(bytes.subarray(0, 4).toString()).toBe('wOF2')
    const parsed = fontFromBuffer(bytes)
    expect(parsed.familyName).toMatch(
      family === 'jost' ? /^Jost(?: |$)/ : /^Cormorant Garamond(?: |$)/,
    )
    expect(parsed['OS/2'].usWeightClass).toBe(source.weight)
    // A genuine italic is drawn slanted, so the browser never has to slant an upright face.
    expect(parsed['OS/2'].fsSelection.italic).toBe(source.style === 'italic')
    expect(parsed.italicAngle !== 0).toBe(source.style === 'italic')
    for (const character of 'AaZzÅåÄäÖö0129')
      expect(parsed.hasGlyphForCodePoint(character.codePointAt(0)!)).toBe(true)
    sizes.set(source.file, bytes.length)
  }
  // Spec section 10: an article with italics uses all six faces. Home uses five: only emphasis
  // in story text needs the Jost italic.
  const total = [...sizes.values()].reduce((sum, size) => sum + size, 0)
  expect(total).toBe(100_816)
  expect(total).toBeLessThanOrEqual(105_000)
  expect(total - sizes.get('jost-latin-400-italic.woff2')!).toBeLessThanOrEqual(95_000)
  for (const license of ['Cormorant-Garamond-OFL.txt', 'Jost-OFL.txt']) {
    expect(fs.readFileSync(path.join(folder, license), 'utf8')).toContain(
      'SIL OPEN FONT LICENSE Version 1.1',
    )
  }
})
