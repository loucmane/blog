import { randomUUID } from 'node:crypto'

import type { Clock } from '../content/ports'
import { redact, redactText } from './redact'

/** The header a correlation id arrives in and is returned in. */
export const correlationIdHeader = 'x-correlation-id'
/** Where an inbound correlation id is looked for: this site's header, then the common request id. */
const inboundCorrelationHeaders = [correlationIdHeader, 'x-request-id'] as const
// 8 to 128 letters, digits and `_.:-`: room for a UUID or a W3C trace id, and nothing that needs
// escaping in a header or a log line.
const correlationIdPattern = /^[A-Za-z0-9][\w.:-]{7,127}$/

export const logLevels = ['debug', 'info', 'warn', 'error'] as const
export type LogLevel = (typeof logLevels)[number]
export type LogFields = Readonly<Record<string, unknown>>
/** Writes one finished log line, a JSON object, at its level. */
export type LogSink = (line: string, level: LogLevel) => void

// Every line starts with these; a field of the same name is dropped rather than allowed to replace one.
const reservedFields = new Set(['correlationId', 'level', 'message', 'time'])

export interface Logger {
  /** The id on every line this logger writes. */
  readonly correlationId: string
  debug(message: string, fields?: LogFields): void
  info(message: string, fields?: LogFields): void
  warn(message: string, fields?: LogFields): void
  error(message: string, fields?: LogFields): void
  /** A logger writing to the same sink with `fields` on every line, and another id when given. */
  child(input: { readonly correlationId?: string; readonly fields?: LogFields }): Logger
}

export interface LoggerOptions {
  readonly clock?: Clock
  readonly correlationId: string
  /** Fields written on every line. */
  readonly fields?: LogFields
  /** The least severe level written: `info` unless given. */
  readonly level?: LogLevel
  /** Where lines go: the console unless given, errors to stderr and the rest to stdout. */
  readonly sink?: LogSink
}

export function isCorrelationId(value: unknown): value is string {
  return typeof value === 'string' && correlationIdPattern.test(value)
}

export function newCorrelationId(): string {
  return randomUUID()
}

/**
 * The correlation id of an inbound request: the caller's `x-correlation-id` or `x-request-id`
 * when it is well formed, so a caller can follow its request through the logs, and a new id
 * otherwise. A malformed id is replaced, never repaired.
 */
export function correlationIdFrom(headers: Pick<Headers, 'get'>): string {
  for (const name of inboundCorrelationHeaders) {
    const value = headers.get(name)?.trim()
    if (isCorrelationId(value)) return value
  }
  return newCorrelationId()
}

const consoleSink: LogSink = (line, level) => {
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)
}

class StructuredLogger implements Logger {
  constructor(
    readonly correlationId: string,
    private readonly fields: LogFields,
    private readonly minimum: number,
    private readonly sink: LogSink,
    private readonly clock: Clock | undefined,
  ) {}

  debug(message: string, fields?: LogFields) {
    this.write('debug', message, fields)
  }

  info(message: string, fields?: LogFields) {
    this.write('info', message, fields)
  }

  warn(message: string, fields?: LogFields) {
    this.write('warn', message, fields)
  }

  error(message: string, fields?: LogFields) {
    this.write('error', message, fields)
  }

  child(input: { readonly correlationId?: string; readonly fields?: LogFields }): Logger {
    return new StructuredLogger(
      input.correlationId ?? this.correlationId,
      { ...this.fields, ...input.fields },
      this.minimum,
      this.sink,
      this.clock,
    )
  }

  private write(level: LogLevel, message: string, fields: LogFields | undefined) {
    if (logLevels.indexOf(level) < this.minimum) return
    const head = {
      time: (this.clock?.now() ?? new Date()).toISOString(),
      level,
      message: redactText(message),
      correlationId: this.correlationId,
    }
    let line: string
    try {
      const record: Record<string, unknown> = { ...head }
      const redacted = redact({ ...this.fields, ...fields }) as Record<string, unknown>
      for (const [key, value] of Object.entries(redacted)) {
        if (!reservedFields.has(key)) record[key] = value
      }
      line = JSON.stringify(record)
    } catch {
      // Only a field whose getter throws gets here; the line is still written, without its fields.
      line = JSON.stringify({ ...head, fields: '[unreadable]' })
    }
    try {
      this.sink(line, level)
    } catch {
      // Logging never fails the work it describes.
    }
  }
}

/**
 * A structured logger (TS-13): each line is one JSON object with `time`, `level`, `message` and
 * `correlationId`, then the line's fields. Every field and the message pass through `redact`
 * first, so draft bodies, tokens, email addresses and signed URLs never reach the log (BR-12).
 */
export function createLogger(options: LoggerOptions): Logger {
  return new StructuredLogger(
    options.correlationId,
    options.fields ?? {},
    logLevels.indexOf(options.level ?? 'info'),
    options.sink ?? consoleSink,
    options.clock,
  )
}
