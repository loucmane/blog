import { describe, expect, it } from 'vitest'

import { redact, redactedDraft, redactedEmail, redactedSecret, redactText } from './redact'

const draftDocument = {
  content: [
    {
      content: [{ text: 'Unpublished words about the lantern.', type: 'text' }],
      type: 'paragraph',
    },
  ],
  type: 'doc',
}

const s3SignedUrl =
  'https://media.s3.eu-north-1.amazonaws.com/originals/lantern.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAEXAMPLE%2F20261103%2Feu-north-1%2Fs3%2Faws4_request&X-Amz-Date=20261103T090000Z&X-Amz-Expires=300&X-Amz-Signature=3f1c0ffee'
const cloudFrontSignedUrl =
  'https://cdn.magazine.example/media/lantern.webp?Expires=1793729829&Signature=abc~def_123&Key-Pair-Id=K2EXAMPLE'
const jsonWebToken = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJvd25lciJ9.c2lnbmF0dXJlLXBhcnQ'

describe('redact', () => {
  it.each([
    {
      name: 'a story document under its field name',
      input: { articleId: 'article-1', document: draftDocument, title: 'The lantern' },
      expected: { articleId: 'article-1', document: redactedDraft, title: 'The lantern' },
    },
    {
      name: 'search text and request bodies, whatever their case or separator',
      input: { body: 'Draft body', search_text: 'Draft text', searchText: 'Draft text' },
      expected: { body: redactedDraft, search_text: redactedDraft, searchText: redactedDraft },
    },
    {
      name: 'a rich-text document under any field name',
      input: { revision: { id: 'revision-1', snapshot: draftDocument } },
      expected: { revision: { id: 'revision-1', snapshot: redactedDraft } },
    },
    {
      name: 'tokens, passwords, cookies and keys by field name',
      input: {
        accessKeyId: 'AKIAEXAMPLE',
        authorization: 'Bearer outbox-drain-secret',
        cookie: 'magazine-owner-test-session=v1.abc',
        MAGAZINE_OWNER_TEST_TOKEN: 'task43-owner-test-token',
        password: 'hunter2',
        secretAccessKey: 'wJalrXUtnFEMI',
        sessionId: 'session-1',
      },
      expected: {
        accessKeyId: redactedSecret,
        authorization: redactedSecret,
        cookie: redactedSecret,
        MAGAZINE_OWNER_TEST_TOKEN: redactedSecret,
        password: redactedSecret,
        secretAccessKey: redactedSecret,
        sessionId: redactedSecret,
      },
    },
    {
      name: 'email addresses by field name, including lists of recipients',
      input: {
        email: 'owner@magazine.example',
        subscriberEmail: 'a@b.example',
        to: ['c@d.example'],
      },
      expected: { email: redactedEmail, subscriberEmail: redactedEmail, to: redactedEmail },
    },
    {
      name: 'a bearer credential in text',
      input: 'refused Authorization: Bearer outbox-drain-secret.v2',
      expected: `refused Authorization: Bearer ${redactedSecret}`,
    },
    {
      name: 'a JSON web token in text',
      input: `session ${jsonWebToken} rejected`,
      expected: `session ${redactedSecret} rejected`,
    },
    {
      name: 'name=value secrets in a connection string',
      input: 'connect failed: host=db user=magazine password=hunter2 dbname=magazine',
      expected: `connect failed: host=db user=magazine password=${redactedSecret} dbname=magazine`,
    },
    {
      name: 'quoted secrets in JSON text',
      input: '{"apiKey": "sk-live-123", "attempts": 2, "x_token":"abc"}',
      expected: `{"apiKey": "${redactedSecret}", "attempts": 2, "x_token":"${redactedSecret}"}`,
    },
    {
      name: 'email addresses in text',
      input: 'bounced for owner@magazine.example and Reader.One+news@mail.example.co.uk today',
      expected: `bounced for ${redactedEmail} and ${redactedEmail} today`,
    },
    {
      name: 'the signature of an S3 signed media URL',
      input: `upload failed for ${s3SignedUrl}`,
      expected:
        'upload failed for https://media.s3.eu-north-1.amazonaws.com/originals/lantern.jpg?[redacted]',
    },
    {
      name: 'the signature of a CloudFront signed media URL, before sentence punctuation',
      input: `could not fetch ${cloudFrontSignedUrl}. Gave up.`,
      expected:
        'could not fetch https://cdn.magazine.example/media/lantern.webp?[redacted]. Gave up.',
    },
    {
      name: 'the credentials and options of a connection string',
      input: 'postgres://magazine:hunter2@db.internal.example:5432/magazine?sslmode=require',
      expected: `postgres://${redactedSecret}@db.internal.example:5432/magazine?[redacted]`,
    },
    {
      name: 'the credentials and query of URLs that have no path',
      input: 'redis://default:s3cret@cache.internal:6379 and https://magazine.example?token=abc',
      expected: `redis://${redactedSecret}@cache.internal:6379 and https://magazine.example?[redacted]`,
    },
    {
      name: 'an email address in a URL path',
      input: 'https://magazine.example/unsubscribe/owner@magazine.example',
      expected: `https://magazine.example/unsubscribe/${redactedEmail}`,
    },
    {
      name: 'nothing from values that carry no secret',
      input: {
        attempts: 3,
        eventId: 'outbox-1',
        idempotencyKey: 'outbox-1',
        nextAttemptAt: null,
        ok: true,
        path: '/api/health',
        slug: 'quiet-rooms',
        type: 'search.upsert',
      },
      expected: {
        attempts: 3,
        eventId: 'outbox-1',
        idempotencyKey: 'outbox-1',
        nextAttemptAt: null,
        ok: true,
        path: '/api/health',
        slug: 'quiet-rooms',
        type: 'search.upsert',
      },
    },
    {
      name: 'secrets in maps and URL objects',
      input: {
        link: new URL('https://magazine.example/preview?token=abc'),
        lookup: new Map([
          ['slug', 'quiet-rooms'],
          ['token', 'abc'],
        ]),
      },
      expected: {
        link: 'https://magazine.example/preview?[redacted]',
        lookup: { slug: 'quiet-rooms', token: redactedSecret },
      },
    },
    {
      name: 'secrets in request headers',
      input: new Headers({ authorization: 'Bearer abc', 'x-correlation-id': 'request-12345678' }),
      expected: { authorization: redactedSecret, 'x-correlation-id': 'request-12345678' },
    },
    {
      name: 'values JSON cannot hold, and dates and big numbers as text',
      input: {
        at: new Date('2026-11-03T09:00:00.000Z'),
        big: 12n,
        callback: () => undefined,
        never: new Date(Number.NaN),
        tags: new Set(['owner@magazine.example']),
      },
      expected: {
        at: '2026-11-03T09:00:00.000Z',
        big: '12',
        callback: undefined,
        never: null,
        tags: [redactedEmail],
      },
    },
  ])('removes $name', ({ expected, input }) => {
    expect(redact(input)).toEqual(expected)
  })

  it('redacts an error, its cause and its driver fields, and keeps what explains it', () => {
    const cause = Object.assign(new Error('password authentication failed for password=hunter2'), {
      code: '28P01',
      detail: 'Key (email)=(owner@magazine.example) already exists.',
    })
    const error = new Error('send to owner@magazine.example failed', { cause })

    const redacted = redact(error) as Record<string, unknown>

    expect(redacted).toMatchObject({
      cause: {
        code: '28P01',
        detail: `Key (email)=(${redactedEmail}) already exists.`,
        message: `password authentication failed for password=${redactedSecret}`,
        name: 'Error',
      },
      message: `send to ${redactedEmail} failed`,
      name: 'Error',
    })
    expect(redacted.stack).toContain(`send to ${redactedEmail} failed`)
    expect(JSON.stringify(redacted)).not.toMatch(/hunter2|owner@magazine\.example/)
    const bare = new TypeError('no stack')
    delete bare.stack
    expect(redact(bare)).toEqual({ message: 'no stack', name: 'TypeError' })
  })

  it('is pure: it leaves its input as it was and gives the same output every time', () => {
    const input = {
      document: draftDocument,
      events: [{ lastError: `refused ${s3SignedUrl}`, to: 'owner@magazine.example' }],
    }
    const before = structuredClone(input)

    const first = redact(input)

    expect(input).toEqual(before)
    expect(redact(input)).toEqual(first)
  })

  it('ends a cycle in a marker but copies an object shared by two branches', () => {
    const shared = { slug: 'quiet-rooms' }
    const cyclic: Record<string, unknown> = { first: shared, name: 'cyclic', second: shared }
    cyclic.self = cyclic

    expect(redact(cyclic)).toEqual({
      first: { slug: 'quiet-rooms' },
      name: 'cyclic',
      second: { slug: 'quiet-rooms' },
      self: '[circular]',
    })
  })

  it('cuts deep nesting and long text without leaving part of a secret behind', () => {
    let nested: unknown = 'bottom'
    for (let level = 0; level < 10; level += 1) nested = { level, nested }
    const longText = `${'word '.repeat(799)}owner@magazine.example`

    expect(JSON.stringify(redact(nested))).toContain('[truncated]')
    expect(JSON.stringify(redact(nested))).not.toContain('bottom')
    expect(redactText(longText)).toMatch(/word \[truncated\]$/)
    expect(redactText(longText)).not.toContain('owner@')
  })

  it('keeps the words of plain sentences', () => {
    expect(redactText('The handler did not finish within 30000 ms.')).toBe(
      'The handler did not finish within 30000 ms.',
    )
    expect(redactText('unsupported event type: newsletter.unknown')).toBe(
      'unsupported event type: newsletter.unknown',
    )
  })
})
