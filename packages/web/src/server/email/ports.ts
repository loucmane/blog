/** An application-owned email envelope. Adapters map these fields to their transport. */
export interface OutboundEmail {
  readonly recipient: string
  readonly subject: string
  readonly text: string
  readonly html: string
  /** The List-Unsubscribe header value; null for a confirmation of a pending subscription. */
  readonly listUnsubscribe: string | null
  /** RFC 8058 one-click POST, only when an unsubscribe link exists. */
  readonly listUnsubscribePost: 'List-Unsubscribe=One-Click' | null
  readonly correlationId?: string
  readonly signal?: AbortSignal
}

export interface EmailSendResult {
  /** Console delivery is always simulated, never a claim that a reader received mail. */
  readonly delivery: 'accepted' | 'simulated'
  readonly duplicate: boolean
}

/**
 * Called only by outbox handlers. A failed or rate-limited send throws so the dispatcher retries.
 * The key is the outbox event ID, with one event per recipient. Adapters must deduplicate it even
 * after an uncertain outcome; a real transport must retain that guarantee across worker restarts.
 * Retrying may regenerate a token and hence change the body: the first accepted message wins.
 * Errors must contain only a safe category, never an address, body, token or provider response.
 */
export interface EmailSender {
  send(message: OutboundEmail, idempotencyKey: string): Promise<EmailSendResult>
}
