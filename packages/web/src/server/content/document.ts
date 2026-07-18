import { z } from 'zod'

export const CURRENT_CONTENT_DOCUMENT_VERSION = 3
export const MAX_CONTENT_DOCUMENT_BYTES = 2_000_000

const knownNodeTypes = [
  'blockquote',
  'bulletList',
  'callout',
  'codeBlock',
  'doc',
  'editorialBlock',
  'embed',
  'gallery',
  'hardBreak',
  'heading',
  'horizontalRule',
  'listItem',
  'mediaImage',
  'orderedList',
  'paragraph',
  'pullQuote',
  'text',
] as const

const knownMarkTypes = ['bold', 'code', 'italic', 'link', 'strike', 'underline'] as const

export type ContentNodeType = (typeof knownNodeTypes)[number]
export type ContentMarkType = (typeof knownMarkTypes)[number]

export interface ContentMark {
  readonly attrs?: Readonly<Record<string, unknown>>
  readonly type: ContentMarkType
}

export interface ContentNode {
  readonly attrs?: Readonly<Record<string, unknown>>
  readonly content?: readonly ContentNode[]
  readonly marks?: readonly ContentMark[]
  readonly text?: string
  readonly type: ContentNodeType
}

export interface DocumentMigrationProvenance {
  readonly from: number
  readonly migration: string
  readonly to: number
}

export interface ContentDocument {
  readonly articleId: string
  readonly document: ContentNode
  readonly migrationProvenance: readonly DocumentMigrationProvenance[]
  readonly schemaVersion: typeof CURRENT_CONTENT_DOCUMENT_VERSION
  readonly title: string
}

export interface ContentDocumentIssue {
  readonly code:
    | 'future_version'
    | 'invalid_shape'
    | 'invalid_url'
    | 'oversized'
    | 'unknown_mark'
    | 'unknown_node'
  readonly message: string
  readonly path: string
}

export interface QuarantinedContentNode {
  readonly node: unknown
  readonly path: string
  readonly type: string
}

export type ContentDocumentInspection =
  | {
      readonly document: ContentDocument
      readonly issues: readonly []
      readonly status: 'valid'
      readonly unknownNodes: readonly []
    }
  | {
      readonly issues: readonly ContentDocumentIssue[]
      readonly original: unknown
      readonly status: 'quarantined'
      readonly unknownNodes: readonly QuarantinedContentNode[]
    }

export type ContentDocumentMigration =
  | {
      readonly document: ContentDocument
      readonly original: unknown
      readonly status: 'current' | 'migrated'
    }
  | Extract<ContentDocumentInspection, { status: 'quarantined' }>

export class ContentDocumentValidationError extends Error {
  readonly inspection: Extract<ContentDocumentInspection, { status: 'quarantined' }>

  constructor(inspection: Extract<ContentDocumentInspection, { status: 'quarantined' }>) {
    super(inspection.issues.map(({ message, path }) => `${path}: ${message}`).join('; '))
    this.name = 'ContentDocumentValidationError'
    this.inspection = inspection
  }
}

const safeIdentifier = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/)
const nonEmptyText = z.string().trim().min(1).max(10_000)
const optionalText = z.string().max(10_000)
const creditSchema = z
  .object({
    name: nonEmptyText,
    url: z.string().url().nullable(),
  })
  .strict()
const focalPointSchema = z
  .object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
  })
  .strict()
const mediaItemSchema = z
  .object({
    alt: nonEmptyText,
    caption: optionalText,
    credit: creditSchema,
    focalPoint: focalPointSchema,
    mediaId: safeIdentifier,
  })
  .strict()

const attributeSchemas: Readonly<Partial<Record<ContentNodeType, z.ZodType>>> = {
  blockquote: z.object({}).strict(),
  bulletList: z.object({}).strict(),
  callout: z
    .object({
      label: nonEmptyText,
      variant: z.enum(['note', 'tip', 'warning']),
    })
    .strict(),
  codeBlock: z.object({ language: z.string().max(80).nullable() }).strict(),
  doc: z.object({}).strict(),
  editorialBlock: z
    .object({
      blockId: safeIdentifier,
      kind: z.enum(['fact-box', 'key-points', 'methodology', 'related-stories']),
    })
    .strict(),
  embed: z
    .object({
      fallback: nonEmptyText,
      provider: z.enum(['youtube', 'vimeo']),
      title: nonEmptyText,
      url: z.string().url(),
    })
    .strict(),
  gallery: z
    .object({
      items: z.array(mediaItemSchema).min(1).max(50),
      layout: z.enum(['carousel', 'diptych', 'grid']),
    })
    .strict(),
  hardBreak: z.object({}).strict(),
  heading: z.object({ level: z.number().int().min(2).max(6) }).strict(),
  horizontalRule: z.object({}).strict(),
  listItem: z.object({}).strict(),
  mediaImage: mediaItemSchema,
  orderedList: z.object({ start: z.number().int().min(1).max(10_000) }).strict(),
  paragraph: z.object({}).strict(),
  pullQuote: z.object({ attribution: nonEmptyText }).strict(),
  text: z.object({}).strict(),
}

const migrationProvenanceSchema = z
  .object({
    from: z.number().int().nonnegative(),
    migration: nonEmptyText,
    to: z.number().int().positive(),
  })
  .strict()

const topLevelSchema = z
  .object({
    articleId: safeIdentifier,
    document: z.unknown(),
    migrationProvenance: z.array(migrationProvenanceSchema).default([]),
    schemaVersion: z.number().int().nonnegative(),
    title: z.string().trim().min(1).max(300),
  })
  .strict()

function clone<T>(value: T): T {
  return structuredClone(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function pushIssue(
  issues: ContentDocumentIssue[],
  code: ContentDocumentIssue['code'],
  path: string,
  message: string,
) {
  issues.push({ code, message, path })
}

function validateUrl(value: unknown, path: string, issues: ContentDocumentIssue[]) {
  if (typeof value !== 'string') {
    pushIssue(issues, 'invalid_url', path, 'must be an absolute URL')
    return
  }

  let url: URL
  try {
    url = new URL(value)
  } catch {
    pushIssue(issues, 'invalid_url', path, 'must be an absolute URL')
    return
  }

  if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) {
    pushIssue(issues, 'invalid_url', path, `protocol ${url.protocol} is not allowed`)
  }
}

function validateEmbedUrl(
  attrs: Readonly<Record<string, unknown>>,
  path: string,
  issues: ContentDocumentIssue[],
) {
  const provider = attrs.provider
  const value = attrs.url
  if (typeof value !== 'string' || (provider !== 'youtube' && provider !== 'vimeo')) {
    return
  }

  let url: URL
  try {
    url = new URL(value)
  } catch {
    return
  }

  const providers = {
    vimeo: new Set(['player.vimeo.com', 'vimeo.com', 'www.vimeo.com']),
    youtube: new Set(['www.youtube.com', 'youtu.be', 'youtube.com']),
  }
  if (url.protocol !== 'https:' || !providers[provider].has(url.hostname)) {
    pushIssue(issues, 'invalid_url', `${path}.url`, `URL is not allowed for ${provider}`)
  }
}

function validateMarks(
  marks: unknown,
  path: string,
  issues: ContentDocumentIssue[],
): readonly ContentMark[] | undefined {
  if (marks === undefined) return undefined
  if (!Array.isArray(marks)) {
    pushIssue(issues, 'invalid_shape', path, 'marks must be an array')
    return undefined
  }

  const result: ContentMark[] = []
  for (const [index, rawMark] of marks.entries()) {
    const markPath = `${path}[${index}]`
    if (!isRecord(rawMark) || typeof rawMark.type !== 'string') {
      pushIssue(issues, 'invalid_shape', markPath, 'mark must be an object with a type')
      continue
    }
    if (!knownMarkTypes.includes(rawMark.type as ContentMarkType)) {
      pushIssue(issues, 'unknown_mark', markPath, `mark ${rawMark.type} is not supported`)
      continue
    }
    const unexpected = Object.keys(rawMark).filter((key) => !['attrs', 'type'].includes(key))
    if (unexpected.length > 0) {
      pushIssue(issues, 'invalid_shape', markPath, `unsupported keys: ${unexpected.join(', ')}`)
      continue
    }

    const type = rawMark.type as ContentMarkType
    if (type === 'link') {
      const parsed = z
        .object({ href: z.string(), title: z.string().max(300).nullable() })
        .strict()
        .safeParse(rawMark.attrs)
      if (!parsed.success) {
        pushIssue(
          issues,
          'invalid_shape',
          `${markPath}.attrs`,
          parsed.error.issues[0]?.message ?? 'invalid link',
        )
        continue
      }
      validateUrl(parsed.data.href, `${markPath}.attrs.href`, issues)
      result.push({ attrs: parsed.data, type })
      continue
    }

    const empty = z
      .object({})
      .strict()
      .safeParse(rawMark.attrs ?? {})
    if (!empty.success) {
      pushIssue(issues, 'invalid_shape', `${markPath}.attrs`, 'mark does not accept attributes')
      continue
    }
    result.push({ type })
  }
  return result
}

const blockNodes = new Set<ContentNodeType>([
  'blockquote',
  'bulletList',
  'callout',
  'codeBlock',
  'editorialBlock',
  'embed',
  'gallery',
  'heading',
  'horizontalRule',
  'mediaImage',
  'orderedList',
  'paragraph',
  'pullQuote',
])
const inlineNodes = new Set<ContentNodeType>(['hardBreak', 'text'])
const leafNodes = new Set<ContentNodeType>([
  'embed',
  'gallery',
  'hardBreak',
  'horizontalRule',
  'mediaImage',
  'text',
])

function allowedChild(parent: ContentNodeType, child: ContentNodeType): boolean {
  if (parent === 'doc' || parent === 'editorialBlock') return blockNodes.has(child)
  if (parent === 'bulletList' || parent === 'orderedList') return child === 'listItem'
  if (parent === 'listItem') return blockNodes.has(child)
  if (parent === 'codeBlock') return child === 'text'
  return inlineNodes.has(child)
}

function validateNode(
  value: unknown,
  path: string,
  issues: ContentDocumentIssue[],
  unknownNodes: QuarantinedContentNode[],
): ContentNode | null {
  if (!isRecord(value) || typeof value.type !== 'string') {
    pushIssue(issues, 'invalid_shape', path, 'node must be an object with a string type')
    return null
  }

  if (!knownNodeTypes.includes(value.type as ContentNodeType)) {
    unknownNodes.push({ node: clone(value), path, type: value.type })
    pushIssue(issues, 'unknown_node', path, `node ${value.type} is not supported`)
    return null
  }

  const unexpected = Object.keys(value).filter(
    (key) => !['attrs', 'content', 'marks', 'text', 'type'].includes(key),
  )
  if (unexpected.length > 0) {
    pushIssue(issues, 'invalid_shape', path, `unsupported keys: ${unexpected.join(', ')}`)
  }

  const type = value.type as ContentNodeType
  const schema = attributeSchemas[type]
  const parsedAttrs = schema?.safeParse(value.attrs ?? {})
  if (!parsedAttrs?.success) {
    pushIssue(
      issues,
      'invalid_shape',
      `${path}.attrs`,
      parsedAttrs?.error.issues[0]?.message ?? 'attributes are invalid',
    )
  }
  const attrs = parsedAttrs?.success
    ? (parsedAttrs.data as Readonly<Record<string, unknown>>)
    : undefined

  if (type === 'embed' && attrs) {
    validateEmbedUrl(attrs, `${path}.attrs`, issues)
  }
  if (attrs && (type === 'mediaImage' || type === 'gallery')) {
    const credits =
      type === 'mediaImage'
        ? [attrs.credit]
        : (attrs.items as { credit: unknown }[]).map(({ credit }) => credit)
    for (const [index, rawCredit] of credits.entries()) {
      if (isRecord(rawCredit) && rawCredit.url !== null) {
        validateUrl(
          rawCredit.url,
          type === 'mediaImage'
            ? `${path}.attrs.credit.url`
            : `${path}.attrs.items[${index}].credit.url`,
          issues,
        )
      }
    }
  }

  if (type === 'text' && typeof value.text !== 'string') {
    pushIssue(issues, 'invalid_shape', `${path}.text`, 'text node requires string text')
  }
  if (type !== 'text' && value.text !== undefined) {
    pushIssue(issues, 'invalid_shape', `${path}.text`, 'only text nodes may contain text')
  }

  const marks = validateMarks(value.marks, `${path}.marks`, issues)
  if (type !== 'text' && marks !== undefined) {
    pushIssue(issues, 'invalid_shape', `${path}.marks`, 'only text nodes may contain marks')
  }

  const content: ContentNode[] = []
  if (value.content !== undefined && !Array.isArray(value.content)) {
    pushIssue(issues, 'invalid_shape', `${path}.content`, 'content must be an array')
  } else if (Array.isArray(value.content)) {
    if (leafNodes.has(type) && value.content.length > 0) {
      pushIssue(issues, 'invalid_shape', `${path}.content`, `${type} may not contain child nodes`)
    }
    for (const [index, rawChild] of value.content.entries()) {
      const child = validateNode(rawChild, `${path}.content[${index}]`, issues, unknownNodes)
      if (child) {
        if (!allowedChild(type, child.type)) {
          pushIssue(
            issues,
            'invalid_shape',
            `${path}.content[${index}]`,
            `${child.type} is not allowed inside ${type}`,
          )
        }
        content.push(child)
      }
    }
  }

  const node: ContentNode = { type }
  if (attrs && Object.keys(attrs).length > 0) Object.assign(node, { attrs })
  if (content.length > 0) Object.assign(node, { content })
  if (marks && marks.length > 0) Object.assign(node, { marks })
  if (type === 'text' && typeof value.text === 'string') Object.assign(node, { text: value.text })
  return node
}

export function inspectContentDocument(value: unknown): ContentDocumentInspection {
  const original = clone(value)
  const issues: ContentDocumentIssue[] = []
  const unknownNodes: QuarantinedContentNode[] = []
  const bytes = Buffer.byteLength(JSON.stringify(value), 'utf8')
  if (bytes > MAX_CONTENT_DOCUMENT_BYTES) {
    pushIssue(
      issues,
      'oversized',
      'document',
      `document is ${bytes} bytes; maximum is ${MAX_CONTENT_DOCUMENT_BYTES}`,
    )
  }

  const parsed = topLevelSchema.safeParse(value)
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      pushIssue(
        issues,
        'invalid_shape',
        issue.path.length > 0 ? `document.${issue.path.join('.')}` : 'document',
        issue.message,
      )
    }
    return { issues, original, status: 'quarantined', unknownNodes }
  }
  if (parsed.data.schemaVersion > CURRENT_CONTENT_DOCUMENT_VERSION) {
    pushIssue(
      issues,
      'future_version',
      'document.schemaVersion',
      `version ${parsed.data.schemaVersion} is newer than ${CURRENT_CONTENT_DOCUMENT_VERSION}`,
    )
  } else if (parsed.data.schemaVersion !== CURRENT_CONTENT_DOCUMENT_VERSION) {
    pushIssue(
      issues,
      'invalid_shape',
      'document.schemaVersion',
      `version ${parsed.data.schemaVersion} must be migrated before validation`,
    )
  }

  const root = validateNode(parsed.data.document, 'document.document', issues, unknownNodes)
  if (root?.type !== 'doc') {
    pushIssue(issues, 'invalid_shape', 'document.document', 'root node must be doc')
  }

  if (issues.length > 0 || root === null) {
    return { issues, original, status: 'quarantined', unknownNodes }
  }

  return {
    document: {
      articleId: parsed.data.articleId,
      document: root,
      migrationProvenance: parsed.data.migrationProvenance,
      schemaVersion: CURRENT_CONTENT_DOCUMENT_VERSION,
      title: parsed.data.title,
    },
    issues: [],
    status: 'valid',
    unknownNodes: [],
  }
}

export function parseContentDocument(value: unknown): ContentDocument {
  const inspection = inspectContentDocument(value)
  if (inspection.status === 'quarantined') {
    throw new ContentDocumentValidationError(inspection)
  }
  return inspection.document
}

function visitRawNodes(value: unknown, visitor: (node: Record<string, unknown>) => void) {
  if (!isRecord(value)) return
  visitor(value)
  if (Array.isArray(value.content)) {
    for (const child of value.content) visitRawNodes(child, visitor)
  }
}

function migrateVersionOne(value: Record<string, unknown>) {
  visitRawNodes(value.document, (node) => {
    const attrs = node.attrs
    if (!isRecord(attrs)) return
    if (node.type === 'callout') {
      const { tone, ...rest } = attrs
      node.attrs = { ...rest, variant: tone }
    }
    if (node.type === 'mediaImage') {
      const { focalX, focalY, id, ...rest } = attrs
      node.attrs = { ...rest, focalPoint: { x: focalX, y: focalY }, mediaId: id }
    }
    if (node.type === 'gallery' && Array.isArray(attrs.items)) {
      node.attrs = {
        ...attrs,
        items: attrs.items.map((item: unknown) => {
          if (!isRecord(item)) return item
          const { focalX, focalY, ...rest } = item
          return { ...rest, focalPoint: { x: focalX, y: focalY } }
        }),
        layout: attrs.layout ?? 'grid',
      }
    }
  })
  value.schemaVersion = 2
}

function migrateVersionTwo(value: Record<string, unknown>) {
  visitRawNodes(value.document, (node) => {
    const attrs = node.attrs
    if (!isRecord(attrs)) return
    if (node.type === 'mediaImage' && typeof attrs.credit === 'string') {
      attrs.credit = { name: attrs.credit, url: null }
    }
    if (node.type === 'gallery' && Array.isArray(attrs.items)) {
      attrs.items = attrs.items.map((item: unknown) => {
        if (!isRecord(item) || typeof item.credit !== 'string') return item
        return { ...item, credit: { name: item.credit, url: null } }
      })
    }
  })
  value.schemaVersion = 3
}

const migrations = new Map<number, (value: Record<string, unknown>) => void>([
  [1, migrateVersionOne],
  [2, migrateVersionTwo],
])

export function migrateContentDocument(value: unknown): ContentDocumentMigration {
  const original = clone(value)
  const basic = topLevelSchema.safeParse(value)
  if (!basic.success)
    return inspectContentDocument(value) as Extract<
      ContentDocumentInspection,
      { status: 'quarantined' }
    >
  if (basic.data.schemaVersion > CURRENT_CONTENT_DOCUMENT_VERSION) {
    return inspectContentDocument(value) as Extract<
      ContentDocumentInspection,
      { status: 'quarantined' }
    >
  }

  const migrated = clone(value)
  if (!isRecord(migrated))
    return inspectContentDocument(value) as Extract<
      ContentDocumentInspection,
      { status: 'quarantined' }
    >
  const provenance = Array.isArray(migrated.migrationProvenance)
    ? clone(migrated.migrationProvenance)
    : []
  const startedAt = basic.data.schemaVersion

  while (
    typeof migrated.schemaVersion === 'number' &&
    migrated.schemaVersion < CURRENT_CONTENT_DOCUMENT_VERSION
  ) {
    const from = migrated.schemaVersion
    const migration = migrations.get(from)
    if (!migration) {
      const inspection = inspectContentDocument(migrated)
      return inspection.status === 'quarantined'
        ? inspection
        : {
            issues: [
              {
                code: 'invalid_shape',
                message: `migration ${from} -> ${from + 1} is not registered`,
                path: 'document.schemaVersion',
              },
            ],
            original,
            status: 'quarantined',
            unknownNodes: [],
          }
    }
    migration(migrated)
    provenance.push({ from, migration: `content-v${from}-to-v${from + 1}`, to: from + 1 })
  }
  migrated.migrationProvenance = provenance

  const inspection = inspectContentDocument(migrated)
  if (inspection.status === 'quarantined') {
    return { ...inspection, original }
  }
  return {
    document: inspection.document,
    original,
    status: startedAt === CURRENT_CONTENT_DOCUMENT_VERSION ? 'current' : 'migrated',
  }
}

function collectText(node: ContentNode, parts: string[]) {
  if (typeof node.text === 'string') parts.push(node.text)
  if (node.type === 'mediaImage' && node.attrs) {
    const credit = node.attrs.credit as { name?: unknown }
    parts.push(
      String(node.attrs.alt ?? ''),
      String(node.attrs.caption ?? ''),
      String(credit.name ?? ''),
    )
  }
  if (node.type === 'gallery' && node.attrs) {
    const items = node.attrs.items as {
      alt?: unknown
      caption?: unknown
      credit?: { name?: unknown }
    }[]
    for (const item of items) {
      parts.push(
        String(item.alt ?? ''),
        String(item.caption ?? ''),
        String(item.credit?.name ?? ''),
      )
    }
  }
  if (node.type === 'embed' && node.attrs) {
    parts.push(String(node.attrs.title ?? ''), String(node.attrs.fallback ?? ''))
  }
  for (const child of node.content ?? []) collectText(child, parts)
}

export function extractContentText(value: ContentDocument): string {
  const document = parseContentDocument(value)
  const parts: string[] = [document.title]
  collectText(document.document, parts)
  return parts
    .filter((part) => part.trim().length > 0)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}
