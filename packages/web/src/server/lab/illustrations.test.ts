import { createHash } from 'node:crypto'
import { inflateSync } from 'node:zlib'

import { describe, expect, it } from 'vitest'

import { encodePng, renderIllustration, type IllustrationSpec } from './illustrations'

const spec: IllustrationSpec = {
  floor: [176, 146, 112],
  height: 24,
  light: [255, 236, 200],
  wallBottom: [196, 202, 209],
  wallTop: [214, 220, 226],
  width: 36,
  window: [0.5, 0.1, 0.25, 0.4],
}

function readChunks(png: Uint8Array) {
  const buffer = Buffer.from(png)
  const chunks: { data: Buffer; type: string }[] = []
  let offset = 8
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset)
    const type = buffer.toString('ascii', offset + 4, offset + 8)
    chunks.push({ data: buffer.subarray(offset + 8, offset + 8 + length), type })
    offset += length + 12
  }
  return chunks
}

describe('lab illustrations', () => {
  it('encodes a valid RGB PNG with the requested dimensions', () => {
    const png = renderIllustration(spec)
    const chunks = readChunks(png)
    const header = chunks.find(({ type }) => type === 'IHDR')?.data
    const pixels = inflateSync(
      Buffer.concat(chunks.filter(({ type }) => type === 'IDAT').map(({ data }) => data)),
    )

    expect(Buffer.from(png).subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    )
    expect(chunks.map(({ type }) => type)).toEqual(['IHDR', 'IDAT', 'IEND'])
    expect(header?.readUInt32BE(0)).toBe(36)
    expect(header?.readUInt32BE(4)).toBe(24)
    expect([header?.[8], header?.[9]]).toEqual([8, 2])
    expect(pixels).toHaveLength((36 * 3 + 1) * 24)
  })

  it('renders byte-identical originals on every run', () => {
    const digest = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex')

    expect(digest(renderIllustration(spec))).toBe(digest(renderIllustration(spec)))
    expect(digest(renderIllustration(spec))).not.toBe(
      digest(renderIllustration({ ...spec, light: [10, 20, 30] })),
    )
  })

  it('refuses pixel data that does not match the image size', () => {
    expect(() => encodePng(2, 2, new Uint8Array(5))).toThrow('Pixel data does not match')
  })
})
