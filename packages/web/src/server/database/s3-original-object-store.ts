import { createHash } from 'node:crypto'

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  type S3Client,
} from '@aws-sdk/client-s3'

import type { OriginalObjectStore, StoredOriginalObject } from '../content/ports'

async function bodyBytes(body: unknown): Promise<Uint8Array> {
  if (
    typeof body === 'object' &&
    body !== null &&
    'transformToByteArray' in body &&
    typeof body.transformToByteArray === 'function'
  ) {
    return body.transformToByteArray() as Promise<Uint8Array>
  }
  throw new Error('S3 response did not provide a readable byte stream.')
}

function sha256(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

export class S3OriginalObjectStore implements OriginalObjectStore {
  constructor(
    private readonly client: S3Client,
    private readonly bucket: string,
  ) {}

  async deleteOriginal(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
  }

  async getOriginal(key: string): Promise<Uint8Array> {
    const result = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }))
    return bodyBytes(result.Body)
  }

  async putOriginal(input: {
    body: Uint8Array
    contentType: string
    key: string
    sha256: string
  }): Promise<StoredOriginalObject> {
    if (sha256(input.body) !== input.sha256) {
      throw new Error('Original checksum does not match its bytes.')
    }
    await this.client.send(
      new PutObjectCommand({
        Body: input.body,
        Bucket: this.bucket,
        ChecksumAlgorithm: 'SHA256',
        ChecksumSHA256: Buffer.from(input.sha256, 'hex').toString('base64'),
        ContentType: input.contentType,
        Key: input.key,
        Metadata: { 'application-sha256': input.sha256 },
      }),
    )
    return {
      bytes: input.body.byteLength,
      contentType: input.contentType,
      key: input.key,
      sha256: input.sha256,
    }
  }

  async verifyOriginal(key: string, expectedSha256: string): Promise<boolean> {
    const head = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }))
    if (head.Metadata?.['application-sha256'] !== expectedSha256) return false
    const body = await this.getOriginal(key)
    return sha256(body) === expectedSha256
  }
}
