import type { ContentMark, ContentNode } from '@/server/content/document'
import type { MediaAsset } from '@/server/content/domain'

import { publicMediaPath } from './paths'
import type {
  ArticleBlock,
  ChecklistItemBlock,
  InlineContent,
  InlineMark,
  ListItemBlock,
  ReaderImage,
} from './views'

/** Media the reader can serve, by id; null when no media storage is configured. */
export type ReaderMediaLookup = ReadonlyMap<string, MediaAsset> | null

export const wordsPerMinute = 225

type Attributes = Readonly<Record<string, unknown>>

const numberingStyles = ['1', 'a', 'A', 'i', 'I'] as const
const galleryLayouts = ['carousel', 'diptych', 'grid'] as const
const calloutVariants = ['note', 'tip', 'warning'] as const
const editorialVariants = ['fact-box', 'key-points', 'methodology', 'related-stories'] as const
const embedProviders = ['vimeo', 'youtube'] as const

function isRecord(value: unknown): value is Attributes {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.find((candidate) => candidate === value) ?? fallback
}

function safeHref(value: unknown): string | null {
  if (typeof value !== 'string') return null
  try {
    const url = new URL(value)
    return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? value : null
  } catch {
    return null
  }
}

function inlineMark(mark: ContentMark): InlineMark | null {
  if (mark.type !== 'link') return { kind: mark.type }
  const href = safeHref(mark.attrs?.href)
  return href ? { href, kind: 'link' } : null
}

function inlineContent(nodes: readonly ContentNode[] | undefined): InlineContent[] {
  const content: InlineContent[] = []
  for (const node of nodes ?? []) {
    if (node.type === 'hardBreak') {
      content.push({ kind: 'break' })
    } else if (node.type === 'text' && node.text) {
      const marks = (node.marks ?? []).flatMap((mark) => inlineMark(mark) ?? [])
      content.push({ kind: 'text', marks, text: node.text })
    }
  }
  return content
}

function hasText(content: readonly InlineContent[]): boolean {
  return content.some((item) => item.kind === 'text' && item.text.trim().length > 0)
}

export function resolveImage(attrs: unknown, media: ReaderMediaLookup): ReaderImage | null {
  if (!media || !isRecord(attrs) || typeof attrs.mediaId !== 'string') return null
  const asset = media.get(attrs.mediaId)
  if (!asset) return null
  const credit = isRecord(attrs.credit) ? attrs.credit : null
  const creditName = text(credit?.name)
  const focalPoint = isRecord(attrs.focalPoint) ? attrs.focalPoint : null
  return {
    alt: text(attrs.alt) || asset.alt,
    caption: text(attrs.caption) || null,
    contentType: asset.contentType,
    credit: creditName
      ? { name: creditName, url: safeHref(credit?.url) }
      : asset.creditName
        ? { name: asset.creditName, url: asset.creditUrl }
        : null,
    focalPoint: {
      x: typeof focalPoint?.x === 'number' ? focalPoint.x : asset.focalX,
      y: typeof focalPoint?.y === 'number' ? focalPoint.y : asset.focalY,
    },
    height: asset.height,
    mediaId: asset.id,
    src: publicMediaPath(asset.id),
    width: asset.width,
  }
}

function listItems(nodes: readonly ContentNode[] | undefined, media: ReaderMediaLookup) {
  const items: ListItemBlock[] = []
  for (const node of nodes ?? []) {
    if (node.type !== 'listItem') continue
    const blocks = convertBlocks(node.content, media)
    if (blocks.length > 0) items.push({ blocks })
  }
  return items
}

function checklistItems(nodes: readonly ContentNode[] | undefined, media: ReaderMediaLookup) {
  const items: ChecklistItemBlock[] = []
  for (const node of nodes ?? []) {
    if (node.type !== 'taskItem') continue
    const blocks = convertBlocks(node.content, media)
    if (blocks.length > 0) items.push({ blocks, checked: node.attrs?.checked === true })
  }
  return items
}

function headingLevel(value: unknown): 2 | 3 | 4 | 5 | 6 {
  return value === 3 || value === 4 || value === 5 || value === 6 ? value : 2
}

function convertBlock(node: ContentNode, media: ReaderMediaLookup): ArticleBlock | null {
  const attrs: Attributes = node.attrs ?? {}
  switch (node.type) {
    case 'paragraph': {
      const content = inlineContent(node.content)
      return hasText(content) ? { content, kind: 'paragraph' } : null
    }
    case 'heading': {
      const content = inlineContent(node.content)
      return hasText(content)
        ? { content, kind: 'heading', level: headingLevel(attrs.level) }
        : null
    }
    case 'blockquote': {
      // The document schema stores quote text inline; block children are accepted as well.
      const children = node.content ?? []
      if (children.some(({ type }) => type === 'text' || type === 'hardBreak')) {
        const content = inlineContent(children)
        return hasText(content) ? { blocks: [{ content, kind: 'paragraph' }], kind: 'quote' } : null
      }
      const blocks = convertBlocks(children, media)
      return blocks.length > 0 ? { blocks, kind: 'quote' } : null
    }
    case 'pullQuote': {
      const content = inlineContent(node.content)
      return hasText(content)
        ? { attribution: text(attrs.attribution), content, kind: 'pull-quote' }
        : null
    }
    case 'bulletList': {
      const items = listItems(node.content, media)
      return items.length > 0 ? { items, kind: 'bulleted-list' } : null
    }
    case 'orderedList': {
      const items = listItems(node.content, media)
      const start = typeof attrs.start === 'number' && attrs.start >= 1 ? attrs.start : 1
      return items.length > 0
        ? {
            items,
            kind: 'numbered-list',
            numbering: oneOf(attrs.type, numberingStyles, '1'),
            start,
          }
        : null
    }
    case 'taskList': {
      const items = checklistItems(node.content, media)
      return items.length > 0 ? { items, kind: 'checklist' } : null
    }
    case 'mediaImage': {
      const image = resolveImage(attrs, media)
      return image ? { image, kind: 'image' } : null
    }
    case 'gallery': {
      const items: readonly unknown[] = Array.isArray(attrs.items) ? attrs.items : []
      const images = items.flatMap((item) => resolveImage(item, media) ?? [])
      return images.length > 0
        ? { images, kind: 'gallery', layout: oneOf(attrs.layout, galleryLayouts, 'grid') }
        : null
    }
    case 'callout': {
      const content = inlineContent(node.content)
      return hasText(content)
        ? {
            content,
            kind: 'callout',
            label: text(attrs.label) || 'Note',
            variant: oneOf(attrs.variant, calloutVariants, 'note'),
          }
        : null
    }
    case 'codeBlock': {
      const code = (node.content ?? []).map((child) => child.text ?? '').join('')
      return code.trim().length > 0
        ? { kind: 'code', language: text(attrs.language) || null, text: code }
        : null
    }
    case 'horizontalRule':
      return { kind: 'divider' }
    case 'embed': {
      const url = safeHref(attrs.url)
      return url?.startsWith('https:')
        ? {
            fallback: text(attrs.fallback),
            kind: 'embed',
            provider: oneOf(attrs.provider, embedProviders, 'youtube'),
            title: text(attrs.title) || 'Embedded media',
            url,
          }
        : null
    }
    case 'editorialBlock': {
      const blocks = convertBlocks(node.content, media)
      return blocks.length > 0
        ? { blocks, kind: 'editorial', variant: oneOf(attrs.kind, editorialVariants, 'fact-box') }
        : null
    }
    default:
      return null
  }
}

/** Converts document nodes to reader blocks, dropping empty blocks and unservable images. */
export function convertBlocks(
  nodes: readonly ContentNode[] | undefined,
  media: ReaderMediaLookup,
): ArticleBlock[] {
  return (nodes ?? []).flatMap((node) => convertBlock(node, media) ?? [])
}

/** An image that opens the story becomes its lead image and leaves the body. */
export function splitLeadImage(blocks: readonly ArticleBlock[]): {
  readonly body: readonly ArticleBlock[]
  readonly hero: ReaderImage | null
} {
  const [first, ...rest] = blocks
  return first?.kind === 'image' ? { body: rest, hero: first.image } : { body: blocks, hero: null }
}

function nestedBlocks(block: ArticleBlock): readonly ArticleBlock[] {
  switch (block.kind) {
    case 'quote':
    case 'editorial':
      return block.blocks
    case 'bulleted-list':
    case 'numbered-list':
    case 'checklist':
      return block.items.flatMap((item) => item.blocks)
    default:
      return []
  }
}

export function firstImage(blocks: readonly ArticleBlock[]): ReaderImage | null {
  for (const block of blocks) {
    if (block.kind === 'image') return block.image
    if (block.kind === 'gallery') return block.images[0] ?? null
    const nested = firstImage(nestedBlocks(block))
    if (nested) return nested
  }
  return null
}

function inlineText(content: readonly InlineContent[]): string {
  return content.map((item) => (item.kind === 'text' ? item.text : ' ')).join('')
}

function blockText(block: ArticleBlock): string {
  switch (block.kind) {
    case 'paragraph':
    case 'heading':
    case 'pull-quote':
    case 'callout':
      return inlineText(block.content)
    case 'code':
      return block.text
    default:
      return nestedBlocks(block).map(blockText).join(' ')
  }
}

export function countWords(blocks: readonly ArticleBlock[]): number {
  return blocks
    .map(blockText)
    .join(' ')
    .split(/\s+/)
    .filter((word) => word.length > 0).length
}

export function readingMinutes(blocks: readonly ArticleBlock[]): number {
  return Math.max(1, Math.round(countWords(blocks) / wordsPerMinute))
}

/** Media ids that a document references from images and galleries, in document order. */
export function referencedMediaIds(node: ContentNode): string[] {
  const ids: string[] = []
  const visit = (current: ContentNode) => {
    const attrs = current.attrs
    if (current.type === 'mediaImage' && typeof attrs?.mediaId === 'string') ids.push(attrs.mediaId)
    if (current.type === 'gallery' && Array.isArray(attrs?.items)) {
      for (const item of attrs.items) {
        if (isRecord(item) && typeof item.mediaId === 'string') ids.push(item.mediaId)
      }
    }
    for (const child of current.content ?? []) visit(child)
  }
  visit(node)
  return ids
}
