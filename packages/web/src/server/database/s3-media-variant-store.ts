import { createHash } from 'node:crypto'

import { GetObjectCommand, PutObjectCommand, type S3Client } from '@aws-sdk/client-s3'

import type { MediaVariantStore } from '../content/ports'
import { bodyBytes } from './s3-original-object-store'

function isMissingObject(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error.name === 'NoSuchKey' || error.name === 'NotFound')
  )
}

/** Keeps media variants in the media bucket, beside the originals, under `variants/`. */
export class S3MediaVariantStore implements MediaVariantStore {
  constructor(
    private readonly client: S3Client,
    private readonly bucket: string,
  ) {}

  async getVariant(key: string): Promise<Uint8Array | null> {
    try {
      const result = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }))
      return await bodyBytes(result.Body)
    } catch (error) {
      if (isMissingObject(error)) return null
      throw error
    }
  }

  async putVariant(input: { body: Uint8Array; contentType: string; key: string }): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Body: input.body,
        Bucket: this.bucket,
        ChecksumAlgorithm: 'SHA256',
        ChecksumSHA256: createHash('sha256').update(input.body).digest('base64'),
        ContentType: input.contentType,
        Key: input.key,
      }),
    )
  }
}
