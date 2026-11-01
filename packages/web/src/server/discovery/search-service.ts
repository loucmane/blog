import type { SearchQuery, SearchResultPage } from '../content/ports'

/** The longest query searched, in characters (code points). A longer query is cut to this. */
export const maxSearchQueryLength = 200

/** Hits per page when the caller asks for no particular number. */
export const defaultSearchPageSize = 10

/** The most hits one page may hold. */
export const maxSearchPageSize = 50

export type SearchQueryRejection = 'control-character'

/**
 * A reader's query made ready to search, or the reason there is nothing to search:
 *
 * - `blank`: nothing is left once whitespace is removed.
 * - `rejected`: the query holds a control character that is not whitespace, such as NUL or ESC.
 * - `ready`: the query to search.
 */
export type NormalizedSearchQuery =
  | { readonly status: 'blank' }
  | { readonly reason: SearchQueryRejection; readonly status: 'rejected' }
  | { readonly query: string; readonly status: 'ready' }

// JavaScript's \s takes in tabs and line breaks, the control characters that are only spacing.
const whitespace = /\s+/gu
const controlCharacter = /\p{Cc}/u

/**
 * Normalizes a reader's query. Compatibility forms such as full-width letters and ligatures become
 * the plain letters the index holds (NFKC); whitespace of any kind, tabs and line breaks included,
 * collapses to single spaces; and the result is trimmed and cut to `maxSearchQueryLength`
 * characters. Any other control character rejects the whole query, wherever it appears, rather
 * than being searched for or silently dropped.
 */
export function normalizeSearchQuery(raw: string): NormalizedSearchQuery {
  const spaced = raw.normalize('NFKC').replace(whitespace, ' ')
  if (controlCharacter.test(spaced)) return { reason: 'control-character', status: 'rejected' }
  // Array.from splits by code point, so the cut never separates a surrogate pair.
  const query = Array.from(spaced.trim()).slice(0, maxSearchQueryLength).join('').trimEnd()
  return query ? { query, status: 'ready' } : { status: 'blank' }
}

export interface SearchRequest {
  /** The query as the reader typed it; `normalizeSearchQuery` prepares it. */
  readonly query: string
  /** Hits per page, 1 to `maxSearchPageSize`; `defaultSearchPageSize` when omitted. */
  readonly limit?: number
  /** Hits to skip, 0 or more; 0 when omitted. */
  readonly offset?: number
}

/**
 * What a reader's search comes to. This is the documented empty-state contract:
 *
 * - `blank`: there was nothing to search for, so nothing was searched. Show the search form
 *   alone, with no result count.
 * - `rejected`: the query cannot be searched (see `normalizeSearchQuery`), so nothing was
 *   searched. A route answers 400.
 * - `empty`: the search ran and no published story matched. `items` is empty and `total` is 0.
 *   This is the empty state readers see, with the normalized `query` to show back to them.
 * - `results`: at least one published story matched. `items` holds the requested page, best
 *   first; it is empty only when `offset` is at or past `total`.
 */
export type SearchResponse =
  | { readonly status: 'blank' }
  | { readonly reason: SearchQueryRejection; readonly status: 'rejected' }
  | (SearchResultPage & {
      readonly limit: number
      readonly offset: number
      readonly query: string
      readonly status: 'empty' | 'results'
    })

/**
 * Searches published stories for readers. The `SearchQuery` adapter does the matching; a failure
 * there propagates, and the route decides how to show it.
 */
export class SearchService {
  constructor(private readonly searchQuery: SearchQuery) {}

  async search(request: SearchRequest): Promise<SearchResponse> {
    const limit = request.limit ?? defaultSearchPageSize
    const offset = request.offset ?? 0
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > maxSearchPageSize) {
      throw new RangeError(`A search page holds 1 to ${maxSearchPageSize} hits.`)
    }
    if (!Number.isSafeInteger(offset) || offset < 0) {
      throw new RangeError('A search offset is a whole number of hits, 0 or more.')
    }
    const normalized = normalizeSearchQuery(request.query)
    if (normalized.status !== 'ready') return normalized
    const page = await this.searchQuery.search({ limit, offset, query: normalized.query })
    return {
      items: page.items,
      limit,
      offset,
      query: normalized.query,
      status: page.total === 0 ? 'empty' : 'results',
      total: page.total,
    }
  }
}
