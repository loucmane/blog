import {
  bigint,
  boolean,
  customType,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { getTableName } from 'drizzle-orm'

import type { ContentDocument } from '../content/document'

const timestampWithTimezone = (name: string) =>
  timestamp(name, { mode: 'string', withTimezone: true })
const tsvector = customType<{ data: string }>({ dataType: () => 'tsvector' })

export const publicationSettings = pgTable('publication_settings', {
  createdAt: timestampWithTimezone('created_at').notNull(),
  defaultLocale: text('default_locale').notNull(),
  id: text('id').primaryKey(),
  ownerTimeZone: text('owner_time_zone').notNull(),
  updatedAt: timestampWithTimezone('updated_at').notNull(),
  version: integer('version').notNull().default(1),
})

export const authors = pgTable(
  'authors',
  {
    bio: text('bio').notNull().default(''),
    createdAt: timestampWithTimezone('created_at').notNull(),
    displayName: text('display_name').notNull(),
    id: text('id').primaryKey(),
    slug: text('slug').notNull(),
    updatedAt: timestampWithTimezone('updated_at').notNull(),
  },
  (table) => [uniqueIndex('authors_slug_key').on(table.slug)],
)

export const ownerUsers = pgTable(
  'owner_users',
  {
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    email: text('email').notNull(),
    emailVerified: boolean('email_verified').default(false).notNull(),
    id: text('id').primaryKey(),
    image: text('image'),
    name: text('name').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('owner_users_email_key').on(table.email)],
)

export const ownerSessions = pgTable(
  'owner_sessions',
  {
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    id: text('id').primaryKey(),
    ipAddress: text('ip_address'),
    token: text('token').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => ownerUsers.id, { onDelete: 'cascade' }),
  },
  (table) => [
    uniqueIndex('owner_sessions_token_key').on(table.token),
    index('owner_sessions_user_id_idx').on(table.userId),
  ],
)

export const ownerAccounts = pgTable(
  'owner_accounts',
  {
    accessToken: text('access_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
    accountId: text('account_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    id: text('id').primaryKey(),
    idToken: text('id_token'),
    password: text('password'),
    providerId: text('provider_id').notNull(),
    refreshToken: text('refresh_token'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
    scope: text('scope'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => ownerUsers.id, { onDelete: 'cascade' }),
  },
  (table) => [index('owner_accounts_user_id_idx').on(table.userId)],
)

export const ownerVerifications = pgTable(
  'owner_verifications',
  {
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    value: text('value').notNull(),
  },
  (table) => [index('owner_verifications_identifier_idx').on(table.identifier)],
)

export const ownerPasskeys = pgTable(
  'owner_passkeys',
  {
    aaguid: text('aaguid'),
    backedUp: boolean('backed_up').notNull(),
    counter: integer('counter').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    credentialID: text('credential_id').notNull(),
    deviceType: text('device_type').notNull(),
    id: text('id').primaryKey(),
    name: text('name'),
    publicKey: text('public_key').notNull(),
    transports: text('transports'),
    userId: text('user_id')
      .notNull()
      .references(() => ownerUsers.id, { onDelete: 'cascade' }),
  },
  (table) => [
    index('owner_passkeys_user_id_idx').on(table.userId),
    uniqueIndex('owner_passkeys_credential_id_key').on(table.credentialID),
  ],
)

export const ownerAuthSchema = {
  account: ownerAccounts,
  passkey: ownerPasskeys,
  session: ownerSessions,
  user: ownerUsers,
  verification: ownerVerifications,
} as const

export const ownerAuthTables = [
  ownerAccounts,
  ownerPasskeys,
  ownerSessions,
  ownerUsers,
  ownerVerifications,
] as const

export const ownerAuthTableNames = ownerAuthTables.map((table) => getTableName(table)).sort()

export const articles = pgTable(
  'articles',
  {
    createdAt: timestampWithTimezone('created_at').notNull(),
    currentDraftRevisionId: text('current_draft_revision_id').notNull(),
    dek: text('dek').notNull().default(''),
    deletedAt: timestampWithTimezone('deleted_at'),
    id: text('id').primaryKey(),
    preDeleteStatus: text('pre_delete_status'),
    publishedAt: timestampWithTimezone('published_at'),
    publishedRevisionId: text('published_revision_id'),
    scheduledAt: timestampWithTimezone('scheduled_at'),
    scheduledRevisionId: text('scheduled_revision_id'),
    slug: text('slug').notNull(),
    status: text('status').notNull(),
    title: text('title').notNull(),
    updatedAt: timestampWithTimezone('updated_at').notNull(),
    version: integer('version').notNull().default(1),
  },
  (table) => [
    index('articles_status_publication_idx').on(table.status, table.scheduledAt, table.publishedAt),
  ],
)

export const articleRevisions = pgTable(
  'article_revisions',
  {
    articleId: text('article_id').notNull(),
    createdAt: timestampWithTimezone('created_at').notNull(),
    dek: text('dek'),
    document: jsonb('document').$type<ContentDocument>().notNull(),
    documentSchemaVersion: integer('document_schema_version').notNull(),
    id: text('id').primaryKey(),
    revisionNumber: integer('revision_number').notNull(),
    title: text('title'),
  },
  (table) => [
    uniqueIndex('article_revisions_article_number_key').on(table.articleId, table.revisionNumber),
  ],
)

export const articleAutosaves = pgTable(
  'article_autosaves',
  {
    articleId: text('article_id').notNull(),
    articleVersion: integer('article_version').notNull(),
    createdAt: timestampWithTimezone('created_at').notNull(),
    id: text('id').primaryKey(),
    idempotencyKey: text('idempotency_key').notNull(),
    revisionId: text('revision_id').notNull(),
  },
  (table) => [
    uniqueIndex('article_autosaves_article_idempotency_key').on(
      table.articleId,
      table.idempotencyKey,
    ),
  ],
)

export const taxonomies = pgTable(
  'taxonomies',
  {
    createdAt: timestampWithTimezone('created_at').notNull(),
    id: text('id').primaryKey(),
    kind: text('kind').notNull(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    updatedAt: timestampWithTimezone('updated_at').notNull(),
  },
  (table) => [uniqueIndex('taxonomies_kind_slug_key').on(table.kind, table.slug)],
)

export const articleTaxonomies = pgTable(
  'article_taxonomies',
  {
    articleId: text('article_id').notNull(),
    position: integer('position').notNull().default(0),
    taxonomyId: text('taxonomy_id').notNull(),
  },
  (table) => [primaryKey({ columns: [table.articleId, table.taxonomyId] })],
)

export const slugRedirects = pgTable(
  'slug_redirects',
  {
    articleId: text('article_id').notNull(),
    createdAt: timestampWithTimezone('created_at').notNull(),
    fromSlug: text('from_slug').notNull(),
    id: text('id').primaryKey(),
    toSlug: text('to_slug').notNull(),
  },
  (table) => [uniqueIndex('slug_redirects_from_slug_key').on(table.fromSlug)],
)

export const mediaAssets = pgTable(
  'media_assets',
  {
    alt: text('alt').notNull(),
    bytes: bigint('bytes', { mode: 'number' }).notNull(),
    caption: text('caption').notNull().default(''),
    contentType: text('content_type').notNull(),
    createdAt: timestampWithTimezone('created_at').notNull(),
    creditName: text('credit_name').notNull(),
    creditUrl: text('credit_url'),
    focalX: doublePrecision('focal_x').notNull(),
    focalY: doublePrecision('focal_y').notNull(),
    height: integer('height'),
    id: text('id').primaryKey(),
    originalKey: text('original_key').notNull(),
    originalSha256: text('original_sha256').notNull(),
    updatedAt: timestampWithTimezone('updated_at').notNull(),
    width: integer('width'),
  },
  (table) => [uniqueIndex('media_assets_original_key_key').on(table.originalKey)],
)

export const mediaRenditions = pgTable(
  'media_renditions',
  {
    bytes: bigint('bytes', { mode: 'number' }).notNull(),
    contentType: text('content_type').notNull(),
    createdAt: timestampWithTimezone('created_at').notNull(),
    height: integer('height').notNull(),
    id: text('id').primaryKey(),
    mediaId: text('media_id').notNull(),
    objectKey: text('object_key').notNull(),
    sha256: text('sha256').notNull(),
    width: integer('width').notNull(),
  },
  (table) => [
    uniqueIndex('media_renditions_object_key_key').on(table.objectKey),
    uniqueIndex('media_renditions_dimensions_key').on(
      table.mediaId,
      table.width,
      table.height,
      table.contentType,
    ),
  ],
)

export const reusableBlocks = pgTable('reusable_blocks', {
  createdAt: timestampWithTimezone('created_at').notNull(),
  currentRevisionId: text('current_revision_id').notNull(),
  id: text('id').primaryKey(),
  kind: text('kind').notNull(),
  name: text('name').notNull(),
  updatedAt: timestampWithTimezone('updated_at').notNull(),
  version: integer('version').notNull().default(1),
})

export const reusableBlockRevisions = pgTable(
  'reusable_block_revisions',
  {
    blockId: text('block_id').notNull(),
    createdAt: timestampWithTimezone('created_at').notNull(),
    document: jsonb('document').$type<ContentDocument>().notNull(),
    documentSchemaVersion: integer('document_schema_version').notNull(),
    id: text('id').primaryKey(),
    revisionNumber: integer('revision_number').notNull(),
  },
  (table) => [
    uniqueIndex('reusable_block_revisions_block_number_key').on(
      table.blockId,
      table.revisionNumber,
    ),
  ],
)

export const publishingJobs = pgTable(
  'publishing_jobs',
  {
    articleId: text('article_id').notNull(),
    attempt: integer('attempt').notNull().default(0),
    claimedBy: text('claimed_by'),
    createdAt: timestampWithTimezone('created_at').notNull(),
    id: text('id').primaryKey(),
    idempotencyKey: text('idempotency_key').notNull(),
    leaseUntil: timestampWithTimezone('lease_until'),
    previousStatus: text('previous_status').notNull(),
    revisionId: text('revision_id').notNull(),
    runAt: timestampWithTimezone('run_at').notNull(),
    status: text('status').notNull(),
    timeZone: text('time_zone').notNull(),
    updatedAt: timestampWithTimezone('updated_at').notNull(),
  },
  (table) => [
    uniqueIndex('publishing_jobs_article_idempotency_key').on(
      table.articleId,
      table.idempotencyKey,
    ),
    index('publishing_jobs_due_idx').on(table.runAt, table.status, table.leaseUntil),
  ],
)

export const outboxEvents = pgTable(
  'outbox_events',
  {
    aggregateId: text('aggregate_id').notNull(),
    attempts: integer('attempts').notNull().default(0),
    createdAt: timestampWithTimezone('created_at').notNull(),
    id: text('id').primaryKey(),
    lastError: text('last_error'),
    payload: jsonb('payload').$type<Readonly<Record<string, unknown>>>().notNull(),
    status: text('status').notNull(),
    type: text('type').notNull(),
    updatedAt: timestampWithTimezone('updated_at').notNull(),
  },
  (table) => [index('outbox_events_delivery_idx').on(table.status, table.createdAt)],
)

export const auditEvents = pgTable(
  'audit_events',
  {
    action: text('action').notNull(),
    actorId: text('actor_id'),
    articleId: text('article_id').notNull(),
    createdAt: timestampWithTimezone('created_at').notNull(),
    id: text('id').primaryKey(),
    metadata: jsonb('metadata')
      .$type<Readonly<Record<string, string | number | boolean | null>>>()
      .notNull(),
  },
  (table) => [index('audit_events_article_time_idx').on(table.articleId, table.createdAt)],
)

export const idempotencyRecords = pgTable(
  'idempotency_records',
  {
    createdAt: timestampWithTimezone('created_at').notNull(),
    key: text('key').notNull(),
    operation: text('operation').notNull(),
    result: jsonb('result').notNull(),
  },
  (table) => [primaryKey({ columns: [table.operation, table.key] })],
)

export const articleSearchDocuments = pgTable(
  'article_search_documents',
  {
    articleId: text('article_id').primaryKey(),
    document: tsvector('document'),
    publishedAt: timestampWithTimezone('published_at').notNull(),
    searchText: text('search_text').notNull(),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    updatedAt: timestampWithTimezone('updated_at').notNull(),
  },
  (table) => [index('article_search_documents_document_idx').using('gin', table.document)],
)

export const contentTables = [
  articleAutosaves,
  articleRevisions,
  articleSearchDocuments,
  articleTaxonomies,
  articles,
  auditEvents,
  authors,
  idempotencyRecords,
  mediaAssets,
  mediaRenditions,
  outboxEvents,
  publicationSettings,
  publishingJobs,
  reusableBlockRevisions,
  reusableBlocks,
  slugRedirects,
  taxonomies,
] as const

export const contentTableNames = contentTables.map((table) => getTableName(table)).sort()
