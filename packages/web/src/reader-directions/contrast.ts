/*
 * WCAG 2.2 contrast for the colors a reader direction declares. Opaque hex, rgb(), and oklch()
 * colors are measured. Anything else is refused, so a palette can never pass a check that was not
 * actually run.
 */

/** The minimum contrast for body-size text (WCAG 2.2 success criterion 1.4.3, level AA). */
export const wcagTextContrast = 4.5

type LinearRgb = readonly [number, number, number]

function unmeasurable(value: string): never {
  throw new RangeError(
    `The Reader Lab cannot measure the contrast of "${value}". Use an opaque hex, rgb(), or oklch() color.`,
  )
}

function linearize(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
}

function fromSrgb(value: string, channels: readonly number[]): LinearRgb {
  const [red, green, blue] = channels
  if (
    channels.length !== 3 ||
    red === undefined ||
    green === undefined ||
    blue === undefined ||
    channels.some((channel) => !Number.isFinite(channel) || channel < 0 || channel > 1)
  ) {
    unmeasurable(value)
  }
  return [linearize(red), linearize(green), linearize(blue)]
}

function parseHex(value: string): LinearRgb | null {
  const digits = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(value)?.[1]
  if (!digits) return null
  let hex = digits.length === 3 ? [...digits].map((digit) => digit + digit).join('') : digits
  if (hex.length === 8) {
    if (hex.slice(6).toLowerCase() !== 'ff') unmeasurable(value)
    hex = hex.slice(0, 6)
  }
  return fromSrgb(
    value,
    [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255),
  )
}

/** The channel list inside `name(...)`, or null for another notation. Refuses translucency. */
function functionalChannels(value: string, name: string): string[] | null {
  const inner = new RegExp(`^${name}\\(([^()]*)\\)$`, 'i').exec(value)?.[1]
  if (inner === undefined) return null
  const [channels = '', alpha, ...extra] = inner.split('/')
  if (extra.length > 0) unmeasurable(value)
  if (alpha !== undefined && !['1', '1.0', '100%'].includes(alpha.trim())) unmeasurable(value)
  return channels.trim().split(/\s*,\s*|\s+/)
}

function number(value: string, text: string | undefined): number {
  if (text === undefined || !/^-?(?:\d+\.?\d*|\.\d+)$/.test(text)) unmeasurable(value)
  return Number(text)
}

function numberOrPercentage(value: string, text: string | undefined, percentScale: number) {
  return text?.endsWith('%') ? (number(value, text.slice(0, -1)) / 100) * percentScale : null
}

function parseRgb(value: string): LinearRgb | null {
  const channels = functionalChannels(value, 'rgb')
  if (!channels) return null
  return fromSrgb(
    value,
    channels.map(
      (channel) => numberOrPercentage(value, channel, 1) ?? number(value, channel) / 255,
    ),
  )
}

function parseOklch(value: string): LinearRgb | null {
  const channels = functionalChannels(value, 'oklch')
  if (!channels) return null
  if (channels.length !== 3) unmeasurable(value)
  const [lightnessText, chromaText, hueText] = channels
  const lightness = numberOrPercentage(value, lightnessText, 1) ?? number(value, lightnessText)
  const chroma = numberOrPercentage(value, chromaText, 0.4) ?? number(value, chromaText)
  const hue = number(value, hueText?.replace(/deg$/i, ''))
  if (lightness < 0 || lightness > 1 || chroma < 0) unmeasurable(value)

  const angle = (hue * Math.PI) / 180
  const a = chroma * Math.cos(angle)
  const b = chroma * Math.sin(angle)
  const long = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const medium = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const short = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3
  const inGamut = (channel: number) => Math.min(1, Math.max(0, channel))
  return [
    inGamut(4.0767416621 * long - 3.3077115913 * medium + 0.2309699292 * short),
    inGamut(-1.2684380046 * long + 2.6097574011 * medium - 0.3413193965 * short),
    inGamut(-0.0041960863 * long - 0.7034186147 * medium + 1.707614701 * short),
  ]
}

/** Relative luminance (WCAG 2.2), from 0 for black to 1 for white. */
export function relativeLuminance(color: string): number {
  const value = color.trim()
  const [red, green, blue] =
    parseHex(value) ?? parseRgb(value) ?? parseOklch(value) ?? unmeasurable(color)
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

/** The WCAG contrast ratio of two colors, from 1 to 21. The order does not matter. */
export function contrastRatio(first: string, second: string): number {
  const [lighter, darker] = [relativeLuminance(first), relativeLuminance(second)].sort(
    (left, right) => right - left,
  ) as [number, number]
  return (lighter + 0.05) / (darker + 0.05)
}
