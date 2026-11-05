import { createLogger, newCorrelationId, type Logger } from '../observability/logger'
import type { EmailSender, EmailSendResult, OutboundEmail } from './ports'

/**
 * Development-only delivery: records an envelope's event ID, never its recipient, links or body.
 * Duplicate suppression lasts for this adapter instance; no network delivery takes place. The
 * runtime shares one instance for its lifetime. Durable transport deduplication belongs to the
 * future provider adapter, not this console simulation.
 */
export class ConsoleEmailSender implements EmailSender {
  private readonly accepted = new Set<string>()

  constructor(
    private readonly logger: Logger = createLogger({ correlationId: newCorrelationId() }),
  ) {}

  async send(message: OutboundEmail, idempotencyKey: string): Promise<EmailSendResult> {
    message.signal?.throwIfAborted()
    if (!idempotencyKey.trim()) throw new Error('Email delivery requires an event ID.')
    if (this.accepted.has(idempotencyKey)) return { delivery: 'simulated', duplicate: true }
    this.accepted.add(idempotencyKey)
    this.logger
      .child(message.correlationId ? { correlationId: message.correlationId } : {})
      .info('email.delivery.simulated', {
        adapter: 'console',
        eventId: idempotencyKey,
      })
    return { delivery: 'simulated', duplicate: false }
  }
}

/** One simulation across all dispatcher handler maps in this process. No credentials needed. */
export const consoleEmailSender = new ConsoleEmailSender()

/** A readiness declaration only: probing health never sends an email. */
export const consoleEmailHealthProbe = {
  mode: 'development' as const,
  run: async () => undefined,
}
