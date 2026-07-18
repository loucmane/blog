import {
  CURRENT_CONTENT_DOCUMENT_VERSION,
  extractContentText,
  parseContentDocument,
  type ContentDocument,
  type ContentNode,
} from '@/server/content/document'

export interface OwnerPublicationIssue {
  readonly field: 'body' | 'dek' | 'title'
  readonly message: string
}

export function emptyEditorDocument(): ContentNode {
  return {
    content: [{ type: 'paragraph' }],
    type: 'doc',
  }
}

export function createOwnerContentDocument(input: {
  readonly articleId: string
  readonly document: unknown
  readonly title: string
}): ContentDocument {
  return parseContentDocument({
    articleId: input.articleId,
    document: input.document,
    migrationProvenance: [],
    schemaVersion: CURRENT_CONTENT_DOCUMENT_VERSION,
    title: input.title,
  })
}

export function publicationReadiness(input: {
  readonly dek: string
  readonly document: ContentDocument
  readonly title: string
}): readonly OwnerPublicationIssue[] {
  const issues: OwnerPublicationIssue[] = []
  if (input.title.trim().length < 4) {
    issues.push({ field: 'title', message: 'Add a clear story title before publishing.' })
  }
  if (input.dek.trim().length < 12) {
    issues.push({ field: 'dek', message: 'Add a short summary before publishing.' })
  }
  const bodyText = extractContentText(input.document).replace(input.document.title, '').trim()
  if (bodyText.length < 20) {
    issues.push({ field: 'body', message: 'Add more story text before publishing.' })
  }
  return issues
}
