import { spawn, type ChildProcess, type SpawnOptions } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'

import { describe, expect, it, vi } from 'vitest'

import { runPostgresTool } from './restore-drill-postgres'

vi.mock('node:child_process', () => ({ spawn: vi.fn() }))

function processFixture() {
  const child = Object.assign(new EventEmitter(), {
    stdin: new PassThrough(),
    stdout: new PassThrough(),
    kill: vi.fn(),
  })
  const mockSpawn = vi.mocked(spawn).mockReturnValue(child as unknown as ChildProcess)
  return { child, spawn: mockSpawn }
}

describe('restore drill PostgreSQL subprocess boundary', () => {
  it('passes a bounded archive on stdin with credentials only in an isolated child environment', async () => {
    const { child, spawn } = processFixture()
    const password = randomUUID()
    const url = new URL('postgresql://drill@127.0.0.1:25442/restore_drill_target_fixture')
    url.password = password
    const input = Buffer.from('synthetic custom archive')
    const received: Buffer[] = []
    child.stdin.on('data', (chunk: Buffer) => received.push(chunk))
    const args = ['--exit-on-error', '--dbname', 'restore_drill_target_fixture']
    const result = runPostgresTool('pg_restore', args, url.href, input)
    child.emit('close', 0)
    await expect(result).resolves.toEqual(Buffer.alloc(0))
    expect(Buffer.concat(received)).toEqual(input)
    const invocation = spawn.mock.calls[0]!
    expect(invocation.slice(0, 2)).toEqual(['pg_restore', args])
    const options = invocation[2] as SpawnOptions
    expect(options).toMatchObject({ stdio: ['pipe', 'pipe', 'ignore'], timeout: 900_000 })
    expect(options.shell).toBeUndefined()
    expect(options.env).toEqual({
      PATH: process.env.PATH,
      LANG: 'C',
      PGHOST: '127.0.0.1',
      PGPORT: '25442',
      PGDATABASE: 'restore_drill_target_fixture',
      PGUSER: 'drill',
      PGPASSWORD: password,
      PGSSLMODE: 'disable',
      PGCONNECT_TIMEOUT: '10',
    })
    expect(JSON.stringify(args)).not.toContain(password)
  })

  it('returns binary dump output without string conversion', async () => {
    const { child } = processFixture()
    const result = runPostgresTool('pg_dump', ['--format=custom'])
    const archive = Buffer.from([0, 255, 128, 1])
    child.stdout.write(archive)
    child.emit('close', 0)
    await expect(result).resolves.toEqual(archive)
  })

  it('returns fixed errors for spawn, input and exit failures without driver text', async () => {
    for (const failure of ['spawn', 'stdin', 'exit']) {
      const { child, spawn } = processFixture()
      const result = runPostgresTool('pg_dump', ['--format=custom'])
      const rejection = expect(result).rejects.toThrow(/^operation_failed$/)
      if (failure === 'spawn') child.emit('error', new Error(randomUUID()))
      else if (failure === 'stdin') child.stdin.emit('error', new Error(randomUUID()))
      else child.emit('close', 1)
      await rejection
      spawn.mockRestore()
    }
  })
})
