import type { FunctionComponent } from 'react'

import type { ArticleView, HomeView, SectionView } from '@/reader/views'

import { contrastRatio, wcagTextContrast } from './contrast'

/*
 * The reader direction contract. A direction is one complete presentation of the public site: its
 * Home, Article, and Section server components receive the direction-neutral view models and render
 * the whole page below the root layout. Directions never fetch data, read cookies, or know about
 * the Reader Lab.
 *
 * A direction's assets load only while it is the active direction: the page applies its font
 * variables, tokens, and styles only when it renders that direction. Next preloads every declared
 * font and bundles every imported stylesheet into all reader pages, whichever direction is active,
 * so direction fonts set `preload: false`, and direction CSS lives in `tokens` and `styles` instead
 * of imported stylesheets. The registry tests enforce both rules.
 */

export interface HomeDirectionProps {
  readonly view: HomeView
}

export interface ArticleDirectionProps {
  readonly view: ArticleView
}

export interface SectionDirectionProps {
  readonly view: SectionView
}

/** What a `next/font` loader returns when it is declared with a `variable`. */
export interface ReaderDirectionFont {
  readonly className: string
  readonly style: { readonly fontFamily: string }
  /** The class that defines the font's CSS variable. It is applied to the direction's root. */
  readonly variable: string
}

export type ReaderDirectionTokenName = `--${string}`
export type ReaderDirectionTokenSet = Readonly<Record<ReaderDirectionTokenName, string>>
export type ReaderDirectionTextPair = readonly [
  text: ReaderDirectionTokenName,
  background: ReaderDirectionTokenName,
]

/** CSS custom properties, scoped to the direction's root element. */
export interface ReaderDirectionTokens {
  /** Overrides for the dark theme. Tokens it does not name keep their light value. */
  readonly dark?: ReaderDirectionTokenSet
  readonly light: ReaderDirectionTokenSet
  /** Text and background tokens that must reach WCAG AA contrast (4.5:1) in every theme. */
  readonly textPairs?: readonly ReaderDirectionTextPair[]
}

export interface ReaderDirectionDefinition {
  readonly Article: FunctionComponent<ArticleDirectionProps>
  /** `next/font` loaders, each declared with `preload: false` and a `variable`. */
  readonly fonts?: readonly ReaderDirectionFont[]
  readonly Home: FunctionComponent<HomeDirectionProps>
  /** Short lowercase kebab-case, such as `quiet-monograph`. */
  readonly id: string
  /** The name the owner sees in the Reader Lab. */
  readonly name: string
  readonly Section: FunctionComponent<SectionDirectionProps>
  /** CSS nested under the direction's root element, so its selectors reach only this direction. */
  readonly styles?: string
  /** The direction's idea, in one line. */
  readonly thesis: string
  readonly tokens?: ReaderDirectionTokens
}

export interface ReaderDirection extends ReaderDirectionDefinition {
  readonly fonts: readonly ReaderDirectionFont[]
}

export interface ReaderDirectionNeighbours {
  readonly next: ReaderDirection
  /** The direction's place in the registry, starting at 1. */
  readonly position: number
  readonly previous: ReaderDirection
  readonly total: number
}

export interface ReaderDirectionRegistry {
  /** The direction every visitor sees. */
  readonly defaultDirection: ReaderDirection
  /** Registered directions, in Reader Lab order. */
  readonly directions: readonly ReaderDirection[]
  find(id: string | null | undefined): ReaderDirection | null
  /** The previous and next directions, wrapping around at either end. */
  neighbours(id: string): ReaderDirectionNeighbours
}

export class ReaderDirectionError extends TypeError {
  constructor(message: string) {
    super(message)
    this.name = 'ReaderDirectionError'
  }
}

const directionIdPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/
const maxIdLength = 48
const maxNameLength = 48
const maxThesisLength = 180
const tokenNamePattern = /^--[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/
const fontVariablePattern = /^[A-Za-z0-9_-]+$/
const views = ['Home', 'Article', 'Section'] as const

function fail(id: string, problem: string): never {
  throw new ReaderDirectionError(`Reader direction "${id}": ${problem}`)
}

function requireText(id: string, field: 'name' | 'thesis', value: unknown, maxLength: number) {
  const text = typeof value === 'string' ? value.trim() : ''
  if (!text) fail(id, `${field} must not be empty.`)
  if (/[\r\n]/.test(text)) fail(id, `${field} must be one line.`)
  if (text.length > maxLength) fail(id, `${field} must be at most ${maxLength} characters.`)
  return text
}

function requireFonts(id: string, fonts: readonly ReaderDirectionFont[] | undefined) {
  const variables = new Set<string>()
  for (const font of fonts ?? []) {
    if (typeof font?.variable !== 'string' || !fontVariablePattern.test(font.variable)) {
      fail(id, 'every font needs the single class name from its font variable (`variable`).')
    }
    if (typeof font.style?.fontFamily !== 'string' || !font.style.fontFamily.trim()) {
      fail(id, `the font with variable "${font.variable}" has no font family.`)
    }
    if (variables.has(font.variable)) fail(id, `the font "${font.variable}" is listed twice.`)
    variables.add(font.variable)
  }
  return Object.freeze([...(fonts ?? [])])
}

function requireTokenSet(id: string, theme: string, tokens: unknown): ReaderDirectionTokenSet {
  if (typeof tokens !== 'object' || tokens === null) fail(id, `${theme} tokens must be an object.`)
  for (const [name, value] of Object.entries(tokens)) {
    if (!tokenNamePattern.test(name)) {
      fail(id, `token "${name}" must be a lowercase custom property name, such as "--ink".`)
    }
    if (typeof value !== 'string' || !value.trim() || /[;{}<>\\\r\n]/.test(value)) {
      fail(id, `token ${name} needs a plain CSS value without ; { } < > \\ or line breaks.`)
    }
  }
  return Object.freeze({ ...(tokens as ReaderDirectionTokenSet) })
}

function requireReadableText(
  id: string,
  theme: string,
  tokens: ReaderDirectionTokenSet,
  [text, background]: ReaderDirectionTextPair,
) {
  for (const name of [text, background]) {
    if (tokens[name] === undefined) fail(id, `text pair token ${name} is not defined.`)
  }
  let ratio: number
  try {
    ratio = contrastRatio(tokens[text] ?? '', tokens[background] ?? '')
  } catch {
    fail(
      id,
      `${text} and ${background} must be opaque hex, rgb(), or oklch() colors to check their contrast.`,
    )
  }
  if (ratio < wcagTextContrast) {
    fail(
      id,
      `${text} on ${background} must reach ${wcagTextContrast}:1 for text (WCAG AA) in ${theme} mode, but is ${ratio.toFixed(2)}:1.`,
    )
  }
}

function requireTokens(id: string, tokens: ReaderDirectionTokens | undefined) {
  if (tokens === undefined) return undefined
  const light = requireTokenSet(id, 'light', tokens.light)
  const dark = tokens.dark === undefined ? undefined : requireTokenSet(id, 'dark', tokens.dark)
  const textPairs = Object.freeze(
    (tokens.textPairs ?? []).map((pair) => Object.freeze([...pair]) as ReaderDirectionTextPair),
  )
  for (const pair of textPairs) {
    requireReadableText(id, 'light', light, pair)
    if (dark) requireReadableText(id, 'dark', { ...light, ...dark }, pair)
  }
  return Object.freeze({ ...(dark ? { dark } : {}), light, textPairs })
}

/** True when every brace outside comments and strings closes, so styles cannot leave their scope. */
function bracesBalance(css: string): boolean {
  let depth = 0
  for (const character of css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(["'])(?:\\.|(?!\1).)*\1/g, '')) {
    if (character === '{') depth += 1
    if (character === '}') depth -= 1
    if (depth < 0) return false
  }
  return depth === 0
}

function requireStyles(id: string, styles: string | undefined) {
  if (styles === undefined) return undefined
  if (
    typeof styles !== 'string' ||
    !styles.trim() ||
    styles.includes('<') ||
    !bracesBalance(styles)
  ) {
    fail(id, 'styles must be non-empty CSS with balanced braces and no markup.')
  }
  return styles.trim()
}

/** Validates a direction and freezes it. Throws a `ReaderDirectionError` on the first problem. */
export function defineReaderDirection(definition: ReaderDirectionDefinition): ReaderDirection {
  const { id } = definition
  if (typeof id !== 'string' || id.length > maxIdLength || !directionIdPattern.test(id)) {
    throw new ReaderDirectionError(
      `Reader direction id ${JSON.stringify(id)} must be short lowercase kebab-case, such as "quiet-monograph".`,
    )
  }
  for (const view of views) {
    if (typeof definition[view] !== 'function') {
      fail(id, `the direction must provide a ${view} view component.`)
    }
  }
  const name = requireText(id, 'name', definition.name, maxNameLength)
  const thesis = requireText(id, 'thesis', definition.thesis, maxThesisLength)
  const fonts = requireFonts(id, definition.fonts)
  const tokens = requireTokens(id, definition.tokens)
  const styles = requireStyles(id, definition.styles)

  return Object.freeze({
    Article: definition.Article,
    fonts,
    Home: definition.Home,
    id,
    name,
    Section: definition.Section,
    ...(styles === undefined ? {} : { styles }),
    thesis,
    ...(tokens === undefined ? {} : { tokens }),
  })
}

/**
 * Registers directions in Reader Lab order. Fails fast on an invalid direction, a duplicate id or
 * name, an empty list, or a default that is not registered.
 */
export function createReaderDirectionRegistry(input: {
  readonly defaultId: string
  readonly directions: readonly ReaderDirectionDefinition[]
}): ReaderDirectionRegistry {
  if (input.directions.length === 0) {
    throw new ReaderDirectionError('The Reader Lab needs at least one direction.')
  }
  const byId = new Map<string, ReaderDirection>()
  const idsByName = new Map<string, string>()
  for (const definition of input.directions) {
    const direction = defineReaderDirection(definition)
    if (byId.has(direction.id)) {
      throw new ReaderDirectionError(`Reader direction "${direction.id}" is registered twice.`)
    }
    const sameName = idsByName.get(direction.name.toLowerCase())
    if (sameName) {
      throw new ReaderDirectionError(
        `Reader direction name "${direction.name}" is already used by "${sameName}".`,
      )
    }
    byId.set(direction.id, direction)
    idsByName.set(direction.name.toLowerCase(), direction.id)
  }
  const defaultDirection = byId.get(input.defaultId)
  if (!defaultDirection) {
    throw new ReaderDirectionError(`The default direction "${input.defaultId}" is not registered.`)
  }
  const directions = Object.freeze([...byId.values()])

  return Object.freeze({
    defaultDirection,
    directions,
    find(id: string | null | undefined) {
      return typeof id === 'string' ? (byId.get(id) ?? null) : null
    },
    neighbours(id: string) {
      const index = directions.findIndex((direction) => direction.id === id)
      const direction = directions[index]
      if (!direction) throw new ReaderDirectionError(`Reader direction "${id}" is not registered.`)
      return {
        next: directions[(index + 1) % directions.length] ?? direction,
        position: index + 1,
        previous: directions[(index - 1 + directions.length) % directions.length] ?? direction,
        total: directions.length,
      }
    },
  })
}

function scope(direction: ReaderDirection): string {
  return `[data-reader-direction="${direction.id}"]`
}

function declarations(tokens: ReaderDirectionTokenSet): string {
  return Object.entries(tokens)
    .map(([name, value]) => `${name}:${value.trim()}`)
    .join(';')
}

/** The direction's tokens as CSS for its root element, or null when it declares none. */
export function readerDirectionTokenCss(direction: ReaderDirection): string | null {
  if (!direction.tokens) return null
  const { dark, light } = direction.tokens
  return (
    `${scope(direction)}{${declarations(light)}}` +
    (dark ? `.dark ${scope(direction)}{${declarations(dark)}}` : '')
  )
}

/** The direction's styles nested under its root element, or null when it has none. */
export function readerDirectionStyleCss(direction: ReaderDirection): string | null {
  return direction.styles ? `${scope(direction)}{${direction.styles}}` : null
}

/** The font variable classes for the direction's root element. */
export function readerDirectionFontClassName(direction: ReaderDirection): string | undefined {
  return direction.fonts.map(({ variable }) => variable).join(' ') || undefined
}
