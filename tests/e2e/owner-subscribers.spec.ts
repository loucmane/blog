import AxeBuilder from '@axe-core/playwright'
import { expect, test, type BrowserContext, type Locator, type Page } from '@playwright/test'

import { subscriptionConsent } from '../../packages/web/src/server/subscriptions/consent'

const ownerTestToken = [
  'task43',
  'owner',
  'test',
  'token',
  'with',
  'more',
  'than',
  'thirty',
  'two',
  'bytes',
].join('-')

async function authenticate(context: BrowserContext) {
  expect(
    (
      await context.request.post('/api/owner/fixture-session', {
        headers: { authorization: `Bearer ${ownerTestToken}` },
      })
    ).status(),
  ).toBe(200)
}

async function subscribe(context: BrowserContext, email: string) {
  expect(
    (
      await context.request.post('/api/subscriptions', {
        headers: { origin: 'http://localhost:3100' },
        data: { email, consentTextVersion: subscriptionConsent.version },
      })
    ).status(),
  ).toBe(202)
}

async function tabTo(page: Page, target: Locator) {
  for (let count = 0; count < 30; count += 1) {
    if (await target.evaluate((element) => document.activeElement === element)) return
    await page.keyboard.press('Tab')
  }
  await expect(target).toBeFocused()
}

test('subscriber privacy is owner-only, uncached, accessible and usable on a narrow screen', async ({
  context,
  page,
  request,
}) => {
  expect((await request.get('/api/owner/subscribers/summary')).status()).toBe(401)
  await authenticate(context)
  const response = await page.goto('/owner/subscribers')
  expect(response?.headers()['cache-control']).toContain('no-store')
  expect(response?.headers()['x-robots-tag']).toContain('noindex')
  await expect(page.getByRole('heading', { name: 'Subscribers', exact: true })).toBeVisible()
  const violations = (
    await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()
  ).violations
  expect(violations.filter(({ impact }) => impact === 'critical' || impact === 'serious')).toEqual(
    [],
  )
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
    ),
  ).toBe(true)
})

test.describe('native subscriber forms', () => {
  test.use({ javaScriptEnabled: false })
  test('downloads and erases one subscriber using only the keyboard with JavaScript disabled', async ({
    context,
    page,
  }, testInfo) => {
    const email = `privacy-${testInfo.project.name}-${Date.now()}@example.com`
    await subscribe(context, email)
    await authenticate(context)
    await page.goto('/owner/subscribers')
    await expect(page.locator('body')).not.toContainText(email)
    await tabTo(page, page.getByLabel('Email address to export'))
    await page.keyboard.type(email)
    await page.keyboard.press('Tab')
    const downloadPromise = page.waitForEvent('download')
    await page.keyboard.press('Enter')
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe('subscriber.json')
    const stream = await download.createReadStream()
    const chunks = []
    for await (const chunk of stream) chunks.push(Buffer.from(chunk))
    const bundle = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    expect(bundle.version).toBe(2)
    expect(bundle.data.subscribers).toHaveLength(1)
    expect(bundle.data.subscribers[0].emailCanonical).toBe(email)
    expect(bundle.data.consents).toHaveLength(1)
    await tabTo(page, page.getByLabel('Email address to delete', { exact: true }))
    await page.keyboard.type(email)
    await page.keyboard.press('Tab')
    await page.keyboard.type('different@example.com')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    await expect(page.getByRole('status')).toContainText('same email address in both fields')
    for (const expected of [
      'were deleted',
      'No subscriber with that address; nothing was deleted.',
    ]) {
      await tabTo(page, page.getByLabel('Email address to delete', { exact: true }))
      await page.keyboard.type(email)
      await page.keyboard.press('Tab')
      await page.keyboard.type(email)
      await page.keyboard.press('Tab')
      await page.keyboard.press('Enter')
      await expect(page.getByRole('status')).toContainText(expected)
    }
    expect(page.url()).not.toContain(email)
  })
})
