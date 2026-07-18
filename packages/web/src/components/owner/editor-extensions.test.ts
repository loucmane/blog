// @vitest-environment jsdom

import { Editor } from '@tiptap/core'
import { describe, expect, it } from 'vitest'

import { createOwnerContentDocument } from '@/server/owner/document'

import { ownerEditorExtensions } from './editor-extensions'

describe('owner structured editor contract', () => {
  it('round-trips the registered project-owned node vocabulary as portable JSON', () => {
    const content = {
      content: [
        {
          attrs: { level: 2 },
          content: [{ text: 'Owner workflow', type: 'text' }],
          type: 'heading',
        },
        {
          content: [
            {
              attrs: { checked: false },
              content: [
                {
                  content: [{ text: 'Preview before publishing', type: 'text' }],
                  type: 'paragraph',
                },
              ],
              type: 'taskItem',
            },
          ],
          type: 'taskList',
        },
        {
          attrs: { label: 'Owner note', variant: 'tip' },
          content: [{ text: 'Your work saves automatically.', type: 'text' }],
          type: 'callout',
        },
        {
          attrs: {
            alt: 'Layered magazine pages',
            caption: 'A portable original.',
            credit: { name: 'Magazine owner', url: null },
            focalPoint: { x: 0.5, y: 0.4 },
            mediaId: 'media-owner-proof',
          },
          type: 'mediaImage',
        },
      ],
      type: 'doc',
    }
    const editor = new Editor({ content, extensions: Array.from(ownerEditorExtensions) })
    const json = editor.getJSON()
    editor.destroy()

    expect(json).toEqual(content)
    expect(
      createOwnerContentDocument({ articleId: 'article-editor', document: json, title: 'Editor' })
        .document,
    ).toEqual(content)
  })

  it('does not register executable HTML or script nodes', () => {
    const names = new Set(ownerEditorExtensions.map(({ name }) => name))
    expect(names).toEqual(
      expect.objectContaining({
        has: expect.any(Function),
      }),
    )
    for (const denied of ['html', 'iframe', 'script', 'style'])
      expect(names.has(denied)).toBe(false)
    for (const required of [
      'callout',
      'editorialBlock',
      'embed',
      'gallery',
      'mediaImage',
      'pullQuote',
      'taskItem',
      'taskList',
    ]) {
      expect(names.has(required), required).toBe(true)
    }
  })

  it('keeps toolbar-generated lists and links inside the server document contract', () => {
    const editor = new Editor({
      content: '<p>Portable owner link</p>',
      extensions: Array.from(ownerEditorExtensions),
    })
    editor.commands.selectAll()
    editor.chain().focus().setLink({ href: 'https://example.test/story' }).run()
    editor.chain().focus().toggleOrderedList().run()
    const json = editor.getJSON()
    editor.destroy()

    expect(
      createOwnerContentDocument({
        articleId: 'article-toolbar-contract',
        document: json,
        title: 'Toolbar contract',
      }).document,
    ).toEqual(json)
  })
})
