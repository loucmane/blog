import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'

const ownerCookieName = 'magazine-owner-test-session'
const directionCookieName = 'reader_lab_direction'
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const help = `Usage: node scripts/lab-lighthouse.mjs --direction <id> [options]

Audit a running production build in the local NODE_ENV=test fixture runtime.
The harness seeds North House, signs in, and audits home, article, and section.

  --url <origin>      Default: http://localhost:3100
  --article <slug>    Default: the-long-table-a-field-guide-to-the-north-house-kitchen
  --section <slug>    Default: interiors
  --output <folder>   Default: ci-artifacts/lab-lighthouse/<direction>
  --help             Show this help

Required environment (must match the server):
  MAGAZINE_OWNER_TEST_TOKEN, MAGAZINE_LAB_SEED_TOKEN
Optional tooling:
  LIGHTHOUSE_MODULE  Absolute path to lighthouse/core/index.js
  CHROME_PATH        Chromium executable; defaults to Playwright's Chromium

See scripts/lab-lighthouse.md for setup and the production-build commands.
`

export function readOptions(argv, environment = process.env) {
  const { values } = parseArgs({
    args: argv,
    options: {
      direction: { type: 'string' },
      url: { type: 'string', default: 'http://localhost:3100' },
      article: {
        type: 'string',
        default: 'the-long-table-a-field-guide-to-the-north-house-kitchen',
      },
      section: { type: 'string', default: 'interiors' },
      output: { type: 'string' },
      help: { type: 'boolean' },
    },
  })
  if (values.help) return { help: true }
  for (const key of ['direction', 'article', 'section']) {
    if (!values[key] || !slugPattern.test(values[key])) {
      throw new Error(`--${key} must be a lowercase, hyphen-separated id.`)
    }
  }
  const url = new URL(values.url)
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    !['localhost', '127.0.0.1'].includes(url.hostname) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new Error('--url must be a plain localhost or 127.0.0.1 HTTP(S) origin.')
  }
  if (environment.NODE_ENV === 'production') {
    throw new Error(
      'Run this harness against the local fixture runtime, outside NODE_ENV=production.',
    )
  }
  for (const key of ['MAGAZINE_OWNER_TEST_TOKEN', 'MAGAZINE_LAB_SEED_TOKEN']) {
    if (!environment[key] || Buffer.byteLength(environment[key], 'utf8') < 32) {
      throw new Error(`Set ${key} (at least 32 bytes) to match the local fixture server.`)
    }
  }
  return {
    direction: values.direction,
    origin: url.origin,
    ownerToken: environment.MAGAZINE_OWNER_TEST_TOKEN,
    seedToken: environment.MAGAZINE_LAB_SEED_TOKEN,
    output: path.resolve(values.output ?? `ci-artifacts/lab-lighthouse/${values.direction}`),
    routes: [
      { name: 'home', path: '/' },
      { name: 'article', path: `/stories/${values.article}` },
      { name: 'section', path: `/sections/${values.section}` },
    ],
  }
}

async function fixturePost(fetchImpl, origin, route, token) {
  const response = await fetchImpl(new URL(route, origin), {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
    redirect: 'error',
    signal: AbortSignal.timeout(30_000),
  })
  if (!response.ok) {
    throw new Error(
      `${route} returned HTTP ${response.status}. Check the fixture runtime and token.`,
    )
  }
  return response
}

export async function fixtureCookies(options, fetchImpl = fetch) {
  await fixturePost(fetchImpl, options.origin, '/api/internal/lab-seed', options.seedToken)
  const session = await fixturePost(
    fetchImpl,
    options.origin,
    '/api/owner/fixture-session',
    options.ownerToken,
  )
  const cookie = session.headers
    .getSetCookie()
    .find((value) => value.startsWith(`${ownerCookieName}=`))
  const value = cookie?.split(';', 1)[0].slice(ownerCookieName.length + 1)
  if (!value) throw new Error('Fixture session did not return the owner cookie; refusing to audit.')
  const scope = {
    domain: new URL(options.origin).hostname,
    path: '/',
    httpOnly: true,
    secure: options.origin.startsWith('https:'),
  }
  return [
    { ...scope, name: ownerCookieName, value, sameSite: 'Strict' },
    { ...scope, name: directionCookieName, value: options.direction, sameSite: 'Lax' },
  ]
}

export function summarizeResult(lhr, direction, url, observed) {
  if (lhr?.runtimeError) throw new Error(`Lighthouse failed: ${lhr.runtimeError.code}`)
  if (
    observed.status !== 200 ||
    observed.url !== url ||
    lhr?.requestedUrl !== url ||
    (lhr.finalDisplayedUrl ?? lhr.finalUrl) !== url
  ) {
    throw new Error(`Audit navigation failed or redirected for ${url}; refusing to report scores.`)
  }
  if (
    observed.directions.length !== 1 ||
    observed.directions[0] !== direction ||
    !observed.labBar
  ) {
    throw new Error(
      `Expected authenticated direction ${direction} on ${url}; refusing baseline scores.`,
    )
  }
  const metrics = {
    performance: lhr.categories?.performance?.score,
    accessibility: lhr.categories?.accessibility?.score,
    lcpMs: lhr.audits?.['largest-contentful-paint']?.numericValue,
    cls: lhr.audits?.['cumulative-layout-shift']?.numericValue,
    tbtMs: lhr.audits?.['total-blocking-time']?.numericValue,
  }
  if (Object.values(metrics).some((value) => !Number.isFinite(value) || value < 0)) {
    throw new Error(`Lighthouse did not return all five metrics for ${url}.`)
  }
  return {
    url,
    direction,
    verified: observed,
    ...metrics,
    performance: Math.round(metrics.performance * 100),
    accessibility: Math.round(metrics.accessibility * 100),
    lighthouseVersion: lhr.lighthouseVersion,
    fetchTime: lhr.fetchTime,
    settings: lhr.configSettings,
    warnings: lhr.runWarnings ?? [],
  }
}

export async function auditRoutes(options, { browser, lighthouse, cookies }) {
  const results = []
  for (const route of options.routes) {
    // A fresh context keeps each route cold without discarding its authentication cookies.
    const context = await browser.createBrowserContext()
    try {
      await context.setCookie(...cookies)
      const page = await context.newPage()
      const url = new URL(route.path, options.origin).href
      let status = null
      page.on('response', (response) => {
        if (response.request().isNavigationRequest() && response.frame() === page.mainFrame()) {
          status = response.status()
        }
      })
      // Pass the actual page, not a port that could select an unauthenticated browser context.
      // https://github.com/GoogleChrome/lighthouse/blob/main/docs/recipes/auth/README.md
      const result = await lighthouse(
        url,
        {
          disableStorageReset: true,
          onlyCategories: ['performance', 'accessibility'],
          output: 'html',
          logLevel: 'error',
          maxWaitForLoad: 45_000,
        },
        undefined,
        page,
      )
      // Inspect the document Lighthouse measured; do not navigate to a separate proof page.
      const observed = await page.evaluate(() => ({
        // eslint-disable-next-line no-undef -- executes inside Chromium
        url: location.href,
        // eslint-disable-next-line no-undef -- executes inside Chromium
        directions: Array.from(document.querySelectorAll('[data-reader-direction]'), (root) =>
          root.getAttribute('data-reader-direction'),
        ),
        // eslint-disable-next-line no-undef -- executes inside Chromium
        labBar: Boolean(document.querySelector('[data-reader-lab-bar]')),
      }))
      const summary = summarizeResult(result?.lhr, options.direction, url, { ...observed, status })
      results.push({ name: route.name, summary, lhr: result.lhr, html: result.report })
    } finally {
      await context.close()
    }
  }
  return results
}

export async function writeReports(options, results) {
  // Only publish reports after every route passed its identity and metric checks. Unique run
  // directories keep an unsuccessful rerun from being mistaken for an older successful run.
  await mkdir(options.output, { recursive: true })
  const directory = await mkdtemp(path.join(options.output, 'run-'))
  for (const result of results) {
    await writeFile(
      path.join(directory, `${result.name}.json`),
      `${JSON.stringify(result.lhr, null, 2)}\n`,
    )
    await writeFile(path.join(directory, `${result.name}.html`), result.html)
  }
  await writeFile(
    path.join(directory, 'summary.json'),
    `${JSON.stringify({ direction: options.direction, results: results.map((result) => result.summary) }, null, 2)}\n`,
  )
  return directory
}

async function loadTools(environment) {
  const require = createRequire(import.meta.url)
  let entry
  try {
    entry = environment.LIGHTHOUSE_MODULE
      ? path.resolve(environment.LIGHTHOUSE_MODULE)
      : require.resolve('lighthouse')
  } catch {
    throw new Error('Install Lighthouse and set LIGHTHOUSE_MODULE; see scripts/lab-lighthouse.md.')
  }
  // Use the exact Puppeteer copy Lighthouse itself uses, including with an isolated pnpm install.
  const lighthouseRequire = createRequire(entry)
  const { default: lighthouse } = await import(pathToFileURL(entry).href)
  const { default: puppeteer } = await import(
    pathToFileURL(lighthouseRequire.resolve('puppeteer-core')).href
  )
  const executablePath =
    environment.CHROME_PATH ?? (await import('@playwright/test')).chromium.executablePath()
  return { lighthouse, puppeteer, executablePath }
}

export async function runHarness(
  options,
  { puppeteer, lighthouse, executablePath, fetchImpl = fetch },
) {
  const cookies = await fixtureCookies(options, fetchImpl)
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    defaultViewport: null,
    ignoreDefaultArgs: ['--enable-automation'],
  })
  try {
    return await auditRoutes(options, { browser, lighthouse, cookies })
  } finally {
    await browser.close()
  }
}

async function main() {
  const options = readOptions(process.argv.slice(2))
  if (options.help) {
    console.log(help)
    return
  }
  const results = await runHarness(options, await loadTools(process.env))
  const directory = await writeReports(options, results)
  console.table(
    results.map(({ name, summary: { performance, accessibility, lcpMs, cls, tbtMs } }) => ({
      page: name,
      performance,
      accessibility,
      lcpMs,
      cls,
      tbtMs,
    })),
  )
  console.log(`Verified direction: ${options.direction}. Reports: ${directory}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}
