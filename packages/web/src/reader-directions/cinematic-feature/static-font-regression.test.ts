import { createHash } from 'node:crypto'

import { expect, it } from 'vitest'

import { readerDirectionFontCss } from '../contract'
import { literaryLongreadDirection } from '../literary-longread'
import { quietMonographDirection } from '../quiet-monograph'
import { swissIndexDirection } from '../swiss-index'
import { cinematicFeatureDirection } from './index'

// SHA-256 of the exact output from contract.ts at base 68dde2b, using each
// unchanged direction's font data. A range extension must not alter static CSS.
it.each([
  {
    direction: quietMonographDirection,
    id: 'quiet-monograph',
    sha256: '699a0e52b23842212ec40021414052e0517eb937d3d2a40204eb61d88c4651ba',
  },
  {
    direction: literaryLongreadDirection,
    id: 'literary-longread',
    sha256: '3c028a1f0068c2598652e5d41215badcd3984eeb03ea81898355c32b368b0275',
  },
  {
    direction: swissIndexDirection,
    id: 'swiss-index',
    sha256: '38ff6d85f3bd6bc91d1b7ae4d499e9b11cf5baa529baa17e6681b30de317f8d1',
  },
])('keeps $id font output byte-for-byte compatible', ({ direction, sha256 }) => {
  expect(createHash('sha256').update(readerDirectionFontCss(direction)!).digest('hex')).toBe(sha256)
})

// Independently assembled from the five expected source faces and two fallback
// rules (1,837 UTF-8 bytes), without calling the CSS generator to obtain the pin.
it('pins Cinematic Feature font output including genuine 400 and 700 italics', () => {
  expect(
    createHash('sha256').update(readerDirectionFontCss(cinematicFeatureDirection)!).digest('hex'),
  ).toBe('67775cb1408c33c913e1c291c89c86205117cd264acfc490ef9764e3b5b80180')
})
