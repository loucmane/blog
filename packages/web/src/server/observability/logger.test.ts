import { describe, expect, it, vi } from 'vitest'

import {
  correlationIdFrom,
  correlationIdHeader,
  createLogger,
  isCorrelationId,
  type LogLevel,
  type LoggerOptions,
} from './logger'
import { redactedDraft, redactedEmail, redactedSecret } from './redact'

const now = new Date('2026-11-03T09:00:00.000Z')
const uuid = /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/

function capture(options: Partial<LoggerOptions> = {}) {
  const lines: { level: LogLevel; line: string; record: Record<string, unknown> }[] = []
  const logger = createLogger({
    clock: { now: () => now },
    correlationId: 'request-0001',
    sink: (line, level) => lines.push({ level, line, record: JSON.parse(line) }),
    ...options,
  })
  return { lines, logger }
}

describe('structured logger', () => {
  it('writes one JSON object per line: time, level, message and correlation id, then the fields', () => {
    const { lines, logger } = capture()

    logger.warn('outbox.event.retrying', { attempts: 2, eventId: 'outbox-1' })

    expect(lines).toHaveLength(1)
    expect(lines[0]?.level).toBe('warn')
    expect(lines[0]?.line).toBe(
      '{"time":"2026-11-03T09:00:00.000Z","level":"warn","message":"outbox.event.retrying","correlationId":"request-0001","attempts":2,"eventId":"outbox-1"}',
    )
  })

  it('redacts the message and every field before anything is written (BR-12)', () => {
    const { lines, logger } = capture()
    const draft = { content: [{ text: 'Unpublished words.', type: 'text' }], type: 'doc' }

    logger.error('delivery to owner@magazine.example failed', {
      document: draft,
      error: new Error('provider said token=tok_live_123 for reader@magazine.example'),
      headers: new Headers({ authorization: 'Bearer drain-secret-123' }),
      mediaUrl: 'https://media.example/originals/a.jpg?X-Amz-Signature=abc123',
    })

    const [written] = lines
    expect(written?.line).not.toMatch(
      /owner@|reader@|tok_live_123|drain-secret-123|abc123|Unpublished/,
    )
    expect(written?.record).toMatchObject({
      correlationId: 'request-0001',
      document: redactedDraft,
      error: {
        message: `provider said token=${redactedSecret} for ${redactedEmail}`,
        name: 'Error',
      },
      headers: { authorization: redactedSecret },
      level: 'error',
      mediaUrl: 'https://media.example/originals/a.jpg?[redacted]',
      message: `delivery to ${redactedEmail} failed`,
    })
  })

  it('does not let a field replace the time, level, message or correlation id', () => {
    const { lines, logger } = capture()

    logger.info('health.checked', {
      correlationId: 'someone-elses-id',
      level: 'error',
      message: 'replaced',
      other: 1,
      time: 'never',
    })

    expect(lines[0]?.record).toEqual({
      correlationId: 'request-0001',
      level: 'info',
      message: 'health.checked',
      other: 1,
      time: '2026-11-03T09:00:00.000Z',
    })
  })

  it('binds fields and another correlation id in a child, leaving the parent as it was', () => {
    const { lines, logger } = capture({ fields: { service: 'web' } })
    const child = logger.child({
      correlationId: 'outbox-0123456789',
      fields: { eventId: 'outbox-1' },
    })

    child.info('outbox.event.completed', { attempts: 1 })
    child.child({ fields: { step: 'record' } }).info('nested')
    logger.info('parent')

    expect(child.correlationId).toBe('outbox-0123456789')
    expect(lines.map(({ record }) => record)).toEqual([
      expect.objectContaining({
        attempts: 1,
        correlationId: 'outbox-0123456789',
        eventId: 'outbox-1',
        service: 'web',
      }),
      expect.objectContaining({
        correlationId: 'outbox-0123456789',
        eventId: 'outbox-1',
        step: 'record',
      }),
      {
        correlationId: 'request-0001',
        level: 'info',
        message: 'parent',
        service: 'web',
        time: now.toISOString(),
      },
    ])
  })

  it('writes nothing less severe than its level', () => {
    const { lines, logger } = capture({ level: 'warn' })

    logger.debug('debug')
    logger.info('info')
    logger.warn('warn')
    logger.error('error')

    expect(lines.map(({ level }) => level)).toEqual(['warn', 'error'])
    const verbose = capture({ level: 'debug' })
    verbose.logger.debug('debug')
    expect(verbose.lines.map(({ level }) => level)).toEqual(['debug'])
  })

  it('never throws, whether a field cannot be read or the sink fails', () => {
    const { lines, logger } = capture()
    const unreadable = {
      get value() {
        throw new Error('getter failed')
      },
    }

    expect(() => logger.error('unreadable field', { unreadable })).not.toThrow()
    expect(lines[0]?.record).toEqual({
      correlationId: 'request-0001',
      fields: '[unreadable]',
      level: 'error',
      message: 'unreadable field',
      time: now.toISOString(),
    })
    const broken = createLogger({
      correlationId: 'request-0002',
      sink: () => {
        throw new Error('stdout closed')
      },
    })
    expect(() => broken.error('nowhere to write')).not.toThrow()
  })

  it('writes errors and warnings to stderr and the rest to stdout unless given a sink', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const logger = createLogger({ correlationId: 'request-0003' })

    logger.error('e')
    logger.warn('w')
    logger.info('i')
    logger.debug('not written at the default level')

    expect(JSON.parse(String(error.mock.calls[0]?.[0]))).toMatchObject({
      level: 'error',
      message: 'e',
    })
    expect(JSON.parse(String(warn.mock.calls[0]?.[0]))).toMatchObject({
      level: 'warn',
      message: 'w',
    })
    expect(log).toHaveBeenCalledOnce()
    expect(JSON.parse(String(log.mock.calls[0]?.[0]))).toMatchObject({
      correlationId: 'request-0003',
      level: 'info',
      time: expect.any(String),
    })
  })
})

describe('correlation ids', () => {
  it('takes a well-formed inbound id, the correlation header before the request id', () => {
    expect(correlationIdHeader).toBe('x-correlation-id')
    expect(correlationIdFrom(new Headers({ 'x-correlation-id': ' trace-abc12345 ' }))).toBe(
      'trace-abc12345',
    )
    expect(correlationIdFrom(new Headers({ 'x-request-id': 'req_0123456789' }))).toBe(
      'req_0123456789',
    )
    expect(
      correlationIdFrom(
        new Headers({ 'x-correlation-id': 'from-the-caller', 'x-request-id': 'from-the-proxy' }),
      ),
    ).toBe('from-the-caller')
    expect(
      correlationIdFrom(
        new Headers({ 'x-correlation-id': 'bad id', 'x-request-id': 'proxy-12345' }),
      ),
    ).toBe('proxy-12345')
  })

  it.each([
    ['no header', {}],
    ['a short id', { 'x-correlation-id': 'short' }],
    ['spaces', { 'x-correlation-id': 'has a space in it' }],
    ['an email address', { 'x-correlation-id': 'owner@magazine.example' }],
    ['markup', { 'x-correlation-id': '<script>alert(1)</script>' }],
    ['a repeated header', { 'x-correlation-id': 'first-id-123, second-id-456' }],
    ['an overlong id', { 'x-correlation-id': 'a'.repeat(129) }],
  ])('makes a new id for a request with %s', (_case, headers) => {
    const made = correlationIdFrom(new Headers(headers))

    expect(made).toMatch(uuid)
    expect(isCorrelationId(made)).toBe(true)
    expect(correlationIdFrom(new Headers(headers))).not.toBe(made)
  })

  it('accepts W3C trace ids and UUIDs and nothing that is not text', () => {
    expect(isCorrelationId('4bf92f3577b34da6a3ce929d0e0e4736')).toBe(true)
    expect(isCorrelationId('00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01')).toBe(true)
    expect(isCorrelationId(crypto.randomUUID())).toBe(true)
    expect(isCorrelationId(12345678)).toBe(false)
    expect(isCorrelationId(undefined)).toBe(false)
  })
})
