import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import { createLogger } from '../observability/logger'
import { ConsoleEmailSender } from './console'
import type { OutboundEmail } from './ports'

function setup() {
  const records: Record<string, unknown>[] = []
  const sender = new ConsoleEmailSender(
    createLogger({
      correlationId: 'email-console-test',
      sink: (line) => records.push(JSON.parse(line)),
    }),
  )
  const message: OutboundEmail = {
    recipient: 'reader@example.com',
    subject: 'Private subject',
    text: randomUUID(),
    html: '<p>Private body</p>',
    listUnsubscribe: null,
    listUnsubscribePost: null,
    correlationId: 'email-event-correlation',
  }
  return { message, records, sender }
}

describe('console email simulation', () => {
  it('suppresses concurrent and changed-body replays using only the event ID, without logging content', async () => {
    const { message, records, sender } = setup()
    expect(
      await Promise.all([
        sender.send(message, 'outbox-first'),
        sender.send({ ...message, text: randomUUID() }, 'outbox-first'),
      ]),
    ).toEqual([
      { delivery: 'simulated', duplicate: false },
      { delivery: 'simulated', duplicate: true },
    ])
    expect(records).toEqual([
      expect.objectContaining({
        message: 'email.delivery.simulated',
        adapter: 'console',
        eventId: 'outbox-first',
        correlationId: 'email-event-correlation',
      }),
    ])
    const serialized = JSON.stringify(records)
    for (const value of [message.recipient, message.subject, message.html, message.text]) {
      expect(serialized).not.toContain(value)
    }
    expect(await sender.send(message, 'outbox-next')).toEqual({
      delivery: 'simulated',
      duplicate: false,
    })
    expect(records).toHaveLength(2)
  })

  it('refuses a missing key or an abandoned dispatch without remembering it as delivered', async () => {
    const { message, records, sender } = setup()
    await expect(sender.send(message, ' ')).rejects.toThrow('requires an event ID')
    const controller = new AbortController()
    controller.abort()
    await expect(
      sender.send({ ...message, signal: controller.signal }, 'outbox-aborted'),
    ).rejects.toThrow()
    expect(records).toEqual([])
    expect((await sender.send(message, 'outbox-aborted')).duplicate).toBe(false)
  })
})
