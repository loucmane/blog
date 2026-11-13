import {
  CreateBucketCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3'

import type { MigrationClient } from '../database/migrations'
import { S3OriginalObjectStore } from '../database/s3-original-object-store'
import {
  DrillError,
  hash,
  type DrillLocation,
  type RestoreDrillEvidence,
} from './restore-drill-contract'

export interface DrillMediaObject {
  readonly key: string
  readonly sha256: string
  readonly bytes: number
  readonly contentType: string
}

export async function mediaManifest(
  client: Pick<MigrationClient, 'query'>,
): Promise<{ originals: readonly DrillMediaObject[]; renditions: readonly string[] }> {
  const originals = await client.query<{
    key: string
    sha256: string
    bytes: string
    contentType: string
  }>(
    'SELECT original_key AS key, original_sha256 AS sha256, bytes::text, content_type AS "contentType" FROM public.media_assets ORDER BY original_key',
  )
  const renditions = await client.query<{ key: string }>(
    'SELECT object_key AS key FROM public.media_renditions ORDER BY object_key',
  )
  return {
    originals: originals.rows.map((row) => ({ ...row, bytes: Number(row.bytes) })),
    renditions: renditions.rows.map(({ key }) => key),
  }
}

export function s3DrillClient(config: DrillLocation['objects']): S3Client {
  return new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    forcePathStyle: true,
    maxAttempts: 1,
    credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
    requestHandler: { connectionTimeout: 10_000, requestTimeout: 60_000 },
  })
}

function missing(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    '$metadata' in error &&
    (error.$metadata as { httpStatusCode?: number } | undefined)?.httpStatusCode === 404
  )
}

export async function createFreshBucket(client: S3Client, bucket: string): Promise<void> {
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }), {
      abortSignal: AbortSignal.timeout(60_000),
    })
  } catch (error) {
    if (!missing(error)) throw error
    await client.send(new CreateBucketCommand({ Bucket: bucket }), {
      abortSignal: AbortSignal.timeout(60_000),
    })
    return
  }
  throw new DrillError('target_exists')
}

export async function listObjectKeys(client: S3Client, bucket: string): Promise<readonly string[]> {
  const keys: string[] = []
  const tokens = new Set<string>()
  let token: string | undefined
  do {
    const page = await client.send(
      new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token }),
      { abortSignal: AbortSignal.timeout(60_000) },
    )
    for (const item of page.Contents ?? []) {
      if (item.Key === undefined) throw new DrillError('operation_failed')
      keys.push(item.Key)
    }
    token = page.IsTruncated ? page.NextContinuationToken : undefined
    if (page.IsTruncated && (!token || tokens.has(token))) throw new DrillError('operation_failed')
    if (token) tokens.add(token)
  } while (token)
  return keys.sort()
}

export async function copyOriginals(input: {
  source: S3Client
  target: S3Client
  sourceBucket: string
  targetBucket: string
  manifest: { originals: readonly DrillMediaObject[]; renditions: readonly string[] }
  evidence: RestoreDrillEvidence
}): Promise<void> {
  const { source, target, sourceBucket, targetBucket, manifest, evidence } = input
  const known = new Set([...manifest.originals.map(({ key }) => key), ...manifest.renditions])
  const sourceKeys = new Set(await listObjectKeys(source, sourceBucket))
  for (const key of sourceKeys) {
    if (!known.has(key))
      evidence.failures.push({ code: 'orphaned_object', stage: 'backup', subject: hash(key) })
  }
  const from = new S3OriginalObjectStore(source, sourceBucket)
  const to = new S3OriginalObjectStore(target, targetBucket)
  for (const object of manifest.originals) {
    const subject = hash(object.key)
    if (!sourceKeys.has(object.key)) {
      evidence.failures.push({ code: 'missing_object', stage: 'backup', subject })
      continue
    }
    let body: Uint8Array
    try {
      body = await from.getOriginal(object.key, AbortSignal.timeout(60_000))
    } catch (error) {
      if (!missing(error)) throw error
      evidence.failures.push({ code: 'missing_object', stage: 'backup', subject })
      continue
    }
    if (hash(body) !== object.sha256 || body.byteLength !== object.bytes) {
      evidence.failures.push({ code: 'checksum_mismatch', stage: 'backup', subject })
      continue
    }
    await to.putOriginal({ ...object, body }, AbortSignal.timeout(60_000))
    evidence.media.copied += 1
  }
}

export async function verifyOriginals(
  client: S3Client,
  bucket: string,
  manifest: readonly DrillMediaObject[],
  evidence: RestoreDrillEvidence,
): Promise<void> {
  const keys = new Set(await listObjectKeys(client, bucket))
  const expected = new Set(manifest.map(({ key }) => key))
  for (const key of keys) {
    if (!expected.has(key))
      evidence.failures.push({ code: 'orphaned_object', stage: 'comparison', subject: hash(key) })
  }
  const store = new S3OriginalObjectStore(client, bucket)
  for (const object of manifest) {
    const subject = hash(object.key)
    const entry = {
      identitySha256: subject,
      expectedSha256: object.sha256,
      restoredSha256: null as string | null,
      bytes: object.bytes,
    }
    evidence.media.objects.push(entry)
    try {
      if (!keys.has(object.key)) {
        evidence.failures.push({ code: 'missing_object', stage: 'comparison', subject })
        continue
      }
      const body = await store.getOriginal(object.key, AbortSignal.timeout(60_000))
      entry.restoredSha256 = hash(body)
      if (entry.restoredSha256 !== object.sha256 || body.byteLength !== object.bytes) {
        evidence.failures.push({ code: 'checksum_mismatch', stage: 'comparison', subject })
      } else evidence.media.verified += 1
    } catch (error) {
      if (!missing(error)) throw error
      evidence.failures.push({ code: 'missing_object', stage: 'comparison', subject })
    }
  }
}
