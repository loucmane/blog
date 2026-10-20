import { createHash } from 'node:crypto'

import { expect, it } from 'vitest'

import { readerDirectionFontCss } from '../contract'
import { literaryLongreadDirection } from '../literary-longread'
import { quietMonographDirection } from '../quiet-monograph'
import { swissIndexDirection } from '../swiss-index'
import { cinematicFeatureDirection } from './index'

// SHA-256 of the exact output from contract.ts, first pinned at base 68dde2b and updated for the
// local bold and italic fallback faces (blog-0044.63), using each unchanged direction's font data.
// A range extension must not alter static CSS.
it.each([
  {
    direction: quietMonographDirection,
    id: 'quiet-monograph',
    sha256: 'b6bb10662a34971b9cb4ccbd4975a783162dbea2fdccfe758e7b025096f069e6',
  },
  {
    direction: literaryLongreadDirection,
    id: 'literary-longread',
    sha256: 'b778cba0f0f490a2e8cde77c37fa39be2d936a36e01541c936f0c9a86121beeb',
  },
  {
    direction: swissIndexDirection,
    id: 'swiss-index',
    sha256: '9bd3827f6d3b371682c9d46c4f19d4d87f73050c06f818f972fff98b2e4c5ee5',
  },
])('keeps $id font output byte-for-byte compatible', ({ direction, sha256 }) => {
  expect(createHash('sha256').update(readerDirectionFontCss(direction)!).digest('hex')).toBe(sha256)
})

// Independently assembled from the five expected source faces and six local fallback
// faces (3,007 UTF-8 bytes), without calling the CSS generator to obtain the pin.
it('pins Cinematic Feature font output including genuine 400 and 700 italics', () => {
  expect(
    createHash('sha256').update(readerDirectionFontCss(cinematicFeatureDirection)!).digest('hex'),
  ).toBe('b893ba0db202eb67ed413b87170ee9d519376a67bbd18973a2dd38de8731d751')
})
