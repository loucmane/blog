// @vitest-environment jsdom

import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { PassThrough } from 'node:stream'
import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { state } = vi.hoisted(() => ({ state: vi.fn() }))
vi.mock('@/server/owner/setup', () => ({ ownerSetupPageState: state }))
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NOT_FOUND')
  },
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}))

import OwnerSetupPage from './page'

beforeEach(() => state.mockReset())
describe('owner setup page', () => {
  it('renders a generic tokenless HTML shell with no owner identity', async () => {
    state.mockResolvedValue({ email: 'owner@example.com', ready: false })
    const html = renderToStaticMarkup(await OwnerSetupPage())
    expect(html).toContain('Open the setup link from your invitation')
    expect(html).not.toContain('owner@example.com')
    expect(html).not.toContain('<form')
  })
  it('does not serialize owner identity into the tokenless RSC response', async () => {
    // Run the installed production Flight serializer with isolated server React modules.
    // This tests real RSC bytes without a browser/build or changing global React conditions.
    const load = createRequire(import.meta.url)
    const dependencies: Record<string, unknown> = {}
    function evaluate(source: string) {
      const exports = {}
      new Function('require', 'exports', source)(
        (id: string) => dependencies[id] ?? load(id),
        exports,
      )
      return exports
    }
    for (const name of ['react', 'react-dom']) {
      const directory = path.dirname(load.resolve(`${name}/package.json`))
      dependencies[name] = evaluate(
        readFileSync(path.join(directory, `cjs/${name}.react-server.production.js`), 'utf8'),
      )
    }
    const serializer = load.resolve(
      'next/dist/compiled/react-server-dom-webpack/cjs/react-server-dom-webpack-server.node.production.js',
    )
    const flight = evaluate(readFileSync(serializer, 'utf8')) as {
      registerClientReference: (fn: () => void, id: string, name: string) => unknown
      renderToPipeableStream: (
        model: ReactNode,
        manifest: object,
      ) => { pipe: (stream: PassThrough) => void }
    }
    const boundary = (id: string, name: string) =>
      flight.registerClientReference(() => {}, id, name)
    dependencies['next/link'] = { default: boundary('next/link', 'default') }
    dependencies['next/navigation'] = {
      notFound() {
        throw new Error('NOT_FOUND')
      },
    }
    dependencies['@/components/owner/setup-form'] = {
      OwnerSetupForm: boundary('setup-form', 'OwnerSetupForm'),
    }
    dependencies['@/server/owner/setup'] = {
      ownerSetupPageState: async () => ({ ready: false, email: 'owner@example.com' }),
    }
    const source = readFileSync(path.resolve('packages/web/src/app/owner/setup/page.tsx'), 'utf8')
    const js = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText
    const page = evaluate(js) as { default: () => Promise<ReactNode> }
    const stream = new PassThrough()
    flight
      .renderToPipeableStream(await page.default(), {
        'setup-form': { id: 'setup-form', chunks: [], name: 'OwnerSetupForm' },
        'next/link': { id: 'next/link', chunks: [], name: 'default' },
      })
      .pipe(stream)
    let payload = ''
    for await (const chunk of stream) payload += String(chunk)
    expect(payload).toContain('setup-form')
    expect(payload).not.toContain('owner@example.com')
  })
  it('shows sign-in without a form after setup', async () => {
    state.mockResolvedValue({ email: 'owner@example.com', ready: true })
    const html = renderToStaticMarkup(await OwnerSetupPage())
    expect(html).toContain('Your account is ready')
    expect(html).toContain('/owner/sign-in')
    expect(html).not.toContain('<form')
  })
  it('returns not found when disabled or unavailable', async () => {
    state.mockResolvedValueOnce(null).mockRejectedValueOnce(new Error('database unavailable'))
    await expect(OwnerSetupPage()).rejects.toThrow('NOT_FOUND')
    await expect(OwnerSetupPage()).rejects.toThrow('NOT_FOUND')
  })
})
