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
import { parseMigratedContentDocument } from './document'
import { ContentConflictError, DuplicateSlugError } from './errors'
import type { ContentRepository, ContentTransaction } from './ports'

interface RepositoryState {
  articles: Map<string, Article>
  articleTaxonomies: Map<string, ArticleTaxonomy>
  auditEvents: Map<string, AuditEvent>
  authors: Map<string, AuthorProfile>
  autosaves: Map<string, DraftAutosave>
  idempotency: Map<string, IdempotencyRecord>
  mediaAssets: Map<string, MediaAsset>
  mediaRenditions: Map<string, MediaRendition>
  outboxEvents: Map<string, OutboxEvent>
  publicationJobs: Map<string, PublicationJob>
  publicationSettings: Map<string, PublicationSettings>
  redirects: Map<string, SlugRedirect>
  reusableBlockRevisions: Map<string, ReusableBlockRevision>
  reusableBlocks: Map<string, ReusableBlock>
  revisions: Map<string, ArticleRevision>
  taxonomyTerms: Map<string, TaxonomyTerm>
}

function createState(): RepositoryState {
  return {
    articles: new Map(),
    articleTaxonomies: new Map(),
    auditEvents: new Map(),
    authors: new Map(),
    autosaves: new Map(),
    idempotency: new Map(),
    mediaAssets: new Map(),
    mediaRenditions: new Map(),
    outboxEvents: new Map(),
    publicationJobs: new Map(),
    publicationSettings: new Map(),
    redirects: new Map(),
    reusableBlockRevisions: new Map(),
    reusableBlocks: new Map(),
    revisions: new Map(),
    taxonomyTerms: new Map(),
  }
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

function cloneState(state: RepositoryState): RepositoryState {
  return clone(state)
}

function values<T>(map: ReadonlyMap<string, T>): readonly T[] {
  return [...map.values()].map((value) => clone(value))
}

class InMemoryContentTransaction implements ContentTransaction {
  constructor(private readonly state: RepositoryState) {}

  async claimDuePublicationJob({
    leaseUntil,
    now,
    workerId,
  }: {
    leaseUntil: string
    now: string
    workerId: string
  }): Promise<PublicationJob | null> {
    const due = [...this.state.publicationJobs.values()]
      .filter(
        (job) =>
          (job.status === 'pending' ||
            (job.status === 'claimed' && job.leaseUntil !== null && job.leaseUntil <= now)) &&
          job.runAt <= now,
      )
      .sort((left, right) => left.runAt.localeCompare(right.runAt))[0]
    if (!due) return null
    const claimed: PublicationJob = {
      ...due,
      attempt: due.attempt + 1,
      claimedBy: workerId,
      leaseUntil,
      status: 'claimed',
      updatedAt: now,
    }
    this.state.publicationJobs.set(claimed.id, claimed)
    return clone(claimed)
  }

  async getArticle(id: string): Promise<Article | null> {
    return clone(this.state.articles.get(id) ?? null)
  }

  async getArticleForUpdate(id: string): Promise<Article | null> {
    return this.getArticle(id)
  }

  async getArticleBySlug(slug: string): Promise<Article | null> {
    const article = [...this.state.articles.values()].find(
      ({ slug: candidate }) => candidate === slug,
    )
    return clone(article ?? null)
  }

  async getIdempotency(operation: string, key: string): Promise<IdempotencyRecord | null> {
    return clone(this.state.idempotency.get(`${operation}:${key}`) ?? null)
  }

  async getMediaAsset(id: string): Promise<MediaAsset | null> {
    return clone(this.state.mediaAssets.get(id) ?? null)
  }

  async getOutboxEvent(id: string): Promise<OutboxEvent | null> {
    return clone(this.state.outboxEvents.get(id) ?? null)
  }

  async getPublicationJob(id: string): Promise<PublicationJob | null> {
    return clone(this.state.publicationJobs.get(id) ?? null)
  }

  async getPublicationJobForUpdate(id: string): Promise<PublicationJob | null> {
    return this.getPublicationJob(id)
  }

  async getPublicationSettings(): Promise<PublicationSettings | null> {
    return clone(this.state.publicationSettings.values().next().value ?? null)
  }

  async getRevision(id: string): Promise<ArticleRevision | null> {
    const revision = this.state.revisions.get(id)
    return revision
      ? clone({ ...revision, document: parseMigratedContentDocument(revision.document) })
      : null
  }

  async lockIdempotency(_operation: string, _key: string): Promise<void> {}

  async listArticles(): Promise<readonly Article[]> {
    return values(this.state.articles)
  }

  async listArticleTaxonomies(): Promise<readonly ArticleTaxonomy[]> {
    return values(this.state.articleTaxonomies)
  }

  async listAuditEvents(articleId?: string): Promise<readonly AuditEvent[]> {
    return values(this.state.auditEvents).filter(
      (event) => articleId === undefined || event.articleId === articleId,
    )
  }

  async listAuthors(): Promise<readonly AuthorProfile[]> {
    return values(this.state.authors)
  }

  async listAutosaves(articleId: string): Promise<readonly DraftAutosave[]> {
    return values(this.state.autosaves).filter((autosave) => autosave.articleId === articleId)
  }

  async listMediaAssets(): Promise<readonly MediaAsset[]> {
    return values(this.state.mediaAssets)
  }

  async listMediaRenditions(): Promise<readonly MediaRendition[]> {
    return values(this.state.mediaRenditions)
  }

  async listOutboxEvents(articleId?: string): Promise<readonly OutboxEvent[]> {
    return values(this.state.outboxEvents).filter(
      (event) => articleId === undefined || event.aggregateId === articleId,
    )
  }

  async listPublicationJobs(articleId?: string): Promise<readonly PublicationJob[]> {
    return values(this.state.publicationJobs).filter(
      (job) => articleId === undefined || job.articleId === articleId,
    )
  }

  async listRedirects(articleId?: string): Promise<readonly SlugRedirect[]> {
    return values(this.state.redirects).filter(
      (redirect) => articleId === undefined || redirect.articleId === articleId,
    )
  }

  async listReusableBlockRevisions(): Promise<readonly ReusableBlockRevision[]> {
    return values(this.state.reusableBlockRevisions).map((revision) => ({
      ...revision,
      document: parseMigratedContentDocument(revision.document),
    }))
  }

  async listReusableBlocks(): Promise<readonly ReusableBlock[]> {
    return values(this.state.reusableBlocks)
  }

  async listRevisions(articleId?: string): Promise<readonly ArticleRevision[]> {
    return values(this.state.revisions)
      .filter((revision) => articleId === undefined || revision.articleId === articleId)
      .map((revision) => ({
        ...revision,
        document: parseMigratedContentDocument(revision.document),
      }))
      .sort((left, right) => left.revisionNumber - right.revisionNumber)
  }

  async listTaxonomyTerms(): Promise<readonly TaxonomyTerm[]> {
    return values(this.state.taxonomyTerms)
  }

  async saveArticle(article: Article, expectedVersion: number | null): Promise<void> {
    const current = this.state.articles.get(article.id)
    const duplicateSlug = [...this.state.articles.values()].find(
      ({ id, slug }) => id !== article.id && slug === article.slug,
    )
    if (duplicateSlug) throw new DuplicateSlugError(article.slug)
    if (expectedVersion === null && current) {
      throw new ContentConflictError({ currentArticle: current })
    }
    if (expectedVersion !== null && (!current || current.version !== expectedVersion)) {
      throw new ContentConflictError({ currentArticle: current ?? article })
    }
    this.state.articles.set(article.id, clone(article))
  }

  async saveArticleTaxonomy(link: ArticleTaxonomy): Promise<void> {
    this.state.articleTaxonomies.set(`${link.articleId}:${link.taxonomyId}`, clone(link))
  }

  async saveAuditEvent(event: AuditEvent): Promise<void> {
    this.state.auditEvents.set(event.id, clone(event))
  }

  async saveAuthor(author: AuthorProfile): Promise<void> {
    this.state.authors.set(author.id, clone(author))
  }

  async saveAutosave(autosave: DraftAutosave): Promise<void> {
    this.state.autosaves.set(autosave.id, clone(autosave))
  }

  async saveIdempotency(record: IdempotencyRecord): Promise<void> {
    this.state.idempotency.set(`${record.operation}:${record.key}`, clone(record))
  }

  async saveMediaAsset(asset: MediaAsset): Promise<void> {
    this.state.mediaAssets.set(asset.id, clone(asset))
  }

  async saveMediaRendition(rendition: MediaRendition): Promise<void> {
    this.state.mediaRenditions.set(rendition.id, clone(rendition))
  }

  async saveOutboxEvent(event: OutboxEvent): Promise<void> {
    this.state.outboxEvents.set(event.id, clone(event))
  }

  async savePublicationJob(job: PublicationJob): Promise<void> {
    this.state.publicationJobs.set(job.id, clone(job))
  }

  async savePublicationSettings(settings: PublicationSettings): Promise<void> {
    this.state.publicationSettings.clear()
    this.state.publicationSettings.set(settings.id, clone(settings))
  }

  async saveRedirect(redirect: SlugRedirect): Promise<void> {
    this.state.redirects.set(redirect.id, clone(redirect))
  }

  async saveReusableBlock(block: ReusableBlock): Promise<void> {
    this.state.reusableBlocks.set(block.id, clone(block))
  }

  async saveReusableBlockRevision(revision: ReusableBlockRevision): Promise<void> {
    this.state.reusableBlockRevisions.set(revision.id, clone(revision))
  }

  async saveRevision(revision: ArticleRevision): Promise<void> {
    if (this.state.revisions.has(revision.id)) {
      throw new Error(`Revision ${revision.id} already exists and is immutable.`)
    }
    const duplicateNumber = [...this.state.revisions.values()].some(
      ({ articleId, revisionNumber }) =>
        articleId === revision.articleId && revisionNumber === revision.revisionNumber,
    )
    if (duplicateNumber) {
      throw new Error(`Revision number ${revision.revisionNumber} already exists.`)
    }
    this.state.revisions.set(revision.id, clone(revision))
  }

  async saveTaxonomyTerm(term: TaxonomyTerm): Promise<void> {
    this.state.taxonomyTerms.set(term.id, clone(term))
  }
}

export class InMemoryContentRepository implements ContentRepository {
  private state = createState()
  private transactionBarrier: Promise<void> = Promise.resolve()

  private async runExclusive<T>(work: () => Promise<T>): Promise<T> {
    const previous = this.transactionBarrier
    let release: () => void = () => undefined
    this.transactionBarrier = new Promise<void>((resolve) => {
      release = resolve
    })
    await previous
    try {
      return await work()
    } finally {
      release()
    }
  }

  async transaction<T>(work: (transaction: ContentTransaction) => Promise<T>): Promise<T> {
    return this.runExclusive(async () => {
      const original = cloneState(this.state)
      try {
        return await work(new InMemoryContentTransaction(this.state))
      } catch (error) {
        this.state = original
        throw error
      }
    })
  }

  async inspect<T>(work: (transaction: ContentTransaction) => Promise<T>): Promise<T> {
    return this.runExclusive(() => work(new InMemoryContentTransaction(this.state)))
  }
}
