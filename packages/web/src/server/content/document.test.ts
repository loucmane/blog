import { describe, expect, it } from 'vitest'

import {
  CURRENT_CONTENT_DOCUMENT_VERSION,
  ContentDocumentValidationError,
  extractContentText,
  inspectContentDocument,
  migrateContentDocument,
  parseContentDocument,
  type ContentDocument,
} from './document'

function currentDocument(): ContentDocument {
  return {
    articleId: 'article-portable-foundation',
    document: {
      content: [
        {
          attrs: { level: 2 },
          content: [{ text: 'A portable publishing foundation', type: 'text' }],
          type: 'heading',
        },
        {
          content: [
            { text: 'Owner-controlled content with ', type: 'text' },
            {
              marks: [
                {
                  attrs: { href: 'https://example.invalid/portability', title: null },
                  type: 'link',
                },
              ],
              text: 'portable evidence',
              type: 'text',
            },
          ],
          type: 'paragraph',
        },
        {
          attrs: {
            alt: 'Layered editorial pages',
            caption: 'The original remains owner-controlled.',
            credit: { name: 'Magazine owner', url: null },
            focalPoint: { x: 0.45, y: 0.35 },
            mediaId: 'media-portable-hero',
          },
          type: 'mediaImage',
        },
        {
          attrs: {
            fallback: 'Watch the publishing workflow demonstration.',
            provider: 'youtube',
            title: 'Publishing workflow',
            url: 'https://www.youtube.com/watch?v=portable-foundation',
          },
          type: 'embed',
        },
      ],
      type: 'doc',
    },
    migrationProvenance: [],
    schemaVersion: CURRENT_CONTENT_DOCUMENT_VERSION,
    title: 'Portable foundation',
  }
}

describe('content document contract', () => {
  it('accepts the allow-listed structured document and extracts deterministic public text', () => {
    const document = parseContentDocument(currentDocument())

    expect(document).toEqual(currentDocument())
    expect(extractContentText(document)).toBe(
      'Portable foundation A portable publishing foundation Owner-controlled content with portable evidence Layered editorial pages The original remains owner-controlled. Magazine owner Publishing workflow Watch the publishing workflow demonstration.',
    )
  })

  it('quarantines unknown nodes without losing the original payload', () => {
    const input = structuredClone(currentDocument()) as unknown as Record<string, unknown>
    const root = input.document as { content: unknown[] }
    root.content.push({ attrs: { instruction: 'execute me' }, type: 'futureAgentNode' })

    const result = inspectContentDocument(input)

    expect(result.status).toBe('quarantined')
    if (result.status === 'quarantined') {
      expect(result.original).toEqual(input)
      expect(result.unknownNodes).toEqual([
        {
          node: { attrs: { instruction: 'execute me' }, type: 'futureAgentNode' },
          path: 'document.document.content[4]',
          type: 'futureAgentNode',
        },
      ])
    }
  })

  it('rejects unsafe links, embed hosts, and unexpected executable attributes', () => {
    const link = structuredClone(currentDocument())
    const paragraph = link.document.content?.[1]
    const linkedText = paragraph?.content?.[1]
    if (!linkedText?.marks?.[0]?.attrs) throw new Error('fixture link missing')
    ;(linkedText.marks[0].attrs as { href: string }).href = 'javascript:alert(1)'
    expect(() => parseContentDocument(link)).toThrow(ContentDocumentValidationError)

    const embed = structuredClone(currentDocument())
    const embedNode = embed.document.content?.[3]
    if (!embedNode?.attrs) throw new Error('fixture embed missing')
    ;(embedNode.attrs as { url: string }).url = 'https://attacker.invalid/watch'
    expect(() => parseContentDocument(embed)).toThrow(/not allowed for youtube/)

    const executable = structuredClone(currentDocument()) as unknown as Record<string, unknown>
    const executableRoot = executable.document as { content: Record<string, unknown>[] }
    executableRoot.content[0]!.onclick = 'alert(1)'
    expect(() => parseContentDocument(executable)).toThrow(/unsupported keys: onclick/)
  })

  it('rejects future versions and retains them for attended migration', () => {
    const future = { ...currentDocument(), schemaVersion: 99 }
    const result = inspectContentDocument(future)

    expect(result.status).toBe('quarantined')
    if (result.status === 'quarantined') {
      expect(result.issues).toContainEqual(
        expect.objectContaining({ code: 'future_version', path: 'document.schemaVersion' }),
      )
      expect(result.original).toEqual(future)
    }
  })

  it('migrates legacy media and callout metadata one version at a time', () => {
    const legacy = {
      articleId: 'article-legacy',
      document: {
        content: [
          {
            attrs: { label: 'Editor note', tone: 'note' },
            content: [{ text: 'Keep this context.', type: 'text' }],
            type: 'callout',
          },
          {
            attrs: {
              alt: 'Archive photograph',
              caption: 'Preserved original',
              credit: 'Magazine archive',
              focalX: 0.4,
              focalY: 0.6,
              id: 'media-legacy',
            },
            type: 'mediaImage',
          },
        ],
        type: 'doc',
      },
      migrationProvenance: [],
      schemaVersion: 1,
      title: 'Legacy story',
    }

    const result = migrateContentDocument(legacy)

    expect(result.status).toBe('migrated')
    if (result.status === 'migrated') {
      expect(result.document.schemaVersion).toBe(CURRENT_CONTENT_DOCUMENT_VERSION)
      expect(result.document.migrationProvenance).toEqual([
        { from: 1, migration: 'content-v1-to-v2', to: 2 },
        { from: 2, migration: 'content-v2-to-v3', to: 3 },
      ])
      expect(result.document.document.content?.[1]?.attrs).toEqual({
        alt: 'Archive photograph',
        caption: 'Preserved original',
        credit: { name: 'Magazine archive', url: null },
        focalPoint: { x: 0.4, y: 0.6 },
        mediaId: 'media-legacy',
      })
      expect(migrateContentDocument(result.document)).toMatchObject({ status: 'current' })
    }
  })

  it('quarantines malformed wrappers, unknown marks, and unmigrated old documents', () => {
    expect(inspectContentDocument(null)).toMatchObject({ status: 'quarantined' })

    const marked = structuredClone(currentDocument()) as unknown as Record<string, unknown>
    const root = marked.document as { content: { content?: Record<string, unknown>[] }[] }
    root.content[0]!.content![0]!.marks = [{ type: 'executeAgentInstruction' }]
    expect(inspectContentDocument(marked)).toMatchObject({
      issues: expect.arrayContaining([expect.objectContaining({ code: 'unknown_mark' })]),
      status: 'quarantined',
    })

    expect(inspectContentDocument({ ...currentDocument(), schemaVersion: 2 })).toMatchObject({
      issues: expect.arrayContaining([
        expect.objectContaining({
          message: expect.stringContaining('must be migrated before validation'),
        }),
      ]),
      status: 'quarantined',
    })
  })
})
