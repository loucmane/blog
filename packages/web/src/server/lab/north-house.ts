import type { IllustrationSpec } from './illustrations'

/*
 * Original sample copy for the Reader Lab: North House, a design and interiors magazine. The set
 * covers the edge cases public designs must handle: a very long title, a story without images, a
 * very short story, and a long read that uses every block type in the document schema.
 */

type Mark =
  | { readonly type: 'bold' | 'code' | 'italic' | 'strike' | 'underline' }
  | { readonly attrs: { readonly href: string }; readonly type: 'link' }

type Inline =
  | { readonly marks?: readonly Mark[]; readonly text: string; readonly type: 'text' }
  | { readonly type: 'hardBreak' }

/** A document node in the stored JSON shape that the content service validates. */
export interface LabNode {
  readonly attrs?: Readonly<Record<string, unknown>>
  readonly content?: readonly (LabNode | Inline)[]
  readonly type: string
}

export interface LabSection {
  readonly id: string
  readonly name: string
  readonly slug: string
}

export interface LabImage {
  readonly alt: string
  readonly caption: string
  readonly creditName: string
  readonly focalPoint: { readonly x: number; readonly y: number }
  readonly id: string
  readonly illustration: IllustrationSpec
}

export interface LabStory {
  readonly blocks: readonly LabNode[]
  readonly dek: string
  readonly id: string
  /** The publication time the seed records for this story. */
  readonly publishedAt: string
  readonly section: string
  readonly title: string
}

const studio = 'North House studio'

export const labSections: readonly LabSection[] = [
  { id: 'section-lab-architecture', name: 'Architecture', slug: 'architecture' },
  { id: 'section-lab-craft', name: 'Craft', slug: 'craft' },
  { id: 'section-lab-interiors', name: 'Interiors', slug: 'interiors' },
]

function illustration(
  width: number,
  height: number,
  colors: Pick<IllustrationSpec, 'floor' | 'light' | 'wallBottom' | 'wallTop'>,
  windowFrame: IllustrationSpec['window'],
): IllustrationSpec {
  return { ...colors, height, width, window: windowFrame }
}

const images = {
  boathouse: {
    alt: 'Illustration of a wide boathouse window glowing amber at dusk above a dark timber floor',
    caption: 'The boathouse at four in the afternoon, a week before midwinter.',
    creditName: studio,
    focalPoint: { x: 0.5, y: 0.4 },
    id: 'media-lab-boathouse',
    illustration: illustration(
      1600,
      900,
      {
        floor: [70, 58, 48],
        light: [240, 186, 140],
        wallBottom: [44, 50, 64],
        wallTop: [58, 66, 82],
      },
      [0.18, 0.2, 0.64, 0.34],
    ),
  },
  cabinDusk: {
    alt: 'Illustration of a cabin window glowing orange at dusk against dark blue walls',
    caption: 'The smallest cabin at dusk, when its one window does all the work.',
    creditName: studio,
    focalPoint: { x: 0.5, y: 0.45 },
    id: 'media-lab-cabin-dusk',
    illustration: illustration(
      1080,
      1080,
      {
        floor: [64, 54, 50],
        light: [250, 170, 120],
        wallBottom: [58, 60, 78],
        wallTop: [72, 76, 96],
      },
      [0.4, 0.26, 0.2, 0.36],
    ),
  },
  cabinMorning: {
    alt: 'Illustration of a small cabin window at first light, set in warm timber walls',
    caption: 'First light in the forest cabin, which faces east on purpose.',
    creditName: studio,
    focalPoint: { x: 0.5, y: 0.4 },
    id: 'media-lab-cabin-morning',
    illustration: illustration(
      1080,
      1080,
      {
        floor: [104, 84, 66],
        light: [255, 226, 180],
        wallBottom: [140, 112, 88],
        wallTop: [160, 132, 104],
      },
      [0.36, 0.22, 0.28, 0.3],
    ),
  },
  cabinNoon: {
    alt: 'Illustration of a long horizontal cabin window at midday, bright against pale board walls',
    caption: 'The ribbon window of the lakeside cabin, set at the height of a seated eye.',
    creditName: studio,
    focalPoint: { x: 0.5, y: 0.35 },
    id: 'media-lab-cabin-noon',
    illustration: illustration(
      1080,
      1080,
      {
        floor: [120, 110, 96],
        light: [255, 252, 240],
        wallBottom: [184, 180, 170],
        wallTop: [200, 196, 186],
      },
      [0.2, 0.18, 0.6, 0.3],
    ),
  },
  handle: {
    alt: 'Illustration of warm side light from a narrow window grazing a plaster wall',
    caption: 'Side light is the honest test of any hardware: it shows every edge.',
    creditName: studio,
    focalPoint: { x: 0.3, y: 0.4 },
    id: 'media-lab-handle-light',
    illustration: illustration(
      960,
      1200,
      {
        floor: [140, 104, 72],
        light: [255, 232, 196],
        wallBottom: [222, 212, 198],
        wallTop: [236, 228, 216],
      },
      [0.08, 0.06, 0.14, 0.6],
    ),
  },
  kitchen: {
    alt: 'Illustration of morning light through a kitchen window on a pale sage wall, spreading across an ash floor',
    caption: 'The kitchen at eight, before anyone has made coffee.',
    creditName: studio,
    focalPoint: { x: 0.35, y: 0.45 },
    id: 'media-lab-kitchen-light',
    illustration: illustration(
      1440,
      960,
      {
        floor: [188, 160, 126],
        light: [255, 244, 214],
        wallBottom: [210, 216, 206],
        wallTop: [226, 230, 224],
      },
      [0.12, 0.14, 0.26, 0.46],
    ),
  },
  northRoom: {
    alt: 'Illustration of cool north light from a tall window on a chalk-white wall above a grey stone floor',
    caption: 'North light stays the same colour all day. That is its gift and its difficulty.',
    creditName: studio,
    focalPoint: { x: 0.5, y: 0.35 },
    id: 'media-lab-north-room',
    illustration: illustration(
      960,
      1200,
      {
        floor: [130, 128, 124],
        light: [236, 242, 250],
        wallBottom: [205, 207, 213],
        wallTop: [222, 224, 228],
      },
      [0.32, 0.1, 0.36, 0.48],
    ),
  },
  shelf: {
    alt: 'Illustration of soft daylight from a square window on a warm white wall above a walnut floor',
    caption: 'Afternoon light on the living-room wall, where the shelf now hangs.',
    creditName: studio,
    focalPoint: { x: 0.5, y: 0.4 },
    id: 'media-lab-shelf-light',
    illustration: illustration(
      1080,
      1080,
      {
        floor: [150, 120, 92],
        light: [255, 246, 226],
        wallBottom: [221, 212, 198],
        wallTop: [233, 226, 214],
      },
      [0.3, 0.16, 0.4, 0.36],
    ),
  },
  winterLight: {
    alt: 'Illustration of low winter sun: a tall window of pale gold light on a blue-grey wall, casting a soft patch across a pine floor',
    caption: 'At three in the afternoon in December, the light arrives almost sideways.',
    creditName: studio,
    focalPoint: { x: 0.62, y: 0.4 },
    id: 'media-lab-winter-light',
    illustration: illustration(
      1440,
      960,
      {
        floor: [176, 146, 112],
        light: [255, 236, 200],
        wallBottom: [196, 202, 209],
        wallTop: [214, 220, 226],
      },
      [0.56, 0.12, 0.2, 0.42],
    ),
  },
} as const satisfies Record<string, LabImage>

export const labImages: readonly LabImage[] = Object.values(images)

function text(value: string, ...marks: Mark[]): Inline {
  return marks.length > 0 ? { marks, text: value, type: 'text' } : { text: value, type: 'text' }
}

const bold: Mark = { type: 'bold' }
const italic: Mark = { type: 'italic' }
const code: Mark = { type: 'code' }
const strike: Mark = { type: 'strike' }
const underline: Mark = { type: 'underline' }
const lineBreak: Inline = { type: 'hardBreak' }

function link(href: string): Mark {
  return { attrs: { href }, type: 'link' }
}

function paragraph(...parts: (Inline | string)[]): LabNode {
  return {
    content: parts.map((part) => (typeof part === 'string' ? text(part) : part)),
    type: 'paragraph',
  }
}

function heading(level: 2 | 3 | 4, value: string): LabNode {
  return { attrs: { level }, content: [text(value)], type: 'heading' }
}

function bulletList(...items: string[]): LabNode {
  return {
    content: items.map((item) => ({ content: [paragraph(item)], type: 'listItem' })),
    type: 'bulletList',
  }
}

function orderedList(numbering: '1' | 'a', ...items: string[]): LabNode {
  return {
    attrs: { start: 1, type: numbering },
    content: items.map((item) => ({ content: [paragraph(item)], type: 'listItem' })),
    type: 'orderedList',
  }
}

function mediaItem(image: LabImage, caption = image.caption) {
  return {
    alt: image.alt,
    caption,
    credit: { name: image.creditName, url: null },
    focalPoint: image.focalPoint,
    mediaId: image.id,
  }
}

function mediaImage(image: LabImage, caption?: string): LabNode {
  return { attrs: mediaItem(image, caption), type: 'mediaImage' }
}

const winterLight: LabStory = {
  blocks: [
    mediaImage(images.winterLight),
    paragraph(
      'By three in the afternoon in December, the light is already leaving. It comes in almost horizontally, the colour of weak tea, and it crosses a room so slowly that you can watch it climb a wall. Architects who work this far north learn to treat that beam as a building material, as real as timber or plaster.',
    ),
    paragraph(
      'The houses that feel calm in winter are rarely the ones with the most glass. They are the ones where a single window has been placed with care: low enough to catch the sun as it skims the horizon, and deep enough that its reveal turns the light into a soft rectangle on the floor.',
    ),
    heading(2, 'Designing for a sun that stays low'),
    paragraph(
      'Start with the path of the sun on the shortest day, not the longest. A south-west window that seems modest in June becomes the most important opening in the house in January, when it is the only one that receives direct light at all.',
    ),
    paragraph(
      'Deep window reveals matter more than size. Splayed plaster returns catch the light and spread it, so a small opening reads as a large, glowing frame. Painted a warm white, they bounce colour back into the room long after the sun has moved on.',
    ),
    {
      attrs: { attribution: 'From the North House notebook' },
      content: [
        text('A winter room is not about brightness. It is about how slowly the light changes.'),
      ],
      type: 'pullQuote',
    },
    heading(2, 'Surfaces that hold the light'),
    paragraph(
      'Matte limewash, oiled pine, and unglazed tile all do the same quiet work: they diffuse rather than reflect. A polished floor throws back a hard patch of glare. A soaped one turns the same sun into a broad, even glow that reaches the back of the room.',
    ),
    paragraph(
      'In the end the goal is modest. A good winter house gives you one place to sit where the light finds you for an hour each afternoon. Plan for that hour, and the other twenty-three take care of themselves.',
    ),
  ],
  dek: 'In the months when the sun barely clears the treeline, the best northern houses are planned around one low, travelling beam of light.',
  id: 'article-lab-winter-light',
  publishedAt: '2026-10-02T07:00:00.000Z',
  section: 'architecture',
  title: 'The quiet architecture of winter light',
}

const boathouse: LabStory = {
  blocks: [
    mediaImage(images.boathouse),
    paragraph(
      'The boathouse was built for one thing: keeping a wooden boat dry through the winter. It was never meant to keep people warm, and for the first few weeks it made that very clear. The wind came up through the floorboards, the stove sulked, and the water under the slipway made a sound like someone breathing in the next room.',
    ),
    paragraph(
      'We stayed from October to March. What follows is less a renovation story than a list of small negotiations with a building that had its own ideas.',
    ),
    heading(2, 'The stove comes first'),
    paragraph(
      'A small cast-iron stove heats a room this size easily, but only if it draws. Ours needed a taller flue and a steady supply of properly dry birch. Once we stopped feeding it damp wood from the shore, it ran for twelve hours on two loads.',
    ),
    heading(2, 'Living with the ice'),
    paragraph(
      'In January the fjord froze at the edges and the ice began to talk: long, low groans at night, sharp cracks at dawn when the tide turned. By February we no longer woke up to it. By March we missed it.',
    ),
    heading(2, 'What we would do again'),
    bulletList(
      'Insulate the floor before anything else. Cold rises less than you think and creeps sideways more.',
      'Hang wool curtains on a track across the big doors, even if you never close them in daylight.',
      'Keep one lamp low and warm near the water side, so the window does not turn into a black mirror at night.',
      'Leave the old boat hooks on the wall. Visitors always ask about them.',
    ),
  ],
  dek: 'A season of small repairs, short days, and long evenings in a building that was never meant to be lived in.',
  id: 'article-lab-boathouse',
  publishedAt: '2026-09-30T07:00:00.000Z',
  section: 'interiors',
  title:
    'Everything we learned from one long winter in a converted boathouse at the edge of the fjord, from keeping the stove alive to living with the sound of the ice',
}

const chair: LabStory = {
  blocks: [
    paragraph(
      'It is not a beautiful chair, exactly. The ash has gone the colour of milky tea, one stretcher has been reglued twice, and the seat dips where thirty years of people have sat in roughly the same way. But it has outlasted three sofas and two moves, and every attempt to replace it has ended with the new chair moving to the bedroom.',
    ),
    paragraph(
      'Part of the reason is proportion. The seat is a little lower than modern chairs, and the back leans a few degrees further. It is a chair for ',
      text('staying', italic),
      ', not for perching, and the room has quietly rearranged itself around that fact.',
    ),
    paragraph(
      'Part of it is the material. Ash flexes before it breaks, and a chair made from it gives slightly when you lean back, like a branch taking weight. Steel and plywood do not do that. You notice the difference only when it is gone.',
    ),
    paragraph(
      'And part of it is simply time. Some objects earn a permanent place in a room by being present for enough ordinary evenings. Moving this chair now would feel less like redecorating and more like asking someone to leave.',
    ),
    paragraph(
      'So it stays by the window, a little too close to the radiator, where it has always been. We have stopped trying to improve on it.',
    ),
  ],
  dek: 'Some furniture earns a permanent place in a room. This ash chair has outlasted three sofas, two moves, and every attempt to replace it.',
  id: 'article-lab-chair',
  publishedAt: '2026-09-27T07:00:00.000Z',
  section: 'craft',
  title: 'Notes on a chair that refuses to be moved',
}

const shelf: LabStory = {
  blocks: [
    mediaImage(images.shelf),
    paragraph(
      'Take everything off the shelf. Put back six objects, no more. Leave the left third empty, and let the light do the rest.',
    ),
    paragraph('It took ten minutes. The room has felt larger ever since.'),
  ],
  dek: 'Ten minutes, six objects, and one rule: leave a third of the shelf empty.',
  id: 'article-lab-shelf',
  publishedAt: '2026-09-24T07:00:00.000Z',
  section: 'interiors',
  title: 'A single shelf, rearranged',
}

const longTable: LabStory = {
  blocks: [
    mediaImage(images.kitchen),
    paragraph(
      'Every magazine has a room where the real work happens. Ours is the kitchen, and at the centre of the kitchen is a ',
      text('long table', bold),
      ' that seats ten when everyone breathes in. We cook at one end, eat at the other, and plan each issue somewhere in the middle, ',
      text('usually', italic),
      ' with flour on the page proofs. This is a field guide to that room, written for anyone who wants a kitchen that works this hard. If you build something like it, ',
      text('write and tell us', link('mailto:letters@north-house.example')),
      '.',
    ),
    heading(2, 'The table'),
    paragraph(
      'The table came first, before the cabinets, before the floor, before we had agreed on a colour for the walls. That order mattered. A kitchen designed around a table becomes a place to sit. A kitchen with a table added at the end becomes a corridor with chairs in it.',
    ),
    mediaImage(
      images.northRoom,
      'The table sits on the north side of the room, out of the glare of the morning window.',
    ),
    heading(3, 'Timber and finish'),
    paragraph(
      'The top is solid ash, forty millimetres thick, made from four boards that were left to settle in the room for a month before they were joined. We first planned to ',
      text('varnish', strike),
      ' soap it, and we are glad we changed our minds. A soap finish never looks new, which is the point: it looks ',
      text('used', underline),
      ' from the first day, and it only gets better.',
    ),
    paragraph(
      'The walls are painted in a warm off-white, mixed to match the paper of our first issue. The paint shop calls it ',
      text('NH-01 Proof', code),
      ', and so do we.',
    ),
    {
      attrs: { language: null },
      content: [
        text(
          'Length    2,400 mm\nWidth       900 mm\nHeight      740 mm\nTop       solid ash, 40 mm, soap finish\nLegs      ash, pinned through the top',
        ),
      ],
      type: 'codeBlock',
    },
    {
      content: [text('Build the table first, then the kitchen around it.')],
      type: 'blockquote',
    },
    heading(2, 'The stove end'),
    paragraph(
      'At the far end of the table, where the room turns its back on the window, is the cooking range: six burners, one oven that runs slightly hot, and a steel shelf above it for salt, oil, and the wooden spoons that never make it back to the drawer. Putting the stove at the end of the table rather than against a long wall was the single best decision in the room. Whoever is cooking faces the people they are cooking for, and nobody has to shout over an extractor fan to join the conversation.',
    ),
    paragraph(
      'The worktop beside the range is a slab of soapstone, chosen because it does not mind hot pans and does not show every ring of red wine. It was the most expensive surface in the kitchen by a wide margin, and it is the only one we would buy again without hesitating. The rest of the counters are oiled oak, and they look exactly as old as they are.',
    ),
    heading(3, 'Storage under the table'),
    paragraph(
      'The table has no drawers, which surprises people. Instead there is a low bench along one side with deep baskets underneath for bread, onions, and the cloths we use every day. Drawers in a dining table catch knees and collect crumbs; baskets can be pulled out with a foot and carried to wherever they are needed.',
    ),
    paragraph(
      'Everything else lives in a tall pantry cupboard by the door, painted the same colour as the walls so that it reads as part of the room rather than as furniture. Behind its doors the shelves are shallow, a single jar deep, so nothing can hide at the back and go stale.',
    ),
    heading(2, 'The shelves'),
    paragraph(
      'Closed cabinets hide mess; open shelves hide nothing, and that turns out to be useful. When everything is visible, you keep fewer things, and you keep them where they are used.',
    ),
    bulletList(
      'Everyday plates and bowls, stacked no higher than a hand can reach without looking.',
      'Three good knives on a magnetic strip, and nothing in a drawer that needs to be sharp.',
      'Jars of dry goods with the labels turned inward, because the contents are the label.',
      'One shelf left half empty, for whatever the season brings in.',
    ),
    {
      attrs: { attribution: 'Overheard at the long table' },
      content: [text('The best kitchens are the ones where nobody asks where anything is.')],
      type: 'pullQuote',
    },
    heading(2, 'Caring for a soap finish'),
    orderedList(
      '1',
      'Grate a handful of pure soap flakes into a litre of hot water and whisk until it foams.',
      'Spread the foam along the grain with a soft cloth, working one board at a time.',
      'Wipe away the excess after a few minutes and let the table dry overnight.',
      'Repeat every few weeks, or whenever the surface starts to look thirsty.',
    ),
    {
      attrs: { label: 'Tip', variant: 'tip' },
      content: [
        text(
          'Soap-finished timber marks easily but forgives quickly. A stain that looks permanent on Friday is usually gone after the next wash.',
        ),
      ],
      type: 'callout',
    },
    heading(3, 'Before the winter dinner'),
    {
      content: [
        {
          attrs: { checked: true },
          content: [paragraph('Wash and soap the table top')],
          type: 'taskItem',
        },
        {
          attrs: { checked: true },
          content: [paragraph('Bring the extra chairs up from the cellar')],
          type: 'taskItem',
        },
        {
          attrs: { checked: false },
          content: [paragraph('Iron the long linen runner')],
          type: 'taskItem',
        },
        {
          attrs: { checked: false },
          content: [paragraph('Trim the candle wicks')],
          type: 'taskItem',
        },
      ],
      type: 'taskList',
    },
    { type: 'horizontalRule' },
    heading(2, 'The light'),
    paragraph(
      'The window over the sink faces east, so mornings in the kitchen are bright and evenings are soft. We added nothing to the ceiling. Instead there are three low lamps along the wall, each on its own switch, so the room can be as dim or as awake as the hour demands.',
    ),
    {
      attrs: {
        items: [
          mediaItem(images.cabinMorning),
          mediaItem(images.cabinNoon),
          mediaItem(images.cabinDusk),
        ],
        layout: 'grid',
      },
      type: 'gallery',
    },
    {
      attrs: {
        fallback:
          'A short film about soaping the long table. In this sample story the link opens the video platform rather than a real film.',
        provider: 'vimeo',
        title: 'Watch: soaping the long table',
        url: 'https://vimeo.com/',
      },
      type: 'embed',
    },
    heading(2, 'Dinner for ten'),
    paragraph(
      'Once a month the table is cleared of proofs and laid for ten. Those dinners taught us more about the room than any plan did. We learned that the lamps need to be low enough not to shine in anyone’s eyes, that the bench is more comfortable than any chair once a meal has gone on for three hours, and that a single long runner of linen makes even a mismatched set of plates look like it belongs together.',
    ),
    paragraph(
      'We also learned to leave the middle of the table empty. Flowers and candlesticks look lovely in photographs and get in the way of conversation in real life. A jug of water and a bowl of salt is enough. Everything else arrives with the food and leaves with the plates.',
    ),
    heading(4, 'A note on chairs'),
    paragraph(
      'No two of our chairs match, and none of them were bought for the kitchen. They arrived one at a time, from flea markets and from friends who were moving, and they stay because they are comfortable for a long meal. That is the only test a kitchen chair has to pass.',
    ),
    heading(2, 'What we would change'),
    paragraph(
      'Not much, but not nothing. We would add a second sink near the table end, so that whoever is clearing does not have to walk the whole length of the room with a stack of plates. We would run one more power socket along the wall behind the bench, because a long table attracts laptops as surely as it attracts bread. And we would have started the soap finish on day one, instead of spending a month afraid of marking the wood.',
    ),
    paragraph(
      'Most of all, we would worry less. A kitchen like this is never finished. It changes with the seasons, with the people who sit at it, and with whatever the next issue needs. The table will outlast every plan we make for the room around it, and that is exactly as it should be.',
    ),
    {
      attrs: { blockId: 'long-table-key-points', kind: 'key-points' },
      content: [
        heading(3, 'The long table in brief'),
        bulletList(
          'Plan the table before the cabinets.',
          'Choose finishes that look better with use.',
          'Keep everything you use daily within one step of where you use it.',
          'Light the room from the walls, not the ceiling.',
        ),
      ],
      type: 'editorialBlock',
    },
    paragraph(
      text('North House kitchen notes'),
      lineBreak,
      text('Written over many dinners, and corrected at many more'),
    ),
  ],
  dek: 'Everything about the room where we cook, eat, argue, and plan the magazine, from the timber of the table to the order of the shelves.',
  id: 'article-lab-long-table',
  publishedAt: '2026-09-20T07:00:00.000Z',
  section: 'interiors',
  title: 'The long table: a field guide to the North House kitchen',
}

const northColour: LabStory = {
  blocks: [
    mediaImage(images.northRoom),
    paragraph(
      'North light is the light painters wanted, because it barely changes through the day. In a home that steadiness is a gift and a difficulty. A room that faces north never glows at sunset, but it never goes harsh at noon either, and every colour you put in it is seen in the same cool, even way.',
    ),
    paragraph(
      'That is why colour cards lie in north rooms. A warm grey that looks gentle in a shop window turns slightly green against the cool light. Paper samples help, but only if you look at them at four in the afternoon, which is when the room is at its most honest.',
    ),
    heading(2, 'Three combinations we keep returning to'),
    bulletList(
      'Chalk white walls with a stone floor, for a room that feels like a gallery between exhibitions.',
      'A clay pink on the walls and a deep green on the woodwork, warm enough to hold its own against the light.',
      'Paper white with one wall in an ochre, so the room has a sunny side even when the sun is elsewhere.',
    ),
    paragraph(
      'Whatever you choose, paint a large sample, a metre square if you can, and live with it for a week. North rooms reward patience more than any other kind.',
    ),
  ],
  dek: 'North light is cool, steady, and unforgiving. Choosing colours for it means looking at samples at four in the afternoon, not at noon.',
  id: 'article-lab-north-colour',
  publishedAt: '2026-09-16T07:00:00.000Z',
  section: 'interiors',
  title: 'Paper, stone, and the colour of rooms that face north',
}

const threeCabins: LabStory = {
  blocks: [
    mediaImage(images.cabinMorning),
    paragraph(
      'Small buildings force decisions that large ones let you postpone. When a cabin is twenty square metres, every window, shelf, and door has to justify itself, and the result, when it works, is a building that feels larger than it is.',
    ),
    heading(2, 'The forest cabin'),
    paragraph(
      'Built for one person and a lot of books, the forest cabin has a single east window placed exactly where the bed meets the morning. Everything else is wall, and the walls are shelves.',
    ),
    heading(2, 'The lakeside cabin'),
    paragraph(
      'Here the window is a long horizontal ribbon set at the height of a seated eye. Standing, you see the treetops. Sitting, you see the lake. The difference makes the small room feel like two.',
    ),
    heading(2, 'The smallest cabin'),
    paragraph(
      'Just nine square metres, with one window, one bench, and a stove. It is meant for a night or two, and it is the one everyone asks to borrow.',
    ),
    {
      attrs: {
        items: [mediaItem(images.cabinNoon), mediaItem(images.cabinDusk)],
        layout: 'diptych',
      },
      type: 'gallery',
    },
    paragraph(
      'None of the three would win a prize for floor area. All three are proof that the most generous thing a building can offer is not space but attention.',
    ),
  ],
  dek: 'Small buildings force decisions that large ones let you postpone. Three cabins show what happens when every square metre has to earn its place.',
  id: 'article-lab-three-cabins',
  publishedAt: '2026-09-12T07:00:00.000Z',
  section: 'architecture',
  title: 'Three cabins and the case for building less',
}

const doorHandle: LabStory = {
  blocks: [
    mediaImage(images.handle),
    paragraph(
      'You touch a door handle a dozen times a day and almost never think about it. That is exactly how a good one should feel. A bad handle announces itself: it is too thin, too cold, too light, or it rattles on its spindle like a loose tooth.',
    ),
    paragraph(
      'A good handle has weight. It meets the hand at the right height and returns to rest with a small, definite click. It is usually brass or oak, and it usually costs more than you expected, which is worth remembering when you count how many times you will use it.',
    ),
    heading(2, 'What to check in the shop'),
    orderedList(
      'a',
      'Hold it with your eyes closed. The shape should tell your hand which way to turn.',
      'Feel the end of the lever. It should be rounded enough not to catch a sleeve.',
      'Ask about the spring. A firm return keeps the latch from sticking in damp weather.',
      'Look at the rose, the plate against the door. A small, solid one ages better than a large, thin one.',
    ),
    paragraph(
      'Then buy one, live with it for a month, and only then order the rest. Hardware is the one part of a house you test with every single day.',
    ),
  ],
  dek: 'You touch it a dozen times a day and almost never notice it. That is exactly how a good handle should feel.',
  id: 'article-lab-door-handle',
  publishedAt: '2026-09-08T07:00:00.000Z',
  section: 'craft',
  title: 'The weight of a good door handle',
}

export const labStories: readonly LabStory[] = [
  winterLight,
  boathouse,
  chair,
  shelf,
  longTable,
  northColour,
  threeCabins,
  doorHandle,
]

/** When the seed's sections and images were prepared, before the first story. */
export const labPreparedAt = '2026-09-01T07:00:00.000Z'
