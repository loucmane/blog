import type { Pool, PoolClient, QueryResultRow } from 'pg'

import type {
  Article,
  ArticleRevision,
  ArticleTaxonomy,
  AuditEvent,
  AuthorProfile,
  DraftAutosave,
  IdempotencyRecord,
  MediaAsset,
  MediaRendition,
  OutboxEvent,
  PublicationJob,
  PublicationSettings,
  ReusableBlock,
  ReusableBlockRevision,
  SlugRedirect,
  TaxonomyTerm,
} from '../content/domain'
import { parseMigratedContentDocument } from '../content/document'
import { ContentConflictError, DuplicateSlugError } from '../content/errors'
import type { ContentRepository, ContentTransaction } from '../content/ports'

function iso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

function nullableIso(value: Date | string | null): string | null {
  return value === null ? null : iso(value)
}

interface ArticleRow extends QueryResultRow {
  created_at: Date | string
  current_draft_revision_id: string
  dek: string
  deleted_at: Date | string | null
  id: string
  pre_delete_status: Article['preDeleteStatus']
  published_at: Date | string | null
  published_revision_id: string | null
  scheduled_at: Date | string | null
  scheduled_revision_id: string | null
  slug: string
  status: Article['status']
  title: string
  updated_at: Date | string
  version: number
}

interface RevisionRow extends QueryResultRow {
  article_id: string
  created_at: Date | string
  dek: string | null
  document: ArticleRevision['document']
  id: string
  revision_number: number
  title: string | null
}

interface AutosaveRow extends QueryResultRow {
  article_id: string
  article_version: number
  created_at: Date | string
  id: string
  idempotency_key: string
  revision_id: string
}

interface RedirectRow extends QueryResultRow {
  article_id: string
  created_at: Date | string
  from_slug: string
  id: string
  to_slug: string
}

interface PublicationJobRow extends QueryResultRow {
  article_id: string
  attempt: number
  claimed_by: string | null
  created_at: Date | string
  id: string
  idempotency_key: string
  lease_until: Date | string | null
  previous_status: PublicationJob['previousStatus']
  revision_id: string
  run_at: Date | string
  status: PublicationJob['status']
  time_zone: string
  updated_at: Date | string
}

interface OutboxRow extends QueryResultRow {
  aggregate_id: string
  attempts: number
  created_at: Date | string
  id: string
  last_error: string | null
  payload: Readonly<Record<string, unknown>>
  status: OutboxEvent['status']
  type: string
  updated_at: Date | string
}

interface AuditRow extends QueryResultRow {
  action: string
  actor_id: string | null
  article_id: string
  created_at: Date | string
  id: string
  metadata: AuditEvent['metadata']
}

interface MediaAssetRow extends QueryResultRow {
  alt: string
  bytes: number | string
  caption: string
  content_type: string
  created_at: Date | string
  credit_name: string
  credit_url: string | null
  focal_x: number
  focal_y: number
  height: number | null
  id: string
  original_key: string
  original_sha256: string
  updated_at: Date | string
  width: number | null
}

interface MediaRenditionRow extends QueryResultRow {
  bytes: number | string
  content_type: string
  created_at: Date | string
  height: number
  id: string
  media_id: string
  object_key: string
  sha256: string
  width: number
}

interface AuthorRow extends QueryResultRow {
  bio: string
  created_at: Date | string
  display_name: string
  id: string
  slug: string
  updated_at: Date | string
}

interface TaxonomyRow extends QueryResultRow {
  created_at: Date | string
  id: string
  kind: TaxonomyTerm['kind']
  name: string
  slug: string
  updated_at: Date | string
}

interface ReusableBlockRow extends QueryResultRow {
  created_at: Date | string
  current_revision_id: string
  id: string
  kind: string
  name: string
  updated_at: Date | string
  version: number
}

interface ReusableBlockRevisionRow extends QueryResultRow {
  block_id: string
  created_at: Date | string
  document: ReusableBlockRevision['document']
  id: string
  revision_number: number
}

function mapArticle(row: ArticleRow): Article {
  return {
    createdAt: iso(row.created_at),
    currentDraftRevisionId: row.current_draft_revision_id,
    deletedAt: nullableIso(row.deleted_at),
    dek: row.dek,
    id: row.id,
    preDeleteStatus: row.pre_delete_status,
    publishedAt: nullableIso(row.published_at),
    publishedRevisionId: row.published_revision_id,
    scheduledAt: nullableIso(row.scheduled_at),
    scheduledRevisionId: row.scheduled_revision_id,
    slug: row.slug,
    status: row.status,
    title: row.title,
    updatedAt: iso(row.updated_at),
    version: row.version,
  }
}

function mapRevision(row: RevisionRow): ArticleRevision {
  return {
    articleId: row.article_id,
    createdAt: iso(row.created_at),
    ...(row.dek === null ? {} : { dek: row.dek }),
    document: parseMigratedContentDocument(row.document),
    id: row.id,
    revisionNumber: row.revision_number,
    ...(row.title === null ? {} : { title: row.title }),
  }
}

function mapAutosave(row: AutosaveRow): DraftAutosave {
  return {
    articleId: row.article_id,
    articleVersion: row.article_version,
    createdAt: iso(row.created_at),
    id: row.id,
    idempotencyKey: row.idempotency_key,
    revisionId: row.revision_id,
  }
}

function mapJob(row: PublicationJobRow): PublicationJob {
  return {
    articleId: row.article_id,
    attempt: row.attempt,
    claimedBy: row.claimed_by,
    createdAt: iso(row.created_at),
    id: row.id,
    idempotencyKey: row.idempotency_key,
    leaseUntil: nullableIso(row.lease_until),
    previousStatus: row.previous_status,
    revisionId: row.revision_id,
    runAt: iso(row.run_at),
    status: row.status,
    timeZone: row.time_zone,
    updatedAt: iso(row.updated_at),
  }
}

function mapOutbox(row: OutboxRow): OutboxEvent {
  return {
    aggregateId: row.aggregate_id,
    attempts: row.attempts,
    createdAt: iso(row.created_at),
    id: row.id,
    lastError: row.last_error,
    payload: row.payload,
    status: row.status,
    type: row.type,
    updatedAt: iso(row.updated_at),
  }
}

function mapMediaAsset(row: MediaAssetRow): MediaAsset {
  return {
    alt: row.alt,
    bytes: Number(row.bytes),
    caption: row.caption,
    contentType: row.content_type,
    createdAt: iso(row.created_at),
    creditName: row.credit_name,
    creditUrl: row.credit_url,
    focalX: row.focal_x,
    focalY: row.focal_y,
    height: row.height,
    id: row.id,
    originalKey: row.original_key,
    originalSha256: row.original_sha256,
    updatedAt: iso(row.updated_at),
    width: row.width,
  }
}

function mapMediaRendition(row: MediaRenditionRow): MediaRendition {
  return {
    bytes: Number(row.bytes),
    contentType: row.content_type,
    createdAt: iso(row.created_at),
    height: row.height,
    id: row.id,
    mediaId: row.media_id,
    objectKey: row.object_key,
    sha256: row.sha256,
    width: row.width,
  }
}

function postgresCode(error: unknown): string | null {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code: unknown }).code)
    : null
}

class PostgresContentTransaction implements ContentTransaction {
  constructor(private readonly client: PoolClient) {}

  async claimDuePublicationJob(input: {
    leaseUntil: string
    now: string
    workerId: string
  }): Promise<PublicationJob | null> {
    const result = await this.client.query<PublicationJobRow>(
      `WITH candidate AS (
        SELECT id
        FROM publishing_jobs
        WHERE run_at <= $1
          AND (
            status = 'pending'
            OR (status = 'claimed' AND lease_until <= $1)
          )
        ORDER BY run_at, id
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      UPDATE publishing_jobs AS job
      SET status = 'claimed',
          claimed_by = $2,
          lease_until = $3,
          attempt = job.attempt + 1,
          updated_at = $1
      FROM candidate
      WHERE job.id = candidate.id
      RETURNING job.*`,
      [input.now, input.workerId, input.leaseUntil],
    )
    return result.rows[0] ? mapJob(result.rows[0]) : null
  }

  async getArticle(id: string): Promise<Article | null> {
    const result = await this.client.query<ArticleRow>('SELECT * FROM articles WHERE id = $1', [id])
    return result.rows[0] ? mapArticle(result.rows[0]) : null
  }

  async getArticleForUpdate(id: string): Promise<Article | null> {
    const result = await this.client.query<ArticleRow>(
      'SELECT * FROM articles WHERE id = $1 FOR UPDATE',
      [id],
    )
    return result.rows[0] ? mapArticle(result.rows[0]) : null
  }

  async getArticleBySlug(slug: string): Promise<Article | null> {
    const result = await this.client.query<ArticleRow>(
      'SELECT * FROM articles WHERE slug = $1 AND deleted_at IS NULL',
      [slug],
    )
    return result.rows[0] ? mapArticle(result.rows[0]) : null
  }

  async getIdempotency(operation: string, key: string): Promise<IdempotencyRecord | null> {
    const result = await this.client.query<
      QueryResultRow & {
        created_at: Date | string
        key: string
        operation: string
        result: unknown
      }
    >('SELECT * FROM idempotency_records WHERE operation = $1 AND key = $2', [operation, key])
    const row = result.rows[0]
    return row
      ? {
          createdAt: iso(row.created_at),
          key: row.key,
          operation: row.operation,
          result: row.result,
        }
      : null
  }

  async lockIdempotency(operation: string, key: string): Promise<void> {
    await this.client.query('SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))', [
      operation,
      key,
    ])
  }

  async getMediaAsset(id: string): Promise<MediaAsset | null> {
    const result = await this.client.query<MediaAssetRow>(
      'SELECT * FROM media_assets WHERE id = $1',
      [id],
    )
    return result.rows[0] ? mapMediaAsset(result.rows[0]) : null
  }

  async getOutboxEvent(id: string): Promise<OutboxEvent | null> {
    const result = await this.client.query<OutboxRow>('SELECT * FROM outbox_events WHERE id = $1', [
      id,
    ])
    return result.rows[0] ? mapOutbox(result.rows[0]) : null
  }

  async getPublicationJob(id: string): Promise<PublicationJob | null> {
    const result = await this.client.query<PublicationJobRow>(
      'SELECT * FROM publishing_jobs WHERE id = $1',
      [id],
    )
    return result.rows[0] ? mapJob(result.rows[0]) : null
  }

  async getPublicationJobForUpdate(id: string): Promise<PublicationJob | null> {
    const result = await this.client.query<PublicationJobRow>(
      'SELECT * FROM publishing_jobs WHERE id = $1 FOR UPDATE',
      [id],
    )
    return result.rows[0] ? mapJob(result.rows[0]) : null
  }

  async getPublicationSettings(): Promise<PublicationSettings | null> {
    const result = await this.client.query<
      QueryResultRow & {
        created_at: Date | string
        default_locale: string
        id: string
        owner_time_zone: string
        updated_at: Date | string
        version: number
      }
    >('SELECT * FROM publication_settings ORDER BY id LIMIT 1')
    const row = result.rows[0]
    return row
      ? {
          createdAt: iso(row.created_at),
          defaultLocale: row.default_locale,
          id: row.id,
          ownerTimeZone: row.owner_time_zone,
          updatedAt: iso(row.updated_at),
          version: row.version,
        }
      : null
  }

  async getRevision(id: string): Promise<ArticleRevision | null> {
    const result = await this.client.query<RevisionRow>(
      'SELECT * FROM article_revisions WHERE id = $1',
      [id],
    )
    return result.rows[0] ? mapRevision(result.rows[0]) : null
  }

  async listArticles(): Promise<readonly Article[]> {
    return (await this.client.query<ArticleRow>('SELECT * FROM articles ORDER BY id')).rows.map(
      mapArticle,
    )
  }

  async listArticleTaxonomies(): Promise<readonly ArticleTaxonomy[]> {
    return (
      await this.client.query<
        QueryResultRow & { article_id: string; position: number; taxonomy_id: string }
      >('SELECT * FROM article_taxonomies ORDER BY article_id, position, taxonomy_id')
    ).rows.map((row) => ({
      articleId: row.article_id,
      position: row.position,
      taxonomyId: row.taxonomy_id,
    }))
  }

  async listAuditEvents(articleId?: string): Promise<readonly AuditEvent[]> {
    const result = await this.client.query<AuditRow>(
      articleId
        ? 'SELECT * FROM audit_events WHERE article_id = $1 ORDER BY created_at, id'
        : 'SELECT * FROM audit_events ORDER BY created_at, id',
      articleId ? [articleId] : [],
    )
    return result.rows.map((row) => ({
      action: row.action,
      actorId: row.actor_id,
      articleId: row.article_id,
      createdAt: iso(row.created_at),
      id: row.id,
      metadata: row.metadata,
    }))
  }

  async listAuthors(): Promise<readonly AuthorProfile[]> {
    return (await this.client.query<AuthorRow>('SELECT * FROM authors ORDER BY id')).rows.map(
      (row) => ({
        bio: row.bio,
        createdAt: iso(row.created_at),
        displayName: row.display_name,
        id: row.id,
        slug: row.slug,
        updatedAt: iso(row.updated_at),
      }),
    )
  }

  async listAutosaves(articleId: string): Promise<readonly DraftAutosave[]> {
    return (
      await this.client.query<AutosaveRow>(
        'SELECT * FROM article_autosaves WHERE article_id = $1 ORDER BY created_at, id',
        [articleId],
      )
    ).rows.map(mapAutosave)
  }

  async listMediaAssets(): Promise<readonly MediaAsset[]> {
    return (
      await this.client.query<MediaAssetRow>('SELECT * FROM media_assets ORDER BY id')
    ).rows.map(mapMediaAsset)
  }

  async listMediaRenditions(): Promise<readonly MediaRendition[]> {
    return (
      await this.client.query<MediaRenditionRow>('SELECT * FROM media_renditions ORDER BY id')
    ).rows.map(mapMediaRendition)
  }

  async listOutboxEvents(articleId?: string): Promise<readonly OutboxEvent[]> {
    const result = await this.client.query<OutboxRow>(
      articleId
        ? 'SELECT * FROM outbox_events WHERE aggregate_id = $1 ORDER BY created_at, id'
        : 'SELECT * FROM outbox_events ORDER BY created_at, id',
      articleId ? [articleId] : [],
    )
    return result.rows.map(mapOutbox)
  }

  async listPublicationJobs(articleId?: string): Promise<readonly PublicationJob[]> {
    const result = await this.client.query<PublicationJobRow>(
      articleId
        ? 'SELECT * FROM publishing_jobs WHERE article_id = $1 ORDER BY created_at, id'
        : 'SELECT * FROM publishing_jobs ORDER BY created_at, id',
      articleId ? [articleId] : [],
    )
    return result.rows.map(mapJob)
  }

  async listRedirects(articleId?: string): Promise<readonly SlugRedirect[]> {
    const result = await this.client.query<RedirectRow>(
      articleId
        ? 'SELECT * FROM slug_redirects WHERE article_id = $1 ORDER BY created_at, id'
        : 'SELECT * FROM slug_redirects ORDER BY created_at, id',
      articleId ? [articleId] : [],
    )
    return result.rows.map((row) => ({
      articleId: row.article_id,
      createdAt: iso(row.created_at),
      fromSlug: row.from_slug,
      id: row.id,
      toSlug: row.to_slug,
    }))
  }

  async listReusableBlockRevisions(): Promise<readonly ReusableBlockRevision[]> {
    return (
      await this.client.query<ReusableBlockRevisionRow>(
        'SELECT * FROM reusable_block_revisions ORDER BY block_id, revision_number',
      )
    ).rows.map((row) => ({
      blockId: row.block_id,
      createdAt: iso(row.created_at),
      document: parseMigratedContentDocument(row.document),
      id: row.id,
      revisionNumber: row.revision_number,
    }))
  }

  async listReusableBlocks(): Promise<readonly ReusableBlock[]> {
    return (
      await this.client.query<ReusableBlockRow>('SELECT * FROM reusable_blocks ORDER BY id')
    ).rows.map((row) => ({
      createdAt: iso(row.created_at),
      currentRevisionId: row.current_revision_id,
      id: row.id,
      kind: row.kind,
      name: row.name,
      updatedAt: iso(row.updated_at),
      version: row.version,
    }))
  }

  async listRevisions(articleId?: string): Promise<readonly ArticleRevision[]> {
    const result = await this.client.query<RevisionRow>(
      articleId
        ? 'SELECT * FROM article_revisions WHERE article_id = $1 ORDER BY revision_number'
        : 'SELECT * FROM article_revisions ORDER BY article_id, revision_number',
      articleId ? [articleId] : [],
    )
    return result.rows.map(mapRevision)
  }

  async listTaxonomyTerms(): Promise<readonly TaxonomyTerm[]> {
    return (
      await this.client.query<TaxonomyRow>('SELECT * FROM taxonomies ORDER BY kind, slug')
    ).rows.map((row) => ({
      createdAt: iso(row.created_at),
      id: row.id,
      kind: row.kind,
      name: row.name,
      slug: row.slug,
      updatedAt: iso(row.updated_at),
    }))
  }

  async saveArticle(article: Article, expectedVersion: number | null): Promise<void> {
    try {
      if (expectedVersion === null) {
        await this.client.query(
          `INSERT INTO articles (
            id, slug, title, dek, status, current_draft_revision_id,
            published_revision_id, scheduled_revision_id, version, scheduled_at,
            published_at, deleted_at, pre_delete_status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
          [
            article.id,
            article.slug,
            article.title,
            article.dek,
            article.status,
            article.currentDraftRevisionId,
            article.publishedRevisionId,
            article.scheduledRevisionId,
            article.version,
            article.scheduledAt,
            article.publishedAt,
            article.deletedAt,
            article.preDeleteStatus,
            article.createdAt,
            article.updatedAt,
          ],
        )
        return
      }
      const result = await this.client.query(
        `UPDATE articles SET
          slug = $2, title = $3, dek = $4, status = $5,
          current_draft_revision_id = $6, published_revision_id = $7,
          scheduled_revision_id = $8, version = $9, scheduled_at = $10,
          published_at = $11, deleted_at = $12, pre_delete_status = $13,
          updated_at = $14
        WHERE id = $1 AND version = $15`,
        [
          article.id,
          article.slug,
          article.title,
          article.dek,
          article.status,
          article.currentDraftRevisionId,
          article.publishedRevisionId,
          article.scheduledRevisionId,
          article.version,
          article.scheduledAt,
          article.publishedAt,
          article.deletedAt,
          article.preDeleteStatus,
          article.updatedAt,
          expectedVersion,
        ],
      )
      if (result.rowCount === 0) {
        const current = await this.getArticle(article.id)
        throw new ContentConflictError({ currentArticle: current ?? article })
      }
    } catch (error) {
      if (postgresCode(error) === '23505') throw new DuplicateSlugError(article.slug)
      throw error
    }
  }

  async saveArticleTaxonomy(link: ArticleTaxonomy): Promise<void> {
    await this.client.query(
      'INSERT INTO article_taxonomies (article_id, taxonomy_id, position) VALUES ($1, $2, $3)',
      [link.articleId, link.taxonomyId, link.position],
    )
  }

  async saveAuditEvent(event: AuditEvent): Promise<void> {
    await this.client.query(
      'INSERT INTO audit_events (id, article_id, actor_id, action, metadata, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [event.id, event.articleId, event.actorId, event.action, event.metadata, event.createdAt],
    )
  }

  async saveAuthor(author: AuthorProfile): Promise<void> {
    await this.client.query(
      'INSERT INTO authors (id, slug, display_name, bio, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [author.id, author.slug, author.displayName, author.bio, author.createdAt, author.updatedAt],
    )
  }

  async saveAutosave(autosave: DraftAutosave): Promise<void> {
    await this.client.query(
      'INSERT INTO article_autosaves (id, article_id, revision_id, article_version, idempotency_key, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [
        autosave.id,
        autosave.articleId,
        autosave.revisionId,
        autosave.articleVersion,
        autosave.idempotencyKey,
        autosave.createdAt,
      ],
    )
  }

  async saveIdempotency(record: IdempotencyRecord): Promise<void> {
    await this.client.query(
      'INSERT INTO idempotency_records (operation, key, result, created_at) VALUES ($1, $2, $3, $4)',
      [record.operation, record.key, record.result, record.createdAt],
    )
  }

  async saveMediaAsset(asset: MediaAsset): Promise<void> {
    const result = await this.client.query(
      `INSERT INTO media_assets (
        id, original_key, original_sha256, bytes, content_type, width, height,
        alt, caption, credit_name, credit_url, focal_x, focal_y, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (id) DO UPDATE SET
        alt = EXCLUDED.alt, caption = EXCLUDED.caption, credit_name = EXCLUDED.credit_name,
        credit_url = EXCLUDED.credit_url, focal_x = EXCLUDED.focal_x,
        focal_y = EXCLUDED.focal_y, updated_at = EXCLUDED.updated_at
      WHERE media_assets.original_key = EXCLUDED.original_key
        AND media_assets.original_sha256 = EXCLUDED.original_sha256
        AND media_assets.bytes = EXCLUDED.bytes
        AND media_assets.content_type = EXCLUDED.content_type`,
      [
        asset.id,
        asset.originalKey,
        asset.originalSha256,
        asset.bytes,
        asset.contentType,
        asset.width,
        asset.height,
        asset.alt,
        asset.caption,
        asset.creditName,
        asset.creditUrl,
        asset.focalX,
        asset.focalY,
        asset.createdAt,
        asset.updatedAt,
      ],
    )
    if (result.rowCount === 0) throw new Error(`Media original ${asset.id} is immutable.`)
  }

  async saveMediaRendition(rendition: MediaRendition): Promise<void> {
    await this.client.query(
      `INSERT INTO media_renditions
        (id, media_id, object_key, sha256, bytes, content_type, width, height, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        rendition.id,
        rendition.mediaId,
        rendition.objectKey,
        rendition.sha256,
        rendition.bytes,
        rendition.contentType,
        rendition.width,
        rendition.height,
        rendition.createdAt,
      ],
    )
  }

  async saveOutboxEvent(event: OutboxEvent): Promise<void> {
    await this.client.query(
      `INSERT INTO outbox_events
        (id, aggregate_id, type, payload, status, attempts, last_error, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status, attempts = EXCLUDED.attempts,
        last_error = EXCLUDED.last_error, updated_at = EXCLUDED.updated_at`,
      [
        event.id,
        event.aggregateId,
        event.type,
        event.payload,
        event.status,
        event.attempts,
        event.lastError,
        event.createdAt,
        event.updatedAt,
      ],
    )
  }

  async savePublicationJob(job: PublicationJob): Promise<void> {
    await this.client.query(
      `INSERT INTO publishing_jobs
        (id, article_id, revision_id, run_at, status, idempotency_key, attempt,
         claimed_by, lease_until, previous_status, time_zone, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (id) DO UPDATE SET
         status = EXCLUDED.status, attempt = EXCLUDED.attempt,
         claimed_by = EXCLUDED.claimed_by, lease_until = EXCLUDED.lease_until,
         updated_at = EXCLUDED.updated_at`,
      [
        job.id,
        job.articleId,
        job.revisionId,
        job.runAt,
        job.status,
        job.idempotencyKey,
        job.attempt,
        job.claimedBy,
        job.leaseUntil,
        job.previousStatus,
        job.timeZone,
        job.createdAt,
        job.updatedAt,
      ],
    )
  }

  async savePublicationSettings(settings: PublicationSettings): Promise<void> {
    await this.client.query(
      `INSERT INTO publication_settings
        (id, owner_time_zone, default_locale, version, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         owner_time_zone = EXCLUDED.owner_time_zone,
         default_locale = EXCLUDED.default_locale,
         version = EXCLUDED.version,
         updated_at = EXCLUDED.updated_at`,
      [
        settings.id,
        settings.ownerTimeZone,
        settings.defaultLocale,
        settings.version,
        settings.createdAt,
        settings.updatedAt,
      ],
    )
  }

  async saveRedirect(redirect: SlugRedirect): Promise<void> {
    await this.client.query(
      'INSERT INTO slug_redirects (id, article_id, from_slug, to_slug, created_at) VALUES ($1, $2, $3, $4, $5)',
      [redirect.id, redirect.articleId, redirect.fromSlug, redirect.toSlug, redirect.createdAt],
    )
  }

  async saveReusableBlock(block: ReusableBlock): Promise<void> {
    await this.client.query(
      `INSERT INTO reusable_blocks
        (id, name, kind, current_revision_id, version, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        block.id,
        block.name,
        block.kind,
        block.currentRevisionId,
        block.version,
        block.createdAt,
        block.updatedAt,
      ],
    )
  }

  async saveReusableBlockRevision(revision: ReusableBlockRevision): Promise<void> {
    await this.client.query(
      `INSERT INTO reusable_block_revisions
        (id, block_id, revision_number, document_schema_version, document, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        revision.id,
        revision.blockId,
        revision.revisionNumber,
        revision.document.schemaVersion,
        revision.document,
        revision.createdAt,
      ],
    )
  }

  async saveRevision(revision: ArticleRevision): Promise<void> {
    await this.client.query(
      `INSERT INTO article_revisions
        (id, article_id, revision_number, document_schema_version, document, title, dek, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        revision.id,
        revision.articleId,
        revision.revisionNumber,
        revision.document.schemaVersion,
        revision.document,
        revision.title ?? null,
        revision.dek ?? null,
        revision.createdAt,
      ],
    )
  }

  async saveTaxonomyTerm(term: TaxonomyTerm): Promise<void> {
    await this.client.query(
      'INSERT INTO taxonomies (id, kind, slug, name, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [term.id, term.kind, term.slug, term.name, term.createdAt, term.updatedAt],
    )
  }
}

export class PostgresContentRepository implements ContentRepository {
  constructor(private readonly pool: Pool) {}

  async transaction<T>(work: (transaction: ContentTransaction) => Promise<T>): Promise<T> {
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')
      await client.query('SET CONSTRAINTS ALL DEFERRED')
      const result = await work(new PostgresContentTransaction(client))
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
}
