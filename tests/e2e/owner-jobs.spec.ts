import AxeBuilder from '@axe-core/playwright'
import { expect, test, type BrowserContext, type Page } from '@playwright/test'

const ownerTestToken = 'task43-owner-test-token-with-more-than-thirty-two-bytes'
const publicationWorkerToken = ['task43', 'publication', 'worker', 'token', 'more-than-32'].join(
  '-',
)
const ownerStates = ['Needs attention', 'Waiting to retry', 'Sending', 'Waiting to send', 'Sent']

async function authenticate(context: BrowserContext) {
  const response = await context.request.post('/api/owner/fixture-session', {
    headers: { authorization: `Bearer ${ownerTestToken}` },
  })
  expect(response.status()).toBe(200)
}

async function seriousAccessibilityViolations(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
  return result.violations.filter(({ impact }) => impact === 'critical' || impact === 'serious')
}

async function createDraft(page: Page, title: string) {
  await page.goto('/owner/stories/new')
  await page.getByLabel('Story title', { exact: true }).fill(title)
  await page
    .getByLabel('Short summary')
    .fill('A plain-language summary that shows the owner what happens after publishing.')
  await page
    .getByRole('textbox', { name: 'Story body' })
    .fill('This story is scheduled so its publishing jobs can be followed from start to finish.')
  const saved = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/owner/stories') && response.request().method() === 'POST',
  )
  await page.getByRole('button', { name: 'Save now' }).click()
  expect((await saved).status()).toBe(200)
  await expect(page).toHaveURL(/\/owner\/stories\/article-/)
}

/** The jobs of one story listed under one state. */
function jobsOf(page: Page, state: string, storyTitle: string) {
  return page
    .getByRole('region', { name: state, exact: true })
    .getByRole('listitem')
    .filter({ hasText: storyTitle })
}

test('follows a scheduled story’s jobs in plain language, with details a maintainer opens from the keyboard', async ({
  context,
  page,
}, testInfo) => {
  test.setTimeout(60_000)
  await authenticate(context)
  const title = `Publishing jobs ${testInfo.project.name}-${Date.now()}`
  await createDraft(page, title)
  const scheduled = new Date(Date.now() + 4 * 60 * 60 * 1_000).toISOString().slice(0, 16)
  await page.getByLabel('Schedule for').fill(scheduled)
  await page.getByRole('button', { name: 'Schedule publication' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Scheduled for' })).toBeVisible()

  await page
    .getByRole('navigation', { name: 'Owner workspace' })
    .getByRole('link', { name: 'Publishing jobs' })
    .click()
  await expect(page).toHaveURL(/\/owner\/jobs$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Publishing jobs' })).toBeVisible()
  const summary = page.getByRole('region', { name: 'Jobs by state' })
  for (const state of ownerStates) {
    await expect(
      summary.getByRole('term').filter({ hasText: new RegExp(`^${state}$`) }),
    ).toBeVisible()
  }
  const waiting = jobsOf(page, 'Waiting to send', title)
  await expect(waiting).toHaveCount(1)
  await expect(waiting).toContainText('Publish on schedule')
  await expect(waiting).toContainText('Scheduled for')
  expect(await seriousAccessibilityViolations(page)).toEqual([])

  // The publishing worker runs after the scheduled time and publishes the story.
  const worker = await context.request.post('/api/internal/publication-jobs', {
    headers: {
      authorization: `Bearer ${publicationWorkerToken}`,
      'x-magazine-test-now': new Date(Date.now() + 8 * 60 * 60 * 1_000).toISOString(),
    },
  })
  expect(worker.status()).toBe(200)
  expect(((await worker.json()) as { processed: number }).processed).toBeGreaterThanOrEqual(1)

  await page.reload()
  const sent = jobsOf(page, 'Sent', title)
  await expect(sent).toHaveCount(1)
  await expect(sent).toContainText('Published at')
  // The publication queued the work that follows it, which waits for the outbox to be drained.
  const followUps = jobsOf(page, 'Waiting to send', title)
  await expect(followUps).toHaveCount(3)
  for (const job of [
    'Update site search',
    'Refresh the published pages',
    'Publication follow-up',
  ]) {
    await expect(followUps.filter({ has: page.getByRole('heading', { name: job }) })).toHaveCount(1)
  }

  const details = sent.getByText('Details for a maintainer', { exact: true })
  await details.focus()
  await expect(details).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(
    sent.getByRole('definition').filter({ hasText: /^publication\.scheduled$/ }),
  ).toBeVisible()
  await expect(sent.getByRole('term').filter({ hasText: /^Attempts$/ })).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
    ),
  ).toBe(true)
  expect(await seriousAccessibilityViolations(page)).toEqual([])
})

test('reports the health of the stores and the job queue, uncached and without secrets', async ({
  request,
}) => {
  const response = await request.get('/api/health', {
    headers: { 'x-correlation-id': 'browser-health-check-0001' },
  })

  expect(response.status()).toBe(200)
  expect(response.headers()['cache-control']).toContain('no-store')
  expect(response.headers()['x-correlation-id']).toBe('browser-health-check-0001')
  const body = await response.text()
  expect(body).not.toContain(ownerTestToken)
  expect(body).not.toContain(publicationWorkerToken)
  expect(body).not.toContain('owner@example.test')
  expect(JSON.parse(body)).toMatchObject({
    checks: {
      database: { status: 'up' },
      email: { status: 'configured_for_development' },
      jobQueue: { status: expect.stringMatching(/^(up|degraded)$/) },
      search: { status: 'not_configured' },
    },
    correlationId: 'browser-health-check-0001',
    status: expect.stringMatching(/^(ok|degraded)$/),
  })
})
