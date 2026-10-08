import { describe, expect, it, vi } from 'vitest'

import { runLabSeed } from '../../scripts/lab-seed.mjs'
import { refusedLabSeedEnvironments } from '../support/lab-seed-environments'

const token = 'fixture-lab-seed-command-'.padEnd(48, 'x')
const preview = {
  NODE_ENV: 'production',
  MAGAZINE_DEPLOYMENT_ENVIRONMENT: 'preview',
  MAGAZINE_LAB_SEED_URL: 'https://preview.example.invalid',
  MAGAZINE_LAB_SEED_TOKEN: token,
}

describe('one-shot lab seed command', () => {
  it('reports a busy seed without retrying or echoing the response body', async () => {
    const fetcher = vi.fn(async () => new Response(token, { status: 409 }))
    await expect(runLabSeed({ environment: preview, fetcher })).rejects.toThrow(
      'The lab seed is already running. Try again shortly.',
    )
    expect(fetcher).toHaveBeenCalledOnce()
  })
  it('posts once to the hosted URL with a bearer token, bounded timeout and no redirects', async () => {
    const report = { stories: { created: ['fixture-story'] } }
    const fetcher = vi.fn(async () => Response.json(report))
    expect(await runLabSeed({ environment: preview, fetcher })).toEqual(report)
    expect(fetcher).toHaveBeenCalledOnce()
    const [url, options] = fetcher.mock.calls[0]
    expect(url.href).toBe('https://preview.example.invalid/api/internal/lab-seed')
    expect(options).toMatchObject({
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      redirect: 'error',
    })
    expect(options.signal).toBeInstanceOf(AbortSignal)
    expect(options.signal.aborted).toBe(false)
  })

  it.each(refusedLabSeedEnvironments)(
    'refuses $name before sending credentials',
    async ({ environment }) => {
      const fetcher = vi.fn()
      await expect(
        runLabSeed({ environment: { MAGAZINE_LAB_SEED_TOKEN: token, ...environment }, fetcher }),
      ).rejects.toThrow('refuses production')
      expect(fetcher).not.toHaveBeenCalled()
    },
  )

  it.each([undefined, '', 'short', 'x'.repeat(513), 'é'.repeat(257), `${token} space`])(
    'refuses invalid seed tokens (%#)',
    async (value) => {
      const fetcher = vi.fn()
      await expect(
        runLabSeed({ environment: { ...preview, MAGAZINE_LAB_SEED_TOKEN: value }, fetcher }),
      ).rejects.toThrow('MAGAZINE_LAB_SEED_TOKEN')
      expect(fetcher).not.toHaveBeenCalled()
    },
  )

  it.each([
    'not-a-url',
    '',
    'ftp://preview.example.invalid',
    'http://preview.example.invalid',
    'https://USER:PASSWORD@preview.example.invalid',
    'https://preview.example.invalid/path',
    'https://preview.example.invalid/?token=fixture',
    'https://preview.example.invalid/#fixture',
    'http://localhost.example.invalid',
    'http://0.0.0.0:3000',
  ])('refuses unsafe origins (%#)', async (url) => {
    const fetcher = vi.fn()
    await expect(
      runLabSeed({ environment: { ...preview, MAGAZINE_LAB_SEED_URL: url }, fetcher }),
    ).rejects.toThrow()
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('requires explicit Preview intent for a remote target even from a local shell', async () => {
    const fetcher = vi.fn()
    await expect(
      runLabSeed({
        environment: {
          MAGAZINE_LAB_SEED_TOKEN: token,
          MAGAZINE_LAB_SEED_URL: preview.MAGAZINE_LAB_SEED_URL,
        },
        fetcher,
      }),
    ).rejects.toThrow('remote lab seed')
    expect(fetcher).not.toHaveBeenCalled()
  })

  it.each([undefined, 'http://127.0.0.1:3100', 'http://[::1]:3100'])(
    'preserves local invocation and runtime URL fallback (%#)',
    async (url) => {
      const fetcher = vi.fn(async () => Response.json({ stories: {} }))
      await runLabSeed({
        environment: { MAGAZINE_LAB_SEED_TOKEN: token, MAGAZINE_RUNTIME_SITE_URL: url },
        fetcher,
      })
      expect(fetcher.mock.calls[0][0].origin).toBe(url ?? 'http://localhost:3000')
    },
  )

  it.each([301, 302, 307, 308, 404, 503])(
    'reports HTTP %i without echoing response bodies',
    async (status) => {
      const fetcher = vi.fn(async () => new Response(token, { status }))
      await expect(runLabSeed({ environment: preview, fetcher })).rejects.toThrow(`HTTP ${status}`)
      await expect(runLabSeed({ environment: preview, fetcher })).rejects.not.toThrow(token)
    },
  )

  it('does not expose transport errors and refuses invalid success reports', async () => {
    await expect(
      runLabSeed({
        environment: preview,
        fetcher: async () => {
          throw new Error(token)
        },
      }),
    ).rejects.toThrow('Could not complete')
    await expect(
      runLabSeed({ environment: preview, fetcher: async () => new Response('Sign in') }),
    ).rejects.toThrow('did not return a lab seed report')
  })
})
