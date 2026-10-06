import { mkdir } from 'node:fs/promises'
import path from 'node:path'

import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import { normalizeSlug } from '../../server/content/domain'
import { labStories } from '../../server/lab/north-house'

const storyTitle = 'The long table: a field guide to the North House kitchen'
const storyPath = '/stories/the-long-table-a-field-guide-to-the-north-house-kitchen'
const sectionPath = '/sections/interiors'
const root = '[data-reader-direction="quiet-monograph"]'

test.beforeEach(async ({ context, page, request }) => {
  const seed = await request.post('/api/internal/lab-seed', {
    headers: { authorization: 'Bearer task44-lab-seed-token-with-more-than-32-bytes' },
  })
  expect(seed.status()).toBe(200)
  const session = await context.request.post('/api/owner/fixture-session', {
    headers: { authorization: 'Bearer task43-owner-test-token-with-more-than-thirty-two-bytes' },
  })
  expect(session.status()).toBe(200)
  await page.goto('/owner/reader-lab')
  await page
    .locator('[data-reader-direction-card="quiet-monograph"]')
    .getByRole('button', { name: /^View the site in this direction/ })
    .click()
  await expect(page).toHaveURL('/')
  await expect(page.locator(root)).toBeVisible()
})

test('opens Quiet Monograph from the lab and renders published titles on all three pages', async ({
  page,
}) => {
  await expect(
    page.locator(root).getByRole('heading', { name: storyTitle, exact: true }),
  ).toBeVisible()
  await page.goto(storyPath)
  await expect(page.locator(root).getByRole('heading', { level: 1 })).toHaveText(storyTitle)
  await page.goto(sectionPath)
  await expect(page.locator(root).getByRole('heading', { level: 1 })).toHaveText('Interiors')
  await expect(
    page.locator(root).getByRole('heading', { name: storyTitle, exact: true }),
  ).toBeVisible()
})

test('has no overflow at every required width and an operable touch-sized menu', async ({
  page,
}) => {
  test.setTimeout(120_000)
  for (const width of [360, 390, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const path of ['/', storyPath, sectionPath]) {
      await page.goto(path)
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        `${path} at ${width}`,
      ).toBe(true)
      const menu = page.locator(`${root} summary`)
      await menu.click()
      const sections = page.locator(root).getByRole('navigation', { name: 'Sections' })
      await expect(sections).toBeVisible()
      for (const control of [menu, ...(await sections.getByRole('link').all())]) {
        const box = await control.boundingBox()
        expect(box?.width).toBeGreaterThanOrEqual(44)
        expect(box?.height).toBeGreaterThanOrEqual(44)
      }
      await sections.getByRole('link', { name: 'Interiors', exact: true }).click()
      await expect(page).toHaveURL(sectionPath)
    }
  }
})

test('keeps the seeded long-title, image-free, short and long-read stories readable at every width', async ({
  page,
}) => {
  test.setTimeout(180_000)
  const cases = labStories.filter(({ id }) =>
    [
      'article-lab-boathouse',
      'article-lab-chair',
      'article-lab-shelf',
      'article-lab-long-table',
    ].includes(id),
  )
  for (const width of [360, 390, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const story of cases) {
      await page.goto(`/stories/${normalizeSlug(story.title)}`)
      await page.evaluate(async () => {
        await document.fonts.ready
      })
      await expect(page.locator(root).getByRole('heading', { level: 1 })).toHaveText(story.title)
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        `${story.id} at ${width}px`,
      ).toBe(true)
      if (story.id === 'article-lab-chair') await expect(page.locator('.qm-hero')).toHaveCount(0)
    }
  }
})

test('uses visible keyboard focus, a keyboard-operable disclosure, and paper in dark mode', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const menu = page.locator(`${root} summary`)
  // Reach the menu through the real tab order, including the lab controls and skip link.
  for (
    let tabs = 0;
    tabs < 12 && !(await menu.evaluate((element) => element === document.activeElement));
    tabs++
  ) {
    await page.keyboard.press('Tab')
  }
  await expect(menu).toBeFocused()
  expect(await menu.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe('solid')
  await page.keyboard.press('Enter')
  await expect(page.locator(root).getByRole('navigation', { name: 'Sections' })).toBeVisible()
  await page.keyboard.press('Tab')
  await expect(
    page.locator(root).getByRole('navigation').getByRole('link', { name: 'All stories' }),
  ).toBeFocused()
  await page.evaluate(() => document.documentElement.classList.add('dark'))
  expect(
    await page.locator(root).evaluate((element) => getComputedStyle(element).backgroundColor),
  ).toBe('rgb(246, 245, 241)')
})

for (const width of [390, 1440]) {
  test(`passes axe with the lab bar at ${width}px`, async ({ page }) => {
    test.setTimeout(120_000)
    await page.setViewportSize({ width, height: 900 })
    for (const path of ['/', storyPath, sectionPath]) {
      await page.goto(path)
      await page.evaluate(async () => {
        await document.fonts.ready
      })
      await expect(page.getByRole('region', { name: 'Reader Lab', exact: true })).toBeVisible()
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze()
      expect(result.violations, `${path} at ${width}`).toEqual([])
    }
  })
}

test('keeps a visitor on baseline even with the direction cookie', async ({ browser }) => {
  const visitor = await browser.newContext()
  try {
    await visitor.addCookies([
      { name: 'reader_lab_direction', value: 'quiet-monograph', url: 'http://localhost:3100' },
    ])
    const page = await visitor.newPage()
    const fonts: string[] = []
    page.on('request', (request) => {
      if (request.resourceType() === 'font') fonts.push(request.url())
    })
    for (const path of ['/', storyPath, sectionPath]) {
      await page.goto(path)
      await page.evaluate(async () => {
        await document.fonts.ready
      })
      await expect(page.locator('[data-reader-direction="baseline"]')).toHaveCount(1)
      await expect(page.locator(root)).toHaveCount(0)
      await expect(page.locator('[data-reader-lab-bar]')).toHaveCount(0)
    }
    expect(fonts).toEqual([])
  } finally {
    await visitor.close()
  }
})

test('captures twelve seeded screenshots for review', async ({ page }) => {
  test.setTimeout(180_000)
  const destination = path.resolve('docs/worklog/blog-0044.3')
  await mkdir(destination, { recursive: true })
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 })
    for (const [name, route] of [
      ['home', '/'],
      ['article', storyPath],
      ['section', sectionPath],
    ]) {
      await page.goto(route!)
      await page.evaluate(async () => {
        await document.fonts.ready
      })
      // Load lazy images before the full-page capture, then return to the cover.
      await page.evaluate(async () => {
        for (const image of document.images) image.loading = 'eager'
        await Promise.all(Array.from(document.images, (image) => image.decode().catch(() => {})))
        window.scrollTo(0, 0)
      })
      expect(
        await page
          .locator(`${root} img`)
          .evaluateAll((images) =>
            images.every((image) => (image as HTMLImageElement).naturalWidth > 0),
          ),
        `${name} images loaded`,
      ).toBe(true)
      for (const fullPage of [false, true]) {
        await page.screenshot({
          path: path.join(destination, `${name}-${width}-${fullPage ? 'full' : 'viewport'}.png`),
          fullPage,
          animations: 'disabled',
        })
      }
    }
  }
})
