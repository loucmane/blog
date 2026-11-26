import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { newDrillEvidence } from '../src/server/operations/restore-drill-contract'
import { runRestoreDrill } from '../src/server/operations/restore-drill'
import { notRecordedExitCode, runRestoreDrillCommand } from './restore-drill.mjs'

const directories = []
async function evidencePath() {
  const parent = path.resolve('ci-artifacts/tmp')
  await mkdir(parent, { recursive: true })
  const directory = await mkdtemp(path.join(parent, 'restore-drill-cli-'))
  directories.push(directory)
  return path.join(directory, 'evidence.json')
}
afterEach(async () => {
  for (const directory of directories.splice(0))
    await rm(directory, { recursive: true, force: true })
})

/** Evidence of a drill that passed and measured both recovery targets. */
function passedEvidence() {
  const evidence = newDrillEvidence(new Date('2026-11-23T10:00:00.000Z'))
  evidence.status = 'passed'
  evidence.completedAt = '2026-11-23T10:12:00.000Z'
  evidence.recovery.rpoMilliseconds = 3_600_000
  evidence.recovery.rtoMilliseconds = 600_000
  evidence.recovery.rpoMet = true
  evidence.recovery.rtoMet = true
  return evidence
}

const finishedAt = new Date('2026-11-23T10:13:00.000Z')

describe('restore drill command', () => {
  it('writes private evidence, records the run and exits zero only for a passed drill', async () => {
    const filename = await evidencePath()
    const result = passedEvidence()
    const output = vi.fn()
    const record = vi.fn(async () => undefined)
    const drill = vi.fn(async () => result)
    const environment = { DATABASE_URL: 'synthetic-placeholder' }
    expect(
      await runRestoreDrillCommand({
        args: ['--evidence', filename],
        environment,
        input: async () => ({ isolated: true }),
        drill,
        record,
        output,
      }),
    ).toBe(0)
    expect(drill).toHaveBeenCalledWith({ isolated: true })
    expect(JSON.parse(await readFile(filename, 'utf8'))).toEqual(result)
    expect((await stat(filename)).mode & 0o777).toBe(0o600)
    expect(output).toHaveBeenCalledWith('Restore drill passed. Evidence recorded.')
    expect(record).toHaveBeenCalledExactlyOnceWith(
      {
        failureReason: null,
        finishedAt: '2026-11-23T10:12:00.000Z',
        kind: 'restore-drill',
        outcome: 'succeeded',
        rpoMs: 3_600_000,
        rtoMs: 600_000,
        startedAt: '2026-11-23T10:00:00.000Z',
      },
      environment,
    )
  })

  it('persists and records real invalid-configuration evidence with nonzero exit and no raw input', async () => {
    const filename = await evidencePath()
    const privateInput = ['fixture', 'private', 'value'].join('-')
    const record = vi.fn(async () => undefined)
    expect(
      await runRestoreDrillCommand({
        args: ['--evidence', filename],
        input: async () => privateInput,
        drill: runRestoreDrill,
        record,
        output: vi.fn(),
      }),
    ).toBe(1)
    const written = await readFile(filename, 'utf8')
    expect(JSON.parse(written).failures).toEqual([
      { code: 'invalid_configuration', stage: 'configuration' },
    ])
    expect(written).not.toContain(privateInput)
    expect(record.mock.calls[0][0]).toMatchObject({
      failureReason: 'invalid_configuration',
      kind: 'restore-drill',
      outcome: 'failed',
      rpoMs: null,
      rtoMs: null,
    })
    expect(JSON.stringify(record.mock.calls)).not.toContain(privateInput)
  })

  it('never runs or records a drill when its evidence file already exists or cannot be opened', async () => {
    const filename = await evidencePath()
    await writeFile(filename, 'earlier evidence')
    const drill = vi.fn()
    const record = vi.fn()
    for (const destination of [filename, path.join(filename, 'impossible.json')]) {
      expect(
        await runRestoreDrillCommand({
          args: ['--evidence', destination],
          drill,
          record,
          error: vi.fn(),
        }),
      ).toBe(1)
    }
    expect(drill).not.toHaveBeenCalled()
    expect(record).not.toHaveBeenCalled()
    expect(await readFile(filename, 'utf8')).toBe('earlier evidence')
  })

  it('keeps dependency errors out of output, records the failed run and refuses invalid arguments', async () => {
    const filename = await evidencePath()
    const error = vi.fn()
    const record = vi.fn(async () => undefined)
    const sensitive = ['private', 'connection', 'detail'].join('-')
    const drill = vi.fn(async () => {
      throw new Error(sensitive)
    })
    const started = new Date('2026-11-23T10:00:00.000Z')
    expect(
      await runRestoreDrillCommand({
        args: ['--evidence', filename],
        input: async () => ({}),
        drill,
        record,
        error,
        now: vi.fn().mockReturnValueOnce(started).mockReturnValue(finishedAt),
      }),
    ).toBe(1)
    expect(JSON.stringify(error.mock.calls)).not.toContain(sensitive)
    expect(record).toHaveBeenCalledExactlyOnceWith(
      {
        failureReason: 'operation_failed',
        finishedAt: finishedAt.toISOString(),
        kind: 'restore-drill',
        outcome: 'failed',
        rpoMs: null,
        rtoMs: null,
        startedAt: started.toISOString(),
      },
      expect.anything(),
    )
    for (const args of [[], ['--evidence', 'relative.json'], ['--evidence', filename, '--force']]) {
      expect(await runRestoreDrillCommand({ args, drill, record, error })).toBe(1)
    }
    expect(record).toHaveBeenCalledOnce()
    const output = vi.fn()
    expect(await runRestoreDrillCommand({ args: ['--help'], output })).toBe(0)
    expect(output).toHaveBeenCalledWith(expect.stringContaining('Usage:'))
  })

  it('keeps the evidence of a passed drill but exits 3 when its run cannot be recorded', async () => {
    const filename = await evidencePath()
    const error = vi.fn()
    expect(
      await runRestoreDrillCommand({
        args: ['--evidence', filename],
        // The default recorder refuses before connecting: no DATABASE_URL is configured.
        environment: {},
        input: async () => ({ isolated: true }),
        drill: async () => passedEvidence(),
        error,
        output: vi.fn(),
      }),
    ).toBe(notRecordedExitCode)
    expect(error).toHaveBeenCalledExactlyOnceWith(
      'Restore drill evidence was kept, but the run was not recorded in the application database (not_configured). Health reports the previous drill until a run is recorded.',
    )
    expect(JSON.parse(await readFile(filename, 'utf8')).status).toBe('passed')

    const failedFile = await evidencePath()
    const failed = newDrillEvidence()
    failed.failures.push({ code: 'export_invalid', stage: 'export' })
    const failing = vi.fn()
    expect(
      await runRestoreDrillCommand({
        args: ['--evidence', failedFile],
        input: async () => ({ isolated: true }),
        drill: async () => failed,
        record: async () => {
          throw new Error(['private', 'driver', 'text'].join('-'))
        },
        error: failing,
        output: vi.fn(),
      }),
    ).toBe(1)
    expect(failing).toHaveBeenCalledExactlyOnceWith(
      'The failed restore drill was not recorded in the application database either (operation_failed).',
    )
  })
})
