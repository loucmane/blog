import postcss from 'postcss'
import { describe, expect, it } from 'vitest'

import { BaselineAuthor } from './baseline/author'
import { BaselineTopic } from './baseline/topic'
import {
  createReaderDirectionRegistry,
  defineReaderDirection,
  readerDirectionFontCss,
  readerDirectionStyleCss,
  readerDirectionTokenCss,
  ReaderDirectionError,
  type ReaderDirectionDefinition,
  type ReaderDirectionFont,
} from './contract'

function TestView() {
  return null
}

function definition(overrides: Partial<ReaderDirectionDefinition> = {}): ReaderDirectionDefinition {
  return {
    Article: TestView,
    Home: TestView,
    id: 'quiet-monograph',
    name: 'A Quiet Monograph',
    Section: TestView,
    thesis: 'Long, calm pages that let photographs and type breathe.',
    ...overrides,
  }
}

const displayFont = {
  fallback: {
    family: 'Times New Roman',
    ascentOverride: '95.27%',
    descentOverride: '29.59%',
    lineGapOverride: '0.00%',
    sizeAdjust: '96.98%',
  },
  genericFamily: 'serif',
  sources: [{ file: 'display-latin-400.woff2', weight: 400 }],
  variable: '--font-display',
} as const
const textFont = { ...displayFont, variable: '--font-text' } as const

describe('variable font descriptors', () => {
  function variable(source: Record<string, unknown>) {
    return defineReaderDirection(
      definition({
        fonts: [
          {
            ...displayFont,
            sources: [{ file: 'variable.woff2', weight: [100, 900], ...source } as never],
          },
        ],
      }),
    )
  }

  it('emits weight and width ranges and freezes independent copies', () => {
    const weight = [100, 900]
    const stretch = ['62.5%', '125%']
    const direction = variable({ weight, stretch })
    expect(readerDirectionFontCss(direction)).toContain(
      'font-weight:100 900;font-stretch:62.5% 125%;font-display:optional;',
    )
    weight[0] = 400
    stretch[0] = '100%'
    expect(direction.fonts[0]!.sources[0]!.weight).toEqual([100, 900])
    expect(direction.fonts[0]!.sources[0]!.stretch).toEqual(['62.5%', '125%'])
    expect(Object.isFrozen(direction.fonts[0]!.sources[0]!.weight)).toBe(true)
    expect(Object.isFrozen(direction.fonts[0]!.sources[0]!.stretch)).toBe(true)
  })

  it.each([
    [],
    [400],
    [100, 400, 900],
    [900, 100],
    [0, 1000],
    [100, 1001],
    [100.5, 900],
    ['100', 900],
    [NaN, 900],
    [100, Infinity],
    '100 900',
    null,
  ])('rejects invalid weight %j', (weight) => {
    expect(() => variable({ weight })).toThrow(/weight/)
  })

  it.each([
    [],
    ['100%'],
    ['50%', '100%', '150%'],
    ['100%', '50%'],
    ['24%', '100%'],
    ['100%', '201%'],
    [25, 200],
    ['25% ; color:red', '100%'],
    ['25%', '200%}'],
    ['NaN%', '100%'],
    '100%',
    null,
  ])('rejects invalid stretch %j', (stretch) => {
    expect(() => variable({ stretch })).toThrow(/stretch/)
  })

  it('accepts inclusive bounds and single-value ranges', () => {
    expect(
      readerDirectionFontCss(variable({ weight: [1, 1000], stretch: ['25%', '200%'] })),
    ).toContain('font-weight:1 1000;font-stretch:25% 200%;')
    expect(
      readerDirectionFontCss(variable({ weight: [400, 400], stretch: ['100%', '100%'] })),
    ).toContain('font-weight:400 400;font-stretch:100% 100%;')
  })
})

describe('local fallback faces', () => {
  type Source = ReaderDirectionFont['sources'][number]
  const fallbackFamily = '"reader-quiet-monograph__font-display fallback"'
  const timesOverrides = {
    'ascent-override': '95.27%',
    'descent-override': '29.59%',
    'line-gap-override': '0.00%',
    'size-adjust': '96.98%',
  }
  const arial = {
    family: 'Arial',
    ascentOverride: '93.46%',
    descentOverride: '24.67%',
    lineGapOverride: '0.00%',
    sizeAdjust: '104.49%',
  } as const

  function css(fonts: readonly ReaderDirectionFont[]) {
    return readerDirectionFontCss(defineReaderDirection(definition({ fonts })))!
  }

  /** The generated local fallback faces, in order, as descriptor maps. */
  function localFaces(fonts: readonly ReaderDirectionFont[]) {
    const faces: Record<string, string>[] = []
    postcss.parse(css(fonts)).walkAtRules('font-face', (face) => {
      const descriptors: Record<string, string> = {}
      face.walkDecls(({ prop, value }) => {
        descriptors[prop] = value
      })
      if (descriptors.src?.startsWith('local(')) faces.push(descriptors)
    })
    return faces
  }

  function display(sources: readonly Source[], fallback: ReaderDirectionFont['fallback']) {
    return [{ ...displayFont, fallback, sources }]
  }

  it('gives a medium emphasis family regular, bold and italic faces, with a bold face from 500', () => {
    // Quiet Monograph's shape: 400 and 500 with a 400 italic. Its emphasis is the 500, which
    // browsers never synthesize as bold, so the local bold face must start at 500.
    expect(
      localFaces(
        display(
          [
            { file: 'display-400.woff2', weight: 400 },
            { file: 'display-500.woff2', weight: 500 },
            { file: 'display-400-italic.woff2', weight: 400, style: 'italic' },
          ],
          displayFont.fallback,
        ),
      ),
    ).toEqual([
      {
        'font-family': fallbackFamily,
        src: 'local("Times New Roman"),local("TimesNewRomanPSMT"),local("Liberation Serif")',
        ...timesOverrides,
      },
      {
        'font-family': fallbackFamily,
        'font-weight': '500 1000',
        src: 'local("Times New Roman Bold"),local("TimesNewRomanPS-BoldMT"),local("Liberation Serif Bold")',
        ...timesOverrides,
      },
      {
        'font-family': fallbackFamily,
        'font-style': 'italic',
        src: 'local("Times New Roman Italic"),local("TimesNewRomanPS-ItalicMT"),local("Liberation Serif Italic")',
        ...timesOverrides,
      },
    ])
  })

  it('gives a family with bold and bold italic web faces all four local faces, bold from 600', () => {
    const overrides = {
      'ascent-override': '93.46%',
      'descent-override': '24.67%',
      'line-gap-override': '0.00%',
      'size-adjust': '104.49%',
    }
    expect(
      localFaces(
        display(
          [
            { file: 'sans-400.woff2', weight: 400 },
            { file: 'sans-700.woff2', weight: 700 },
            { file: 'sans-800.woff2', weight: 800 },
            { file: 'sans-400-italic.woff2', weight: 400, style: 'italic' },
            { file: 'sans-700-italic.woff2', weight: 700, style: 'italic' },
          ],
          arial,
        ),
      ),
    ).toEqual([
      {
        'font-family': fallbackFamily,
        src: 'local("Arial"),local("ArialMT"),local("Liberation Sans")',
        ...overrides,
      },
      {
        'font-family': fallbackFamily,
        'font-weight': '600 1000',
        src: 'local("Arial Bold"),local("Arial-BoldMT"),local("Liberation Sans Bold")',
        ...overrides,
      },
      {
        'font-family': fallbackFamily,
        'font-style': 'italic',
        src: 'local("Arial Italic"),local("Arial-ItalicMT"),local("Liberation Sans Italic")',
        ...overrides,
      },
      {
        'font-family': fallbackFamily,
        'font-style': 'italic',
        'font-weight': '600 1000',
        src: 'local("Arial Bold Italic"),local("Arial-BoldItalicMT"),local("Liberation Sans Bold Italic")',
        ...overrides,
      },
    ])
  })

  it.each<{ weights: readonly Source['weight'][]; bold: string | undefined }>([
    { weights: [400], bold: undefined },
    { weights: [300, 400], bold: undefined },
    { weights: [[100, 400]], bold: undefined },
    { weights: [400, 450], bold: '450 1000' },
    { weights: [400, 500], bold: '500 1000' },
    { weights: [[400, 500]], bold: '500 1000' },
    { weights: [400, 500, 600], bold: '600 1000' },
    { weights: [400, 600], bold: '600 1000' },
    { weights: [400, 700, 800], bold: '600 1000' },
    { weights: [700], bold: '600 1000' },
    { weights: [[100, 900]], bold: '600 1000' },
    { weights: [[400, 900]], bold: '600 1000' },
  ])(
    'starts the bold face at the heaviest weight up to 600 for weights $weights',
    ({ weights, bold }) => {
      const faces = localFaces(
        display(
          weights.map((weight, index) => ({ file: `face-${index}.woff2`, weight })),
          displayFont.fallback,
        ),
      )
      expect(faces.map((face) => face['font-weight'])).toEqual(
        bold === undefined ? [undefined] : [undefined, bold],
      )
      expect(faces.every((face) => face['font-style'] === undefined)).toBe(true)
    },
  )

  it('derives the italic faces from the italic web faces alone', () => {
    const styles = (sources: readonly Source[]) =>
      localFaces(display(sources, displayFont.fallback)).map((face) => [
        face['font-style'] ?? 'normal',
        face['font-weight'] ?? 'normal',
      ])
    // A 400-only italic paints strong em at 400 on warm views, so its fallback has no bold italic.
    expect(
      styles([
        { file: 'a.woff2', weight: 400 },
        { file: 'b.woff2', weight: 500 },
        { file: 'c.woff2', weight: 400, style: 'italic' },
      ]),
    ).toEqual([
      ['normal', 'normal'],
      ['normal', '500 1000'],
      ['italic', 'normal'],
    ])
    expect(
      styles([
        { file: 'a.woff2', weight: 400 },
        { file: 'b.woff2', weight: 400, style: 'italic' },
        { file: 'c.woff2', weight: [400, 900], style: 'italic' },
      ]),
    ).toEqual([
      ['normal', 'normal'],
      ['italic', 'normal'],
      ['italic', '600 1000'],
    ])
    // Without italic web faces there is no local italic either, as on warm views.
    expect(
      styles([
        { file: 'a.woff2', weight: 400 },
        { file: 'b.woff2', weight: 600 },
      ]),
    ).toEqual([
      ['normal', 'normal'],
      ['normal', '600 1000'],
    ])
  })

  it('names another fallback family by its full face names only', () => {
    expect(
      localFaces(
        display(
          [
            { file: 'a.woff2', weight: 400 },
            { file: 'b.woff2', weight: 700 },
            { file: 'c.woff2', weight: 400, style: 'italic' },
            { file: 'd.woff2', weight: 700, style: 'italic' },
          ],
          { ...displayFont.fallback, family: 'Georgia' },
        ),
      ).map(({ src }) => src),
    ).toEqual([
      'local("Georgia")',
      'local("Georgia Bold")',
      'local("Georgia Italic")',
      'local("Georgia Bold Italic")',
    ])
  })

  it('treats a fallback named like an Object.prototype key as an unknown family', () => {
    for (const family of ['constructor', 'toString']) {
      expect(
        localFaces(
          display(
            [
              { file: 'a.woff2', weight: 400 },
              { file: 'b.woff2', weight: 700 },
            ],
            { ...displayFont.fallback, family },
          ),
        ).map(({ src }) => src),
      ).toEqual([`local("${family}")`, `local("${family} Bold")`])
    }
  })

  it('keeps one fallback family and its metric overrides on every face, after the web faces', () => {
    const fonts = display(
      [
        { file: 'a.woff2', weight: [100, 900], stretch: ['62%', '125%'] },
        { file: 'b.woff2', weight: 400, style: 'italic' },
        { file: 'c.woff2', weight: 700, style: 'italic' },
      ],
      displayFont.fallback,
    )
    const faces = localFaces(fonts)
    expect(faces).toHaveLength(4)
    for (const face of faces) {
      expect(face).toMatchObject({ 'font-family': fallbackFamily, ...timesOverrides })
      expect(face['font-stretch']).toBeUndefined()
      expect(face['font-display']).toBeUndefined()
    }
    const output = css(fonts)
    expect(output.lastIndexOf('url(')).toBeLessThan(output.indexOf('local('))
    expect(output).toMatch(
      /\[data-reader-direction="quiet-monograph"\]\{--font-display:"reader-quiet-monograph__font-display","reader-quiet-monograph__font-display fallback",serif;\}$/,
    )
  })

  it('emits the same fallback faces on every call and for any order of the web faces', () => {
    const sources: Source[] = [
      { file: 'a.woff2', weight: 400 },
      { file: 'b.woff2', weight: 500 },
      { file: 'c.woff2', weight: 400, style: 'italic' },
      { file: 'd.woff2', weight: 600, style: 'italic' },
    ]
    const fallbacks = (order: readonly Source[]) => localFaces(display(order, displayFont.fallback))
    expect(css(display(sources, displayFont.fallback))).toBe(
      css(display(sources, displayFont.fallback)),
    )
    expect(fallbacks([...sources].reverse())).toEqual(fallbacks(sources))
    expect(fallbacks([sources[2]!, sources[0]!, sources[3]!, sources[1]!])).toEqual(
      fallbacks(sources),
    )
  })
})

describe('reader direction contract', () => {
  it('accepts a complete direction and freezes it', () => {
    const direction = defineReaderDirection(
      definition({ fonts: [displayFont, textFont], name: '  A Quiet Monograph ' }),
    )

    expect(direction).toMatchObject({ id: 'quiet-monograph', name: 'A Quiet Monograph' })
    expect(direction.Home).toBe(TestView)
    expect(direction.Article).toBe(TestView)
    expect(direction.Section).toBe(TestView)
    expect(direction.fonts).toEqual([displayFont, textFont])
    expect(Object.isFrozen(direction)).toBe(true)
    expect(Object.isFrozen(direction.fonts)).toBe(true)
    expect(defineReaderDirection(definition()).fonts).toEqual([])
  })

  it('supplies baseline failure views and preserves supplied views', () => {
    const baseline = defineReaderDirection(definition({ id: 'baseline' }))
    const fallback = defineReaderDirection(definition())
    for (const view of ['NotFound', 'Error', 'Unavailable'] as const) {
      expect(typeof fallback[view]).toBe('function')
      expect(fallback[view]).toBe(baseline[view])
      expect(defineReaderDirection(definition({ [view]: TestView }))[view]).toBe(TestView)
    }
  })

  it.each(['NotFound', 'Error', 'Unavailable'] as const)(
    'rejects an invalid optional %s failure view',
    (view) => {
      for (const value of [null, 'main', {}, 42]) {
        expect(() => defineReaderDirection(definition({ [view]: value as never }))).toThrow(
          new RegExp(`${view} view`),
        )
      }
    },
  )

  it('copies, defaults, and freezes direction image sizes', () => {
    const sizes = { body: '(min-width: 60rem) 48rem, 100vw' }
    const direction = defineReaderDirection(definition({ imageSizes: sizes }))
    sizes.body = '1px'
    expect(direction.imageSizes).toEqual({
      body: '(min-width: 60rem) 48rem, 100vw',
      gallery: '(min-width: 768px) 42rem, 100vw',
    })
    expect(Object.isFrozen(direction.imageSizes)).toBe(true)
    expect(defineReaderDirection(definition()).imageSizes).toEqual({
      body: '(min-width: 768px) 42rem, 100vw',
      gallery: '(min-width: 768px) 42rem, 100vw',
    })
  })

  it('keeps the validated sizes values without reading getters again', () => {
    let reads = 0
    const direction = defineReaderDirection(
      definition({
        imageSizes: {
          get body() {
            reads += 1
            return reads === 1 ? '80vw' : '<invalid>'
          },
        },
      }),
    )
    expect(reads).toBe(1)
    expect(direction.imageSizes.body).toBe('80vw')
    expect(Object.isFrozen(direction.imageSizes)).toBe(true)
  })

  it.each([undefined, { body: '80vw' }])(
    'does not wrap an already defined Article again during registration (%j)',
    (imageSizes) => {
      const direction = defineReaderDirection(definition(imageSizes ? { imageSizes } : {}))
      const registry = createReaderDirectionRegistry({
        defaultId: direction.id,
        directions: [direction],
      })
      expect(registry.defaultDirection.Article).toBe(direction.Article)
      expect(defineReaderDirection(direction).Article).toBe(direction.Article)
      if (!imageSizes) expect(registry.defaultDirection.Article).toBe(TestView)
    },
  )

  it.each(
    [
      null,
      [],
      '100vw',
      { typo: '100vw' },
      { body: '' },
      { gallery: 42 },
      { body: '100vw\n' },
      { gallery: '100vw; color:red' },
      { body: '<img>' },
    ].map((value) => [value]),
  )('rejects malformed image sizes %j', (imageSizes) => {
    expect(() => defineReaderDirection(definition({ imageSizes: imageSizes as never }))).toThrow(
      /imageSizes/,
    )
  })

  it.each([
    'Quiet',
    'quiet_monograph',
    'quiet monograph',
    'quiet--monograph',
    '-quiet',
    'quiet-',
    '1-quiet',
    '',
    `q${'a'.repeat(48)}`,
  ])('rejects the id %j because it is not short kebab-case', (id) => {
    expect(() => defineReaderDirection(definition({ id }))).toThrow(ReaderDirectionError)
    expect(() => defineReaderDirection(definition({ id }))).toThrow(/kebab-case/)
  })

  it.each(['Home', 'Article', 'Section'] as const)(
    'rejects a direction without a %s view',
    (view) => {
      const incomplete = {
        ...definition(),
        [view]: undefined,
      } as unknown as ReaderDirectionDefinition

      expect(() => defineReaderDirection(incomplete)).toThrow(ReaderDirectionError)
      expect(() => defineReaderDirection(incomplete)).toThrow(new RegExp(`${view} view`))
    },
  )

  it('rejects a view that is not a component', () => {
    expect(() => defineReaderDirection(definition({ Home: '<main />' as never }))).toThrow(
      /Home view/,
    )
  })

  it('falls back to baseline’s author and topic views when a direction leaves them out', () => {
    const direction = defineReaderDirection(definition())

    expect(direction.Author).toBe(BaselineAuthor)
    expect(direction.Topic).toBe(BaselineTopic)
    expect(Object.isFrozen(direction)).toBe(true)
  })

  it('keeps a direction’s own author and topic views', () => {
    function OwnAuthor() {
      return null
    }
    function OwnTopic() {
      return null
    }

    const direction = defineReaderDirection(definition({ Author: OwnAuthor, Topic: OwnTopic }))

    expect(direction.Author).toBe(OwnAuthor)
    expect(direction.Topic).toBe(OwnTopic)
  })

  it.each(['Author', 'Topic'] as const)(
    'rejects an optional %s view that is not a component',
    (view) => {
      for (const value of ['<main />', null, {}]) {
        expect(() => defineReaderDirection(definition({ [view]: value as never }))).toThrow(
          new RegExp(`${view} view`),
        )
      }
    },
  )

  it.each([
    ['name', ''],
    ['name', '   '],
    ['thesis', ''],
    ['thesis', ' \n\t '],
  ] as const)('rejects empty %s metadata (%j)', (field, value) => {
    expect(() => defineReaderDirection(definition({ [field]: value }))).toThrow(
      ReaderDirectionError,
    )
    expect(() => defineReaderDirection(definition({ [field]: value }))).toThrow(
      new RegExp(`${field} must not be empty`),
    )
  })

  it('keeps names short and the thesis to one line', () => {
    expect(() => defineReaderDirection(definition({ name: 'N'.repeat(49) }))).toThrow(
      /name must be at most 48 characters/,
    )
    expect(() =>
      defineReaderDirection(definition({ thesis: 'The first line.\nThe second line.' })),
    ).toThrow(/thesis must be one line/)
    expect(() => defineReaderDirection(definition({ thesis: 'T'.repeat(181) }))).toThrow(
      /thesis must be at most 180 characters/,
    )
  })

  it('rejects fonts that could escape the direction scope or inject CSS', () => {
    const invalid = [
      { variable: '' },
      { variable: 'two classes' },
      { variable: '--font;}' },
      { genericFamily: 'serif; color: red' },
      { fallback: { ...displayFont.fallback, family: '";}</style>' } },
      { fallback: { ...displayFont.fallback, ascentOverride: '95%;}' } },
      { fallback: { ...displayFont.fallback, sizeAdjust: '0%' } },
      { fallback: { ...displayFont.fallback, descentOverride: '-1%' } },
      { sources: [] },
      { sources: [{ file: '../other/font.woff2', weight: 400 }] },
      { sources: [{ file: 'https://example.test/font.woff2', weight: 400 }] },
      { sources: [{ file: 'font.woff2', weight: 1001 }] },
      { sources: [{ file: 'font.woff2', weight: 0 }] },
    ]
    for (const overrides of invalid) {
      expect(() =>
        defineReaderDirection(definition({ fonts: [{ ...displayFont, ...overrides } as never] })),
      ).toThrow(ReaderDirectionError)
    }
    expect(() => defineReaderDirection(definition({ fonts: [displayFont, displayFont] }))).toThrow(
      /listed twice/,
    )
  })

  it('emits genuine italic faces while keeping omitted and explicit normal styles identical', () => {
    const normal = defineReaderDirection(definition({ fonts: [displayFont] }))
    const explicit = defineReaderDirection(
      definition({
        fonts: [{ ...displayFont, sources: [{ ...displayFont.sources[0], style: 'normal' }] }],
      }),
    )
    expect(readerDirectionFontCss(explicit)).toBe(readerDirectionFontCss(normal))
    const italic = defineReaderDirection(
      definition({
        fonts: [
          {
            ...displayFont,
            sources: [{ file: 'display-italic.woff2', weight: 400, style: 'italic' }],
          },
        ],
      }),
    )
    expect(readerDirectionFontCss(italic)).toContain('font-style:italic;font-weight:400;')
    expect(Object.isFrozen(italic.fonts[0]?.sources[0])).toBe(true)
  })

  it.each(['oblique', 'Italic', '', null, 0, 'italic;}</style>'])(
    'rejects invalid font style %j',
    (style) => {
      expect(() =>
        defineReaderDirection(
          definition({
            fonts: [
              { ...displayFont, sources: [{ file: 'display.woff2', weight: 400, style } as never] },
            ],
          }),
        ),
      ).toThrow(/style.*normal.*italic/)
    },
  )

  it('rejects malformed or unsafe tokens', () => {
    const invalidTokenSets = [
      { ink: '#111111' },
      { '--Ink': '#111111' },
      { '--': '#111111' },
      { '--ink': '' },
      { '--ink': 'red; color: blue' },
      { '--ink': 'red}' },
      { '--ink': '</style><script>' },
      { '--ink': 'url(\\61)' },
      { '--ink': 'red\nblue' },
    ]

    for (const light of invalidTokenSets) {
      expect(
        () => defineReaderDirection(definition({ tokens: { light } as never })),
        JSON.stringify(light),
      ).toThrow(ReaderDirectionError)
      expect(
        () =>
          defineReaderDirection(
            definition({ tokens: { dark: light, light: { '--ink': '#111111' } } as never }),
          ),
        `dark ${JSON.stringify(light)}`,
      ).toThrow(ReaderDirectionError)
    }
  })

  it('rejects text pairs that name unknown tokens or miss WCAG AA contrast', () => {
    const light = { '--ink': '#1f1f1f', '--paper': '#ffffff', '--soft-ink': '#777777' }

    expect(() =>
      defineReaderDirection(
        definition({ tokens: { light, textPairs: [['--ink', '--missing']] } as never }),
      ),
    ).toThrow(/--missing/)
    expect(() =>
      defineReaderDirection(
        definition({ tokens: { light, textPairs: [['--soft-ink', '--paper']] } }),
      ),
    ).toThrow(/--soft-ink on --paper .*4\.5:1 .*light/)
    expect(() =>
      defineReaderDirection(
        definition({
          tokens: { dark: { '--paper': '#2a2a2a' }, light, textPairs: [['--ink', '--paper']] },
        }),
      ),
    ).toThrow(/--ink on --paper .*dark/)
    expect(() =>
      defineReaderDirection(
        definition({
          tokens: {
            light: { ...light, '--paper': 'var(--page)' },
            textPairs: [['--ink', '--paper']],
          },
        }),
      ),
    ).toThrow(/--paper/)

    const readable = defineReaderDirection(
      definition({
        tokens: {
          dark: { '--ink': '#f5f2ea', '--paper': '#151515' },
          light,
          textPairs: [['--ink', '--paper']],
        },
      }),
    )
    expect(readable.tokens?.textPairs).toEqual([['--ink', '--paper']])
  })

  it('scopes token CSS to the direction in light and dark modes', () => {
    const direction = defineReaderDirection(
      definition({
        tokens: {
          dark: { '--paper': '#151515' },
          light: { '--display': "'Display', serif", '--ink': '#1f1f1f', '--paper': '#ffffff' },
        },
      }),
    )

    expect(readerDirectionTokenCss(direction)).toBe(
      `[data-reader-direction="quiet-monograph"]{--display:'Display', serif;--ink:#1f1f1f;--paper:#ffffff}` +
        `.dark [data-reader-direction="quiet-monograph"]{--paper:#151515}`,
    )
    expect(readerDirectionTokenCss(defineReaderDirection(definition()))).toBeNull()
  })

  it('scopes direction styles and refuses markup inside them', () => {
    const direction = defineReaderDirection(definition({ styles: '  .masthead { color: red; }  ' }))

    expect(readerDirectionStyleCss(direction)).toBe(
      '[data-reader-direction="quiet-monograph"]{.masthead { color: red; }}',
    )
    expect(readerDirectionStyleCss(defineReaderDirection(definition()))).toBeNull()
    expect(() => defineReaderDirection(definition({ styles: ' ' }))).toThrow(/styles/)
    expect(() => defineReaderDirection(definition({ styles: '.a{}</style><script>' }))).toThrow(
      /styles/,
    )
  })

  it('keeps direction styles inside their scope', () => {
    for (const styles of ['} body { display: none } .a {', '.a { color: red;', '.a { } }']) {
      expect(() => defineReaderDirection(definition({ styles })), styles).toThrow(/balanced braces/)
    }

    const quoted = defineReaderDirection(
      definition({ styles: `.a::before { content: "}"; } /* { */ .b { content: '{'; }` }),
    )
    expect(readerDirectionStyleCss(quoted)).toContain('.b { content')
  })

  it('emits top-level font faces and variables scoped to its own root only', () => {
    const direction = defineReaderDirection(definition({ fonts: [displayFont] }))
    expect(readerDirectionFontCss(direction)).toBe(
      '@font-face{font-family:"reader-quiet-monograph__font-display";font-style:normal;font-weight:400;font-display:optional;src:url("/reader-directions/quiet-monograph/fonts/display-latin-400.woff2") format("woff2");}' +
        '@font-face{font-family:"reader-quiet-monograph__font-display fallback";src:local("Times New Roman"),local("TimesNewRomanPSMT"),local("Liberation Serif");ascent-override:95.27%;descent-override:29.59%;line-gap-override:0.00%;size-adjust:96.98%;}' +
        '[data-reader-direction="quiet-monograph"]{--font-display:"reader-quiet-monograph__font-display","reader-quiet-monograph__font-display fallback",serif;}',
    )
    const second = defineReaderDirection(definition({ id: 'second', fonts: [displayFont] }))
    expect(readerDirectionFontCss(second)).not.toContain('reader-quiet-monograph')
    expect(readerDirectionFontCss(second)).toContain('reader-second__font-display')
    expect(readerDirectionFontCss(defineReaderDirection(definition()))).toBeNull()
    expect(Object.isFrozen(direction.fonts[0]?.fallback)).toBe(true)
    expect(Object.isFrozen(direction.fonts[0]?.sources[0])).toBe(true)
  })
})

describe('reader direction registry', () => {
  const baseline = definition({ id: 'baseline', name: 'Baseline' })
  const quiet = definition()
  const swiss = definition({ id: 'swiss-index', name: 'Swiss Index' })

  it('lists directions in order, finds them by id, and wraps their neighbours', () => {
    const registry = createReaderDirectionRegistry({
      defaultId: 'baseline',
      directions: [baseline, quiet, swiss],
    })

    expect(registry.directions.map(({ id }) => id)).toEqual([
      'baseline',
      'quiet-monograph',
      'swiss-index',
    ])
    expect(registry.defaultDirection.id).toBe('baseline')
    expect(registry.find('swiss-index')?.name).toBe('Swiss Index')
    expect(Object.isFrozen(registry.directions)).toBe(true)

    const first = registry.neighbours('baseline')
    expect([first.previous.id, first.next.id, first.position, first.total]).toEqual([
      'swiss-index',
      'quiet-monograph',
      1,
      3,
    ])
    const last = registry.neighbours('swiss-index')
    expect([last.previous.id, last.next.id, last.position]).toEqual([
      'quiet-monograph',
      'baseline',
      3,
    ])
  })

  it('wraps a single direction onto itself', () => {
    const registry = createReaderDirectionRegistry({
      defaultId: 'baseline',
      directions: [baseline],
    })

    expect(registry.neighbours('baseline')).toMatchObject({ position: 1, total: 1 })
    expect(registry.neighbours('baseline').next.id).toBe('baseline')
    expect(registry.neighbours('baseline').previous.id).toBe('baseline')
  })

  it('finds nothing for unknown, malformed, or missing ids', () => {
    const registry = createReaderDirectionRegistry({
      defaultId: 'baseline',
      directions: [baseline],
    })

    for (const id of ['unknown', 'BASELINE', ' baseline', '../baseline', '', null, undefined]) {
      expect(registry.find(id), String(id)).toBeNull()
    }
    expect(() => registry.neighbours('unknown')).toThrow(ReaderDirectionError)
  })

  it('rejects duplicate ids', () => {
    expect(() =>
      createReaderDirectionRegistry({
        defaultId: 'baseline',
        directions: [baseline, quiet, definition({ name: 'Another Monograph' })],
      }),
    ).toThrow(/"quiet-monograph" is registered twice/)
  })

  it('rejects duplicate names', () => {
    expect(() =>
      createReaderDirectionRegistry({
        defaultId: 'baseline',
        directions: [
          baseline,
          quiet,
          definition({ id: 'second-monograph', name: 'a quiet monograph' }),
        ],
      }),
    ).toThrow(/name "a quiet monograph" is already used/)
  })

  it('requires at least one direction and a registered default', () => {
    expect(() => createReaderDirectionRegistry({ defaultId: 'baseline', directions: [] })).toThrow(
      /at least one direction/,
    )
    expect(() =>
      createReaderDirectionRegistry({ defaultId: 'missing', directions: [baseline] }),
    ).toThrow(/default direction "missing" is not registered/)
  })

  it('registers a direction without author and topic views, which shows baseline’s', () => {
    const registry = createReaderDirectionRegistry({
      defaultId: 'baseline',
      directions: [baseline, quiet],
    })

    expect(registry.find('quiet-monograph')?.Author).toBe(BaselineAuthor)
    expect(registry.find('quiet-monograph')?.Topic).toBe(BaselineTopic)
  })

  it('validates every definition as it registers it', () => {
    expect(() =>
      createReaderDirectionRegistry({
        defaultId: 'baseline',
        directions: [baseline, definition({ id: 'Not Kebab' })],
      }),
    ).toThrow(/kebab-case/)
    expect(() =>
      createReaderDirectionRegistry({
        defaultId: 'baseline',
        directions: [
          baseline,
          { ...quiet, Section: undefined } as unknown as ReaderDirectionDefinition,
        ],
      }),
    ).toThrow(/Section view/)
  })
})
