import { readFileSync } from 'node:fs'

import { describe, expect, it, vi } from 'vitest'

import { runContainerSmoke } from './container-smoke.mjs'

const revision = 'a'.repeat(40)
const imageId = `sha256:${'b'.repeat(64)}`
const project = 'blog-container-smoke'
const story = '/stories/the-long-table-a-field-guide-to-the-north-house-kitchen'

function fixture() {
  const imageMetadata = {
    Id: imageId,
    Config: {
      Labels: { 'org.opencontainers.image.revision': revision },
      User: 'node',
      Cmd: ['node', 'node_modules/next/dist/bin/next', 'start'],
      Healthcheck: { Test: ['CMD', 'node'] },
      Env: ['NODE_ENV=production', 'NODE_VERSION=24.18.0', 'NEXT_TELEMETRY_DISABLED=1'],
    },
  }
  const run = vi.fn((args) => {
    if (args[0] === 'image') return JSON.stringify(imageMetadata)
    if (args[0] === 'network') return project
    if (args[0] === 'port') return '127.0.0.1:49152'
    return ''
  })
  const routes = new Map([
    [
      '/api/health',
      () => Response.json({ status: 'degraded', checks: { database: { status: 'up' } } }),
    ],
    ['/build-revision.txt', () => new Response(`${revision}\n`)],
    ['/api/internal/lab-seed', () => Response.json({})],
    [
      story,
      () => new Response('North House kitchen notes', { headers: { 'content-type': 'text/html' } }),
    ],
    [
      '/feed.xml',
      () =>
        new Response(`<rss><link>${story}</link></rss>`, {
          headers: { 'content-type': 'application/rss+xml' },
        }),
    ],
    [
      '/sitemap.xml',
      () =>
        new Response('<sitemapindex>/sitemaps/1.xml</sitemapindex>', {
          headers: { 'content-type': 'application/xml' },
        }),
    ],
    [
      '/sitemaps/1.xml',
      () =>
        new Response(`<urlset>${story}</urlset>`, {
          headers: { 'content-type': 'application/xml' },
        }),
    ],
    [
      '/owner/sign-in',
      () =>
        new Response('Sign in to write, preview, schedule, and publish', {
          headers: { 'content-type': 'text/html' },
        }),
    ],
    [
      '/api/internal/outbox/drain',
      () => Response.json({ error: 'The outbox drain is not configured.' }, { status: 503 }),
    ],
  ])
  const fetcher = vi.fn(async (url) => {
    expect(url.origin).toBe('http://127.0.0.1:49152')
    return routes.get(url.pathname)()
  })
  return {
    imageMetadata,
    routes,
    options: {
      image: 'magazine:test',
      revision,
      docker: run,
      fetcher,
      readyForMs: 0,
      log: vi.fn(),
    },
  }
}

describe('portable container smoke', () => {
  it('migrates separately, launches the inspected image read-only, and verifies fixture routes', async () => {
    const { options } = fixture()
    await runContainerSmoke(options)

    const calls = options.docker.mock.calls
    const runs = calls.filter(([args]) => args[0] === 'run')
    expect(runs).toHaveLength(3)
    expect(runs[0][0].slice(-6)).toEqual([
      imageId,
      'node',
      'scripts/migrate.mjs',
      '--apply',
      '--environment',
      'production',
    ])
    expect(runs[1][0]).toContain('--eval')
    expect(runs[2][0].slice(-4)).toEqual(['--detach', '--publish', '127.0.0.1::3000', imageId])
    for (const [args, { environment }] of runs) {
      expect(args).toContain('--read-only')
      expect(args).toContain('--tmpfs')
      expect(args).toContain(`${project}_default`)
      expect(args).toEqual(expect.arrayContaining(Object.keys(environment)))
      for (const value of Object.values(environment)) {
        expect(args).not.toContain(value)
        expect(options.log.mock.calls.flat().join('\n')).not.toContain(value)
      }
    }
    expect(runs[2][1].environment).not.toHaveProperty('MAGAZINE_OUTBOX_DRAIN_SECRET')
    expect(
      options.fetcher.mock.calls.map(([url, options]) => [url.pathname, options.method]),
    ).toEqual([
      ['/api/health', 'GET'],
      ['/build-revision.txt', 'GET'],
      ['/api/internal/lab-seed', 'POST'],
      [story, 'GET'],
      ['/feed.xml', 'GET'],
      ['/sitemap.xml', 'GET'],
      ['/sitemaps/1.xml', 'GET'],
      ['/owner/sign-in', 'GET'],
      ['/api/internal/outbox/drain', 'POST'],
    ])
    expect(calls.slice(-3).map(([args]) => args)).toEqual(
      runs.toReversed().map(([args]) => ['container', 'rm', '--force', args[2]]),
    )
    expect(options.log).toHaveBeenLastCalledWith('PASS container smoke')
  })

  it('rejects an unexpected image environment entry before starting containers and omits its value', async () => {
    const { options, imageMetadata } = fixture()
    const planted = ['private', 'fixture', 'value'].join('-')
    imageMetadata.Config.Env.push(`DATABASE_URL=${planted}`)
    await expect(runContainerSmoke(options)).rejects.toThrow(
      /^Inspect image config: Image config contains an unexpected environment entry\.$/,
    )
    expect(options.docker).toHaveBeenCalledTimes(1)
    expect(options.log).not.toHaveBeenCalled()
  })

  it('refuses an image label for a different source revision before migration', async () => {
    const { options, imageMetadata } = fixture()
    imageMetadata.Config.Labels['org.opencontainers.image.revision'] = 'c'.repeat(40)
    await expect(runContainerSmoke(options)).rejects.toThrow('Image revision label differs')
    expect(options.docker).toHaveBeenCalledTimes(1)
  })

  it('rejects a stale served revision and removes the containers before returning', async () => {
    const { options, routes } = fixture()
    routes.set('/build-revision.txt', () => new Response(`${'c'.repeat(40)}\n`))
    await expect(runContainerSmoke(options)).rejects.toThrow('Served revision differs')
    expect(options.fetcher).toHaveBeenCalledTimes(2)
    expect(options.docker.mock.calls.slice(-3).every(([args]) => args[1] === 'rm')).toBe(true)
  })

  it('stops on a failed migration and withholds the underlying command output', async () => {
    const { options, imageMetadata } = fixture()
    options.docker
      .mockReset()
      .mockReturnValueOnce(JSON.stringify(imageMetadata))
      .mockReturnValueOnce(project)
      .mockImplementationOnce(() => {
        throw new Error(['private', 'migration', 'output'].join('-'))
      })
    await expect(runContainerSmoke(options)).rejects.toThrow(
      /^Apply migrations to the disposable database: Unexpected error; check this step on the Docker host\.$/,
    )
    expect(options.docker.mock.calls.map(([args]) => args.slice(0, 2))).toEqual([
      ['image', 'inspect'],
      ['network', 'inspect'],
      ['run', '--name'],
      ['container', 'rm'],
    ])
    expect(options.fetcher).not.toHaveBeenCalled()
  })

  it('requires the exact unconfigured outbox response rather than accepting any HTTP 503', async () => {
    const { options, routes } = fixture()
    routes.set('/api/internal/outbox/drain', () =>
      Response.json({ error: 'Unavailable.' }, { status: 503 }),
    )
    await expect(runContainerSmoke(options)).rejects.toThrow(
      'did not report that it was unconfigured',
    )
  })

  it('pins the build runtime and filtered-context scan in the Dockerfile', () => {
    const root = new URL('../../../', import.meta.url)
    const read = (file) => readFileSync(new URL(file, root), 'utf8')
    const { node } = JSON.parse(read('config/runtime.json'))
    const dockerfile = read('Dockerfile')
    expect(dockerfile).toContain(`FROM node:${node.version}-bookworm-slim`)
    expect(dockerfile).toContain('corepack pnpm install --prod --frozen-lockfile')
    expect(dockerfile).toContain('RUN --mount=type=bind,target=/context')
    expect(dockerfile).toContain('find /context')
    for (const name of ['.env*', '.git', 'ci-artifacts', 'worktrees', 'node_modules']) {
      expect(read('.dockerignore').split('\n')).toContain(`**/${name}`)
      expect(dockerfile).toContain(`-name '${name}'`)
    }
  })
})
