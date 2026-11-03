import type { QueryResultRow } from 'pg'

import type { RelatedCandidate, RelatedStoryCandidates } from '../discovery/related'

/** The one call this adapter makes; a pg `Pool` provides it. */
export interface RelatedStoriesClient {
  query<Row extends QueryResultRow = QueryResultRow>(
    text: string,
    values: readonly unknown[],
  ): Promise<{ readonly rows: readonly Row[] }>
}

interface CandidateRow extends QueryResultRow {
  readonly article_id: string
  readonly published_at: Date | string
  readonly shared_authors: number
  readonly shared_sections: number
  readonly shared_terms: number
  readonly slug: string
}

// public_articles is what readers may see now, decided as content/reader.ts decides it: an
// article that is not deleted and has a published revision, either published or waiting on a
// newer revision whose one active publication job took over from the published state. Everything
// else, and the article being read, is excluded here, before any row leaves the database. The
// current article must be public itself, so a hidden article's terms and authors relate nothing.
// Only ids, slugs, times and counts are read: never a title, dek or revision, so no draft text.
const relatedCandidates = `WITH public_articles AS (
  SELECT article.id, article.slug, article.published_at
  FROM articles AS article
  WHERE article.deleted_at IS NULL
    AND article.published_at IS NOT NULL
    AND article.published_revision_id IS NOT NULL
    AND (
      article.status = 'published'
      OR (
        article.status = 'scheduled'
        AND (
          SELECT count(*) = 1
            AND bool_and(
              job.previous_status = 'published'
              AND job.revision_id = article.scheduled_revision_id
              AND job.run_at = article.scheduled_at
            )
          FROM publishing_jobs AS job
          WHERE job.article_id = article.id
            AND job.status IN ('pending', 'claimed')
        )
      )
    )
),
current_article AS (
  SELECT id FROM public_articles WHERE id = $1
),
current_terms AS (
  SELECT link.taxonomy_id, term.kind = 'section' AS is_section
  FROM current_article
  JOIN article_taxonomies AS link ON link.article_id = current_article.id
  JOIN taxonomies AS term ON term.id = link.taxonomy_id
),
current_authors AS (
  SELECT credit.author_id
  FROM current_article
  JOIN article_authors AS credit ON credit.article_id = current_article.id
),
term_overlap AS (
  SELECT link.article_id,
    count(*) FILTER (WHERE NOT current_terms.is_section)::int AS terms,
    count(*) FILTER (WHERE current_terms.is_section)::int AS sections
  FROM article_taxonomies AS link
  JOIN current_terms ON current_terms.taxonomy_id = link.taxonomy_id
  GROUP BY link.article_id
),
author_overlap AS (
  SELECT credit.article_id, count(*)::int AS authors
  FROM article_authors AS credit
  JOIN current_authors ON current_authors.author_id = credit.author_id
  GROUP BY credit.article_id
)
SELECT candidate.id AS article_id, candidate.slug, candidate.published_at,
  coalesce(term_overlap.terms, 0) AS shared_terms,
  coalesce(term_overlap.sections, 0) AS shared_sections,
  coalesce(author_overlap.authors, 0) AS shared_authors
FROM public_articles AS candidate
CROSS JOIN current_article
LEFT JOIN term_overlap ON term_overlap.article_id = candidate.id
LEFT JOIN author_overlap ON author_overlap.article_id = candidate.id
WHERE candidate.id <> current_article.id
ORDER BY candidate.id`

/**
 * Reads related-story candidates from PostgreSQL in one query: every publicly visible article
 * except the one being read, with the categories, tags, sections and authors it shares with it.
 * The keys of article_taxonomies and article_authors make each count one of distinct terms or
 * authors. The query decides visibility and exclusion; this adapter only maps its rows, and
 * `RelatedStoriesService` ranks them.
 */
export class PostgresRelatedStories implements RelatedStoryCandidates {
  constructor(private readonly client: RelatedStoriesClient) {}

  async candidatesFor(articleId: string): Promise<readonly RelatedCandidate[]> {
    const { rows } = await this.client.query<CandidateRow>(relatedCandidates, [articleId])
    return rows.map((row) => ({
      articleId: row.article_id,
      publishedAt: new Date(row.published_at).toISOString(),
      sharedAuthors: row.shared_authors,
      sharedSections: row.shared_sections,
      sharedTerms: row.shared_terms,
      slug: row.slug,
    }))
  }
}
