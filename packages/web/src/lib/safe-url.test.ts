import { describe, expect, it } from 'vitest'

import {
  CURRENT_CONTENT_DOCUMENT_VERSION,
  inspectContentDocument,
  type ContentDocument,
  type ContentNode,
} from '../server/content/document'

import { safeHref } from './safe-url'

type UrlCase = { name: string; value: unknown; allowed: boolean }
type UrlContext = 'link' | 'image credit' | 'gallery credit'

function documentWithUrl(value: unknown, context: UrlContext): ContentDocument {
  const media = {
    alt: 'Archive photograph',
    caption: '',
    credit: { name: 'Studio', url: value },
    focalPoint: { x: 0.5, y: 0.5 },
    mediaId: 'media-safe-url',
  }
  const node: ContentNode =
    context === 'link'
      ? {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Source',
              marks: [{ type: 'link', attrs: { href: value } }],
            },
          ],
        }
      : context === 'image credit'
        ? { type: 'mediaImage', attrs: media }
        : { type: 'gallery', attrs: { items: [media], layout: 'grid' } }

  // Keep one candidate per document, so million-character URLs stay below the
  // document size limit and exercise URL validation instead of an oversized rejection.
  return {
    articleId: 'article-safe-url',
    document: { type: 'doc', content: [node] },
    migrationProvenance: [],
    schemaVersion: CURRENT_CONTENT_DOCUMENT_VERSION,
    title: 'Safe URL regression',
  }
}

function expectUrlAgreement({ value, allowed }: UrlCase) {
  const href = safeHref(value)
  expect(href).toBe(allowed ? value : null)

  for (const context of ['link', 'image credit', 'gallery credit'] as const) {
    const inspection = inspectContentDocument(documentWithUrl(value, context))
    // A null credit URL means no link; the document accepts that absent value,
    // while a link mark requires a string. Neither gives the reader an href.
    const absentCredit = context !== 'link' && value === null
    expect(inspection.status, context).toBe(allowed || absentCredit ? 'valid' : 'quarantined')
    expect(inspection.status === 'valid' && !absentCredit, context).toBe(href !== null)
    for (const issue of inspection.issues) {
      expect(['invalid_shape', 'invalid_url'], context).toContain(issue.code)
      expect(issue.path, context).toMatch(/^document\.document\.content\[0\]/)
    }
  }
}

describe('safe link addresses', () => {
  it.each([
    'https://studio.example/credits',
    'http://studio.example/',
    'mailto:pictures@studio.example',
  ])('keeps the web or email address %s as it was given', (value) => {
    expect(safeHref(value)).toBe(value)
  })

  it.each([
    'javascript:alert(1)',
    'JavaScript:alert(document.cookie)',
    ' javascript:alert(1)',
    'java\tscript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
    '//studio.example/credits',
    '/credits',
    'studio.example',
    '',
  ])('refuses %j, which is not a full web or email address', (value) => {
    expect(safeHref(value)).toBeNull()
  })

  it.each([null, undefined, 42, { href: 'https://studio.example/' }])(
    'refuses %j, which is not text',
    (value) => {
      expect(safeHref(value)).toBeNull()
    },
  )

  describe('reviewed bypass regressions and document URL agreement', () => {
    it.each([
      { name: 'HTTPS', value: 'https://studio.example/credits', allowed: true },
      { name: 'HTTP', value: 'http://studio.example/credits', allowed: true },
      { name: 'email', value: 'mailto:pictures@studio.example', allowed: true },
      { name: 'mixed-case HTTPS', value: 'HtTpS://studio.example/credits', allowed: true },
      { name: 'mixed-case email', value: 'MaIlTo:pictures@studio.example', allowed: true },
      { name: 'mixed-case script', value: 'JaVaScRiPt:alert(1)', allowed: false },
      { name: 'leading CR/LF', value: '\r\njavascript:alert(1)', allowed: false },
      { name: 'embedded CR/LF', value: 'java\r\nscript:alert(1)', allowed: false },
      { name: 'encoded leading control', value: '%09javascript:alert(1)', allowed: false },
      { name: 'encoded embedded control', value: 'java%0D%0Ascript:alert(1)', allowed: false },
      { name: 'double-encoded scheme', value: '%256aavascript:alert(1)', allowed: false },
      {
        name: 'fully encoded scheme',
        value: '%6a%61%76%61%73%63%72%69%70%74:alert(1)',
        allowed: false,
      },
      { name: 'HTML entity colon', value: 'javascript&#58;alert(1)', allowed: false },
      { name: 'leading space', value: ' javascript:alert(1)', allowed: false },
      { name: 'nonbreaking space', value: '\u00a0javascript:alert(1)', allowed: false },
      { name: 'zero-width space', value: '\u200bjavascript:alert(1)', allowed: false },
      {
        name: 'web URL with leading controls',
        value: '\0\r\n\thttps://studio.example/',
        allowed: true,
      },
      {
        name: 'web URL with surrounding spaces',
        value: ' https://studio.example/ ',
        allowed: true,
      },
      { name: 'tab inside web scheme', value: 'ht\ttps://studio.example/', allowed: true },
      { name: 'CR inside web scheme', value: 'ht\rtps://studio.example/', allowed: true },
      { name: 'LF inside web scheme', value: 'ht\ntps://studio.example/', allowed: true },
      { name: 'NUL inside web scheme', value: 'ht\0tps://studio.example/', allowed: false },
      {
        name: 'encoded path',
        value: 'https://studio.example/%6aavascript%3Aalert(1)',
        allowed: true,
      },
      { name: 'web backslashes', value: 'https:\\\\studio.example\\credits', allowed: true },
      { name: 'mixed web slashes', value: 'http:/\\studio.example/credits', allowed: true },
      {
        name: 'script backslashes',
        value: 'javascript:\\\\studio.example/alert(1)',
        allowed: false,
      },
      { name: 'backslash before scheme', value: '\\javascript:alert(1)', allowed: false },
      { name: 'backslash-relative host', value: '\\\\studio.example\\credits', allowed: false },
      { name: 'mixed relative slashes', value: '/\\studio.example/credits', allowed: false },
      { name: 'HTTPS credentials', value: 'https://reader:example@studio.example/', allowed: true },
      { name: 'HTTP credentials', value: 'http://reader:example@studio.example/', allowed: true },
      {
        name: 'scheme-like username',
        value: 'https://javascript:example@studio.example/',
        allowed: true,
      },
      { name: 'FTP credentials', value: 'ftp://reader:example@studio.example/', allowed: false },
      // Email addresses never carry credentials: WHATWG still parses userinfo in mailto://.
      {
        name: 'email credentials',
        value: 'mailto://reader:example@studio.example/',
        allowed: false,
      },
      { name: 'email user only', value: 'mailto://reader@studio.example/', allowed: false },
      { name: 'plain email', value: 'mailto:reader@studio.example', allowed: true },
      {
        name: 'script credentials',
        value: 'javascript://reader:example@studio.example/',
        allowed: false,
      },
      { name: 'data credentials', value: 'data://reader:example@studio.example/', allowed: false },
      { name: 'file credentials', value: 'file://reader:example@studio.example/', allowed: false },
      { name: 'relative credentials', value: '//reader:example@studio.example/', allowed: false },
      { name: 'protocol-relative URL', value: '//studio.example/credits', allowed: false },
      { name: 'root-relative URL', value: '/credits', allowed: false },
      { name: 'path-relative URL', value: 'credits/source', allowed: false },
      { name: 'dot-relative URL', value: './credits', allowed: false },
      { name: 'parent-relative URL', value: '../credits', allowed: false },
      { name: 'query-relative URL', value: '?source=studio', allowed: false },
      { name: 'fragment-relative URL', value: '#credits', allowed: false },
      { name: 'bare hostname', value: 'studio.example', allowed: false },
      { name: 'empty string', value: '', allowed: false },
    ] satisfies UrlCase[])('$name', expectUrlAgreement)

    const schemes = [
      ['javascript', 'alert(1)'],
      ['vbscript', 'msgbox(1)'],
      ['data', 'text/html,<script>alert(1)</script>'],
      ['https', '//studio.example/credits'],
      ['http', '//studio.example/credits'],
      ['mailto', 'pictures@studio.example'],
    ] as const

    it.each(
      schemes.flatMap(([scheme, target]) =>
        [...`${scheme}:`].map((character, offset) => ({
          name: `${scheme}: percent-encoded character at offset ${offset}`,
          value: `${scheme.slice(0, offset)}%${character.charCodeAt(0).toString(16)}${`${scheme}:`.slice(offset + 1)}${target}`,
          allowed: false,
        })),
      ),
    )('$name', expectUrlAgreement)

    const controls = [...Array.from({ length: 32 }, (_, code) => code), 0x7f]
    it.each(
      schemes.slice(0, 3).flatMap(([scheme, target]) =>
        controls.flatMap((code) =>
          Array.from({ length: scheme.length + 1 }, (_, offset) => ({
            name: `${scheme}: U+${code.toString(16).padStart(4, '0')} at offset ${offset}`,
            value: `${scheme.slice(0, offset)}${String.fromCharCode(code)}${scheme.slice(offset)}:${target}`,
            allowed: false,
          })),
        ),
      ),
    )('$name', expectUrlAgreement)

    it.each([
      { name: 'null', value: null, allowed: false },
      { name: 'undefined', value: undefined, allowed: false },
      { name: 'number', value: 42, allowed: false },
      { name: 'zero', value: 0, allowed: false },
      { name: 'NaN', value: Number.NaN, allowed: false },
      { name: 'true', value: true, allowed: false },
      { name: 'false', value: false, allowed: false },
      { name: 'empty array', value: [], allowed: false },
      { name: 'URL in array', value: ['https://studio.example/'], allowed: false },
      { name: 'empty object', value: {}, allowed: false },
      { name: 'URL in object', value: { href: 'https://studio.example/' }, allowed: false },
    ] satisfies UrlCase[])('non-string: $name', expectUrlAgreement)

    it.each([
      { name: 'HTTPS path', prefix: 'https://studio.example/', allowed: true },
      { name: 'email address', prefix: 'mailto:', allowed: true },
      { name: 'script URL', prefix: 'javascript:', allowed: false },
      { name: 'data URL', prefix: 'data:text/html,', allowed: false },
      { name: 'relative URL', prefix: '/', allowed: false },
      { name: 'no scheme', prefix: '', allowed: false },
    ])('million-character $name', ({ name, prefix, allowed }) => {
      // Build lazily, use a short case name, and impose no load-sensitive timing assertion.
      const value = prefix + 'a'.repeat(1_000_000 - prefix.length)
      expect(value).toHaveLength(1_000_000)
      expectUrlAgreement({ name, value, allowed })
    })
  })
})
