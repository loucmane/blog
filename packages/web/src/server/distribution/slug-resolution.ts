import type { ContentRepository } from '@/server/content/ports'
import { listVisibleArticles } from '@/server/content/reader'

/**
 * What a request for a story slug gets (TS-05, BR-04, AC-07, OQ-09):
 *
 * - `current`: readers can see a story at this slug, so its page renders.
 * - `redirect`: the slug is in a story's redirect history and readers can see the story at
 *   `slug`, its slug now: a permanent (308) redirect, however many renames lie between.
 * - `gone`: the URL belonged to a story that was published once and that readers can no longer
 *   see, because it was unpublished or deleted: 410.
 * - `unknown`: anything else, including a story that was never published: 404.
 */
export type SlugResolution =
  | { readonly kind: 'current' }
  | { readonly kind: 'gone' }
  | { readonly kind: 'redirect'; readonly slug: string }
  | { readonly kind: 'unknown' }

/** An article as slug resolution sees it, deleted or not. */
export interface SlugArticle {
  readonly deleted: boolean
  readonly id: string
  /** Whether it was ever published, so its URL was public once. */
  readonly published: boolean
  /** Its slug now; a deleted article keeps the slug it had. */
  readonly slug: string
}

/** The redirect recorded when an article left a slug for `toSlug`. */
export interface SlugRedirectEdge {
  readonly articleId: string
  readonly toSlug: string
}

/**
 * The slug-resolution port: the article facts and redirect history resolution reads. Whether
 * readers can see a story is not part of it; that rule belongs to the content reader
 * (`readVisibleSlugs`). Adapters: `PostgresSlugHistory` (database/postgres-slug-resolution.ts)
 * and `RepositorySlugHistory`, over any content repository, which the in-memory store uses.
 */
export interface SlugHistory {
  /** The article with this id, deleted or not, or null when there is none. */
  article(id: string): Promise<SlugArticle | null>
  /**
   * Every article that has this slug now, deleted ones included. At most one is not deleted:
   * PostgreSQL keeps the slugs of articles that are not deleted unique.
   */
  articlesAt(slug: string): Promise<readonly SlugArticle[]>
  /** The redirect recorded when an article left this slug, or null when none did. */
  redirectFrom(slug: string): Promise<SlugRedirectEdge | null>
}

export interface SlugResolutionSources {
  readonly history: SlugHistory
  /** The id of the article readers see at this slug, or null when they see none there. */
  visibleArticleAt(slug: string): Promise<string | null>
}

const current: SlugResolution = { kind: 'current' }
const gone: SlugResolution = { kind: 'gone' }
const unknown: SlugResolution = { kind: 'unknown' }

/**
 * Whether the redirects one article recorded lead from `slug` to `target`. Each rename recorded one
 * redirect, from the slug the article left to its new one, so its history is a chain (a → b → c)
 * that ends at the slug it has now. The walk follows that article's redirects only: another
 * article may take a slug this one left, and the redirects it records later are not this one's
 * history. A history can come back to a slug it passed (a → b → a), so the walk keeps the slugs it
 * visited and stops at the first one it would visit twice: no chain can loop.
 */
async function chainReaches(
  history: SlugHistory,
  slug: string,
  first: SlugRedirectEdge,
  target: string,
): Promise<boolean> {
  const visited = new Set([slug])
  let redirect: SlugRedirectEdge | null = first
  while (redirect && redirect.articleId === first.articleId && !visited.has(redirect.toSlug)) {
    if (redirect.toSlug === target) return true
    visited.add(redirect.toSlug)
    redirect = await history.redirectFrom(redirect.toSlug)
  }
  return false
}

/**
 * Resolves a requested story slug to one outcome, in this order:
 *
 * 1. A slug readers can see is `current`, even when it is also an old slug of another story.
 * 2. A slug whose owner now, the article that has it and is not deleted, was published once and is
 *    no longer visible is `gone`: the owner's URL wins over any older story that left the slug.
 * 3. A slug some story left redirects, in one step, to that story's slug now, when readers can see
 *    it there and the story's recorded history leads there; when that story was published once and
 *    is no longer visible, the slug is `gone`.
 * 4. A slug a deleted article kept, and that article was published once, is `gone`.
 * 5. Everything else is `unknown`, so a draft's slugs, old or new, reveal nothing: a draft owner
 *    does not hide the redirect from a slug it took.
 */
export async function resolveSlug(
  slug: string,
  { history, visibleArticleAt }: SlugResolutionSources,
): Promise<SlugResolution> {
  if ((await visibleArticleAt(slug)) !== null) return current
  const articles = await history.articlesAt(slug)
  if (articles.some(({ deleted, published }) => !deleted && published)) return gone
  const redirect = await history.redirectFrom(slug)
  if (redirect) {
    const article = await history.article(redirect.articleId)
    if (article && (await visibleArticleAt(article.slug)) === article.id) {
      if (await chainReaches(history, slug, redirect, article.slug)) {
        return { kind: 'redirect', slug: article.slug }
      }
    } else if (article?.published) {
      return gone
    }
  }
  return articles.some(({ published }) => published) ? gone : unknown
}

/**
 * Every slug readers can see now, with its article's id. The content reader decides what is
 * visible (`listVisibleArticles`), the same rule the story page applies, so slug resolution can
 * never call a story current that its page would not show, or gone while its page shows it.
 */
export async function readVisibleSlugs(
  repository: ContentRepository,
): Promise<ReadonlyMap<string, string>> {
  const visible = await repository.transaction(listVisibleArticles)
  return new Map(visible.map(({ article }) => [article.slug, article.id]))
}
