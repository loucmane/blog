import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { newDrillEvidence } from '../src/server/operations/restore-drill-contract'
import { runRestoreDrill } from '../src/server/operations/restore-drill'
import { runRestoreDrillCommand } from './restore-drill.mjs'

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

describe('restore drill command', () => {
  it('writes private evidence and exits zero only for a passed drill', async () => {
    const filename = await evidencePath()
    const result = newDrillEvidence()
    result.status = 'passed'
    const output = vi.fn()
    const drill = vi.fn(async () => result)
    expect(
      await runRestoreDrillCommand({
        args: ['--evidence', filename],
        input: async () => ({ isolated: true }),
        drill,
        output,
      }),
    ).toBe(0)
    expect(drill).toHaveBeenCalledWith({ isolated: true })
    expect(JSON.parse(await readFile(filename, 'utf8'))).toEqual(result)
    expect((await stat(filename)).mode & 0o777).toBe(0o600)
    expect(output).toHaveBeenCalledWith('Restore drill passed. Evidence recorded.')
  })

  it('persists real invalid-configuration evidence with nonzero exit and no raw input', async () => {
    const filename = await evidencePath()
    const privateInput = ['fixture', 'private', 'value'].join('-')
    expect(
      await runRestoreDrillCommand({
        args: ['--evidence', filename],
        input: async () => privateInput,
        drill: runRestoreDrill,
        output: vi.fn(),
      }),
    ).toBe(1)
    const written = await readFile(filename, 'utf8')
    expect(JSON.parse(written).failures).toEqual([
      { code: 'invalid_configuration', stage: 'configuration' },
    ])
    expect(written).not.toContain(privateInput)
  })

  it('never runs a drill when its evidence file already exists or cannot be opened', async () => {
    const filename = await evidencePath()
    await writeFile(filename, 'earlier evidence')
    const drill = vi.fn()
    for (const destination of [filename, path.join(filename, 'impossible.json')]) {
      expect(
        await runRestoreDrillCommand({ args: ['--evidence', destination], drill, error: vi.fn() }),
      ).toBe(1)
    }
    expect(drill).not.toHaveBeenCalled()
    expect(await readFile(filename, 'utf8')).toBe('earlier evidence')
  })

  it('keeps dependency errors out of output and refuses invalid arguments', async () => {
    const filename = await evidencePath()
    const error = vi.fn()
    const sensitive = ['private', 'connection', 'detail'].join('-')
    const drill = vi.fn(async () => {
      throw new Error(sensitive)
    })
    expect(
      await runRestoreDrillCommand({
        args: ['--evidence', filename],
        input: async () => ({}),
        drill,
        error,
      }),
    ).toBe(1)
    expect(JSON.stringify(error.mock.calls)).not.toContain(sensitive)
    for (const args of [[], ['--evidence', 'relative.json'], ['--evidence', filename, '--force']]) {
      expect(await runRestoreDrillCommand({ args, drill, error })).toBe(1)
    }
    const output = vi.fn()
    expect(await runRestoreDrillCommand({ args: ['--help'], output })).toBe(0)
    expect(output).toHaveBeenCalledWith(expect.stringContaining('Usage:'))
  })
})
