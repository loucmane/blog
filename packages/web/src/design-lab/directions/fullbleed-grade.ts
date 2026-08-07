export interface FullbleedRgb {
  readonly blue: number
  readonly green: number
  readonly red: number
}

export interface FullbleedGrade {
  readonly primary: string
  readonly scrim: string
  readonly scrimOpacity: number
  readonly secondary: string
  readonly source: 'fallback' | 'sampled'
}

const carbon = { blue: 20, green: 17, red: 16 } satisfies FullbleedRgb
const signalWhite = { blue: 248, green: 247, red: 246 } satisfies FullbleedRgb
const minimumContrast = 4.5

export const fullbleedFallbackGrade = Object.freeze({
  primary: '#E62E6B',
  scrim: 'rgba(0, 0, 0, 0.84)',
  scrimOpacity: 0.84,
  secondary: '#19B8D7',
  source: 'fallback',
}) satisfies FullbleedGrade

interface Hsl {
  readonly hue: number
  readonly lightness: number
  readonly saturation: number
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

function channel(value: number): number {
  return clamp(Math.round(value), 0, 255)
}

function rgbToHsl(color: FullbleedRgb): Hsl {
  const red = channel(color.red) / 255
  const green = channel(color.green) / 255
  const blue = channel(color.blue) / 255
  const maximum = Math.max(red, green, blue)
  const minimum = Math.min(red, green, blue)
  const delta = maximum - minimum
  const lightness = (maximum + minimum) / 2

  if (delta === 0) return { hue: 0, lightness, saturation: 0 }

  const saturation = delta / (1 - Math.abs(2 * lightness - 1))
  const hueBase =
    maximum === red
      ? ((green - blue) / delta) % 6
      : maximum === green
        ? (blue - red) / delta + 2
        : (red - green) / delta + 4
  return {
    hue: (hueBase * 60 + 360) % 360,
    lightness,
    saturation,
  }
}

function hslToRgb({ hue, lightness, saturation }: Hsl): FullbleedRgb {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation
  const segment = (((hue % 360) + 360) % 360) / 60
  const intermediate = chroma * (1 - Math.abs((segment % 2) - 1))
  const [red, green, blue] =
    segment < 1
      ? [chroma, intermediate, 0]
      : segment < 2
        ? [intermediate, chroma, 0]
        : segment < 3
          ? [0, chroma, intermediate]
          : segment < 4
            ? [0, intermediate, chroma]
            : segment < 5
              ? [intermediate, 0, chroma]
              : [chroma, 0, intermediate]
  const offset = lightness - chroma / 2
  return {
    blue: channel((blue + offset) * 255),
    green: channel((green + offset) * 255),
    red: channel((red + offset) * 255),
  }
}

function hex(color: FullbleedRgb): string {
  return `#${[color.red, color.green, color.blue]
    .map((value) => channel(value).toString(16).padStart(2, '0'))
    .join('')}`.toUpperCase()
}

function linearChannel(value: number): number {
  const normalized = channel(value) / 255
  return normalized <= 0.04045 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4)
}

export function relativeLuminance(color: FullbleedRgb): number {
  return (
    0.2126 * linearChannel(color.red) +
    0.7152 * linearChannel(color.green) +
    0.0722 * linearChannel(color.blue)
  )
}

export function contrastRatio(first: FullbleedRgb, second: FullbleedRgb): number {
  const lighter = Math.max(relativeLuminance(first), relativeLuminance(second))
  const darker = Math.min(relativeLuminance(first), relativeLuminance(second))
  return (lighter + 0.05) / (darker + 0.05)
}

function hueDistance(first: number, second: number): number {
  const distance = Math.abs(first - second) % 360
  return Math.min(distance, 360 - distance)
}

function highChroma(color: FullbleedRgb): FullbleedRgb {
  const input = rgbToHsl(color)
  return hslToRgb({
    hue: input.hue,
    lightness: clamp(input.lightness, 0.56, 0.66),
    saturation: clamp(input.saturation * 1.8, 0.78, 0.94),
  })
}

function scrimOpacity(samples: readonly FullbleedRgb[]): number {
  const brightest = Math.max(...samples.map(relativeLuminance))
  const maximumBackgroundLuminance =
    (relativeLuminance(signalWhite) + 0.05) / minimumContrast - 0.05
  if (brightest <= maximumBackgroundLuminance) return 0.42
  return clamp(1 - maximumBackgroundLuminance / brightest, 0.42, 0.86)
}

/**
 * Derives a stable high-chroma grade from sampled image pixels. The function is
 * deliberately pure so fixtures can prove palette, fallback, and contrast behavior.
 */
export function deriveFullbleedGrade(samples: readonly FullbleedRgb[]): FullbleedGrade {
  const usable = samples.filter(
    (sample) =>
      Number.isFinite(sample.red) && Number.isFinite(sample.green) && Number.isFinite(sample.blue),
  )
  if (usable.length === 0) return fullbleedFallbackGrade

  const ranked = usable
    .map((color, index) => ({ color, hsl: rgbToHsl(color), index }))
    .sort(
      (first, second) =>
        second.hsl.saturation - first.hsl.saturation ||
        second.hsl.lightness - first.hsl.lightness ||
        first.index - second.index,
    )
  const first = ranked[0]!
  if (first.hsl.saturation < 0.045) return fullbleedFallbackGrade

  const second =
    ranked
      .slice(1)
      .sort(
        (left, right) =>
          hueDistance(first.hsl.hue, right.hsl.hue) - hueDistance(first.hsl.hue, left.hsl.hue) ||
          right.hsl.saturation - left.hsl.saturation ||
          left.index - right.index,
      )[0] ?? first
  const primary = highChroma(first.color)
  const secondary = highChroma(
    second === first ? hslToRgb({ ...first.hsl, hue: (first.hsl.hue + 54) % 360 }) : second.color,
  )

  if (
    contrastRatio(primary, carbon) < minimumContrast ||
    contrastRatio(secondary, carbon) < minimumContrast
  ) {
    return fullbleedFallbackGrade
  }

  const opacity = Number(scrimOpacity(usable).toFixed(3))
  return Object.freeze({
    primary: hex(primary),
    scrim: `rgba(0, 0, 0, ${opacity})`,
    scrimOpacity: opacity,
    secondary: hex(secondary),
    source: 'sampled',
  })
}

export function isSameOriginImageSource(source: string, origin: string): boolean {
  try {
    const url = new URL(source, origin)
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.origin === origin
  } catch {
    return false
  }
}
