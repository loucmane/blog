import type { QueryResultRow } from 'pg'

import type { SearchQuery, SearchResultPage } from '../content/ports'

/** The one call this adapter makes; a pg `Pool` provides it. */
export interface SearchQueryClient {
  query<Row extends QueryResultRow = QueryResultRow>(
    text: string,
    values: readonly unknown[],
  ): Promise<{ readonly rows: readonly Row[] }>
}

// One row per hit on the page, each with the total; a page past the last hit is one row holding
// only the total.
type SearchRow =
  | { readonly article_id: null; readonly total: number }
  | {
      readonly article_id: string
      readonly rank: number
      readonly slug: string
      readonly snippet: string
      readonly title: string
      readonly total: number
    }

/**
 * Pages the published documents that `matches` finds: a query for their article_id,
 * published_at and rank. The total counts every match. The page is the requested slice, best
 * first, ties to the newer article and then the lower id, and only its rows read the search text:
 * ts_headline excerpts it as plain text (empty StartSel and StopSel, so no markup). The total
 * row is always there, so a page past the last hit still reports how many there are.
 */
function pagedSearch(matches: string): string {
  return `WITH matches AS (${matches}
),
page AS (
  SELECT article_id, published_at, rank
  FROM matches
  ORDER BY rank DESC, published_at DESC, article_id
  LIMIT $2 OFFSET $3
)
SELECT totals.total, page.article_id, published.slug, published.title, page.rank,
  ts_headline('english', published.search_text, websearch_to_tsquery('english', $1),
    'StartSel="", StopSel=""') AS snippet
FROM (SELECT count(*)::int AS total FROM matches) AS totals
LEFT JOIN page ON true
LEFT JOIN article_search_documents AS published ON published.article_id = page.article_id
ORDER BY page.rank DESC, page.published_at DESC, page.article_id`
}

const fullTextSearch = pagedSearch(`
  SELECT article_id, published_at, ts_rank_cd(document, websearch_to_tsquery('english', $1)) AS rank
  FROM article_search_documents
  WHERE document @@ websearch_to_tsquery('english', $1)`)

// Strict word similarity compares the query with runs of whole words in the title. similarity()
// would compare it with the whole title, where one mistyped word scores too low: 'wimter' against
// 'Winter light in small rooms' is about 0.13, but 0.4 against the word 'winter'.
const titleSimilaritySearch = pagedSearch(`
  SELECT article_id, published_at, public.strict_word_similarity($1, title) AS rank
  FROM article_search_documents
  WHERE public.strict_word_similarity($1, title) > 0.3`)

/**
 * Searches `article_search_documents`, which holds published articles only, so no draft text can
 * be found. The english full-text configuration matches and ranks the query's words. When they
 * match nothing, titles a typo away are found instead: those whose strict word similarity to the
 * query is above 0.3, ranked by it. Migration 0006 keeps pg_trgm in schema public, and its
 * function is named there, so the search works whatever the session's search_path.
 */
export class PostgresSearchQuery implements SearchQuery {
  constructor(private readonly client: SearchQueryClient) {}

  async search(input: { query: string; limit: number; offset: number }): Promise<SearchResultPage> {
    const values = [input.query, input.limit, input.offset]
    const ranked = await this.page(fullTextSearch, values)
    return ranked.total > 0 ? ranked : this.page(titleSimilaritySearch, values)
  }

  private async page(text: string, values: readonly unknown[]): Promise<SearchResultPage> {
    const { rows } = await this.client.query<SearchRow>(text, values)
    return {
      items: rows.flatMap((row) =>
        row.article_id === null
          ? []
          : [
              {
                articleId: row.article_id,
                rank: row.rank,
                slug: row.slug,
                snippet: row.snippet,
                title: row.title,
              },
            ],
      ),
      total: rows[0]?.total ?? 0,
    }
  }
}
