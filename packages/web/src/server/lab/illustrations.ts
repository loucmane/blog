import { deflateSync } from 'node:zlib'

/*
 * Deterministic abstract illustrations for the Reader Lab seed: a wall, a window of light, and
 * the patch of light it throws on the floor. They are generated, not downloaded, so the seed
 * needs no network access and every run stores byte-identical originals.
 */

type Rgb = readonly [number, number, number]

export interface IllustrationSpec {
  readonly floor: Rgb
  readonly height: number
  readonly light: Rgb
  readonly wallBottom: Rgb
  readonly wallTop: Rgb
  readonly width: number
  /** Window rectangle as fractions of the image: left, top, width, height. */
  readonly window: readonly [number, number, number, number]
}

const pngSignature = Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)

const crcTable = (() => {
  const table = new Uint32Array(256)
  for (let entry = 0; entry < 256; entry += 1) {
    let value = entry
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
    }
    table[entry] = value >>> 0
  }
  return table
})()

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff
  for (const byte of bytes) crc = (crcTable[(crc ^ byte) & 0xff] ?? 0) ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function pngChunk(type: string, data: Uint8Array): Buffer {
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const chunk = Buffer.alloc(typeAndData.length + 8)
  chunk.writeUInt32BE(data.length, 0)
  typeAndData.copy(chunk, 4)
  chunk.writeUInt32BE(crc32(typeAndData), typeAndData.length + 4)
  return chunk
}

/** Encodes 8-bit RGB pixels as a PNG, using the Sub filter so smooth gradients compress well. */
export function encodePng(width: number, height: number, rgb: Uint8Array): Uint8Array {
  const stride = width * 3
  if (rgb.length !== stride * height) throw new Error('Pixel data does not match the image size.')
  const filtered = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y += 1) {
    const row = y * (stride + 1)
    filtered[row] = 1
    for (let x = 0; x < stride; x += 1) {
      const value = rgb[y * stride + x] ?? 0
      const left = x >= 3 ? (rgb[y * stride + x - 3] ?? 0) : 0
      filtered[row + 1 + x] = (value - left) & 0xff
    }
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header[8] = 8
  header[9] = 2
  return Buffer.concat([
    pngSignature,
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(filtered)),
    pngChunk('IEND', new Uint8Array()),
  ])
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

function mix(from: Rgb, to: Rgb, amount: number): Rgb {
  return [
    from[0] + (to[0] - from[0]) * amount,
    from[1] + (to[1] - from[1]) * amount,
    from[2] + (to[2] - from[2]) * amount,
  ]
}

/** Paints a room: a wall gradient, a soft-edged window, and the light it casts on the floor. */
export function paintIllustration(spec: IllustrationSpec): Uint8Array {
  const { height, width } = spec
  const [windowLeft, windowTop, windowWidth, windowHeight] = spec.window
  const horizon = 0.7
  const softness = 0.012
  const pixels = new Uint8Array(width * height * 3)
  for (let y = 0; y < height; y += 1) {
    const v = y / (height - 1)
    for (let x = 0; x < width; x += 1) {
      const u = x / (width - 1)
      let color: Rgb
      if (v < horizon) {
        color = mix(spec.wallTop, spec.wallBottom, v / horizon)
        const inside =
          smoothstep(windowLeft - softness, windowLeft + softness, u) *
          (1 -
            smoothstep(
              windowLeft + windowWidth - softness,
              windowLeft + windowWidth + softness,
              u,
            )) *
          smoothstep(windowTop - softness, windowTop + softness, v) *
          (1 -
            smoothstep(windowTop + windowHeight - softness, windowTop + windowHeight + softness, v))
        color = mix(color, spec.light, inside * 0.9)
      } else {
        const depth = (v - horizon) / (1 - horizon)
        color = mix(mix(spec.floor, spec.wallBottom, 0.25), spec.floor, depth)
        const spread = windowWidth * (0.6 + depth * 0.9)
        const centre = windowLeft + windowWidth / 2 + depth * 0.12
        const across = 1 - smoothstep(spread * 0.35, spread * 0.6, Math.abs(u - centre))
        const fade = 1 - smoothstep(0.2, 1, depth)
        color = mix(color, spec.light, across * fade * 0.55)
      }
      const vignette = 1 - 0.18 * ((u - 0.5) ** 2 + (v - 0.5) ** 2)
      const offset = (y * width + x) * 3
      pixels[offset] = Math.round(Math.min(255, Math.max(0, color[0] * vignette)))
      pixels[offset + 1] = Math.round(Math.min(255, Math.max(0, color[1] * vignette)))
      pixels[offset + 2] = Math.round(Math.min(255, Math.max(0, color[2] * vignette)))
    }
  }
  return pixels
}

export function renderIllustration(spec: IllustrationSpec): Uint8Array {
  return encodePng(spec.width, spec.height, paintIllustration(spec))
}
