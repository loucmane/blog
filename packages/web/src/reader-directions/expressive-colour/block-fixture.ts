import type { ContentNode } from '@/server/content/document'

// Test-only document: publish through the fixture owner API so browser assertions
// exercise the actual server renderer, without React in the Playwright runner.
const inline: readonly ContentNode[] = [
  { type: 'text', text: 'Surface text with ' },
  { type: 'text', text: 'inline code', marks: [{ type: 'code' }] },
  { type: 'text', text: ' and ' },
  {
    type: 'text',
    text: 'a source link',
    marks: [{ type: 'link', attrs: { href: 'https://example.com/source' } }],
  },
]
const paragraph: ContentNode = { type: 'paragraph', content: inline }
const code: ContentNode = {
  type: 'codeBlock',
  attrs: { language: 'text' },
  content: [{ type: 'text', text: 'A wrapped code sample' }],
}
const image = {
  mediaId: 'media-lab-shelf-light',
  focalPoint: { x: 0.5, y: 0.4 },
  alt: 'Afternoon light on the shelf wall',
  caption: 'The shelf in afternoon light',
  credit: { name: 'North House', url: 'https://example.com/credit' },
}
function panels(prefix: string): readonly ContentNode[] {
  return [
    ...(['fact-box', 'methodology', 'related-stories'] as const).map((kind) => ({
      type: 'editorialBlock' as const,
      attrs: { kind, blockId: `${prefix}-${kind}` },
      content: [paragraph, code],
    })),
    ...(['tip', 'note', 'warning'] as const).map((variant) => ({
      type: 'callout' as const,
      attrs: { variant, label: variant },
      content: inline,
    })),
    {
      type: 'editorialBlock',
      attrs: { kind: 'key-points', blockId: `${prefix}-key-points` },
      content: [paragraph, code],
    },
    {
      type: 'embed',
      attrs: {
        provider: 'vimeo',
        url: 'https://vimeo.com/',
        title: 'Watch the sample',
        fallback: 'A supplied fallback.',
      },
    },
  ]
}
export const blockFixtureDocument: ContentNode = {
  type: 'doc',
  content: [
    ...([2, 3, 4, 5, 6] as const).map((level) => ({
      type: 'heading' as const,
      attrs: { level },
      content: [{ type: 'text' as const, text: `Heading ${level}` }],
    })),
    paragraph,
    { type: 'blockquote', content: inline },
    { type: 'pullQuote', attrs: { attribution: 'A reader' }, content: inline },
    { type: 'bulletList', content: [{ type: 'listItem', content: [paragraph] }] },
    ...(['1', 'a', 'A', 'i', 'I'] as const).map((type) => ({
      type: 'orderedList' as const,
      attrs: { type, start: 3 },
      content: [{ type: 'listItem' as const, content: [paragraph] }],
    })),
    {
      type: 'taskList',
      content: [{ type: 'taskItem', attrs: { checked: true }, content: [paragraph] }],
    },
    { type: 'mediaImage', attrs: image },
    ...(['grid', 'diptych', 'carousel'] as const).map((layout) => ({
      type: 'gallery' as const,
      attrs: { layout, items: [image, image, image] },
    })),
    code,
    { type: 'horizontalRule' },
    paragraph,
    ...panels('outer'),
    {
      type: 'editorialBlock',
      attrs: { kind: 'key-points', blockId: 'nested-surfaces' },
      content: [
        paragraph,
        code,
        { type: 'heading', attrs: { level: 2 }, content: inline },
        { type: 'blockquote', content: inline },
        { type: 'bulletList', content: [{ type: 'listItem', content: [paragraph] }] },
        {
          type: 'taskList',
          content: [{ type: 'taskItem', attrs: { checked: false }, content: [paragraph] }],
        },
        { type: 'mediaImage', attrs: image },
        { type: 'horizontalRule' },
        paragraph,
        ...panels('inner'),
      ],
    },
  ],
}
