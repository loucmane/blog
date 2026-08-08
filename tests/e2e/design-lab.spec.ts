import AxeBuilder from '@axe-core/playwright'
import { expect, test, type BrowserContext, type Locator, type Page } from '@playwright/test'

const ownerTestToken = 'task43-owner-test-token-with-more-than-thirty-two-bytes'
const pngPixel = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII=',
  'base64',
)
const designDirections = [
  'folio',
  'contact',
  'halo',
  'blue-pencil',
  'light-table',
  'edition-zero',
  'margin-studio',
  'pressroom',
  'galley-27',
  'aperture',
  'live-issue',
  'mercury',
  'cutline',
  'edition-os',
  'fullbleed',
  'spread',
  'hearth',
  'vitrine',
  'pulse',
  'ledger',
  'meridian',
] as const
const indexDirectionOrder = [
  'blue-pencil',
  'light-table',
  'edition-zero',
  'margin-studio',
  'pressroom',
  'galley-27',
  'aperture',
  'live-issue',
  'mercury',
  'cutline',
  'edition-os',
  'folio',
  'contact',
  'halo',
  'fullbleed',
  'spread',
  'hearth',
  'vitrine',
  'pulse',
  'ledger',
  'meridian',
] as const

async function authenticate(context: BrowserContext) {
  const response = await context.request.post('/api/owner/fixture-session', {
    headers: { authorization: `Bearer ${ownerTestToken}` },
  })
  expect(response.status()).toBe(200)
}

async function waitForDirectionSwap(page: Page) {
  const stage = page.locator('.design-lab-stage-swap')
  if ((await stage.count()) === 0) return
  await stage.evaluate(async (element) => {
    await Promise.all(
      element.getAnimations().map((animation) => animation.finished.catch(() => undefined)),
    )
  })
}

async function seriousAccessibilityViolations(page: Page) {
  await waitForDirectionSwap(page)
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
  return result.violations.filter(({ impact }) => impact === 'critical' || impact === 'serious')
}

async function activateControl(page: Page, locator: Locator, touch: boolean) {
  if (!touch) {
    await locator.click()
    return
  }
  await locator.scrollIntoViewIfNeeded()
  const hitTarget = await locator.evaluate((element) => {
    const bounds = element.getBoundingClientRect()
    const target = document.elementFromPoint(
      bounds.left + bounds.width / 2,
      bounds.top + bounds.height / 2,
    )
    return {
      element: `${element.tagName.toLowerCase()}:${element.textContent?.trim()}`,
      point: { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 },
      target: target ? `${target.tagName.toLowerCase()}:${target.textContent?.trim()}` : null,
      targetIsControl: target === element || element.contains(target),
    }
  })
  expect(hitTarget.targetIsControl, JSON.stringify(hitTarget)).toBe(true)
  await locator.evaluate((element: HTMLElement) => element.click())
}

test('indexes every direction and round-trips URL navigation', async ({ context, page }) => {
  test.setTimeout(120_000)
  await authenticate(context)
  await page.goto('/owner/design-lab')
  await expect(page.getByTestId('design-lab-connection')).toHaveAttribute(
    'aria-label',
    'Live · private owner workspace',
  )

  await expect(page.getByRole('heading', { level: 1, name: 'All directions' })).toBeVisible()
  for (const heading of [
    'Round 1 · Archive',
    'Round 2 · Archive',
    'Round 3 · Archive',
    'Round 4 · Finalists',
    'Round 5 · New concepts',
  ]) {
    await expect(page.getByRole('heading', { level: 2, name: heading })).toBeVisible()
  }
  for (const direction of indexDirectionOrder) {
    await expect(page.getByTestId(`design-lab-card-${direction}`)).toHaveAttribute(
      'href',
      new RegExp(`direction=${direction}&view=desk`),
    )
  }
  expect(await seriousAccessibilityViolations(page)).toEqual([])

  const storyId = new URL(page.url()).searchParams.get('story')
  await page.getByTestId('design-lab-card-blue-pencil').click()
  await expect(page.locator('select[aria-label="Visual direction"]')).toHaveValue('blue-pencil')
  for (const expectedDirection of indexDirectionOrder.slice(1)) {
    await page.getByRole('button', { name: /^Next direction:/ }).click()
    await expect(page.locator('select[aria-label="Visual direction"]')).toHaveValue(
      expectedDirection,
    )
  }
  await page.getByRole('button', { name: /^Next direction:/ }).click()
  await expect(page.locator('select[aria-label="Visual direction"]')).toHaveValue('blue-pencil')

  await page.getByRole('button', { name: 'write', exact: true }).click()
  await expect(page).toHaveURL(/direction=blue-pencil&view=write/)
  await page.getByRole('button', { name: 'reader', exact: true }).click()
  await expect(page).toHaveURL(/direction=blue-pencil&view=reader/)
  await page.goBack()
  await expect(page.getByRole('button', { name: 'write', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.goForward()
  await expect(page.getByRole('button', { name: 'reader', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  if (storyId) expect(new URL(page.url()).searchParams.get('story')).toBe(storyId)
  await page.reload()
  await expect(page.locator('select[aria-label="Visual direction"]')).toHaveValue('blue-pencil')
  await expect(page.getByRole('button', { name: 'reader', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(await seriousAccessibilityViolations(page)).toEqual([])

  await page.goto('/owner/design-lab?direction=edition-11&view=reader')
  await expect(page.getByRole('heading', { level: 1, name: 'All directions' })).toBeVisible()
  await expect(
    page.getByText('“edition-11” isn’t a direction. Showing all directions.'),
  ).toBeVisible()

  await page.goto('/owner/design-lab?direction=folio&view=grid')
  await expect(page.locator('select[aria-label="Visual direction"]')).toHaveValue('folio')
  await expect(page.getByRole('button', { name: 'desk', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.getByText('“grid” isn’t a view. Showing the desk view.')).toBeVisible()

  await page.goto('/owner/design-lab#halo/reader')
  await expect(page.locator('select[aria-label="Visual direction"]')).toHaveValue('halo')
  await expect(page.getByRole('button', { name: 'reader', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(new URL(page.url()).hash).toBe('')
  expect(new URL(page.url()).searchParams.get('direction')).toBe('halo')
  expect(new URL(page.url()).searchParams.get('view')).toBe('reader')

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/owner/design-lab?direction=fullbleed&view=write')
  await expect(page.locator('select[aria-label="Visual direction"]')).toHaveValue('fullbleed')
  await expect(page.locator('.design-lab-stage-swap')).toHaveCSS('animation-name', 'none')
})

test('shares one private publishing journey across every design direction', async ({
  context,
  page,
}, testInfo) => {
  test.setTimeout(120_000)
  await authenticate(context)
  await page.route(
    '**/api/owner/stories',
    async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          body: JSON.stringify({ stories: [] }),
          contentType: 'application/json',
        })
        return
      }
      await route.continue()
    },
    { times: 1 },
  )
  await page.goto('/owner/design-lab')
  const touch = testInfo.project.name === 'mobile-chromium'
  const seedTitle = `Readiness draft ${testInfo.project.name} ${Date.now()}`
  const directionViolations: Array<{
    readonly direction: string
    readonly violations: Awaited<ReturnType<typeof seriousAccessibilityViolations>>
  }> = []
  await expect(page.getByTestId('design-lab-connection')).toHaveAttribute(
    'aria-label',
    'Live · private owner workspace',
  )
  await page.getByTestId('design-lab-card-folio').click()
  await expect(page).toHaveURL(/direction=folio&view=desk/)

  await activateControl(page, page.getByRole('button', { name: 'write', exact: true }), touch)
  await expect(page).toHaveURL(/direction=folio&view=write/)
  await page.getByLabel('Story title').fill(seedTitle)
  await activateControl(page, page.getByRole('button', { name: 'Review publication' }), touch)
  let publicationDialog = page.getByRole('dialog', { name: 'publication review' })
  await expect(publicationDialog.getByText('Save the draft first', { exact: true })).toBeVisible()
  await expect(publicationDialog.getByRole('button', { name: 'Save draft' })).toBeVisible()
  await expect(
    publicationDialog.getByRole('button', { name: 'Schedule publication' }),
  ).toBeDisabled()
  await expect(publicationDialog.getByRole('button', { name: 'Publish story now' })).toBeDisabled()
  await expect(
    publicationDialog.getByText('Publish becomes available when the checklist is done.'),
  ).toBeVisible()
  await expect(publicationDialog).not.toContainText(/protected/i)
  await publicationDialog.getByRole('button', { name: 'Save draft' }).click()
  await expect(page).toHaveURL(/[?&]story=article-[^&]+/)
  await expect(publicationDialog.getByTestId('publication-check-draft')).toContainText('Done')
  const closePublicationReview = page.getByRole('button', { name: 'Close publication review' })
  if (touch) {
    await expect
      .poll(() =>
        closePublicationReview.evaluate((button) => {
          const bounds = button.getBoundingClientRect()
          const hitTarget = document.elementFromPoint(
            bounds.left + bounds.width / 2,
            bounds.top + bounds.height / 2,
          )
          return hitTarget === button || (hitTarget !== null && button.contains(hitTarget))
        }),
      )
      .toBe(true)
  }
  await activateControl(page, closePublicationReview, touch)
  await expect(publicationDialog).toBeHidden()
  await activateControl(page, page.getByRole('button', { name: 'desk', exact: true }), touch)
  await expect(page).toHaveURL(/direction=folio&view=desk/)

  const title = `Tracked design lab ${testInfo.project.name} ${Date.now()}`
  await page
    .getByRole('button', { name: /Begin a story|Start a story|Start a (private|protected) draft/ })
    .click()
  await page.getByLabel('Working title').fill(title)
  await page.getByRole('button', { name: 'Create private draft' }).click()
  await expect(page).toHaveURL(/story=article-/)

  await page.getByLabel('Story title').fill('No')
  await page.getByLabel('Story body').fill('Short')
  await activateControl(page, page.getByRole('button', { name: 'Review publication' }), touch)
  publicationDialog = page.getByRole('dialog', { name: 'publication review' })
  for (const blocker of [
    'Add a headline and some writing',
    'Add a short summary (about a sentence)',
    'Describe the image for readers who cannot see it',
  ]) {
    await expect(publicationDialog.getByText(blocker, { exact: true })).toBeVisible()
  }
  await expect(page.getByTestId('publication-check-draft')).toContainText('Done')
  await expect(
    publicationDialog.getByRole('button', { name: 'Schedule publication' }),
  ).toBeDisabled()
  await expect(publicationDialog.getByRole('button', { name: 'Publish story now' })).toBeDisabled()

  await publicationDialog.getByRole('button', { name: 'Go to story' }).click()
  await expect(page.getByLabel('Story title')).toBeFocused()
  await page.getByLabel('Story title').fill(title)
  await page
    .getByLabel('Story body')
    .fill(
      'The owner starts with one calm decision.\n\nEvery edit is autosaved to one private story.\n\nPublication remains explicit and reversible.',
    )

  await activateControl(page, page.getByRole('button', { name: 'Review publication' }), touch)
  await page.getByRole('button', { name: 'Go to summary' }).click()
  await expect(page.getByLabel('Short summary')).toBeFocused()
  await page
    .getByLabel('Short summary')
    .fill('A private owner workflow shared by fifteen premium visual directions.')

  await activateControl(page, page.getByRole('button', { name: 'Review publication' }), touch)
  await page.getByRole('button', { name: 'Describe image' }).click()
  await expect(page.getByRole('dialog', { name: 'editorial image upload' })).toBeVisible()

  await page.getByLabel('Image file').setInputFiles({
    buffer: pngPixel,
    mimeType: 'image/png',
    name: 'design-lab-proof.png',
  })
  await page
    .getByLabel('Description for people who cannot see it')
    .fill('A private editorial image in the design lab')
  await page.getByLabel('Caption').fill('Design-lab publication proof')
  await page.getByLabel('Credit').fill('North House studio')
  await page.getByRole('button', { name: 'Upload and use image' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Image uploaded' })).toBeVisible()

  const reviewPublicationButton = page.getByRole('button', { name: 'Review publication' })
  await activateControl(page, reviewPublicationButton, touch)
  await expect(page.getByRole('button', { name: 'Schedule publication' })).toBeEnabled()
  await expect(page.getByRole('button', { name: 'Publish story now' })).toBeEnabled()
  await page.getByRole('button', { name: 'Publish story now' }).click()
  await expect(page.getByText('Live reader story')).toBeVisible()

  for (const direction of designDirections) {
    await page.getByLabel('Visual direction').selectOption(direction)
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()
    await expect(
      direction === 'fullbleed'
        ? page.getByText(/^Published /)
        : direction === 'spread'
          ? page.getByText('Published', { exact: true })
          : direction === 'hearth'
            ? page.getByText('Published — readers can see this', { exact: true })
            : direction === 'vitrine'
              ? page.getByText('Published', { exact: true })
              : direction === 'pulse'
                ? page.getByText('Published', { exact: true })
                : direction === 'ledger'
                  ? page.getByTestId('ledger-lifecycle-copy')
                  : direction === 'meridian'
                    ? page.getByTestId('meridian-lifecycle-chip')
                    : page.getByText('Live reader story'),
    ).toBeVisible()
    if (direction === 'fullbleed') {
      await expect(
        page.getByText(
          'A study in how a northern room receives, holds, and releases the briefest light.',
        ),
      ).toHaveCount(0)
    }
    await activateControl(page, page.getByRole('button', { name: 'write', exact: true }), touch)
    await expect(page.getByLabel('Story title')).toHaveValue(title)
    await expect(page.getByText('Saved just now', { exact: true }).first()).toBeVisible()
    if (!touch) {
      const violations = await seriousAccessibilityViolations(page)
      if (violations.length > 0) directionViolations.push({ direction, violations })
    }
    await activateControl(page, page.getByRole('button', { name: 'reader', exact: true }), touch)
  }
  expect(directionViolations).toEqual([])

  await page.getByLabel('Visual direction').selectOption('fullbleed')
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()
  await activateControl(page, page.getByRole('button', { name: 'write', exact: true }), touch)
  await activateControl(page, page.getByRole('button', { name: 'Review publication' }), touch)
  await page.getByLabel('Reason for the editorial record').fill('Lifecycle canary')
  await page.getByRole('button', { name: 'Unpublish story' }).click()
  await expect(
    page.getByText('Unpublished. The story and earlier drafts remain safe.', { exact: true }),
  ).toBeVisible()

  await activateControl(page, page.getByRole('button', { name: 'Review publication' }), touch)
  await page.getByRole('button', { name: 'Schedule publication' }).click()
  await expect(page.getByTestId('fullbleed-lifecycle-state')).toHaveText(
    'Scheduled for Sunday 08:00',
  )
  await activateControl(page, page.getByRole('button', { name: 'write', exact: true }), touch)
  await activateControl(page, page.getByRole('button', { name: 'Review publication' }), touch)
  await page.getByRole('button', { name: 'Cancel scheduled publication' }).click()
  await expect(
    page.getByText('Schedule cancelled. The private draft remains available.', { exact: true }),
  ).toBeVisible()

  await page.reload()
  await expect(page.getByLabel('Story title')).toHaveValue(title)
  expect(await seriousAccessibilityViolations(page)).toEqual([])
})
