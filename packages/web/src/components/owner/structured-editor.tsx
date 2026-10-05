'use client'

import { EditorContent, useEditor } from '@tiptap/react'
import type { JSONContent } from '@tiptap/core'
import { useEffect, useId, useState } from 'react'

import type { MediaAsset } from '@/server/content/domain'

import { ownerEditorExtensions } from './editor-extensions'

interface StructuredEditorProps {
  readonly disabled?: boolean
  readonly media: readonly MediaAsset[]
  readonly onChange: (document: JSONContent) => void
  readonly value: JSONContent
}

function ToolbarButton({
  active,
  children,
  disabled = false,
  onClick,
}: {
  readonly active?: boolean
  readonly children: React.ReactNode
  readonly disabled?: boolean
  readonly onClick: () => void
}) {
  return (
    <button
      aria-pressed={active === undefined ? undefined : active}
      className="min-h-11 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}

export function StructuredEditor({
  disabled = false,
  media,
  onChange,
  value,
}: StructuredEditorProps) {
  const linkId = useId()
  const mediaId = useId()
  const [link, setLink] = useState('')
  const [selectedMediaId, setSelectedMediaId] = useState('')
  const editor = useEditor({
    content: value,
    editorProps: {
      attributes: {
        'aria-label': 'Story body',
        'aria-multiline': 'true',
        class:
          'owner-editor min-h-[28rem] rounded-b-xl bg-card px-5 py-6 text-base leading-7 focus:outline-none md:px-10',
        role: 'textbox',
      },
    },
    extensions: Array.from(ownerEditorExtensions),
    immediatelyRender: false,
    onUpdate({ editor: updatedEditor }) {
      onChange(updatedEditor.getJSON())
    },
  })

  useEffect(() => {
    if (!editor || JSON.stringify(editor.getJSON()) === JSON.stringify(value)) return
    editor.commands.setContent(value, { emitUpdate: false })
  }, [editor, value])

  useEffect(() => {
    editor?.setEditable(!disabled, false)
  }, [disabled, editor])

  if (!editor) {
    return <p role="status">Loading the writing space…</p>
  }

  const currentEditor = editor
  const selectedMedia = media.find(({ id }) => id === selectedMediaId)

  function applyLink() {
    let parsed: URL
    try {
      parsed = new URL(link)
    } catch {
      return
    }
    if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) return
    currentEditor.chain().focus().extendMarkRange('link').setLink({ href: parsed.toString() }).run()
  }

  function insertImage() {
    if (!selectedMedia) return
    currentEditor
      .chain()
      .focus()
      .insertContent({
        attrs: {
          alt: selectedMedia.alt,
          caption: selectedMedia.caption,
          credit: { name: selectedMedia.creditName, url: selectedMedia.creditUrl },
          focalPoint: { x: selectedMedia.focalX, y: selectedMedia.focalY },
          mediaId: selectedMedia.id,
        },
        type: 'mediaImage',
      })
      .run()
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div
        aria-label="Story formatting"
        className="flex flex-wrap gap-2 border-b border-border bg-muted/50 p-3"
        role="toolbar"
      >
        <ToolbarButton
          active={editor.isActive('heading', { level: 2 })}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          Heading
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('bold')}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          Bold
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('italic')}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          Italic
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('bulletList')}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          Bullets
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('orderedList')}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          Numbered list
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('taskList')}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
        >
          Checklist
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('blockquote')}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          Quote
        </ToolbarButton>
        <ToolbarButton
          disabled={disabled}
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertContent({
                attrs: { label: 'Editor note', variant: 'note' },
                content: [{ text: 'Add the note here.', type: 'text' }],
                type: 'callout',
              })
              .run()
          }
        >
          Callout
        </ToolbarButton>
      </div>
      <div className="grid gap-3 border-b border-border bg-muted/30 p-3 md:grid-cols-2">
        <div className="flex flex-wrap items-end gap-2">
          <label className="grid flex-1 gap-1 text-sm" htmlFor={linkId}>
            Link address
            <input
              className="min-h-11 rounded-md border border-input bg-background px-3"
              disabled={disabled}
              id={linkId}
              inputMode="url"
              onChange={(event) => setLink(event.target.value)}
              placeholder="https://example.com"
              type="url"
              value={link}
            />
          </label>
          <ToolbarButton disabled={disabled || !link} onClick={applyLink}>
            Add link
          </ToolbarButton>
          <ToolbarButton
            disabled={disabled}
            onClick={() => editor.chain().focus().unsetLink().run()}
          >
            Remove link
          </ToolbarButton>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="grid flex-1 gap-1 text-sm" htmlFor={mediaId}>
            Image from media library
            <select
              className="min-h-11 rounded-md border border-input bg-background px-3"
              disabled={disabled}
              id={mediaId}
              onChange={(event) => setSelectedMediaId(event.target.value)}
              value={selectedMediaId}
            >
              <option value="">Choose an image</option>
              {media.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.alt}
                </option>
              ))}
            </select>
          </label>
          <ToolbarButton disabled={disabled || !selectedMedia} onClick={insertImage}>
            Insert image
          </ToolbarButton>
        </div>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
