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
const pngPixel = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII=',
  'base64',
)
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

function storyDocument(text: string, image?: { readonly alt: string; readonly mediaId: string }) {
  const paragraph = { content: [{ text, type: 'text' }], type: 'paragraph' }
  if (!image) return { content: [paragraph], type: 'doc' }
  const imageNode = {
    attrs: {
      ...image,
      caption: '',
      credit: { name: 'Reader journey', url: null },
      focalPoint: { x: 0.5, y: 0.5 },
    },
    type: 'mediaImage',
  }
  return { content: [imageNode, paragraph], type: 'doc' }
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
      expect(response?.headers()['cache-control'], label).toContain('no-store')
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
  const cabinImage = page.getByRole('img', { name: /small cabin window at first light/ })
  await expect(cabinImage).toBeVisible()
  await expect(cabinImage).toHaveAttribute('src', '/api/media/media-lab-cabin-morning')

  const image = await request.get('/api/media/media-lab-cabin-morning')
  expect(image.status()).toBe(200)
  expect(image.headers()['content-type']).toBe('image/png')
  expect(image.headers()['cache-control']).toBe('public, no-cache')
  const entityTag = image.headers()['etag'] ?? ''
  expect(entityTag).toMatch(/^"[0-9a-f]{64}"$/)
  const revalidated = await request.get('/api/media/media-lab-cabin-morning', {
    headers: { 'if-none-match': entityTag },
  })
  expect(revalidated.status()).toBe(304)
  const unknownImage = await request.get('/api/media/media-lab-unknown', {
    headers: { 'if-none-match': entityTag },
  })
  expect(unknownImage.status()).toBe(404)
  expect(unknownImage.headers()['cache-control']).toBe('no-store')
  const optimizedImage = await request.get(
    `/_next/image?url=${encodeURIComponent('/api/media/media-lab-cabin-morning')}&w=640&q=75`,
  )
  expect(optimizedImage.status()).toBe(400)
  expect(await optimizedImage.text()).toBe('"url" parameter is not allowed')
  expect((await request.get('/sections/unknown-section')).status()).toBe(404)
})

test('shows owner-published stories on the next request, removes unpublished ones and their images, and shows republished revisions', async ({
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
  const imageAlt = `Reader journey image ${suffix}`
  const ownerHeaders = { origin: siteOrigin }

  const uploaded = await json<{ readonly asset: { readonly id: string } }>(
    await context.request.post('/api/owner/media', {
      headers: ownerHeaders,
      multipart: {
        alt: imageAlt,
        creditName: 'Reader journey',
        file: { buffer: pngPixel, mimeType: 'image/png', name: 'reader-journey.png' },
      },
    }),
  )
  const imagePath = `/api/media/${uploaded.asset.id}`
  const created = await json<StoryMutation>(
    await context.request.post('/api/owner/stories', {
      data: {
        dek,
        document: storyDocument(firstText, { alt: imageAlt, mediaId: uploaded.asset.id }),
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
  await expect(page.getByRole('img', { name: imageAlt })).toHaveAttribute('src', imagePath)
  const servedImage = await context.request.get(imagePath)
  expect(servedImage.status()).toBe(200)
  expect(servedImage.headers()['cache-control']).toBe('public, no-cache')
  const cachedImage = { headers: { 'if-none-match': servedImage.headers()['etag'] ?? '' } }
  expect(cachedImage.headers['if-none-match']).toMatch(/^"[0-9a-f]{64}"$/)
  expect((await context.request.get(imagePath, cachedImage)).status()).toBe(304)

  const unpublished = await json<{ readonly version: number }>(
    await act({
      action: 'unpublish',
      expectedVersion: published.article.version,
      idempotencyKey: `reader-unpublish-${suffix}`,
      reason: 'Holding the story for corrections.',
    }),
  )
  const unpublishedPage = await page.goto(storyPath)
  expect(unpublishedPage?.status()).toBe(404)
  expect(unpublishedPage?.headers()['cache-control']).toContain('no-store')
  const revokedImage = await context.request.get(imagePath, cachedImage)
  expect(revokedImage.status()).toBe(404)
  expect(revokedImage.headers()['cache-control']).toBe('no-store')
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
  expect((await context.request.get(imagePath, cachedImage)).status()).toBe(404)
})
