import { mergeAttributes, Node as TiptapNode, type Extensions } from '@tiptap/core'
import Placeholder from '@tiptap/extension-placeholder'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import StarterKit from '@tiptap/starter-kit'

const Callout = TiptapNode.create({
  addAttributes() {
    return {
      label: { default: 'Note' },
      variant: { default: 'note' },
    }
  },
  content: 'inline*',
  defining: true,
  group: 'block',
  name: 'callout',
  parseHTML() {
    return [{ tag: 'aside[data-editor-block="callout"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'aside',
      mergeAttributes(HTMLAttributes, {
        'data-editor-block': 'callout',
        role: HTMLAttributes.variant === 'warning' ? 'alert' : 'note',
      }),
      0,
    ]
  },
})

const PullQuote = TiptapNode.create({
  addAttributes() {
    return { attribution: { default: 'Magazine source' } }
  },
  content: 'inline*',
  defining: true,
  group: 'block',
  name: 'pullQuote',
  parseHTML() {
    return [{ tag: 'figure[data-editor-block="pull-quote"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'figure',
      mergeAttributes(HTMLAttributes, { 'data-editor-block': 'pull-quote' }),
      ['blockquote', 0],
      ['figcaption', {}, String(HTMLAttributes.attribution)],
    ]
  },
})

const MediaImage = TiptapNode.create({
  addAttributes() {
    return {
      alt: { default: '' },
      caption: { default: '' },
      credit: { default: { name: '', url: null } },
      focalPoint: { default: { x: 0.5, y: 0.5 } },
      mediaId: { default: '' },
    }
  },
  atom: true,
  draggable: true,
  group: 'block',
  name: 'mediaImage',
  parseHTML() {
    return [{ tag: 'figure[data-editor-block="media-image"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    const credit = HTMLAttributes.credit as { name?: unknown }
    const mediaId = String(HTMLAttributes.mediaId)
    const caption = [HTMLAttributes.caption, credit?.name].filter(Boolean).join(' · ')
    return [
      'figure',
      { 'data-editor-block': 'media-image', 'data-media-id': mediaId },
      [
        'img',
        {
          alt: String(HTMLAttributes.alt),
          src: `/api/owner/media/${encodeURIComponent(mediaId)}`,
        },
      ],
      ['figcaption', {}, caption],
    ]
  },
})

const Gallery = TiptapNode.create({
  addAttributes() {
    return { items: { default: [] }, layout: { default: 'grid' } }
  },
  atom: true,
  draggable: true,
  group: 'block',
  name: 'gallery',
  parseHTML() {
    return [{ tag: 'div[data-editor-block="gallery"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    const items = Array.isArray(HTMLAttributes.items) ? HTMLAttributes.items : []
    return [
      'div',
      {
        'data-editor-block': 'gallery',
        'data-gallery-layout': String(HTMLAttributes.layout),
      },
      `${items.length} image gallery`,
    ]
  },
})

const Embed = TiptapNode.create({
  addAttributes() {
    return {
      fallback: { default: 'External media' },
      provider: { default: 'youtube' },
      title: { default: 'Embedded media' },
      url: { default: '' },
    }
  },
  atom: true,
  group: 'block',
  name: 'embed',
  parseHTML() {
    return [{ tag: 'div[data-editor-block="embed"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      { 'data-editor-block': 'embed' },
      ['strong', {}, String(HTMLAttributes.title)],
      ['p', {}, String(HTMLAttributes.fallback)],
    ]
  },
})

const EditorialBlock = TiptapNode.create({
  addAttributes() {
    return {
      blockId: { default: 'editorial-placeholder' },
      kind: { default: 'key-points' },
    }
  },
  content: 'block+',
  defining: true,
  group: 'block',
  name: 'editorialBlock',
  parseHTML() {
    return [{ tag: 'section[data-editor-block="editorial"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['section', mergeAttributes(HTMLAttributes, { 'data-editor-block': 'editorial' }), 0]
  },
})

export const ownerEditorExtensions: Extensions = [
  StarterKit.configure({ heading: { levels: [2, 3, 4, 5, 6] } }),
  Placeholder.configure({
    placeholder: 'Start writing. Your work saves automatically.',
    showOnlyCurrent: false,
  }),
  TaskList,
  TaskItem.configure({ nested: true }),
  Callout,
  PullQuote,
  MediaImage,
  Gallery,
  Embed,
  EditorialBlock,
]
