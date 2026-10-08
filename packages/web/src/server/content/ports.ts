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
} from './domain'

export interface Clock {
  now(): Date
}

export interface IdentifierSource {
  next(kind: string): string
}

export interface ContentTransaction {
  /** Reserve a new media identity without changing an existing asset. */
  createMediaAssetIfAbsent(asset: MediaAsset): Promise<boolean>
  claimDuePublicationJob(input: {
    leaseUntil: string
    now: string
    workerId: string
  }): Promise<PublicationJob | null>
  getArticle(id: string): Promise<Article | null>
  getArticleForUpdate(id: string): Promise<Article | null>
  getArticleBySlug(slug: string): Promise<Article | null>
  getIdempotency(operation: string, key: string): Promise<IdempotencyRecord | null>
  getMediaAsset(id: string): Promise<MediaAsset | null>
  getOutboxEvent(id: string): Promise<OutboxEvent | null>
  getPublicationJob(id: string): Promise<PublicationJob | null>
  getPublicationJobForUpdate(id: string): Promise<PublicationJob | null>
  getPublicationSettings(): Promise<PublicationSettings | null>
  getRevision(id: string): Promise<ArticleRevision | null>
  lockIdempotency(operation: string, key: string): Promise<void>
  listArticles(): Promise<readonly Article[]>
  listArticleTaxonomies(): Promise<readonly ArticleTaxonomy[]>
  listAuditEvents(articleId?: string): Promise<readonly AuditEvent[]>
  listAuthors(): Promise<readonly AuthorProfile[]>
  listAutosaves(articleId: string): Promise<readonly DraftAutosave[]>
  listMediaAssets(): Promise<readonly MediaAsset[]>
  listMediaRenditions(): Promise<readonly MediaRendition[]>
  listOutboxEvents(articleId?: string): Promise<readonly OutboxEvent[]>
  listPublicationJobs(articleId?: string): Promise<readonly PublicationJob[]>
  listRedirects(articleId?: string): Promise<readonly SlugRedirect[]>
  listReusableBlockRevisions(): Promise<readonly ReusableBlockRevision[]>
  listReusableBlocks(): Promise<readonly ReusableBlock[]>
  listRevisions(articleId?: string): Promise<readonly ArticleRevision[]>
  listTaxonomyTerms(): Promise<readonly TaxonomyTerm[]>
  /**
   * Records that this transaction changes what readers may see. The publication version advances
   * once, in the same commit, however often this is called.
   */
  recordPublicationChange(): void
  saveArticle(article: Article, expectedVersion: number | null): Promise<void>
  saveArticleTaxonomy(link: ArticleTaxonomy): Promise<void>
  saveAuditEvent(event: AuditEvent): Promise<void>
  saveAuthor(author: AuthorProfile): Promise<void>
  saveAutosave(autosave: DraftAutosave): Promise<void>
  saveIdempotency(record: IdempotencyRecord): Promise<void>
  saveMediaAsset(asset: MediaAsset): Promise<void>
  saveMediaRendition(rendition: MediaRendition): Promise<void>
  saveOutboxEvent(event: OutboxEvent): Promise<void>
  savePublicationJob(job: PublicationJob): Promise<void>
  savePublicationSettings(settings: PublicationSettings): Promise<void>
  saveRedirect(redirect: SlugRedirect): Promise<void>
  saveReusableBlock(block: ReusableBlock): Promise<void>
  saveReusableBlockRevision(revision: ReusableBlockRevision): Promise<void>
  saveRevision(revision: ArticleRevision): Promise<void>
  saveTaxonomyTerm(term: TaxonomyTerm): Promise<void>
}

/** Server-owned bounds for a dedicated exclusive session, never normal owner queries. */
export interface ExclusiveWorkLimits {
  /** Checks the monotonic run deadline and returns its positive remaining duration. */
  remainingMs(): number
  readonly statementTimeoutMs: number
  readonly lockTimeoutMs: number
  readonly idleTransactionTimeoutMs: number
  readonly cleanupTimeoutMs: number
}

export interface ContentRepository {
  /**
   * Try a repository-wide lock without waiting. Work must use the supplied repository
   * sequentially; it remains tied to the lock's connection for the whole callback.
   */
  tryExclusive<T>(
    key: string,
    work: (repository: ContentRepository) => Promise<T>,
    limits?: ExclusiveWorkLimits,
  ): Promise<{ acquired: false } | { acquired: true; value: T }>
  /**
   * The publication version: a counter that advances in the commit of every change to what
   * readers may see. It returns the last committed value with one query, outside any transaction.
   */
  readPublicationVersion(): Promise<number>
  transaction<T>(work: (transaction: ContentTransaction) => Promise<T>): Promise<T>
}

export interface StoredOriginalObject {
  readonly bytes: number
  readonly contentType: string
  readonly key: string
  readonly sha256: string
}

export interface OriginalObjectStore {
  deleteOriginal(key: string): Promise<void>
  getOriginal(key: string, signal?: AbortSignal): Promise<Uint8Array>
  putOriginal(
    input: {
      body: Uint8Array
      contentType: string
      key: string
      sha256: string
    },
    signal?: AbortSignal,
  ): Promise<StoredOriginalObject>
  verifyOriginal(key: string, expectedSha256: string, signal?: AbortSignal): Promise<boolean>
}

/**
 * Stores resized media variants. They are derived copies, never the only copy of anything:
 * deleting some or all of them is safe, because they are made again on demand.
 */
export interface MediaVariantStore {
  /** The stored variant, or null when there is none. */
  getVariant(key: string): Promise<Uint8Array | null>
  putVariant(input: { body: Uint8Array; contentType: string; key: string }): Promise<void>
}

export interface SearchProjection {
  removeArticle(articleId: string): Promise<void>
  upsertPublishedArticle(input: {
    articleId: string
    publishedAt: string
    searchText: string
    slug: string
    title: string
  }): Promise<void>
}
