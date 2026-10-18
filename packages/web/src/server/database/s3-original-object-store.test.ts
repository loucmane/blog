import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { sha256Bytes } from '../content/media'
import { LabSeedLimits } from '../lab/limits'
import { labSeedBarrier } from '../../../tests/support/lab-seed-barrier'
import { S3OriginalObjectStore } from './s3-original-object-store'

const bytes = Uint8Array.of(1, 2, 3)
const checksum = sha256Bytes(bytes)
const input = { body: bytes, contentType: 'image/png', key: 'fixture-original', sha256: checksum }

describe('S3 original storage cancellation', () => {
  afterEach(() => vi.useRealTimers())

  it.each(['PUT', 'HEAD', 'GET', 'body'])(
    'bounds a stalled %s including verification, aborts transport and starts no later work',
    async (stalled) => {
      vi.useFakeTimers()
      const client = new S3Client({ region: 'us-east-1' })
      const store = new S3OriginalObjectStore(client, 'fixture-bucket')
      const limits = new LabSeedLimits({ storageTimeoutMs: 50 })
      const started = labSeedBarrier()
      const destroy = vi.fn()
      let release!: () => void
      let signal: AbortSignal | undefined
      const hang = async (result: unknown) => {
        started.resolve()
        await new Promise<void>((resolve) => {
          release = resolve
        })
        return result
      }
      const send = vi.spyOn(client, 'send').mockImplementation(async (command, options) => {
        if (typeof options === 'object') signal = options.abortSignal as AbortSignal
        if (command instanceof PutObjectCommand) return stalled === 'PUT' ? hang({}) : {}
        if (command instanceof HeadObjectCommand) {
          const result = { Metadata: { 'application-sha256': checksum } }
          return stalled === 'HEAD' ? hang(result) : result
        }
        if (command instanceof GetObjectCommand) {
          const result = {
            Body: {
              destroy,
              transformToByteArray: () =>
                stalled === 'body' ? hang(bytes) : Promise.resolve(bytes),
            },
          }
          return stalled === 'GET' ? hang(result) : result
        }
        throw new Error('Unexpected fixture S3 command')
      })
      try {
        const run = limits.storage(async (ioSignal) =>
          stalled === 'PUT'
            ? store.putOriginal(input, ioSignal)
            : store.verifyOriginal(input.key, checksum, ioSignal),
        )
        const failed = expect(run).rejects.toThrow('Lab seed storage timed out')
        await started.promise
        await vi.advanceTimersByTimeAsync(50)
        await failed
        expect(signal?.aborted).toBe(true)
        expect(vi.getTimerCount()).toBe(0)
        expect(destroy).toHaveBeenCalledTimes(stalled === 'body' ? 1 : 0)
        const calls = send.mock.calls.length
        release()
        await vi.advanceTimersByTimeAsync(0)
        expect(send).toHaveBeenCalledTimes(calls)
        expect(calls).toBe(stalled === 'PUT' || stalled === 'HEAD' ? 1 : 2)
      } finally {
        client.destroy()
      }
    },
  )

  it('retains normal PUT and checksum verification without a signal', async () => {
    const client = new S3Client({ region: 'us-east-1' })
    const store = new S3OriginalObjectStore(client, 'fixture-bucket')
    vi.spyOn(client, 'send').mockImplementation(async (command) => {
      if (command instanceof PutObjectCommand) return {}
      if (command instanceof HeadObjectCommand)
        return { Metadata: { 'application-sha256': checksum } }
      if (command instanceof GetObjectCommand)
        return { Body: { transformToByteArray: async () => bytes } }
      throw new Error('Unexpected fixture S3 command')
    })
    try {
      expect(await store.putOriginal(input)).toEqual({
        bytes: bytes.length,
        contentType: input.contentType,
        key: input.key,
        sha256: checksum,
      })
      expect(await store.verifyOriginal(input.key, checksum)).toBe(true)
    } finally {
      client.destroy()
    }
  })
})
