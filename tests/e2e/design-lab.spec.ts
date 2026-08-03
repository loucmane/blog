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
] as const

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

test('shares one protected publishing journey across every design direction', async ({
  context,
  page,
}, testInfo) => {
  test.setTimeout(120_000)
  await authenticate(context)
  await page.goto('/owner/design-lab')
  const touch = testInfo.project.name === 'mobile-chromium'
  const directionViolations: Array<{
    readonly direction: string
    readonly violations: Awaited<ReturnType<typeof seriousAccessibilityViolations>>
  }> = []
  await expect(page.getByTestId('design-lab-connection')).toHaveAttribute(
    'aria-label',
    'Live backend · protected owner workspace',
  )

  const title = `Tracked design lab ${testInfo.project.name} ${Date.now()}`
  await page
    .getByRole('button', { name: /Begin a story|Start a story|Start a protected draft/ })
    .click()
  await page.getByLabel('Working title').fill(title)
  await page.getByRole('button', { name: 'Create protected draft' }).click()
  await expect(page).toHaveURL(/story=article-/)

  await page
    .getByLabel('Short summary')
    .fill('A protected owner workflow shared by fourteen premium visual directions.')
  await page
    .getByLabel('Story body')
    .fill(
      'The owner starts with one calm decision.\n\nEvery edit is autosaved to one protected story.\n\nPublication remains explicit and reversible.',
    )
  await expect(page.getByText('Saved to the protected workspace', { exact: true })).toBeVisible({
    timeout: 15_000,
  })

  const addImageButton = page.getByRole('button', {
    name: touch ? '+ Media' : 'Add image',
  })
  await activateControl(page, addImageButton, touch)
  await page.getByLabel('Image file').setInputFiles({
    buffer: pngPixel,
    mimeType: 'image/png',
    name: 'design-lab-proof.png',
  })
  await page
    .getByLabel('Description for people who cannot see it')
    .fill('A protected editorial image in the design lab')
  await page.getByLabel('Caption').fill('Design-lab publication proof')
  await page.getByLabel('Credit').fill('North House studio')
  await page.getByRole('button', { name: 'Upload and use image' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Image uploaded' })).toBeVisible()

  const reviewPublicationButton = page.getByRole('button', { name: 'Review publication' })
  await activateControl(page, reviewPublicationButton, touch)
  await page.getByRole('button', { name: 'Publish story now' }).click()
  await expect(page.getByText('Live reader story')).toBeVisible()

  for (const direction of designDirections) {
    await page.getByLabel('Visual direction').selectOption(direction)
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()
    await expect(page.getByText('Live reader story')).toBeVisible()
    await activateControl(page, page.getByRole('button', { name: 'write', exact: true }), touch)
    await expect(page.getByLabel('Story title')).toHaveValue(title)
    await expect(
      page.getByText('Saved to the protected workspace', { exact: true }).first(),
    ).toBeVisible()
    if (!touch) {
      const violations = await seriousAccessibilityViolations(page)
      if (violations.length > 0) directionViolations.push({ direction, violations })
    }
    await activateControl(page, page.getByRole('button', { name: 'reader', exact: true }), touch)
  }
  expect(directionViolations).toEqual([])

  await activateControl(page, page.getByRole('button', { name: 'write', exact: true }), touch)
  await activateControl(page, page.getByRole('button', { name: 'Review publication' }), touch)
  await page.getByLabel('Reason for the editorial record').fill('Lifecycle canary')
  await page.getByRole('button', { name: 'Unpublish story' }).click()
  await expect(
    page.getByText('Unpublished. The story and revision history remain safe.', { exact: true }),
  ).toBeVisible()

  await activateControl(page, page.getByRole('button', { name: 'Review publication' }), touch)
  await page.getByRole('button', { name: 'Schedule publication' }).click()
  await expect(page.getByText('SCHEDULED', { exact: true }).first()).toBeVisible()
  await activateControl(page, page.getByRole('button', { name: 'write', exact: true }), touch)
  await activateControl(page, page.getByRole('button', { name: 'Review publication' }), touch)
  await page.getByRole('button', { name: 'Cancel scheduled publication' }).click()
  await expect(
    page.getByText('Schedule cancelled. The protected story remains available.', { exact: true }),
  ).toBeVisible()

  await page.reload()
  await expect(page.getByLabel('Story title')).toHaveValue(title)
  expect(await seriousAccessibilityViolations(page)).toEqual([])
})
