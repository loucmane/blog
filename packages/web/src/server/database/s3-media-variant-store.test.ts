import { createHash } from 'node:crypto'

import { GetObjectCommand, PutObjectCommand, type S3Client } from '@aws-sdk/client-s3'
import { describe, expect, it, vi } from 'vitest'

import { S3MediaVariantStore } from './s3-media-variant-store'

const key = 'variants/media-a/' + 'a'.repeat(64) + '/v1/320.webp'

function fakeClient(send: (command: unknown) => Promise<unknown>) {
  const sendCommand = vi.fn(send)
  return { client: { send: sendCommand } as unknown as S3Client, send: sendCommand }
}

function failure(name: string, statusCode: number) {
  return Object.assign(new Error(name), { $metadata: { httpStatusCode: statusCode }, name })
}

describe('S3 media variant store', () => {
  it('reads a stored variant from the bucket', async () => {
    const { client, send } = fakeClient(async () => ({
      Body: { transformToByteArray: async () => Uint8Array.of(1, 2, 3) },
    }))

    expect(await new S3MediaVariantStore(client, 'media').getVariant(key)).toEqual(
      Uint8Array.of(1, 2, 3),
    )
    const [command] = send.mock.calls[0] ?? []
    expect(command).toBeInstanceOf(GetObjectCommand)
    expect((command as GetObjectCommand).input).toEqual({ Bucket: 'media', Key: key })
  })

  it('reports a missing variant as absent and passes every other failure on', async () => {
    for (const missing of [failure('NoSuchKey', 404), failure('NotFound', 404)]) {
      const { client } = fakeClient(async () => {
        throw missing
      })
      expect(
        await new S3MediaVariantStore(client, 'media').getVariant(key),
        missing.name,
      ).toBeNull()
    }
    for (const unexpected of [failure('AccessDenied', 403), failure('InternalError', 500)]) {
      const { client } = fakeClient(async () => {
        throw unexpected
      })
      await expect(new S3MediaVariantStore(client, 'media').getVariant(key)).rejects.toBe(
        unexpected,
      )
    }
  })

  it('writes a variant with its content type and a checksum the bucket verifies', async () => {
    const { client, send } = fakeClient(async () => ({}))
    const body = Uint8Array.of(4, 5, 6)

    await new S3MediaVariantStore(client, 'media').putVariant({
      body,
      contentType: 'image/webp',
      key,
    })

    const [command] = send.mock.calls[0] ?? []
    expect(command).toBeInstanceOf(PutObjectCommand)
    expect((command as PutObjectCommand).input).toEqual({
      Body: body,
      Bucket: 'media',
      ChecksumAlgorithm: 'SHA256',
      ChecksumSHA256: createHash('sha256').update(body).digest('base64'),
      ContentType: 'image/webp',
      Key: key,
    })
  })
})
