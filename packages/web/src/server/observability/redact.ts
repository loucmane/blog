/** What replaces a removed value. Each kind of value has its own marker, so a log line still says what was there. */
export const redactedDraft = '[redacted draft]'
export const redactedEmail = '[redacted email]'
export const redactedSecret = '[redacted secret]'
const redactedQuery = '?[redacted]'
const circular = '[circular]'
const truncated = '[truncated]'
const maxDepth = 8
/** Longer text is cut, which also bounds the time the patterns below can take. */
const maxTextLength = 4_000

// Field names are compared lowercased and without separators, so `search_text` and `searchText`
// are one name. A secret name wins over an email name, and both over a draft name.
const secretField =
  /token|secret|passw(?:or)?d|authorization|cookie|apikey|signature|credential|session|privatekey|accesskey|connectionstring|databaseurl/
const emailField = /email|^(?:address(?:es)?|bcc|cc|from|recipients?|replyto|to)$/
const draftFields = new Set([
  'body',
  'content',
  'document',
  'draft',
  'draftbody',
  'html',
  'markdown',
  'searchtext',
  'text',
])

// A URL, up to whitespace, a quote or an angle bracket; punctuation that ends a sentence is put back.
const url = /\b[a-z][a-z\d+.-]*:\/\/[^\s"'<>`]+/gi
const urlTrailingPunctuation = /[).,;:!\]]+$/
const jsonWebToken = /\beyJ[\w-]*\.[\w-]+\.[\w-]+/g
const bearerCredential = /\b(bearer)\s+[\w.~+/-]+=*/gi
const secretName =
  '[\\w-]*?(?:token|secret|passw(?:or)?d|api[-_]?key|signature|credential|session|access[-_]?key|private[-_]?key)[\\w-]*'
// `password=…` in a connection string, a cookie or a form body; `"token": "…"` in JSON text.
const assignedSecret = new RegExp(`\\b(${secretName})=[^\\s&;,"']+`, 'gi')
const quotedSecret = new RegExp(`("${secretName}"\\s*:\\s*)"(?:[^"\\\\]|\\\\.)*"`, 'gi')
// The lookbehind starts a match only where a run of address characters starts.
const emailAddress =
  /(?<![a-z\d._%+-])[a-z\d._%+-]+@(?:[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?\.)+[a-z]{2,63}(?![a-z\d-])/gi

function fieldName(key: string): string {
  return key.toLowerCase().replace(/[-_\s]/g, '')
}

/**
 * A URL without the credentials before its host and without its query string and fragment, where
 * signed URLs carry their signatures (S3's `X-Amz-Signature`, CloudFront's `Signature`) and links
 * carry tokens and addresses.
 */
function redactUrl(match: string): string {
  const trailing = urlTrailingPunctuation.exec(match)?.[0] ?? ''
  const candidate = trailing ? match.slice(0, -trailing.length) : match
  const schemeEnd = candidate.indexOf('://') + 3
  const rest = candidate.slice(schemeEnd)
  const queryStart = rest.search(/[?#]/)
  const withoutQuery = queryStart === -1 ? rest : rest.slice(0, queryStart)
  const authorityEnd = withoutQuery.indexOf('/')
  const authority = authorityEnd === -1 ? withoutQuery : withoutQuery.slice(0, authorityEnd)
  const path = authorityEnd === -1 ? '' : withoutQuery.slice(authorityEnd)
  const at = authority.lastIndexOf('@')
  const host = at === -1 ? authority : `${redactedSecret}@${authority.slice(at + 1)}`
  const query = queryStart === -1 ? '' : redactedQuery
  return `${candidate.slice(0, schemeEnd)}${host}${path}${query}${trailing}`
}

/** Text cut to `maxTextLength`, dropping the word the cut falls in so no part of a secret is left. */
function bounded(text: string): string {
  if (text.length <= maxTextLength) return text
  return `${text.slice(0, maxTextLength).replace(/\S*$/, '')}${truncated}`
}

/**
 * Free text with the secrets and addresses it may carry removed: URL credentials and query
 * strings, JSON web tokens, bearer credentials, `name=value` and `"name": "value"` secrets, and
 * email addresses. Text longer than 4,000 characters is cut there.
 */
export function redactText(text: string): string {
  return bounded(text)
    .replace(url, redactUrl)
    .replace(jsonWebToken, redactedSecret)
    .replace(bearerCredential, (_match, scheme: string) => `${scheme} ${redactedSecret}`)
    .replace(assignedSecret, (_match, name: string) => `${name}=${redactedSecret}`)
    .replace(quotedSecret, (_match, prefix: string) => `${prefix}"${redactedSecret}"`)
    .replace(emailAddress, redactedEmail)
}

/** A rich-text document or node, which is story text however it is named. */
function isRichText(value: object): boolean {
  return (
    'type' in value && value.type === 'doc' && 'content' in value && Array.isArray(value.content)
  )
}

function redactField(key: string, value: unknown, depth: number, ancestors: Set<object>): unknown {
  if (value === null || value === undefined) return value
  const name = fieldName(key)
  if (secretField.test(name)) return redactedSecret
  if (emailField.test(name)) return redactedEmail
  if (draftFields.has(name)) return redactedDraft
  return redactValue(value, depth + 1, ancestors)
}

function redactEntries(
  entries: Iterable<readonly [string, unknown]>,
  depth: number,
  ancestors: Set<object>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, item] of entries) result[key] = redactField(key, item, depth, ancestors)
  return result
}

function redactError(error: Error, depth: number, ancestors: Set<object>): Record<string, unknown> {
  const result: Record<string, unknown> = {
    name: error.name,
    message: redactText(error.message),
  }
  if (error.stack) result.stack = redactText(error.stack)
  if (error.cause !== undefined) result.cause = redactValue(error.cause, depth + 1, ancestors)
  // Driver errors carry fields of their own: PostgreSQL's code, detail, hint, table, ...
  for (const [key, item] of Object.entries(error)) {
    if (!(key in result)) result[key] = redactField(key, item, depth, ancestors)
  }
  return result
}

function redactObject(value: object, depth: number, ancestors: Set<object>): unknown {
  if (value instanceof Date) return Number.isNaN(value.valueOf()) ? null : value.toISOString()
  if (value instanceof URL) return redactText(value.href)
  if (value instanceof Error) return redactError(value, depth, ancestors)
  if (Array.isArray(value)) return value.map((item) => redactValue(item, depth + 1, ancestors))
  if (value instanceof Set) return [...value].map((item) => redactValue(item, depth + 1, ancestors))
  if (value instanceof Map) {
    return redactEntries(
      [...value].map(([key, item]) => [String(key), item] as const),
      depth,
      ancestors,
    )
  }
  if (value instanceof Headers) return redactEntries(value.entries(), depth, ancestors)
  if (isRichText(value)) return redactedDraft
  return redactEntries(Object.entries(value), depth, ancestors)
}

function redactValue(value: unknown, depth: number, ancestors: Set<object>): unknown {
  if (typeof value === 'string') return redactText(value)
  if (value === null || typeof value === 'number' || typeof value === 'boolean') return value
  if (typeof value === 'bigint') return value.toString()
  if (typeof value !== 'object') return undefined
  if (ancestors.has(value)) return circular
  if (depth >= maxDepth) return truncated
  ancestors.add(value)
  try {
    return redactObject(value, depth, ancestors)
  } finally {
    // Only an ancestor makes a cycle; the same object met again on another branch is copied again.
    ancestors.delete(value)
  }
}

/**
 * A copy of `value` that is safe to log (TS-13, BR-12): draft bodies, tokens and other secrets,
 * email addresses, and the signatures of signed media URLs are replaced by markers. Fields are
 * judged by name — `document`, `searchText` or `body` is story text, `token`, `password` or
 * `authorization` is a secret, `email` or `to` is an address — and every string by what it
 * contains. Errors keep their name, message, stack and cause, each redacted. It is pure: the input
 * is never changed, the same input always gives the same output, and nothing is read or written.
 * Values JSON cannot hold (functions, symbols) are dropped, cycles end in a marker, and text past
 * 4,000 characters or nesting past eight levels is cut off.
 */
export function redact(value: unknown): unknown {
  return redactValue(value, 0, new Set())
}
