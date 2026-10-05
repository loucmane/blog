import { describe, expect, it } from 'vitest'

import {
  createReaderDirectionRegistry,
  defineReaderDirection,
  readerDirectionFontClassName,
  readerDirectionStyleCss,
  readerDirectionTokenCss,
  ReaderDirectionError,
  type ReaderDirectionDefinition,
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
  className: 'display-font-class',
  style: { fontFamily: "'Display', serif" },
  variable: 'display-font-variable',
}
const textFont = {
  className: 'text-font-class',
  style: { fontFamily: "'Text', serif" },
  variable: 'text-font-variable',
}

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

  it('rejects fonts that cannot be scoped to the direction', () => {
    expect(() =>
      defineReaderDirection(definition({ fonts: [{ ...displayFont, variable: '' }] })),
    ).toThrow(/font variable/)
    expect(() =>
      defineReaderDirection(definition({ fonts: [{ ...displayFont, variable: 'two classes' }] })),
    ).toThrow(/font variable/)
    expect(() =>
      defineReaderDirection(
        definition({ fonts: [{ ...displayFont, style: { fontFamily: ' ' } }] }),
      ),
    ).toThrow(/font family/)
    expect(() => defineReaderDirection(definition({ fonts: [displayFont, displayFont] }))).toThrow(
      /listed twice/,
    )
  })

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

  it('applies only its own font variables', () => {
    expect(
      readerDirectionFontClassName(
        defineReaderDirection(definition({ fonts: [displayFont, textFont] })),
      ),
    ).toBe('display-font-variable text-font-variable')
    expect(readerDirectionFontClassName(defineReaderDirection(definition()))).toBeUndefined()
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
