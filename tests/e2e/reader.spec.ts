import AxeBuilder from '@axe-core/playwright'
import {
  expect,
  test,
  type APIRequestContext,
  type APIResponse,
  type BrowserContext,
  type Page,
} from '@playwright/test'

const labSeedToken = 'task44-lab-seed-token-with-more-than-32-bytes'
const ownerTestToken = 'task43-owner-test-token-with-more-than-thirty-two-bytes'
const siteOrigin = 'http://localhost:3100'
const readerPages = [
  '/',
  '/stories/the-long-table-a-field-guide-to-the-north-house-kitchen',
  '/sections/interiors',
]
const viewports = [
  { height: 844, width: 390 },
  { height: 900, width: 1440 },
]

async function seedReaderLab(request: APIRequestContext) {
  const response = await request.post('/api/internal/lab-seed', {
    headers: { authorization: `Bearer ${labSeedToken}` },
  })
  expect(response.status()).toBe(200)
}

async function authenticate(context: BrowserContext) {
  const response = await context.request.post('/api/owner/fixture-session', {
    headers: { authorization: `Bearer ${ownerTestToken}` },
  })
  expect(response.status()).toBe(200)
}

async function wcagViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
  return results.violations.map(({ id, impact, nodes }) => ({
    id,
    impact,
    targets: nodes.map(({ target }) => target),
  }))
}

function storyDocument(text: string) {
  return { content: [{ content: [{ text, type: 'text' }], type: 'paragraph' }], type: 'doc' }
}

async function json<T>(response: APIResponse): Promise<T> {
  expect(response.status()).toBe(200)
  return (await response.json()) as T
}

interface StoryMutation {
  readonly article: { readonly id: string; readonly slug: string; readonly version: number }
  readonly revision: { readonly id: string }
}

test('renders home, article, and section pages with landmarks and no axe violations at 390 and 1440 pixels', async ({
  page,
  request,
}) => {
  test.setTimeout(90_000)
  await seedReaderLab(request)

  for (const viewport of viewports) {
    await page.setViewportSize(viewport)
    for (const path of readerPages) {
      const response = await page.goto(path)
      const label = `${path} at ${viewport.width}px`

      expect(response?.status(), label).toBe(200)
      await expect(page.getByRole('banner'), label).toHaveCount(1)
      await expect(page.getByRole('main'), label).toHaveCount(1)
      await expect(page.getByRole('heading', { level: 1 }), label).toHaveCount(1)
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
        ),
        label,
      ).toBe(true)
      expect(await wcagViolations(page), label).toEqual([])
    }
  }
})

test('links seeded stories between home, sections, and articles', async ({ page, request }) => {
  await seedReaderLab(request)

  await page.goto('/')
  await page
    .getByRole('navigation', { name: 'Sections' })
    .getByRole('link', { name: 'Architecture' })
    .click()
  await expect(page).toHaveURL('/sections/architecture')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Architecture')
  await page.getByRole('link', { name: 'Three cabins and the case for building less' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Three cabins and the case for building less',
  )
  await expect(page.getByRole('img', { name: /small cabin window at first light/ })).toBeVisible()

  const image = await request.get('/api/media/media-lab-cabin-morning')
  expect(image.status()).toBe(200)
  expect(image.headers()['content-type']).toBe('image/png')
  expect((await request.get('/api/media/media-lab-unknown')).status()).toBe(404)
  expect((await request.get('/sections/unknown-section')).status()).toBe(404)
})

test('shows owner-published stories on the next request, removes unpublished ones, and shows republished revisions', async ({
  context,
  page,
}, testInfo) => {
  test.setTimeout(60_000)
  await authenticate(context)
  const suffix = `${testInfo.project.name}-${Date.now()}`
  const title = `Reader journey ${suffix}`
  const dek = 'A complete summary that prepares readers for this reader journey story.'
  const firstText = 'The first published version of this story reaches readers right away.'
  const revisedText = 'The revised version replaces the first one as soon as it is republished.'
  const ownerHeaders = { origin: siteOrigin }

  const created = await json<StoryMutation>(
    await context.request.post('/api/owner/stories', {
      data: {
        dek,
        document: storyDocument(firstText),
        idempotencyKey: `reader-create-${suffix}`,
        title,
      },
      headers: ownerHeaders,
    }),
  )
  const storyPath = `/stories/${created.article.slug}`
  const act = (data: Record<string, unknown>) =>
    context.request.post(`/api/owner/stories/${created.article.id}/actions`, {
      data,
      headers: ownerHeaders,
    })

  const published = await json<StoryMutation>(
    await act({
      action: 'publish',
      expectedVersion: created.article.version,
      idempotencyKey: `reader-publish-${suffix}`,
      revisionId: created.revision.id,
    }),
  )
  await page.goto('/')
  await expect(page.getByRole('link', { name: title })).toBeVisible()
  expect((await page.goto(storyPath))?.status()).toBe(200)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(title)
  await expect(page.getByText(firstText)).toBeVisible()

  const unpublished = await json<{ readonly version: number }>(
    await act({
      action: 'unpublish',
      expectedVersion: published.article.version,
      idempotencyKey: `reader-unpublish-${suffix}`,
      reason: 'Holding the story for corrections.',
    }),
  )
  expect((await page.goto(storyPath))?.status()).toBe(404)
  await page.goto('/')
  await expect(page.getByRole('link', { name: title })).toHaveCount(0)

  const saved = await json<StoryMutation>(
    await context.request.patch(`/api/owner/stories/${created.article.id}`, {
      data: {
        dek,
        document: storyDocument(revisedText),
        expectedVersion: unpublished.version,
        idempotencyKey: `reader-save-${suffix}`,
        title,
      },
      headers: ownerHeaders,
    }),
  )
  await json<StoryMutation>(
    await act({
      action: 'publish',
      expectedVersion: saved.article.version,
      idempotencyKey: `reader-republish-${suffix}`,
      revisionId: saved.revision.id,
    }),
  )
  expect((await page.goto(storyPath))?.status()).toBe(200)
  await expect(page.getByText(revisedText)).toBeVisible()
  await expect(page.getByText(firstText)).toHaveCount(0)
})
