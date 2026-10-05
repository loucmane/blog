import { describe, expect, it } from 'vitest'

import type { ContentNode } from '@/server/content/document'
import type { MediaAsset } from '@/server/content/domain'

import {
  convertBlocks,
  countWords,
  firstImage,
  readingMinutes,
  referencedMediaIds,
  resolveImage,
  splitLeadImage,
  wordsPerMinute,
  type ReaderMediaLookup,
} from './blocks'
import type { ArticleBlock } from './views'

function asset(
  id: string,
  dimensions: { height: number | null; width: number | null },
): MediaAsset {
  return {
    alt: `Stored alt for ${id}`,
    bytes: 10,
    caption: '',
    contentType: 'image/png',
    createdAt: '2026-09-01T00:00:00.000Z',
    creditName: 'Stored credit',
    creditUrl: null,
    focalX: 0.25,
    focalY: 0.75,
    height: dimensions.height,
    id,
    originalKey: `originals/${id}/sha`,
    originalSha256: 'sha',
    updatedAt: '2026-09-01T00:00:00.000Z',
    width: dimensions.width,
  }
}

const media: ReaderMediaLookup = new Map([
  ['media-a', asset('media-a', { height: 800, width: 1200 })],
  ['media-b', asset('media-b', { height: null, width: null })],
])

function text(value: string, marks?: ContentNode['marks']): ContentNode {
  return marks ? { marks, text: value, type: 'text' } : { text: value, type: 'text' }
}

function paragraph(...content: ContentNode[]): ContentNode {
  return { content, type: 'paragraph' }
}

function image(mediaId: string, caption = 'A caption'): ContentNode {
  return {
    attrs: {
      alt: `Alt for ${mediaId}`,
      caption,
      credit: { name: 'Studio', url: 'https://example.test/studio' },
      focalPoint: { x: 0.4, y: 0.6 },
      mediaId,
    },
    type: 'mediaImage',
  }
}

const everyBlock: ContentNode[] = [
  paragraph(
    text('Plain, '),
    text('bold', [{ type: 'bold' }]),
    text(', '),
    text('linked', [{ attrs: { href: 'https://example.test/' }, type: 'link' }]),
    { type: 'hardBreak' },
    text('and unsafe', [{ attrs: { href: 'javascript:alert(1)' }, type: 'link' }]),
  ),
  { attrs: { level: 3 }, content: [text('A subheading')], type: 'heading' },
  { content: [text('Inline quote text')], type: 'blockquote' },
  { content: [paragraph(text('Block quote text'))], type: 'blockquote' },
  { attrs: { attribution: 'A reader' }, content: [text('Pulled out')], type: 'pullQuote' },
  {
    content: [
      { content: [paragraph(text('First bullet'))], type: 'listItem' },
      { content: [paragraph()], type: 'listItem' },
    ],
    type: 'bulletList',
  },
  {
    attrs: { start: 3, type: 'a' },
    content: [{ content: [paragraph(text('Third step'))], type: 'listItem' }],
    type: 'orderedList',
  },
  {
    content: [
      { attrs: { checked: true }, content: [paragraph(text('Done item'))], type: 'taskItem' },
      { attrs: { checked: false }, content: [paragraph(text('Open item'))], type: 'taskItem' },
    ],
    type: 'taskList',
  },
  image('media-a'),
  {
    attrs: {
      items: [
        {
          alt: 'Gallery one',
          caption: '',
          credit: { name: 'Studio', url: null },
          focalPoint: { x: 0.5, y: 0.5 },
          mediaId: 'media-b',
        },
        {
          alt: 'Missing',
          caption: '',
          credit: { name: 'Studio', url: null },
          focalPoint: { x: 0.5, y: 0.5 },
          mediaId: 'media-missing',
        },
      ],
      layout: 'diptych',
    },
    type: 'gallery',
  },
  {
    attrs: { label: 'Careful', variant: 'warning' },
    content: [text('Mind the step')],
    type: 'callout',
  },
  { attrs: { language: 'text' }, content: [text('line one\nline two')], type: 'codeBlock' },
  { type: 'horizontalRule' },
  {
    attrs: {
      fallback: 'A short film',
      provider: 'vimeo',
      title: 'Watch the film',
      url: 'https://vimeo.com/',
    },
    type: 'embed',
  },
  {
    attrs: { blockId: 'facts', kind: 'fact-box' },
    content: [paragraph(text('A fact'))],
    type: 'editorialBlock',
  },
  paragraph(),
  paragraph(text('   ')),
]

describe('reader document blocks', () => {
  it('converts every block type in the document schema into semantic reader blocks', () => {
    const blocks = convertBlocks(everyBlock, media)

    expect(blocks.map(({ kind }) => kind)).toEqual([
      'paragraph',
      'heading',
      'quote',
      'quote',
      'pull-quote',
      'bulleted-list',
      'numbered-list',
      'checklist',
      'image',
      'gallery',
      'callout',
      'code',
      'divider',
      'embed',
      'editorial',
    ])
    expect(blocks[0]).toEqual({
      content: [
        { kind: 'text', marks: [], text: 'Plain, ' },
        { kind: 'text', marks: [{ kind: 'bold' }], text: 'bold' },
        { kind: 'text', marks: [], text: ', ' },
        {
          kind: 'text',
          marks: [{ href: 'https://example.test/', kind: 'link' }],
          text: 'linked',
        },
        { kind: 'break' },
        { kind: 'text', marks: [], text: 'and unsafe' },
      ],
      kind: 'paragraph',
    })
    expect(blocks[1]).toMatchObject({ kind: 'heading', level: 3 })
    expect(blocks[2]).toEqual({
      blocks: [
        { content: [{ kind: 'text', marks: [], text: 'Inline quote text' }], kind: 'paragraph' },
      ],
      kind: 'quote',
    })
    expect(blocks[4]).toMatchObject({ attribution: 'A reader', kind: 'pull-quote' })
    expect(blocks[5]).toMatchObject({ items: [{ blocks: [{ kind: 'paragraph' }] }] })
    expect(blocks[6]).toMatchObject({ kind: 'numbered-list', numbering: 'a', start: 3 })
    expect(blocks[7]).toMatchObject({
      items: [{ checked: true }, { checked: false }],
      kind: 'checklist',
    })
    expect(blocks[8]).toEqual({
      image: {
        alt: 'Alt for media-a',
        caption: 'A caption',
        credit: { name: 'Studio', url: 'https://example.test/studio' },
        focalPoint: { x: 0.4, y: 0.6 },
        height: 800,
        mediaId: 'media-a',
        src: '/api/media/media-a',
        width: 1200,
      },
      kind: 'image',
    })
    expect(blocks[9]).toMatchObject({
      images: [{ height: null, mediaId: 'media-b', width: null }],
      kind: 'gallery',
      layout: 'diptych',
    })
    expect(blocks[10]).toMatchObject({ kind: 'callout', label: 'Careful', variant: 'warning' })
    expect(blocks[11]).toEqual({ kind: 'code', language: 'text', text: 'line one\nline two' })
    expect(blocks[13]).toEqual({
      fallback: 'A short film',
      kind: 'embed',
      provider: 'vimeo',
      title: 'Watch the film',
      url: 'https://vimeo.com/',
    })
    expect(blocks[14]).toMatchObject({ kind: 'editorial', variant: 'fact-box' })
  })

  it('leaves images out when media storage is unavailable or an asset is missing', () => {
    expect(convertBlocks([image('media-a')], null)).toEqual([])
    expect(convertBlocks([image('media-missing')], media)).toEqual([])
    expect(resolveImage({ mediaId: 42 }, media)).toBeNull()
    expect(resolveImage({ mediaId: 'media-a' }, media)).toMatchObject({
      alt: 'Stored alt for media-a',
      caption: null,
      credit: { name: 'Stored credit', url: null },
      focalPoint: { x: 0.25, y: 0.75 },
    })
  })

  it('treats an opening image as the lead image and finds a card image anywhere else', () => {
    const opening = convertBlocks([paragraph(), image('media-a'), paragraph(text('Body'))], media)
    expect(splitLeadImage(opening)).toMatchObject({
      body: [{ kind: 'paragraph' }],
      hero: { mediaId: 'media-a' },
    })

    const later = convertBlocks([paragraph(text('Intro')), image('media-a')], media)
    expect(splitLeadImage(later)).toMatchObject({ body: later, hero: null })
    expect(firstImage(later)).toMatchObject({ mediaId: 'media-a' })

    const nested: ArticleBlock[] = [
      {
        blocks: [{ image: firstImage(later)!, kind: 'image' }],
        kind: 'editorial',
        variant: 'fact-box',
      },
    ]
    expect(firstImage(nested)).toMatchObject({ mediaId: 'media-a' })
    expect(firstImage(convertBlocks(everyBlock.slice(9, 10), media))).toMatchObject({
      mediaId: 'media-b',
    })
    expect(firstImage(convertBlocks([paragraph(text('No images'))], media))).toBeNull()
  })

  it('estimates reading time from body text at a steady pace', () => {
    const words = (count: number) =>
      convertBlocks([paragraph(text(Array.from({ length: count }, () => 'word').join(' ')))], media)

    expect(countWords(convertBlocks(everyBlock, media))).toBeGreaterThan(20)
    expect(readingMinutes(words(10))).toBe(1)
    expect(readingMinutes(words(wordsPerMinute * 4))).toBe(4)
    expect(readingMinutes([])).toBe(1)
  })

  it('lists the media a document references, including gallery items', () => {
    expect(referencedMediaIds({ content: everyBlock, type: 'doc' })).toEqual([
      'media-a',
      'media-b',
      'media-missing',
    ])
  })
})
