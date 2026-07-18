import { describe, expect, it } from 'vitest'

import { buildLogicalBackupPlan, buildLogicalRestorePlan, verifyRestoredContent } from './backup'
import { InMemoryContentRepository } from './in-memory-repository'
import { createPortableContentBundle } from './portability'

describe('backup and restore contract', () => {
  it('uses standard PostgreSQL tools without placing credentials in command arguments', () => {
    expect(buildLogicalBackupPlan('/tmp/magazine.backup')).toEqual({
      args: ['--format=custom', '--no-owner', '--no-privileges', '--file', '/tmp/magazine.backup'],
      command: 'pg_dump',
      databaseUrlEnvironmentKey: 'DATABASE_URL',
    })
    expect(buildLogicalRestorePlan('/tmp/magazine.backup')).toEqual({
      args: ['--exit-on-error', '--no-owner', '--no-privileges', '/tmp/magazine.backup'],
      command: 'pg_restore',
      databaseUrlEnvironmentKey: 'DATABASE_URL',
    })
    expect(() => buildLogicalBackupPlan('relative.dump')).toThrow(/absolute path/)
  })

  it('requires byte-equivalent portable data and verified media for a passing restore', async () => {
    const empty = new InMemoryContentRepository()
    const expected = await createPortableContentBundle(empty, '2026-07-17T22:45:00.000Z')
    const restored = await createPortableContentBundle(empty, '2026-07-17T23:00:00.000Z')

    expect(verifyRestoredContent({ expected, failedMedia: [], restored })).toMatchObject({
      status: 'passed',
    })
    expect(
      verifyRestoredContent({ expected, failedMedia: ['originals/missing'], restored }),
    ).toMatchObject({ status: 'failed' })

    const drifted = structuredClone(restored)
    ;(drifted.data as unknown as { authors: unknown[] }).authors.push({ id: 'unexpected' })
    expect(verifyRestoredContent({ expected, failedMedia: [], restored: drifted })).toMatchObject({
      status: 'failed',
    })
  })
})
