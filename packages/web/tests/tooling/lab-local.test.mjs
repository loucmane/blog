import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  canReuseBuild,
  localLabConfiguration,
  sourceFingerprint,
  waitForLocalServer,
} from '../../scripts/lab-local.mjs'

const temporary = []
afterEach(async () => {
  await Promise.all(temporary.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

describe('local Reader Lab launcher', () => {
  it('uses the existing loopback fixture values and disables owner test mode while building', () => {
    const { url, runtime, build } = localLabConfiguration({})
    expect(url.origin).toBe('http://localhost:3100')
    expect(runtime).toMatchObject({
      NODE_ENV: 'test',
      MAGAZINE_OWNER_TEST_MODE: '1',
      HOSTNAME: '127.0.0.1',
      MAGAZINE_LAB_SEED_URL: url.origin,
    })
    expect(build.NODE_ENV).toBe('production')
    expect(build.MAGAZINE_OWNER_TEST_MODE).toBeUndefined()
    expect(build.MAGAZINE_OWNER_TEST_TOKEN).toBeUndefined()
  })

  it.each([
    { NODE_ENV: 'production' },
    { LAB_LOCAL_URL: 'https://example.com' },
    { MAGAZINE_RUNTIME_SITE_URL: 'http://0.0.0.0:3100' },
    { BETTER_AUTH_URL: 'http://localhost.example.com:3100' },
    { MAGAZINE_LAB_SEED_URL: 'http://example.com' },
    { LAB_LOCAL_URL: 'http://user:password@localhost:3100' },
    { LAB_LOCAL_URL: 'http://localhost:3100/remote' },
    { LAB_LOCAL_URL: 'http://localhost:3100?url=remote' },
    { LAB_LOCAL_URL: 'http://localhost:3100#remote' },
    { LAB_LOCAL_URL: 'http://localhost:3100', BETTER_AUTH_URL: 'http://127.0.0.1:3100' },
  ])('refuses unsafe or inconsistent invocation: %j', (environment) => {
    expect(() => localLabConfiguration(environment)).toThrow()
  })

  it('reuses only a matching source fingerprint and build ID, and notices edits and deletions', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'reader-lab-local-'))
    temporary.push(root)
    const web = path.join(root, 'packages/web')
    await mkdir(path.join(web, 'src'), { recursive: true })
    await mkdir(path.join(web, '.next'))
    const source = path.join(web, 'src/example.ts')
    await writeFile(source, 'first')
    const fingerprint = await sourceFingerprint(web)
    expect(await canReuseBuild(fingerprint, web)).toBe(false)
    await writeFile(path.join(web, '.next/BUILD_ID'), 'build-one')
    await writeFile(
      path.join(web, '.next/lab-local.json'),
      JSON.stringify({ fingerprint, buildId: 'build-one' }),
    )
    expect(await canReuseBuild(fingerprint, web)).toBe(true)
    await writeFile(source, 'second')
    expect(await canReuseBuild(await sourceFingerprint(web), web)).toBe(false)
    await rm(source)
    expect(await sourceFingerprint(web)).not.toBe(fingerprint)
    await writeFile(path.join(web, '.next/BUILD_ID'), 'another-build')
    expect(await canReuseBuild(fingerprint, web)).toBe(false)
  })

  it('waits through connection failures and non-200s before accepting the sign-in page', async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error('Connection refused'))
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(new Response('Ready'))
    const pause = vi.fn()
    await waitForLocalServer(new URL('http://localhost:3100'), {
      signal: new AbortController().signal,
      exited: () => false,
      fetcher,
      pause,
    })
    expect(fetcher).toHaveBeenCalledTimes(3)
    expect(fetcher.mock.calls[0][0].href).toBe('http://localhost:3100/owner/sign-in')
    expect(pause).toHaveBeenCalledTimes(2)
  })

  it('refuses to use another server after its own process exits, and respects cancellation', async () => {
    const abort = new AbortController()
    const fetcher = vi.fn()
    await expect(
      waitForLocalServer(new URL('http://localhost:3100'), {
        signal: abort.signal,
        exited: () => true,
        fetcher,
      }),
    ).rejects.toThrow('stopped')
    expect(fetcher).not.toHaveBeenCalled()
    abort.abort()
    await expect(
      waitForLocalServer(new URL('http://localhost:3100'), {
        signal: abort.signal,
        exited: () => false,
        fetcher,
      }),
    ).rejects.toThrow()
  })
})
