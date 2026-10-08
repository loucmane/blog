import { Client, type ClientConfig, type QueryResult, type QueryResultRow } from 'pg'

import type { ExclusiveWorkLimits } from '../content/ports'

export interface PostgresQueries {
  query<Row extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: unknown[],
  ): Promise<QueryResult<Row>>
}

async function bounded<T>(
  work: () => Promise<T>,
  timeoutMs: number,
  expire: () => void,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => {
          expire()
          reject(new Error('Exclusive database operation timed out. Try again shortly.'))
        }, timeoutMs)
      }),
      work(),
    ])
  } finally {
    clearTimeout(timer)
  }
}

/** One standalone client per run; seed startup and SQL never occupy the owner pool. */
export class ExclusivePostgresSession implements PostgresQueries {
  private destroyed = false
  private connectionError: Error | undefined

  private constructor(
    private readonly client: Client,
    private readonly limits?: ExclusiveWorkLimits,
  ) {
    // Idle-in-transaction expiry can arrive while awaiting storage, with no SQL in flight.
    client.on('error', (error: Error) => {
      this.connectionError = error
    })
  }

  static async connect(
    configuration: ClientConfig,
    limits?: ExclusiveWorkLimits,
    createClient: (configuration: ClientConfig) => Client = (configuration) =>
      new Client(configuration),
  ): Promise<ExclusivePostgresSession> {
    const client = createClient({
      ...configuration,
      // pg-pool hides explicit passwords as non-enumerable properties.
      password: configuration.password,
      // Let the driver destroy stalled startup, rather than abandoning a checkout promise.
      connectionTimeoutMillis: Math.min(10_000, limits?.remainingMs() ?? 10_000),
    })
    const session = new ExclusivePostgresSession(client, limits)
    try {
      await client.connect()
      session.check()
      return session
    } catch (error) {
      session.destroy()
      await session.close()
      throw error
    }
  }

  check(): void {
    if (this.connectionError) throw this.connectionError
    if (this.destroyed) throw new Error('The exclusive database connection is closed.')
    this.limits?.remainingMs()
  }

  async configure(): Promise<void> {
    if (!this.limits) return
    const remaining = this.limits.remainingMs()
    const duration = (cap: number) => `${Math.min(cap, remaining)}ms`
    await this.query(
      `SELECT set_config('statement_timeout', $1, false),
              set_config('lock_timeout', $2, false),
              set_config('idle_in_transaction_session_timeout', $3, false)`,
      [
        duration(this.limits.statementTimeoutMs),
        duration(this.limits.lockTimeoutMs),
        duration(this.limits.idleTransactionTimeoutMs),
      ],
    )
  }

  async query<Row extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: unknown[],
  ): Promise<QueryResult<Row>> {
    this.check()
    const work = () => this.client.query<Row>(text, values)
    if (!this.limits) return work()
    // Let PostgreSQL cancel first; the extra cleanup interval covers transport failure.
    // The run deadline is always the upper bound, including during publication bookkeeping.
    return bounded(
      work,
      Math.min(
        this.limits.remainingMs(),
        this.limits.statementTimeoutMs + this.limits.cleanupTimeoutMs,
      ),
      () => this.destroy(),
    )
  }

  async cleanup(text: string, values?: unknown[]): Promise<void> {
    if (this.destroyed) return // Closing the connection rolls back and releases session locks.
    try {
      if (this.connectionError) throw this.connectionError
      await bounded(
        () => this.client.query(text, values),
        this.limits?.cleanupTimeoutMs ?? 5_000,
        () => this.destroy(),
      )
    } catch (error) {
      this.destroy()
      throw error
    }
  }

  destroy(): void {
    if (this.destroyed) return
    this.destroyed = true
    // Closing the transport also rolls back and frees session locks if SQL is stalled.
    this.client.connection.stream.destroy()
  }

  async close(): Promise<void> {
    try {
      await bounded(
        () => this.client.end(),
        this.limits?.cleanupTimeoutMs ?? 5_000,
        () => this.destroy(),
      )
    } catch (error) {
      this.destroy()
      throw error
    } finally {
      this.destroyed = true
    }
  }
}
