import { statSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Locator, type Page } from '@playwright/test'

import { dismissReaderLabIntroductions } from '../../../../../tests/e2e/support/reader-lab'
import { normalizeSlug } from '../../server/content/domain'
import { labStories } from '../../server/lab/north-house'
import { prepareFontCapture } from '../capture-fonts'

const storyTitle = 'The long table: a field guide to the North House kitchen'
const storyPath = '/stories/the-long-table-a-field-guide-to-the-north-house-kitchen'
const sectionPath = '/sections/interiors'
const craftPath = '/sections/craft'
const root = '[data-reader-direction="quiet-monograph"]'
const widths = [320, 360, 390, 768, 1024, 1280, 1440]

async function waitForThemeToSettle(page: Page) {
  // The shared lab bar transitions its colours; assertions need the settled theme.
  await expect.poll(() => page.evaluate(() => document.getAnimations().length)).toBe(0)
}

/** Presses Tab until the target has focus, through the real tab order. */
async function tabTo(page: Page, target: Locator, limit: number) {
  for (
    let tabs = 0;
    tabs < limit && !(await target.evaluate((element) => element === document.activeElement));
    tabs++
  ) {
    await page.keyboard.press('Tab')
  }
  await expect(target).toBeFocused()
}

test.beforeEach(async ({ context, page, request }) => {
  await dismissReaderLabIntroductions(context)
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

test('has no overflow from 320 to 1440px, one Sections navigation and touch-sized targets', async ({
  page,
}) => {
  test.setTimeout(240_000)
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 })
    for (const route of ['/', storyPath, sectionPath, craftPath]) {
      await page.goto(route)
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        `${route} at ${width}`,
      ).toBe(true)
      const direction = page.locator(root)
      const masthead = direction.locator('header.qm-masthead')
      const sections = direction.getByRole('navigation', { name: 'Sections' })
      const targets = [
        masthead.locator('.qm-wordmark a'),
        masthead.getByRole('button', { name: 'Choose color theme' }),
        ...(await direction.locator('main .qm-label a').all()),
        ...(await direction.locator('footer a').all()),
      ]
      if (width < 1024) {
        const menu = masthead.locator('summary')
        await menu.click()
        targets.push(menu)
      }
      await expect(sections).toHaveCount(1)
      await expect(sections).toBeVisible()
      targets.push(...(await sections.getByRole('link').all()))
      for (const control of targets) {
        const box = await control.boundingBox()
        const name = `${await control.textContent()} on ${route} at ${width}`
        expect(box?.width, name).toBeGreaterThanOrEqual(44)
        expect(box?.height, name).toBeGreaterThanOrEqual(44)
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
  for (const width of widths) {
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

test('follows the keyboard path from the skip link through the menu and an article to the footer', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const direction = page.locator(root)
  const skip = direction.getByRole('link', { name: 'Skip to content' })
  // The lab controls come first in the real tab order.
  await tabTo(page, skip, 12)
  expect(await skip.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe('solid')
  await page.keyboard.press('Enter')
  await expect(direction.locator('#qm-main')).toBeFocused()

  await page.goto('/')
  const theme = direction.getByRole('button', { name: 'Choose color theme' })
  await expect(theme).toBeEnabled()
  await tabTo(page, theme, 16)
  expect(await theme.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe('solid')
  const menu = direction.locator('summary')
  await page.keyboard.press('Tab')
  await expect(menu).toBeFocused()
  await page.keyboard.press('Enter')
  const sections = direction.getByRole('navigation', { name: 'Sections' })
  await expect(sections).toBeVisible()
  await page.keyboard.press('Tab')
  const frontPage = sections.getByRole('link', { name: 'Front page' })
  await expect(frontPage).toBeFocused()
  await expect(frontPage).toHaveAttribute('aria-current', 'page')

  await page.goto(storyPath)
  const backToTop = direction.getByRole('link', { name: 'Back to top' })
  await tabTo(page, backToTop, 60)
  await page.keyboard.press('Enter')
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
})

test('switches to the warm graphite night version from the Theme control', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  const direction = page.locator(root)
  expect(await direction.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe(
    'rgb(246, 245, 241)',
  )
  const theme = direction.getByRole('button', { name: 'Choose color theme' })
  await expect(theme).toBeEnabled()
  await theme.click()
  await page.getByRole('menuitemradio', { name: 'Dark theme' }).click()
  await expect
    .poll(() => page.evaluate(() => document.documentElement.classList.contains('dark')))
    .toBe(true)
  await waitForThemeToSettle(page)
  expect(
    await direction.evaluate((element) => {
      const style = getComputedStyle(element)
      return [style.backgroundColor, style.colorScheme]
    }),
  ).toEqual(['rgb(46, 43, 39)', 'dark'])
  // Pictures keep their colours and lose the print shadow at night.
  expect(
    await direction
      .locator('.qm-cover img')
      .evaluate((element) => getComputedStyle(element).boxShadow),
  ).toBe('none')
})

for (const width of [390, 1440]) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`passes axe with the lab bar at ${width}px in ${colorScheme} mode`, async ({ page }) => {
      test.setTimeout(150_000)
      await page.emulateMedia({ colorScheme })
      await page.setViewportSize({ width, height: 900 })
      for (const route of ['/', storyPath, sectionPath, craftPath]) {
        await page.goto(route)
        await page.evaluate(async () => {
          await document.fonts.ready
        })
        expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(
          colorScheme === 'dark',
        )
        await waitForThemeToSettle(page)
        await expect(page.getByRole('region', { name: 'Reader Lab', exact: true })).toBeVisible()
        const result = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze()
        expect(result.violations, `${route} at ${width} in ${colorScheme}`).toEqual([])
      }
    })
  }
}

test('requests only the faces home uses, within the font budget', async ({ page }) => {
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
  const requested = new Set<string>()
  page.on('request', (request) => {
    if (request.resourceType() === 'font')
      requested.add(path.basename(new URL(request.url()).pathname))
  })
  await page.goto('/')
  await page.evaluate(async () => {
    await document.fonts.ready
  })
  // Jost 300 stays declared until the italics replace it, but no text uses it any more.
  expect([...requested].sort()).toEqual([
    'cormorant-garamond-latin-400-normal.woff2',
    'cormorant-garamond-latin-500-normal.woff2',
    'jost-latin-400-normal.woff2',
    'jost-latin-500-normal.woff2',
  ])
  const folder = path.resolve('packages/web/public/reader-directions/quiet-monograph/fonts')
  const bytes = [...requested].reduce(
    (total, file) => total + statSync(path.join(folder, file)).size,
    0,
  )
  expect(bytes).toBeLessThanOrEqual(95_000)
})

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
    for (const route of ['/', storyPath, sectionPath]) {
      await page.goto(route)
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

test('captures seeded review screenshots of home, Interiors and Craft in both themes', async ({
  page,
}) => {
  test.setTimeout(600_000)
  const captureFonts = await prepareFontCapture(page, root, {
    '--font-qm-display': 'Cormorant Garamond',
    '--font-qm-text': 'Jost',
  })
  const destination = path.resolve('docs/worklog/blog-0044.40')
  await mkdir(destination, { recursive: true })
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme })
    for (const [width, height] of [
      [390, 844],
      [768, 1024],
      [1440, 1000],
    ] as const) {
      await page.setViewportSize({ width, height })
      for (const [name, route] of [
        ['home', '/'],
        ['interiors', sectionPath],
        ['craft', craftPath],
      ] as const) {
        await captureFonts.goto(route)
        // Load lazy images before the full-page capture, then return to the top.
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
        await waitForThemeToSettle(page)
        for (const fullPage of [false, true]) {
          await captureFonts.assertFonts()
          await page.screenshot({
            path: path.join(
              destination,
              `${name}-${width}-${colorScheme}-${fullPage ? 'full' : 'viewport'}.png`,
            ),
            fullPage,
            animations: 'disabled',
          })
        }
      }
    }
  }
})
