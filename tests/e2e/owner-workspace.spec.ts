import AxeBuilder from '@axe-core/playwright'
import { expect, test, type BrowserContext, type Page } from '@playwright/test'

const ownerTestToken = 'task43-owner-test-token-with-more-than-thirty-two-bytes'
const publicationWorkerToken = ['task43', 'publication', 'worker', 'token', 'more-than-32'].join(
  '-',
)
const pngPixel = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII=',
  'base64',
)

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

async function createStory(page: Page, suffix: string) {
  await page.goto('/owner/stories/new')
  await page.getByLabel('Story title', { exact: true }).fill(`Owner workflow ${suffix}`)
  await page
    .getByLabel('Short summary')
    .fill('A plain-language summary that prepares readers for this complete editorial story.')
  const editor = page.getByRole('textbox', { name: 'Story body' })
  await editor.fill(
    'This complete owner publishing journey saves safely, previews clearly, and remains portable.',
  )
  const savedResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/owner/stories') && response.request().method() === 'POST',
  )
  await page.getByRole('button', { name: 'Save now' }).click()
  expect((await savedResponse).status()).toBe(200)
  await expect(page).toHaveURL(/\/owner\/stories\/article-/)
  await expect(page.getByText('draft', { exact: true })).toBeVisible()
  return page.url()
}

test('keeps sign-in private, understandable, and accessible', async ({ page }) => {
  const response = await page.goto('/owner/sign-in')
  expect(response?.status()).toBe(200)
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Use a passkey' })).toBeVisible()
  expect(response?.headers()['cache-control']).toContain('private')
  expect(response?.headers()['x-robots-tag']).toContain('noindex')
  expect(await seriousAccessibilityViolations(page)).toEqual([])
})

test('supports keyboard-only authoring, reduced motion, and 200-percent-equivalent reflow', async ({
  context,
  page,
}) => {
  await authenticate(context)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ height: 800, width: 640 })
  await page.goto('/owner/stories/new')

  const title = page.getByLabel('Story title', { exact: true })
  await title.focus()
  await page.keyboard.type('Keyboard-first owner story')
  await page.keyboard.press('Tab')
  const summary = page.getByLabel('Short summary')
  await expect(summary).toBeFocused()
  await page.keyboard.type('A complete keyboard-only publishing summary for the magazine owner.')
  const editor = page.getByRole('textbox', { name: 'Story body' })
  await expect(editor).toHaveAttribute('aria-multiline', 'true')
  await editor.focus()
  await page.keyboard.type(
    'The owner can write, recover, and review this story without a pointer or technical tools.',
  )

  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(
    true,
  )
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
    ),
  ).toBe(true)
  for (const button of await page.getByRole('toolbar').getByRole('button').all()) {
    const box = await button.boundingBox()
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44)
  }
  expect(await seriousAccessibilityViolations(page)).toEqual([])
})

test('supports the owner publishing journey, offline recovery, media, and safe lifecycle actions', async ({
  context,
  page,
}, testInfo) => {
  test.setTimeout(60_000)
  await authenticate(context)
  await page.goto('/owner')
  await expect(page.getByRole('heading', { name: 'Stories' })).toBeVisible()
  expect(await seriousAccessibilityViolations(page)).toEqual([])

  await createStory(page, `${testInfo.project.name}-${Date.now()}`)

  const previewSummary = 'This unsaved summary must be included in the private preview.'
  await page.getByLabel('Short summary').fill(previewSummary)
  const previewPagePromise = page.waitForEvent('popup')
  await page.getByRole('button', { name: 'Preview' }).click()
  const previewPage = await previewPagePromise
  await expect(previewPage.getByRole('status').filter({ hasText: 'Private preview' })).toBeVisible()
  await expect(previewPage.getByRole('heading', { level: 1 })).toContainText('Owner workflow')
  await expect(previewPage.getByText(previewSummary)).toBeVisible()
  expect(await seriousAccessibilityViolations(previewPage)).toEqual([])
  await previewPage.close()

  await page.getByLabel('Image file').setInputFiles({
    buffer: pngPixel,
    mimeType: 'image/png',
    name: 'editorial-proof.png',
  })
  await page
    .getByLabel('Description for people who cannot see the image')
    .fill('A small editorial workflow proof')
  await page.getByLabel('Credit', { exact: true }).fill('Magazine owner')
  await page.getByRole('button', { name: 'Add image' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Image added' })).toBeVisible()
  await page
    .getByLabel('Image from media library')
    .selectOption({ label: 'A small editorial workflow proof' })
  await page.getByRole('button', { name: 'Insert image' }).click()
  await page.getByRole('button', { name: 'Save now' }).click()
  await expect(page.getByRole('status').filter({ hasText: /^Saved/ })).toBeVisible()

  await context.setOffline(true)
  await page
    .getByLabel('Short summary')
    .fill('This change is safe locally while the owner is offline.')
  await expect(page.getByRole('status').filter({ hasText: /offline/i })).toBeVisible()
  await context.setOffline(false)
  await expect(page.getByRole('status').filter({ hasText: /^Saved/ })).toBeVisible({
    timeout: 15_000,
  })

  await page.getByRole('button', { name: 'Publish now' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Published.' })).toBeVisible()
  await expect(page.getByText('published', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Unpublish' }).click()
  await page
    .getByLabel('Reason for the editorial record')
    .fill('Revise the story before republishing.')
  await page.getByRole('button', { name: 'Unpublish story' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Unpublished.' })).toBeVisible()

  const scheduled = new Date(Date.now() + 4 * 60 * 60 * 1_000).toISOString().slice(0, 16)
  await page.getByLabel('Schedule for').fill(scheduled)
  await page.getByRole('button', { name: 'Schedule publication' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Scheduled for' })).toBeVisible()
  await expect(page.getByText('scheduled', { exact: true })).toBeVisible()
  const worker = await context.request.post('/api/internal/publication-jobs', {
    headers: {
      authorization: `Bearer ${publicationWorkerToken}`,
      'x-magazine-test-now': new Date(Date.now() + 8 * 60 * 60 * 1_000).toISOString(),
    },
  })
  expect(worker.status()).toBe(200)
  expect(await worker.json()).toMatchObject({ processed: 1 })
  await page.reload()
  await expect(page.getByText('published', { exact: true })).toBeVisible()

  await page.getByLabel('Schedule for').fill(scheduled)
  await page.getByRole('button', { name: 'Schedule publication' }).click()
  await expect(page.getByText('scheduled', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Cancel scheduled publication' }).click()
  await expect(page.getByText('published', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Unpublish' }).click()
  await page
    .getByLabel('Reason for the editorial record')
    .fill('Conclude the lifecycle safety journey.')
  await page.getByRole('button', { name: 'Unpublish story' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Unpublished.' })).toBeVisible()

  const title = await page.getByLabel('Story title', { exact: true }).inputValue()
  await page.getByLabel('To delete, type the story title').fill(title)
  await page.getByRole('button', { name: 'Move to deleted stories' }).click()
  await expect(
    page.getByRole('status').filter({ hasText: 'Moved to deleted stories' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Restore story' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Story restored' })).toBeVisible()

  expect(await seriousAccessibilityViolations(page)).toEqual([])
})

test('publishes edits made while an older autosave is still in flight', async ({
  context,
  page,
}, testInfo) => {
  test.setTimeout(60_000)
  await authenticate(context)
  const storyUrl = await createStory(page, `save-barrier-${testInfo.project.name}-${Date.now()}`)
  const articleId = new URL(storyUrl).pathname.split('/').at(-1)
  if (!articleId) throw new Error('The saved story URL did not contain an article ID.')

  let releaseFirstSave = () => {}
  const firstSaveRelease = new Promise<void>((resolve) => {
    releaseFirstSave = resolve
  })
  let reportFirstSaveStarted = () => {}
  const firstSaveStarted = new Promise<void>((resolve) => {
    reportFirstSaveStarted = resolve
  })
  let delayed = false
  await page.route(`**/api/owner/stories/${articleId}`, async (route) => {
    if (route.request().method() !== 'PATCH' || delayed) {
      await route.continue()
      return
    }
    delayed = true
    reportFirstSaveStarted()
    const response = route.fetch()
    await firstSaveRelease
    await route.fulfill({ response: await response })
  })

  const summary = page.getByLabel('Short summary')
  await summary.fill('This older autosave must not become the published reader version.')
  await page.getByRole('button', { name: 'Save now' }).click()
  await firstSaveStarted
  const visibleSummary = 'The owner can publish these newest visible edits without losing them.'
  await summary.fill(visibleSummary)
  await page.getByRole('button', { name: 'Publish now' }).click()
  await expect(summary).toBeDisabled()
  await expect(page.getByLabel('Image file')).toBeDisabled()
  releaseFirstSave()

  await expect(page.getByRole('status').filter({ hasText: 'Published.' })).toBeVisible({
    timeout: 15_000,
  })
  const response = await context.request.get(`/api/owner/stories/${articleId}`)
  expect(response.status()).toBe(200)
  const workspace = (await response.json()) as {
    article: { dek: string; publishedRevisionId: string }
    currentRevision: { id: string }
  }
  expect(workspace.article.dek).toBe(visibleSummary)
  expect(workspace.article.publishedRevisionId).toBe(workspace.currentRevision.id)
})

test('replays a committed lifecycle action after its response is lost', async ({
  context,
  page,
}, testInfo) => {
  await authenticate(context)
  const storyUrl = await createStory(
    page,
    `lifecycle-replay-${testInfo.project.name}-${Date.now()}`,
  )
  const articleId = new URL(storyUrl).pathname.split('/').at(-1)
  if (!articleId) throw new Error('The saved story URL did not contain an article ID.')

  const idempotencyKeys: string[] = []
  let releaseCommitted!: () => void
  const committed = new Promise<void>((resolve) => {
    releaseCommitted = resolve
  })
  let dropped = false
  await page.route(`**/api/owner/stories/${articleId}/actions`, async (route) => {
    const payload = route.request().postDataJSON() as {
      action?: string
      idempotencyKey?: string
    }
    if (payload.action !== 'publish') return route.continue()
    idempotencyKeys.push(payload.idempotencyKey ?? '')
    if (dropped) return route.continue()
    dropped = true
    const response = await route.fetch()
    expect(response.ok()).toBe(true)
    releaseCommitted()
    await route.abort('failed')
  })

  await page.getByRole('button', { name: 'Publish now' }).click()
  await committed
  await expect(page.getByRole('button', { name: 'Publish now' })).toBeEnabled()
  await page.getByRole('button', { name: 'Publish now' }).click()

  await expect(page.getByRole('status').filter({ hasText: 'Published.' })).toBeVisible()
  expect(idempotencyKeys).toHaveLength(2)
  expect(idempotencyKeys[1]).toBe(idempotencyKeys[0])
  const response = await context.request.get(`/api/owner/stories/${articleId}`)
  expect(response.status()).toBe(200)
  await expect(response.json()).resolves.toMatchObject({ article: { status: 'published' } })
})

test('preserves unsaved edits before restoring exactly one revision', async ({
  context,
  page,
}, testInfo) => {
  await authenticate(context)
  const storyUrl = await createStory(page, `restore-once-${testInfo.project.name}-${Date.now()}`)
  const articleId = new URL(storyUrl).pathname.split('/').at(-1)
  if (!articleId) throw new Error('The saved story URL did not contain an article ID.')

  await page.getByLabel('Short summary').fill('A second revision that remains in history.')
  await page.getByRole('button', { name: 'Save now' }).click()
  await expect(page.getByRole('status').filter({ hasText: /^Saved/ })).toBeVisible()
  const beforeResponse = await context.request.get(`/api/owner/stories/${articleId}`)
  const before = (await beforeResponse.json()) as { revisions: readonly { id: string }[] }

  const unsavedSummary = 'This unsaved owner edit must remain in immutable history.'
  await page.getByLabel('Short summary').fill(unsavedSummary)
  const restoreButton = page.getByRole('button', { name: 'Restore as draft' }).first()
  expect((await restoreButton.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44)
  let releaseRestore!: () => void
  let reportRestoreRequest!: () => void
  const restoreRequested = new Promise<void>((resolve) => {
    reportRestoreRequest = resolve
  })
  const restoreReleased = new Promise<void>((resolve) => {
    releaseRestore = resolve
  })
  await page.route('**/api/owner/stories/*/actions', async (route) => {
    const payload = route.request().postDataJSON() as { action?: string }
    if (payload.action !== 'restore-revision') return route.continue()
    reportRestoreRequest()
    await restoreReleased
    await route.continue()
  })
  const restoreClick = restoreButton.click()
  await restoreRequested
  await expect(page.getByLabel('Story title', { exact: true })).toBeDisabled()
  await expect(page.getByLabel('Short summary')).toBeDisabled()
  await expect(page.getByRole('textbox', { name: 'Story body' })).toHaveAttribute(
    'contenteditable',
    'false',
  )
  releaseRestore()
  await restoreClick
  await expect(
    page.getByRole('status').filter({ hasText: 'Revision restored as a new draft' }),
  ).toBeVisible()
  await page.waitForTimeout(2_000)
  await expect(
    page.getByRole('status').filter({ hasText: 'Revision restored as a new draft' }),
  ).toBeVisible()

  const afterResponse = await context.request.get(`/api/owner/stories/${articleId}`)
  const after = (await afterResponse.json()) as {
    currentRevision: { id: string }
    revisions: readonly { dek?: string; id: string }[]
  }
  expect(after.revisions).toHaveLength(before.revisions.length + 2)
  expect(after.revisions.some(({ dek }) => dek === unsavedSummary)).toBe(true)
  expect(after.currentRevision.id).toBe(after.revisions[0]!.id)
})

test('preserves both versions when two owner windows conflict', async ({
  context,
  page,
}, testInfo) => {
  await authenticate(context)
  const storyUrl = await createStory(page, `conflict-${testInfo.project.name}-${Date.now()}`)
  const secondPage = await context.newPage()
  await secondPage.goto(storyUrl)

  await secondPage
    .getByLabel('Short summary')
    .fill('The second window saved this clear and complete summary first.')
  await secondPage.getByRole('button', { name: 'Save now' }).click()
  await expect(secondPage.getByRole('status').filter({ hasText: /^Saved/ })).toBeVisible()

  await page
    .getByLabel('Story title', { exact: true })
    .fill(`Preserved local copy ${testInfo.project.name}`)
  await page.getByRole('button', { name: 'Save now' }).click()
  await expect(
    page.getByRole('status').filter({ hasText: 'changed in another window' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Keep my copy and save again' }).click()
  await expect(page.getByRole('status').filter({ hasText: /^Saved/ })).toBeVisible({
    timeout: 15_000,
  })
  await expect(page.getByLabel('Story title', { exact: true })).toHaveValue(
    `Preserved local copy ${testInfo.project.name}`,
  )
  await secondPage.close()
})

test('recovers an unsaved local copy after the owner reloads', async ({
  context,
  page,
}, testInfo) => {
  await authenticate(context)
  const storyUrl = await createStory(page, `recovery-${testInfo.project.name}-${Date.now()}`)
  const articleId = new URL(storyUrl).pathname.split('/').at(-1)
  if (!articleId) throw new Error('The saved story URL did not contain an article ID.')
  const recoveredTitle = `Recovered local copy ${testInfo.project.name}`

  await page.evaluate(
    ({ id, title }) => {
      window.localStorage.setItem(
        `magazine-owner-recovery:v1:${id}`,
        JSON.stringify({
          articleId: id,
          baseVersion: 2,
          dek: 'This recovery copy remains available after an accidental reload.',
          document: {
            content: [
              {
                content: [
                  { text: 'Recovered owner work that was not yet on the server.', type: 'text' },
                ],
                type: 'paragraph',
              },
            ],
            type: 'doc',
          },
          savedAt: new Date().toISOString(),
          title,
        }),
      )
    },
    { id: articleId, title: recoveredTitle },
  )

  await page.reload()
  await expect(page.getByRole('alert').filter({ hasText: 'newer recovery copy' })).toBeVisible()
  await page.getByRole('button', { name: 'Open recovery copy' }).click()
  await expect(page.getByLabel('Story title', { exact: true })).toHaveValue(recoveredTitle)
  await expect(page.getByRole('status').filter({ hasText: 'Recovery copy opened' })).toBeVisible()
  expect(await seriousAccessibilityViolations(page)).toEqual([])
})
