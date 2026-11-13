import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  type S3Client,
} from '@aws-sdk/client-s3'
import { describe, expect, it, vi } from 'vitest'

import { hash, newDrillEvidence } from './restore-drill-contract'
import {
  copyOriginals,
  createFreshBucket,
  listObjectKeys,
  verifyOriginals,
} from './restore-drill-media'

function objectStore(initial: Record<string, string> = {}) {
  const objects = new Map<string, Uint8Array>(
    Object.entries(initial).map(([key, value]) => [key, new TextEncoder().encode(value)]),
  )
  const send = vi.fn(async (command: unknown) => {
    if (command instanceof ListObjectsV2Command)
      return { Contents: [...objects.keys()].sort().map((Key) => ({ Key })), IsTruncated: false }
    if (command instanceof GetObjectCommand) {
      const body = objects.get(command.input.Key!)
      if (!body) throw { $metadata: { httpStatusCode: 404 } }
      return { Body: { transformToByteArray: async () => body } }
    }
    if (command instanceof PutObjectCommand) {
      objects.set(command.input.Key!, command.input.Body as Uint8Array)
      return {}
    }
    throw new Error('Unexpected fixture command')
  })
  return { client: { send } as unknown as S3Client, objects, send }
}

const originalBody = new TextEncoder().encode('fixture')
const original = {
  key: 'private-original-key',
  sha256: hash(originalBody),
  bytes: originalBody.length,
  contentType: 'image/png',
}

describe('restore drill media verification', () => {
  it('copies originals, recognizes rebuildable renditions and verifies downloaded target bytes', async () => {
    const source = objectStore({ [original.key]: 'fixture', 'derived-key': 'derived' })
    const target = objectStore()
    const evidence = newDrillEvidence()
    await copyOriginals({
      source: source.client,
      target: target.client,
      sourceBucket: 'source',
      targetBucket: 'target',
      manifest: { originals: [original], renditions: ['derived-key'] },
      evidence,
    })
    expect([...target.objects.keys()]).toEqual([original.key])
    await verifyOriginals(target.client, 'target', [original], evidence)
    expect(evidence.failures).toEqual([])
    expect(evidence.media).toMatchObject({
      copied: 1,
      verified: 1,
      objects: [
        {
          identitySha256: hash(original.key),
          expectedSha256: original.sha256,
          restoredSha256: original.sha256,
        },
      ],
    })
    expect(JSON.stringify(evidence)).not.toContain(original.key)
  })

  it('reports source orphan, missing original and corrupt bytes without copying unverifiable data', async () => {
    const source = objectStore({ orphan: 'orphan', [original.key]: 'corrupt' })
    const target = objectStore()
    const evidence = newDrillEvidence()
    const absent = { ...original, key: 'absent-original' }
    await copyOriginals({
      source: source.client,
      target: target.client,
      sourceBucket: 'source',
      targetBucket: 'target',
      manifest: { originals: [original, absent], renditions: [] },
      evidence,
    })
    expect(evidence.failures).toEqual(
      expect.arrayContaining([
        { code: 'orphaned_object', stage: 'backup', subject: hash('orphan') },
        { code: 'missing_object', stage: 'backup', subject: hash(absent.key) },
        { code: 'checksum_mismatch', stage: 'backup', subject: hash(original.key) },
      ]),
    )
    expect(target.objects.size).toBe(0)
  })

  it('independently detects missing, orphaned and corrupt target objects and size drift', async () => {
    for (const contents of [
      { orphan: 'orphan' },
      { [original.key]: 'corrupt', orphan: 'orphan' },
    ]) {
      const target = objectStore(contents)
      const evidence = newDrillEvidence()
      await verifyOriginals(target.client, 'target', [original], evidence)
      expect(evidence.failures.map(({ code }) => code)).toEqual([
        'orphaned_object',
        original.key in contents ? 'checksum_mismatch' : 'missing_object',
      ])
      expect(evidence.media.verified).toBe(0)
      expect(JSON.stringify(evidence)).not.toContain(original.key)
    }
    const evidence = newDrillEvidence()
    await verifyOriginals(
      objectStore({ [original.key]: 'fixture' }).client,
      'target',
      [{ ...original, bytes: 100 }],
      evidence,
    )
    expect(evidence.failures[0]?.code).toBe('checksum_mismatch')
  })

  it('reads all inventory pages and refuses incomplete or looping pagination', async () => {
    const send = vi
      .fn()
      .mockResolvedValueOnce({
        Contents: [{ Key: 'a' }],
        IsTruncated: true,
        NextContinuationToken: 'second',
      })
      .mockResolvedValueOnce({ Contents: [{ Key: 'b' }], IsTruncated: false })
    expect(await listObjectKeys({ send } as unknown as S3Client, 'bucket')).toEqual(['a', 'b'])
    expect(send.mock.calls[1]![0].input.ContinuationToken).toBe('second')
    for (const page of [
      { IsTruncated: true },
      { IsTruncated: true, NextContinuationToken: 'same' },
      { Contents: [{}] },
    ]) {
      const broken = { send: vi.fn().mockResolvedValue(page) } as unknown as S3Client
      await expect(listObjectKeys(broken, 'bucket')).rejects.toThrow('operation_failed')
    }
  })

  it('creates only absent buckets and treats access-denied responses as errors', async () => {
    const existing = { send: vi.fn().mockResolvedValue({}) }
    await expect(createFreshBucket(existing as unknown as S3Client, 'bucket')).rejects.toThrow(
      'target_exists',
    )
    expect(existing.send).toHaveBeenCalledTimes(1)
    expect(existing.send.mock.calls[0]![0]).toBeInstanceOf(HeadBucketCommand)
    const absent = {
      send: vi
        .fn()
        .mockRejectedValueOnce({ $metadata: { httpStatusCode: 404 } })
        .mockResolvedValue({}),
    }
    await createFreshBucket(absent as unknown as S3Client, 'bucket')
    expect(absent.send.mock.calls[1]![0]).toBeInstanceOf(CreateBucketCommand)
    const denied = { send: vi.fn().mockRejectedValue({ $metadata: { httpStatusCode: 403 } }) }
    await expect(createFreshBucket(denied as unknown as S3Client, 'bucket')).rejects.toMatchObject({
      $metadata: { httpStatusCode: 403 },
    })
    expect(denied.send).toHaveBeenCalledTimes(1)
  })
})
