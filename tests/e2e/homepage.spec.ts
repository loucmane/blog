import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import accessibilityBaseline from './accessibility-baseline.json'

test('serves the reader shell and enforces the accessibility baseline', async ({
  page,
}, testInfo) => {
  const response = await page.goto('/')

  expect(response?.status()).toBe(200)
  await expect(page.locator('main')).toBeVisible()
  await expect(page.locator('h1')).toBeVisible()

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
  const seriousViolations = results.violations.filter((violation) =>
    ['critical', 'serious'].includes(violation.impact ?? ''),
  )
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

  const lightTheme = page.getByRole('radio', { name: /light theme/i })
  const darkTheme = page.getByRole('radio', { name: /dark theme/i })

  await lightTheme.focus()
  await page.keyboard.press('ArrowRight')

  await expect(darkTheme).toBeFocused()
  await expect(darkTheme).toHaveAttribute('aria-checked', 'true')
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
    'http://localhost:3100/stories/framework-migration-proof',
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
  await page.goto('/preview/stories/private-framework-draft')
  await expect(page.getByRole('heading', { name: 'Page Not Found' })).toBeVisible()
  await expect(page.getByText('Private framework preview')).toHaveCount(0)

  const previewRequest = page.context().request
  const deniedResponse = await previewRequest.post('/api/preview', {
    form: {
      secret: 'wrong-preview-fixture',
      slug: 'private-framework-draft',
    },
    maxRedirects: 0,
  })
  expect(deniedResponse.status()).toBe(401)

  const previewResponse = await previewRequest.post('/api/preview', {
    form: {
      secret: 'task40-preview-fixture',
      slug: 'private-framework-draft',
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
  expect(previewResponse.headers()['referrer-policy']).toBe('no-referrer')

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

  await page.goto('/preview/stories/framework-migration-proof')
  await expect(page.getByRole('heading', { name: 'Page Not Found' })).toBeVisible()
  await page.goto('/preview/stories/private-framework-draft')

  await page.getByRole('button', { name: 'Exit preview' }).click()
  await expect(page).toHaveURL('/')
  await page.goto('/preview/stories/private-framework-draft')
  await expect(page.getByRole('heading', { name: 'Page Not Found' })).toBeVisible()
  await expect(page.getByText('Private framework preview')).toHaveCount(0)
})

test('protects the cache invalidation boundary and revalidates known story tags', async ({
  request,
}) => {
  const deniedResponse = await request.post('/api/revalidate', {
    data: { slug: 'framework-migration-proof' },
    headers: { authorization: 'Bearer wrong-revalidation-fixture' },
  })
  expect(deniedResponse.status()).toBe(401)

  const acceptedResponse = await request.post('/api/revalidate', {
    data: { slug: 'framework-migration-proof' },
    headers: { authorization: 'Bearer task40-revalidation-fixture' },
  })
  expect(acceptedResponse.status()).toBe(200)
  await expect(acceptedResponse.json()).resolves.toEqual({
    revalidated: true,
    slug: 'framework-migration-proof',
  })

  const unknownResponse = await request.post('/api/revalidate', {
    data: { slug: '../private-framework-draft' },
    headers: { authorization: 'Bearer task40-revalidation-fixture' },
  })
  expect(unknownResponse.status()).toBe(404)
})

test('rejects oversized public slugs before creating reader cache entries', async ({ page }) => {
  const response = await page.goto(`/stories/${'a'.repeat(121)}`)

  expect(response?.status()).toBe(404)
  await expect(page.getByRole('heading', { name: 'Page Not Found' })).toBeVisible()
})
