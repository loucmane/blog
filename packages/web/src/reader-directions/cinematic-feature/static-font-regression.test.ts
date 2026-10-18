import { createHash } from 'node:crypto'

import { expect, it } from 'vitest'

import { readerDirectionFontCss } from '../contract'
import { literaryLongreadDirection } from '../literary-longread'
import { quietMonographDirection } from '../quiet-monograph'
import { swissIndexDirection } from '../swiss-index'

// SHA-256 of the exact output from contract.ts at base 68dde2b, using each
// unchanged direction's font data. A range extension must not alter static CSS.
it.each([
  {
    direction: quietMonographDirection,
    id: 'quiet-monograph',
    sha256: '7df47005151d461681da106ad168945d1aa254e336041822ea0e50016e07b687',
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
