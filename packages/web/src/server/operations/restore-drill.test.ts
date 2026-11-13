import { describe, expect, it, vi } from 'vitest'

import {
  fingerprint,
  hash,
  measureRecovery,
  newDrillEvidence,
  recoveryTargets,
  restoreDrillConfig,
} from './restore-drill-contract'
import { compareTables, postgres18Version, requireMigrationPrefix } from './restore-drill-postgres'
import { runRestoreDrill } from './restore-drill'

function configuration() {
  const objects = {
    endpoint: 'http://127.0.0.1:27042',
    region: 'us-east-1',
    accessKeyId: 'local-fixture',
    secretAccessKey: Array.from({ length: 16 }, () => 'x').join(''),
  }
  return {
    isolated: true,
    source: {
      databaseUrl: 'postgresql://fixture@127.0.0.1:25442/restore_drill_source_fixture',
      objects: { ...objects, bucket: 'restore-drill-source-fixture' },
    },
    target: {
      databaseUrl: 'postgresql://fixture@127.0.0.1:25442/restore_drill_target_fixture',
      objects: { ...objects, bucket: 'restore-drill-target-fixture' },
    },
  }
}

describe('isolated restore drill boundary', () => {
  it('accepts dedicated local sources and targets without adding application environment variables', () => {
    expect(restoreDrillConfig.safeParse(configuration()).success).toBe(true)
  })

  it.each([
    'postgresql://fixture@db.example.test/restore_drill_source_fixture',
    'postgresql://fixture@localhost/restore_drill_source_fixture',
    'postgresql://fixture@127.0.0.1/production',
    'postgresql://fixture@127.0.0.1/restore_drill_source_fixture?host=db.example.test',
    'postgresql://fixture@127.0.0.1/restore_drill_source_fixture#extra',
    'postgresql://127.0.0.1/restore_drill_source_fixture',
  ])('rejects non-isolated database configuration before connecting: %s', async (databaseUrl) => {
    const config = configuration()
    config.source.databaseUrl = databaseUrl
    const tools = vi.fn()
    const evidence = await runRestoreDrill(config, { tools })
    expect(evidence.status).toBe('failed')
    expect(evidence.failures).toEqual([{ code: 'invalid_configuration', stage: 'configuration' }])
    expect(tools).not.toHaveBeenCalled()
    expect(JSON.stringify(evidence)).not.toContain(databaseUrl)
  })

  it('rejects remote object stores, URL credentials, shared buckets, unknown fields and absent isolation acknowledgement', () => {
    for (const endpoint of [
      'https://s3.example.test',
      'http://local:credential@127.0.0.1',
      'http://127.0.0.1/private',
      'http://127.0.0.1?target=remote',
    ]) {
      const config = configuration()
      config.target.objects.endpoint = endpoint
      expect(restoreDrillConfig.safeParse(config).success).toBe(false)
    }
    const config = configuration()
    expect(restoreDrillConfig.safeParse({ ...config, isolated: false }).success).toBe(false)
    expect(restoreDrillConfig.safeParse({ ...config, extra: true }).success).toBe(false)
    config.target.objects.bucket = config.source.objects.bucket
    expect(restoreDrillConfig.safeParse(config).success).toBe(false)
  })

  it('compares every table, including subscribers, consent, revisions and audit state without returning row payloads', () => {
    const names = [
      'articles',
      'article_revisions',
      'slug_redirects',
      'publishing_jobs',
      'subscribers',
      'subscriber_consents',
      'audit_events',
    ]
    const source = Object.fromEntries(names.map((name) => [name, { count: 2, sha256: hash(name) }]))
    expect(compareTables(source, structuredClone(source))).toEqual([])
    for (const subject of names) {
      const missing = structuredClone(source)
      missing[subject]!.count -= 1
      expect(compareTables(source, missing)).toEqual([
        { code: 'row_count_mismatch', stage: 'comparison', subject },
      ])
      const changed = structuredClone(source)
      changed[subject]!.sha256 = hash('changed')
      expect(compareTables(source, changed)).toEqual([
        { code: 'invariant_changed', stage: 'comparison', subject },
      ])
    }
    expect(compareTables(source, {})).toHaveLength(names.length)
    expect(compareTables({}, source)).toHaveLength(names.length)
  })

  it('requires a gap-free, known and checksum-identical migration prefix', () => {
    const reviewed = ['0001_base', '0002_more', '0003_latest'].map((id) => ({
      id,
      sql: id,
      checksum: hash(id),
    }))
    expect(() => requireMigrationPrefix(reviewed.slice(0, 2), reviewed)).not.toThrow()
    for (const actual of [
      [],
      reviewed.slice(1),
      [reviewed[0]!, reviewed[2]!],
      [{ ...reviewed[0]!, checksum: hash('changed') }],
      [...reviewed, { id: 'unknown', checksum: hash('unknown') }],
    ]) {
      expect(() => requireMigrationPrefix(actual, reviewed)).toThrow('migration_identity_mismatch')
    }
  })

  it('accepts only PostgreSQL 18 tool/server versions and never emits arbitrary version output', () => {
    expect(postgres18Version('pg_dump (PostgreSQL) 18.4 (Debian build)\n')).toBe('18.4')
    expect(postgres18Version('18.4')).toBe('18.4')
    for (const value of [
      '17.9',
      'pg_restore (PostgreSQL) 17.9',
      'driver error with private input',
    ]) {
      expect(() => postgres18Version(value)).toThrow('unsupported_version')
    }
  })

  it('measures snapshot age at recovery completion, not the timestamp of the newest article', () => {
    const evidence = newDrillEvidence(new Date('2026-11-13T10:00:00Z'))
    evidence.snapshotAt = '2026-11-13T10:00:01.000Z'
    measureRecovery(evidence, new Date('2026-11-13T10:10:01Z'), 500_000.1)
    expect(evidence.recovery).toEqual({
      rpoMilliseconds: 600_000,
      rtoMilliseconds: 500_001,
      rpoMet: true,
      rtoMet: true,
      targets: recoveryTargets,
    })
    expect(evidence.failures).toEqual([])
    expect(fingerprint({ b: 1, a: 2 })).toBe(fingerprint({ a: 2, b: 1 }))
  })

  it('fails stale recovery, excessive restore time and backwards clocks without manufacturing a passing measurement', () => {
    const evidence = newDrillEvidence(new Date('2026-11-13T10:00:00Z'))
    evidence.snapshotAt = evidence.startedAt
    measureRecovery(evidence, new Date('2026-11-14T10:00:01Z'), recoveryTargets.rtoMilliseconds + 1)
    expect(evidence.failures.map(({ code }) => code)).toEqual(['rpo_exceeded', 'rto_exceeded'])
    expect(evidence.recovery.rpoMet).toBe(false)
    expect(evidence.recovery.rtoMet).toBe(false)
    const backwards = newDrillEvidence(new Date('2026-11-13T10:00:00Z'))
    backwards.snapshotAt = backwards.startedAt
    measureRecovery(backwards, new Date('2026-11-13T09:59:59Z'), -1)
    expect(backwards.failures).toEqual([{ code: 'invalid_clock', stage: 'comparison' }])
    expect(backwards.recovery.rpoMilliseconds).toBeNull()
    expect(backwards.recovery.rtoMilliseconds).toBeNull()
  })
})
