import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { JSDOM } from 'jsdom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  fixtureCookies,
  readOptions,
  runHarness,
  summarizeResult,
  writeReports,
} from '../../../../scripts/lab-lighthouse.mjs'

const environment = {
  MAGAZINE_OWNER_TEST_TOKEN: 'owner-fixture-token-for-harness-unit-tests',
  MAGAZINE_LAB_SEED_TOKEN: 'lab-seed-token-for-harness-unit-tests',
}
const options = readOptions(['--direction', 'quiet-monograph'], environment)
const ownerCookie = 'v1.test-session-signature'

afterEach(() => vi.unstubAllGlobals())

function fixtureFetch() {
  return vi.fn(
    async (url) =>
      new Response('{}', {
        headers: url.pathname.endsWith('fixture-session')
          ? {
              'set-cookie': `magazine-owner-test-session=${ownerCookie}; Path=/; HttpOnly; SameSite=Strict`,
            }
          : {},
      }),
  )
}

function lighthouseResult(url) {
  return {
    requestedUrl: url,
    finalDisplayedUrl: url,
    lighthouseVersion: '13.5.0',
    fetchTime: '2026-10-06T18:00:00.000Z',
    configSettings: { formFactor: 'mobile', throttlingMethod: 'simulate' },
    categories: { performance: { score: 0.93 }, accessibility: { score: 1 } },
    audits: {
      'largest-contentful-paint': { numericValue: 2400 },
      'cumulative-layout-shift': { numericValue: 0 },
      'total-blocking-time': { numericValue: 50 },
    },
  }
}

function fakeTools({
  direction = options.direction,
  labBar = true,
  status = 200,
  failAudit = false,
} = {}) {
  const contexts = []
  const browser = {
    close: vi.fn(),
    createBrowserContext: vi.fn(async () => {
      const frame = {}
      let responseListener
      const page = {
        mainFrame: () => frame,
        on: vi.fn((event, callback) => {
          expect(event).toBe('response')
          responseListener = callback
        }),
        evaluate: vi.fn((callback) => callback()),
        respond: (responseStatus, navigation, responseFrame = frame) =>
          responseListener({
            status: () => responseStatus,
            frame: () => responseFrame,
            request: () => ({ isNavigationRequest: () => navigation }),
          }),
      }
      const context = { setCookie: vi.fn(), newPage: vi.fn(async () => page), close: vi.fn(), page }
      contexts.push(context)
      return context
    }),
  }
  const lighthouse = vi.fn(async (url, flags, config, page) => {
    const context = contexts.at(-1)
    expect(context.page).toBe(page)
    expect(context.setCookie).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'magazine-owner-test-session', value: ownerCookie }),
      expect.objectContaining({ name: 'reader_lab_direction', value: options.direction }),
    )
    expect(flags).toMatchObject({
      disableStorageReset: true,
      onlyCategories: ['performance', 'accessibility'],
    })
    expect(flags).not.toHaveProperty('extraHeaders')
    expect(config).toBeUndefined()
    if (failAudit) throw new Error('Browser disconnected')
    page.respond(status, true)
    page.respond(500, false) // Subresource status must not replace the main document status.
    page.respond(500, true, {}) // Nor should an iframe navigation.
    const dom = new JSDOM(
      `<div data-reader-direction="${direction}"></div>${labBar ? '<aside data-reader-lab-bar></aside>' : ''}`,
      { url },
    )
    vi.stubGlobal('document', dom.window.document)
    vi.stubGlobal('location', dom.window.location)
    return { lhr: lighthouseResult(url), report: '<!doctype html><title>Lighthouse report</title>' }
  })
  return {
    browser,
    contexts,
    lighthouse,
    puppeteer: { launch: vi.fn(async () => browser) },
    executablePath: '/test/chromium',
    fetchImpl: fixtureFetch(),
  }
}

describe('Reader Lab Lighthouse harness', () => {
  it('offers help without installed audit tools or tokens', () => {
    expect(readOptions(['--help'], {})).toEqual({ help: true })
  })

  it.each([
    ['--url', 'https://magazine.example'],
    ['--url', 'http://localhost:3100/owner'],
    ['--url', 'http://secret@localhost:3100'],
    ['--url', 'http://localhost:3100?token=secret'],
    ['--article', '../owner'],
    ['--section', '//remote.example'],
    ['--direction', '../../baseline'],
  ])('rejects unsafe input %s %s', (flag, value) => {
    expect(() =>
      readOptions(['--direction', 'quiet-monograph', flag, value], environment),
    ).toThrow()
  })

  it('requires both strong tokens and refuses the production runtime', () => {
    for (const key of Object.keys(environment)) {
      expect(() =>
        readOptions(['--direction', 'quiet-monograph'], { ...environment, [key]: 'short' }),
      ).toThrow(key)
    }
    expect(() =>
      readOptions(['--direction', 'quiet-monograph'], { ...environment, NODE_ENV: 'production' }),
    ).toThrow('outside NODE_ENV=production')
  })

  it('seeds, obtains a real fixture cookie, and scopes both cookies to the selected host', async () => {
    const fetchImpl = fixtureFetch()
    const cookies = await fixtureCookies(options, fetchImpl)
    expect(fetchImpl.mock.calls.map(([url]) => url.pathname)).toEqual([
      '/api/internal/lab-seed',
      '/api/owner/fixture-session',
    ])
    expect(fetchImpl.mock.calls[1][1]).toMatchObject({
      method: 'POST',
      redirect: 'error',
      headers: { authorization: `Bearer ${environment.MAGAZINE_OWNER_TEST_TOKEN}` },
    })
    expect(cookies).toEqual([
      {
        name: 'magazine-owner-test-session',
        value: ownerCookie,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Strict',
      },
      {
        name: 'reader_lab_direction',
        value: 'quiet-monograph',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      },
    ])
    const secureOptions = readOptions(
      ['--direction', 'quiet-monograph', '--url', 'https://127.0.0.1:3100'],
      environment,
    )
    expect(await fixtureCookies(secureOptions, fixtureFetch())).toEqual(
      cookies.map((cookie) => ({ ...cookie, domain: '127.0.0.1', secure: true })),
    )
  })

  it.each(['seed', 'session', 'cookie'])(
    'fails before browser launch if %s setup fails',
    async (failure) => {
      const tools = fakeTools()
      tools.fetchImpl = vi.fn(async (url) => {
        if (failure === 'cookie') return new Response('{}')
        const failed = url.pathname.endsWith(failure === 'seed' ? 'lab-seed' : 'fixture-session')
        return new Response('{}', { status: failed ? 404 : 200 })
      })
      await expect(runHarness(options, tools)).rejects.toThrow(
        failure === 'cookie' ? 'owner cookie' : 'HTTP 404',
      )
      expect(tools.puppeteer.launch).not.toHaveBeenCalled()
    },
  )

  it('audits all three routes on their authenticated pages with fresh contexts and five metrics', async () => {
    const tools = fakeTools()
    const results = await runHarness(options, tools)
    expect(results.map(({ name }) => name)).toEqual(['home', 'article', 'section'])
    expect(tools.lighthouse.mock.calls.map(([url]) => new URL(url).pathname)).toEqual(
      options.routes.map((route) => route.path),
    )
    expect(new Set(tools.contexts).size).toBe(3)
    for (const result of results) {
      expect(result.summary).toMatchObject({
        direction: 'quiet-monograph',
        performance: 93,
        accessibility: 100,
        lcpMs: 2400,
        cls: 0,
        tbtMs: 50,
        verified: { status: 200, directions: ['quiet-monograph'], labBar: true },
      })
    }
    for (const context of tools.contexts) expect(context.close).toHaveBeenCalledOnce()
    expect(tools.browser.close).toHaveBeenCalledOnce()
  })

  it.each([{ direction: 'baseline' }, { labBar: false }, { status: 404 }, { failAudit: true }])(
    'rejects invalid audit %j and cleans up',
    async (failure) => {
      const tools = fakeTools(failure)
      await expect(runHarness(options, tools)).rejects.toThrow()
      expect(tools.lighthouse).toHaveBeenCalledOnce()
      expect(tools.contexts[0].close).toHaveBeenCalledOnce()
      expect(tools.browser.close).toHaveBeenCalledOnce()
    },
  )

  it('rejects misleading reports: redirect, missing metrics, runtime error, or multiple roots', () => {
    const url = `${options.origin}/`
    const observed = { url, status: 200, directions: [options.direction], labBar: true }
    expect(() =>
      summarizeResult(
        { ...lighthouseResult(url), finalDisplayedUrl: `${options.origin}/owner/sign-in` },
        options.direction,
        url,
        observed,
      ),
    ).toThrow('redirected')
    expect(() =>
      summarizeResult({ ...lighthouseResult(url), audits: {} }, options.direction, url, observed),
    ).toThrow('five metrics')
    expect(() =>
      summarizeResult({ runtimeError: { code: 'NO_FCP' } }, options.direction, url, observed),
    ).toThrow('NO_FCP')
    expect(() =>
      summarizeResult(lighthouseResult(url), options.direction, url, {
        ...observed,
        directions: ['baseline', options.direction],
      }),
    ).toThrow('baseline scores')
  })

  it('writes separate HTML/JSON reports and a summary, keeping previous runs distinct', async () => {
    const output = await mkdtemp(path.join(os.tmpdir(), 'lab-lighthouse-test-'))
    try {
      const results = await runHarness(options, fakeTools())
      const first = await writeReports({ ...options, output }, results)
      const second = await writeReports({ ...options, output }, results)
      expect(first).not.toBe(second)
      expect((await readdir(first)).sort()).toEqual([
        'article.html',
        'article.json',
        'home.html',
        'home.json',
        'section.html',
        'section.json',
        'summary.json',
      ])
      const summary = await readFile(path.join(first, 'summary.json'), 'utf8')
      expect(JSON.parse(summary).results).toHaveLength(3)
      expect(JSON.parse(summary).results[1].settings.formFactor).toBe('mobile')
      expect(summary).not.toContain(ownerCookie)
      expect(summary).not.toContain(environment.MAGAZINE_OWNER_TEST_TOKEN)
      expect(JSON.parse(await readFile(path.join(first, 'home.json'), 'utf8'))).toEqual(
        results[0].lhr,
      )
    } finally {
      await rm(output, { recursive: true, force: true })
    }
  })
})
