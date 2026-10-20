import type { ArticleBlock, InlineContent, ReaderImage } from '@/reader/views'

// Browser/unit test content passed through the real renderer; never imported by a page.
const inline: readonly InlineContent[] = [
  { kind: 'text', text: 'Surface text with ', marks: [] },
  { kind: 'text', text: 'inline code', marks: [{ kind: 'code' }] },
  { kind: 'text', text: ' and ', marks: [] },
  {
    kind: 'text',
    text: 'a source link',
    marks: [{ kind: 'link', href: 'https://example.com/source' }],
  },
]
const paragraph: ArticleBlock = { kind: 'paragraph', content: inline }
const code: ArticleBlock = { kind: 'code', language: 'text', text: 'A wrapped code sample' }
const image: ReaderImage = {
  src: '/api/media/media-lab-shelf-light',
  mediaId: 'media-lab-shelf-light',
  width: 1080,
  height: 1080,
  contentType: 'image/png',
  animated: false,
  focalPoint: { x: 0.5, y: 0.4 },
  alt: 'Afternoon light on the shelf wall',
  caption: 'The shelf in afternoon light',
  credit: { name: 'North House', url: 'https://example.com/credit' },
}
const panels: readonly ArticleBlock[] = [
  ...(['fact-box', 'methodology', 'related-stories'] as const).map((variant) => ({
    kind: 'editorial' as const,
    variant,
    blocks: [paragraph, code],
  })),
  ...(['tip', 'note', 'warning'] as const).map((variant) => ({
    kind: 'callout' as const,
    variant,
    label: variant,
    content: inline,
  })),
  { kind: 'editorial', variant: 'key-points', blocks: [paragraph, code] },
  {
    kind: 'embed',
    provider: 'vimeo',
    url: 'https://vimeo.com/',
    title: 'Watch the sample',
    fallback: 'A supplied fallback.',
  },
]
export const blockFixture: readonly ArticleBlock[] = [
  ...([2, 3, 4, 5, 6] as const).map((level) => ({
    kind: 'heading' as const,
    level,
    content: [{ kind: 'text' as const, text: `Heading ${level}`, marks: [] }],
  })),
  paragraph,
  { kind: 'quote', blocks: [paragraph] },
  { kind: 'pull-quote', content: inline, attribution: 'A reader' },
  { kind: 'bulleted-list', items: [{ blocks: [paragraph] }] },
  ...(['1', 'a', 'A', 'i', 'I'] as const).map((numbering) => ({
    kind: 'numbered-list' as const,
    numbering,
    start: 3,
    items: [{ blocks: [paragraph] }],
  })),
  { kind: 'checklist', items: [{ checked: true, blocks: [paragraph] }] },
  { kind: 'image', image },
  ...(['grid', 'diptych', 'carousel'] as const).map((layout) => ({
    kind: 'gallery' as const,
    layout,
    images: [image, image, image],
  })),
  code,
  { kind: 'divider' },
  ...panels,
  {
    kind: 'editorial',
    variant: 'key-points',
    blocks: [
      paragraph,
      code,
      { kind: 'heading', level: 2, content: inline },
      { kind: 'quote', blocks: [paragraph] },
      { kind: 'bulleted-list', items: [{ blocks: [paragraph] }] },
      { kind: 'checklist', items: [{ checked: false, blocks: [paragraph] }] },
      { kind: 'image', image },
      { kind: 'divider' },
      ...panels,
    ],
  },
]
