import type { SearchHit, SearchProjection, SearchQuery, SearchResultPage } from '../content/ports'

type SearchDocument = Parameters<SearchProjection['upsertPublishedArticle']>[0]

interface Match {
  readonly document: SearchDocument
  readonly rank: number
}

// The PostgreSQL adapter's weights for title words (A) and text words (B), and its title cut-off.
const titleWeight = 1
const textWeight = 0.4
const titleSimilarityCutoff = 0.3
// About the length of a ts_headline excerpt.
const snippetWords = 35

/** Lowercased runs of letters and digits, the words pg_trgm takes trigrams from. */
function words(text: string): string[] {
  return text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []
}

/** pg_trgm's trigrams: each word padded with two spaces before it and one after. */
function trigrams(fromWords: readonly string[]): Set<string> {
  const found = new Set<string>()
  for (const word of fromWords) {
    const padded = Array.from(`  ${word} `)
    for (let index = 0; index + 3 <= padded.length; index += 1) {
      found.add(padded.slice(index, index + 3).join(''))
    }
  }
  return found
}

/** Shared over all trigrams. A run of title words has trigrams, so this is never 0/0. */
function trigramSimilarity(a: ReadonlySet<string>, b: ReadonlySet<string>): number {
  let shared = 0
  for (const trigram of a) if (b.has(trigram)) shared += 1
  return shared / (a.size + b.size - shared)
}

/**
 * pg_trgm's strict_word_similarity: the best trigram similarity between the query and any run of
 * whole words in the title, so one mistyped word still finds a longer title.
 */
function strictWordSimilarity(query: string, title: string): number {
  const queryTrigrams = trigrams(words(query))
  const titleWords = words(title)
  let best = 0
  for (let start = 0; start < titleWords.length; start += 1) {
    for (let end = start + 1; end <= titleWords.length; end += 1) {
      const run = trigrams(titleWords.slice(start, end))
      best = Math.max(best, trigramSimilarity(queryTrigrams, run))
    }
  }
  return best
}

/** Zero unless every term is a word of the title or text; title words count more. */
function wordRank(terms: readonly string[], document: SearchDocument): number {
  if (terms.length === 0) return 0
  const titleWords = words(document.title)
  const textWords = words(document.searchText)
  let rank = 0
  for (const term of terms) {
    const inTitle = titleWords.filter((word) => word === term).length
    const inText = textWords.filter((word) => word === term).length
    if (inTitle + inText === 0) return 0
    rank += inTitle * titleWeight + inText * textWeight
  }
  return rank
}

function matching(
  documents: readonly SearchDocument[],
  rank: (document: SearchDocument) => number,
  cutoff: number,
): Match[] {
  return documents.flatMap((document) => {
    const value = rank(document)
    return value > cutoff ? [{ document, rank: value }] : []
  })
}

/** Best first; then the newer article; then the lower article id, which no two documents share. */
function byRank(a: Match, b: Match): number {
  return (
    b.rank - a.rank ||
    Date.parse(b.document.publishedAt) - Date.parse(a.document.publishedAt) ||
    (a.document.articleId < b.document.articleId ? -1 : 1)
  )
}

/** Up to `snippetWords` words of the published text, from the first one the query names. */
function snippet(searchText: string, terms: readonly string[]): string {
  const tokens = searchText.split(/\s+/u).filter(Boolean)
  const first = tokens.findIndex((token) => words(token).some((word) => terms.includes(word)))
  const start = Math.max(first, 0)
  return tokens.slice(start, start + snippetWords).join(' ')
}

/**
 * The search test double: the projection's write side and the query's read side over one map, so
 * a test writes published articles exactly as the projection would and then searches them.
 *
 * It matches like the PostgreSQL adapter in outline, not in detail. Every query word must be a
 * word of the title or text, case aside; there is no stemming, stop word, phrase or operator.
 * Title words rank above text words. When no document has every word, it falls back to titles
 * whose strict word similarity to the query is above 0.3, ranked by that similarity. Ties go to
 * the newer article, then the lower article id. Snippets come from the published text only.
 */
export class InMemorySearch implements SearchProjection, SearchQuery {
  private readonly documents = new Map<string, SearchDocument>()

  async removeArticle(articleId: string): Promise<void> {
    this.documents.delete(articleId)
  }

  async search(input: { query: string; limit: number; offset: number }): Promise<SearchResultPage> {
    const documents = [...this.documents.values()]
    const terms = [...new Set(words(input.query))]
    let matches = matching(documents, (document) => wordRank(terms, document), 0)
    if (matches.length === 0) {
      matches = matching(
        documents,
        (document) => strictWordSimilarity(input.query, document.title),
        titleSimilarityCutoff,
      )
    }
    const items = matches
      .sort(byRank)
      .slice(input.offset, input.offset + input.limit)
      .map(({ document, rank }): SearchHit => ({
        articleId: document.articleId,
        rank,
        slug: document.slug,
        snippet: snippet(document.searchText, terms),
        title: document.title,
      }))
    return { items, total: matches.length }
  }

  async upsertPublishedArticle(input: SearchDocument): Promise<void> {
    this.documents.set(input.articleId, { ...input })
  }
}
