import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import http from 'node:http'

import {
  createPreviewToken,
  maxPreviewRequestBytes,
} from '../../packages/web/src/lib/request-security'
import accessibilityBaseline from './accessibility-baseline.json'

const previewTokenSecret = 'task40-preview-token-secret-with-32-bytes'
const revalidationSecret = 'task40-revalidation-secret-with-32-bytes'

async function scanSeriousAccessibilityViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
  return results.violations.filter((violation) =>
    ['critical', 'serious'].includes(violation.impact ?? ''),
  )
}

async function waitForThemeMenuToSettle(page: Page) {
  const menu = page.getByRole('menu', { name: 'Color theme' })
  await expect(menu).toBeVisible()
  await expect
    .poll(() =>
      menu.evaluate((element) => ({
        opacity: window.getComputedStyle(element).opacity,
        starting: element.hasAttribute('data-starting-style'),
      })),
    )
    .toEqual({ opacity: '1', starting: false })
  return menu
}

function previewTokenFor(slug: string): string {
  const token = createPreviewToken(slug, previewTokenSecret)
  if (!token) {
    throw new Error(`Could not create preview token for ${slug}`)
  }
  return token
}

function postChunkedPreview(body: string): Promise<{
  headers: http.IncomingHttpHeaders
  status: number | undefined
}> {
  return new Promise((resolve, reject) => {
    const request = http.request(
      {
        headers: { 'content-type': 'application/json' },
        host: '127.0.0.1',
        method: 'POST',
        path: '/api/preview',
        port: 3100,
      },
      (response) => {
        response.resume()
        response.on('end', () =>
          resolve({ headers: response.headers, status: response.statusCode }),
        )
      },
    )
    request.on('error', reject)
    const splitAt = Math.floor(body.length / 2)
    request.write(body.slice(0, splitAt))
    request.end(body.slice(splitAt))
  })
}

test('serves the reader shell and enforces the accessibility baseline', async ({
  page,
}, testInfo) => {
  const response = await page.goto('/')

  expect(response?.status()).toBe(200)
  await expect(page.locator('main')).toBeVisible()
  await expect(page.locator('h1')).toBeVisible()

  const seriousViolations = await scanSeriousAccessibilityViolations(page)
  const criticalViolations = seriousViolations.filter(
    (violation) => violation.impact === 'critical',
  )
  const normalizedViolations = seriousViolations
    .flatMap((violation) =>
      violation.nodes.map((node) => ({
        id: violation.id,
        impact: violation.impact,
        target: node.target,
      })),
    )
    .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)))
  const expectedViolations =
    accessibilityBaseline.projects[
      testInfo.project.name as keyof typeof accessibilityBaseline.projects
    ]

  expect(criticalViolations).toEqual([])
  expect(expectedViolations).toBeDefined()
  expect(normalizedViolations).toEqual(expectedViolations)
})

test('keeps the theme chooser operable from the keyboard', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.setItem('theme', 'system'))
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.reload()

  await expect(page.locator('html')).toHaveClass(/dark/)
  const trigger = page.getByRole('button', { name: 'Choose color theme' })
  await expect(trigger).toBeEnabled()
  await page.keyboard.press('Tab')
  await expect(trigger).toBeFocused()
  await page.keyboard.press('Enter')

  await waitForThemeMenuToSettle(page)
  let systemTheme = page.getByRole('menuitemradio', { name: /system theme/i })
  await expect(systemTheme).toHaveAttribute('aria-checked', 'true')
  await expect(systemTheme).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('menu', { name: 'Color theme' })).toBeHidden()
  await expect(trigger).toBeFocused()

  await page.keyboard.press('Enter')
  await waitForThemeMenuToSettle(page)
  systemTheme = page.getByRole('menuitemradio', { name: /system theme/i })
  await expect(systemTheme).toBeFocused()
  expect(await scanSeriousAccessibilityViolations(page)).toEqual([])

  const darkTheme = page.getByRole('menuitemradio', { name: /dark theme/i })
  await systemTheme.focus()
  await page.keyboard.press('ArrowUp')
  await expect(darkTheme).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('html')).toHaveClass(/dark/)

  await page.reload()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await expect(trigger).toBeEnabled()
  await page.keyboard.press('Tab')
  await expect(trigger).toBeFocused()
  await page.keyboard.press('Enter')
  await waitForThemeMenuToSettle(page)
  await expect(darkTheme).toHaveAttribute('aria-checked', 'true')
  expect(await scanSeriousAccessibilityViolations(page)).toEqual([])
})

test('preserves forced-colors focus and reduced-motion behavior', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark', forcedColors: 'active', reducedMotion: 'reduce' })
  await page.goto('/')

  const trigger = page.getByRole('button', { name: 'Choose color theme' })
  await expect(trigger).toBeEnabled()
  await page.keyboard.press('Tab')
  await expect(trigger).toBeFocused()
  await expect(page.locator('html')).not.toHaveClass(/gentle|high-contrast/)

  const styles = await trigger.evaluate((element) => {
    const computed = window.getComputedStyle(element)
    return {
      animationDuration: computed.animationDuration,
      outlineStyle: computed.outlineStyle,
      outlineWidth: computed.outlineWidth,
      transitionDuration: computed.transitionDuration,
    }
  })

  expect(styles.outlineStyle).toBe('solid')
  expect(styles.outlineWidth).toBe('2px')
  for (const duration of [styles.animationDuration, styles.transitionDuration]) {
    expect(Math.max(...duration.split(',').map((value) => Number.parseFloat(value)))).toBeLessThan(
      0.001,
    )
  }
})

test('server-renders a canonical story with responsive image and hardened headers', async ({
  page,
}) => {
  const response = await page.goto('/stories/framework-migration-proof')

  expect(response?.status()).toBe(200)
  await expect(page).toHaveTitle('A portable foundation for the magazine | Magazine Foundation')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'A portable foundation for the magazine',
  )
  await expect(
    page.getByRole('img', {
      name: 'Layered editorial pages represented by warm geometric shapes',
    }),
  ).toBeVisible()
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://canonical.magazine.invalid/stories/framework-migration-proof',
  )

  const contentSecurityPolicy = response?.headers()['content-security-policy'] ?? ''
  expect(contentSecurityPolicy).toContain("default-src 'self'")
  expect(contentSecurityPolicy).toContain("frame-ancestors 'none'")
  expect(contentSecurityPolicy).not.toContain("'unsafe-eval'")

  const readerResources = await page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .map((entry) => entry.name)
      .join('\n'),
  )
  expect(readerResources).not.toMatch(/tiptap|prosemirror|lexical|editor/i)
  expect(await scanSeriousAccessibilityViolations(page)).toEqual([])
})

test('delivers the reader story in initial HTML within the foundation byte budget', async ({
  request,
}) => {
  const response = await request.get('/stories/framework-migration-proof')
  const body = await response.text()

  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toContain('text/html')
  expect(body).toContain('A portable foundation for the magazine')
  expect(body).toContain('Layered editorial pages represented by warm geometric shapes')
  expect(body).not.toMatch(/tiptap|prosemirror|lexical|contenteditable/i)
  expect(Buffer.byteLength(body)).toBeLessThan(150_000)
})

test('fails closed before enabling an isolated private preview', async ({ page }) => {
  const unauthorizedPreview = await page.goto('/preview/stories/private-framework-draft')
  expect(unauthorizedPreview?.status()).toBe(404)
  await expect(page.getByRole('heading', { name: 'Page Not Found' })).toBeVisible()
  await expect(page.getByText('Private framework preview')).toHaveCount(0)

  const previewRequest = page.context().request
  const deniedResponse = await previewRequest.post('/api/preview', {
    data: {
      slug: 'private-framework-draft',
      token: 'wrong-preview-token',
    },
    maxRedirects: 0,
  })
  expect(deniedResponse.status()).toBe(401)

  const crossSlugResponse = await previewRequest.post('/api/preview', {
    data: {
      slug: 'framework-migration-proof',
      token: previewTokenFor('private-framework-draft'),
    },
    maxRedirects: 0,
  })
  expect(crossSlugResponse.status()).toBe(401)
  expect(crossSlugResponse.headers()['set-cookie']).toBeUndefined()

  const previewResponse = await previewRequest.post('/api/preview', {
    data: {
      slug: 'private-framework-draft',
      token: previewTokenFor('private-framework-draft'),
    },
    headers: {
      host: 'attacker.example',
    },
    maxRedirects: 0,
  })
  expect(previewResponse.status()).toBe(303)
  expect(previewResponse.headers()['location']).toBe(
    'http://localhost:3100/preview/stories/private-framework-draft',
  )
  expect(previewResponse.headers()['cache-control']).toBe('private, no-store')
  expect(previewResponse.headers()['referrer-policy']).toBe('same-origin')

  const setCookies = previewResponse
    .headersArray()
    .filter(({ name }) => name.toLowerCase() === 'set-cookie')
    .map(({ value }) => value)
  const previewScopeSetCookie = setCookies.find((value) =>
    value.startsWith('magazine-preview-scope='),
  )
  expect(previewScopeSetCookie).toContain('Max-Age=300')
  expect(previewScopeSetCookie).toContain('Path=/preview')
  expect(previewScopeSetCookie).toContain('HttpOnly')
  expect(previewScopeSetCookie?.toLowerCase()).toContain('samesite=strict')
  const draftModeSetCookie = setCookies.find((value) => value.startsWith('__prerender_bypass='))
  expect(draftModeSetCookie).toContain('Path=/')
  expect(draftModeSetCookie).toContain('HttpOnly')
  expect(draftModeSetCookie).toContain('Secure')
  expect(draftModeSetCookie?.toLowerCase()).toContain('samesite=none')
  const cookieHeader = setCookies.map((value) => value.split(';', 1)[0]).join('; ')
  expect(cookieHeader).toContain('magazine-preview-scope=')
  const streamedPreview = await fetch(
    'http://127.0.0.1:3100/preview/stories/private-framework-draft',
    { headers: { cookie: cookieHeader } },
  )
  expect(streamedPreview.status).toBe(200)
  const firstChunk = await streamedPreview.body?.getReader().read()
  const firstChunkHtml = new TextDecoder().decode(firstChunk?.value)
  expect(firstChunkHtml).toContain('data-preview-stream-fallback')
  expect(firstChunkHtml).not.toContain('Private framework preview')

  const previewDocument = await previewRequest.get('/preview/stories/private-framework-draft')
  expect(previewDocument.status()).toBe(200)
  expect(await previewDocument.text()).toContain('Private framework preview')

  await page.goto('/preview/stories/private-framework-draft')
  await expect(page.getByRole('status')).toContainText('Private preview')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Private framework preview')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    /noindex.*nofollow|nofollow.*noindex/,
  )
  expect(await scanSeriousAccessibilityViolations(page)).toEqual([])

  const crossSiteDisable = await previewRequest.post('/api/preview/disable', {
    headers: {
      origin: 'https://attacker.example',
      'sec-fetch-site': 'cross-site',
    },
    maxRedirects: 0,
  })
  expect(crossSiteDisable.status()).toBe(403)
  const opaqueOriginDisable = await previewRequest.post('/api/preview/disable', {
    headers: {
      origin: 'null',
      'sec-fetch-site': 'same-origin',
    },
    maxRedirects: 0,
  })
  expect(opaqueOriginDisable.status()).toBe(403)
  await page.goto('/preview/stories/private-framework-draft')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Private framework preview')

  const crossSlugPreview = await page.goto('/preview/stories/framework-migration-proof')
  expect(crossSlugPreview?.status()).toBe(404)
  await expect(page.getByRole('heading', { name: 'Page Not Found' })).toBeVisible()
  await page.goto('/preview/stories/private-framework-draft')

  await page.getByRole('button', { name: 'Exit preview' }).click()
  await expect(page).toHaveURL('/')
  const disabledPreview = await page.goto('/preview/stories/private-framework-draft')
  expect(disabledPreview?.status()).toBe(404)
  await expect(page.getByRole('heading', { name: 'Page Not Found' })).toBeVisible()
  await expect(page.getByText('Private framework preview')).toHaveCount(0)
})

test('rejects oversized declared and chunked preview bodies before setting cookies', async ({
  request,
}) => {
  const oversized = JSON.stringify({ token: 'x'.repeat(maxPreviewRequestBytes), slug: 'draft' })
  const declaredResponse = await request.post('/api/preview', {
    data: oversized,
    headers: { 'content-type': 'application/json' },
    maxRedirects: 0,
  })
  const chunkedResponse = await postChunkedPreview(oversized)

  expect(declaredResponse.status()).toBe(413)
  expect(declaredResponse.headers()['set-cookie']).toBeUndefined()
  expect(chunkedResponse.status).toBe(413)
  expect(chunkedResponse.headers['set-cookie']).toBeUndefined()
})

test('protects the cache invalidation boundary and regenerates known story data', async ({
  request,
}, testInfo) => {
  const slug =
    testInfo.project.name === 'mobile-chromium'
      ? 'framework-cache-proof-mobile'
      : 'framework-migration-proof'
  const storyPath = `/stories/${slug}`
  const readGeneration = (body: string) =>
    body.match(/data-framework-cache-generation="([^"]+)"/)?.[1]

  const deniedResponse = await request.post('/api/revalidate', {
    data: { slug },
    headers: { authorization: 'Bearer wrong-revalidation-fixture-with-32-bytes' },
  })
  expect(deniedResponse.status()).toBe(401)

  const firstStoryResponse = await request.get(storyPath)
  const firstGeneration = readGeneration(await firstStoryResponse.text())
  const secondStoryResponse = await request.get(storyPath)
  const secondGeneration = readGeneration(await secondStoryResponse.text())

  expect(firstGeneration).toBeTruthy()
  expect(secondGeneration).toBe(firstGeneration)

  const acceptedResponse = await request.post('/api/revalidate', {
    data: { slug },
    headers: { authorization: `Bearer ${revalidationSecret}` },
  })
  expect(acceptedResponse.status()).toBe(200)
  await expect(acceptedResponse.json()).resolves.toEqual({ revalidated: true, slug })

  const oversizedResponse = await request.post('/api/revalidate', {
    data: JSON.stringify({ slug: 'x'.repeat(1_100) }),
    headers: {
      authorization: `Bearer ${revalidationSecret}`,
      'content-type': 'application/json',
    },
  })
  expect(oversizedResponse.status()).toBe(413)

  const revalidatedStoryResponse = await request.get(storyPath)
  const revalidatedGeneration = readGeneration(await revalidatedStoryResponse.text())
  expect(revalidatedGeneration).toBeTruthy()
  expect(revalidatedGeneration).not.toBe(firstGeneration)

  const unknownResponse = await request.post('/api/revalidate', {
    data: { slug: '../private-framework-draft' },
    headers: { authorization: `Bearer ${revalidationSecret}` },
  })
  expect(unknownResponse.status()).toBe(404)
})

test('rejects oversized public slugs at the reader boundary', async ({ page }) => {
  const response = await page.goto(`/stories/${'a'.repeat(121)}`)

  expect(response?.status()).toBe(404)
  await expect(page.getByRole('heading', { name: 'Page Not Found' })).toBeVisible()
})
