import { mkdir } from 'node:fs/promises'
import path from 'node:path'

import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

import { dismissReaderLabIntroductions } from '../../../../../tests/e2e/support/reader-lab'
import { normalizeSlug } from '../../server/content/domain'
import { labStories } from '../../server/lab/north-house'
import { prepareFontCapture } from '../capture-fonts'
import { storyColour, storyColours } from './colours'

const storyTitle = 'The long table: a field guide to the North House kitchen'
const storyPath = '/stories/the-long-table-a-field-guide-to-the-north-house-kitchen'
const sectionPath = '/sections/interiors'
const root = '[data-reader-direction="expressive-colour"]'

async function waitForThemeToSettle(page: Page) {
  // The shared lab bar transitions its colours; assertions need the settled theme.
  await expect.poll(() => page.evaluate(() => document.getAnimations().length)).toBe(0)
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
    .locator('[data-reader-direction-card="expressive-colour"]')
    .getByRole('button', { name: /^View the site in this direction/ })
    .click()
  await expect(page).toHaveURL('/')
  await expect(page.locator(root)).toBeVisible()
})

test('opens Expressive Colour from the lab and renders published titles on all three pages', async ({
  page,
}) => {
  await expect(
    page.locator(root).getByRole('heading', { name: storyTitle, exact: true }),
  ).toBeVisible()
  // The newest (lead) story is winter-light, not the long-table article below.
  // Compare the same story by its canonical href on each page, independent of order.
  const storyCard = page.locator(`.ec-card:has([href="${storyPath}"])`)
  const colour = storyColour(storyPath.split('/').at(-1)!).name
  await expect(storyCard).toHaveAttribute('data-story-colour', colour)
  const lead = page.locator('.ec-card-lead')
  const leadPath = await lead.locator('.ec-card-link').getAttribute('href')
  await expect(lead).toHaveAttribute(
    'data-story-colour',
    storyColour(leadPath!.split('/').at(-1)!).name,
  )
  await page.goto(storyPath)
  await expect(page.locator('.ec-article')).toHaveAttribute('data-story-colour', colour)
  await expect(page.locator(root).getByRole('heading', { level: 1 })).toHaveText(storyTitle)
  await page.goto(sectionPath)
  await expect(page.locator(root).getByRole('heading', { level: 1 })).toHaveText('Interiors')
  await expect(page.locator(`.ec-card:has([href="${storyPath}"])`)).toHaveAttribute(
    'data-story-colour',
    colour,
  )
  await expect(
    page.locator(root).getByRole('heading', { name: storyTitle, exact: true }),
  ).toBeVisible()
})

test('has no overflow at every required width and operable touch-sized navigation', async ({
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
      const sections = page.locator(root).getByRole('navigation', { name: 'Sections' })
      await expect(sections).toBeVisible()
      const masthead = await page.locator('.ec-masthead').boundingBox()
      const content = await page.locator('#ec-main').boundingBox()
      expect(content!.y).toBeGreaterThanOrEqual(masthead!.y + masthead!.height)
      for (const control of await sections.getByRole('link').all()) {
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
      if (story.id === 'article-lab-chair') await expect(page.locator('.ec-hero')).toHaveCount(0)
    }
  }
})

test('uses visible keyboard focus and the same paper reading ground in either site theme', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const skip = page.getByRole('link', { name: 'Skip to stories' })
  for (
    let tabs = 0;
    tabs < 12 && !(await skip.evaluate((element) => element === document.activeElement));
    tabs++
  ) {
    await page.keyboard.press('Tab')
  }
  await expect(skip).toBeFocused()
  expect(await skip.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe('solid')
  expect(await skip.evaluate((element) => getComputedStyle(element).color)).toBe(
    'rgb(251, 244, 234)',
  )
  await page.keyboard.press('Enter')
  await expect(page.locator('#ec-main')).toBeFocused()
  await page.goto('/')
  const interiors = page
    .locator(root)
    .getByRole('navigation')
    .getByRole('link', { name: 'Interiors' })
  for (
    let tabs = 0;
    tabs < 20 && !(await interiors.evaluate((element) => element === document.activeElement));
    tabs++
  ) {
    await page.keyboard.press('Tab')
  }
  await expect(interiors).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(sectionPath)
  await page.evaluate(() => document.documentElement.classList.add('dark'))
  await waitForThemeToSettle(page)
  expect(
    await page.locator(root).evaluate((element) => getComputedStyle(element).backgroundColor),
  ).toBe('rgb(251, 244, 234)')
})

for (const width of [390, 1440]) {
  for (const theme of ['light', 'dark']) {
    test(`passes axe with the lab bar at ${width}px in ${theme} mode`, async ({ page }) => {
      test.setTimeout(120_000)
      await page.setViewportSize({ width, height: 900 })
      for (const path of ['/', storyPath, sectionPath]) {
        await page.goto(path)
        await page.evaluate(async () => {
          await document.fonts.ready
        })
        await page.evaluate(
          (dark) => document.documentElement.classList.toggle('dark', dark),
          theme === 'dark',
        )
        await waitForThemeToSettle(page)
        await expect(page.getByRole('region', { name: 'Reader Lab', exact: true })).toBeVisible()
        const result = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze()
        expect(result.violations, `${path} at ${width} in ${theme}`).toEqual([])
      }
    })

    test(`LONG-TITLE on every story colour at ${width}px with ${theme} inherited theme`, async ({
      page,
    }) => {
      test.setTimeout(240_000)
      await page.setViewportSize({ width, height: 900 })
      const longest = labStories.reduce((first, second) =>
        first.title.length >= second.title.length ? first : second,
      )
      expect(longest.title.length).toBeGreaterThan(100)
      const captureFonts = await prepareFontCapture(page, root, {
        '--font-ec-serif': 'Fraunces',
        '--font-ec-mono': 'Martian Mono',
      })
      for (const route of ['/', storyPath]) {
        await captureFonts.goto(route)
        await page.evaluate(
          (dark) => document.documentElement.classList.toggle('dark', dark),
          theme === 'dark',
        )
        await waitForThemeToSettle(page)
        const surface = page.locator(route === '/' ? '.ec-card-lead' : '.ec-article')
        const heading = surface.getByRole('heading', { level: route === '/' ? 2 : 1 })
        // Browser-only stress fixture: retain actual seeded copy; substitute the longest
        // published title on the lead / all-block article and exercise every palette pair.
        await heading.evaluate((element, title) => {
          element.textContent = title
        }, longest.title)
        for (const colour of storyColours) {
          await surface.evaluate(
            (element, name) => element.setAttribute('data-story-colour', name),
            colour.name,
          )
          await captureFonts.assertFonts()
          await expect(heading).toHaveText(longest.title)
          await expect(page.getByRole('region', { name: 'Reader Lab', exact: true })).toBeVisible()
          const painted = await heading.evaluate((element) => ({
            foreground: getComputedStyle(element).color,
            background: getComputedStyle(element.closest('.ec-card, .ec-article-band')!)
              .backgroundColor,
          }))
          const asRgb = (hex: string) =>
            `rgb(${[1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16)).join(', ')})`
          expect(painted).toEqual({
            foreground: asRgb(colour.foreground),
            background: asRgb(colour.background),
          })
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
            `${route} ${colour.name}`,
          ).toBe(true)
          const container = page.locator(route === '/' ? '.ec-card-lead' : '.ec-article-band')
          const titleBox = await heading.boundingBox()
          const surfaceBox = await container.boundingBox()
          expect(titleBox!.y + titleBox!.height).toBeLessThanOrEqual(
            surfaceBox!.y + surfaceBox!.height,
          )
          const focusLink = surface.locator(route === '/' ? '.ec-card-link' : '.ec-pill').first()
          await page.keyboard.press('Tab')
          await focusLink.focus()
          const outline = await focusLink.evaluate((element) => {
            const style = getComputedStyle(element)
            return {
              style: style.outlineStyle,
              width: style.outlineWidth,
              colour: style.outlineColor,
            }
          })
          expect(outline).toEqual({
            style: 'solid',
            width: '3px',
            colour: asRgb(colour.foreground),
          })
          const result = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
            .analyze()
          expect(result.violations, `${route} ${colour.name} ${width} ${theme}`).toEqual([])
        }
      }
    })
  }
}

test('uses a 65-character reading measure with reduced motion respected', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(storyPath)
  await page.evaluate(async () => {
    await document.fonts.ready
  })
  const body = page.locator('.ec-body')
  const metrics = await body.evaluate((element) => {
    const style = getComputedStyle(element)
    // Measure the CSS ch unit in the same active face, including a retained optional fallback.
    const probe = document.createElement('span')
    probe.style.cssText = 'display:block;width:65ch;position:absolute;visibility:hidden'
    element.append(probe)
    const measure = probe.getBoundingClientRect().width
    probe.remove()
    return {
      width: element.getBoundingClientRect().width,
      measure,
      fontSize: style.fontSize,
      lineHeight: style.lineHeight,
    }
  })
  expect(metrics.fontSize).toBe('20px')
  expect(metrics.lineHeight).toBe('35px')
  expect(Math.abs(metrics.width - metrics.measure)).toBeLessThan(1)
  expect(await body.evaluate((element) => getComputedStyle(element).animationName)).toBe('none')
})

test('removes Expressive Colour font declarations when the owner switches back to baseline', async ({
  page,
}) => {
  await expect(page.locator('[data-reader-direction-fonts="expressive-colour"]')).toHaveCount(1)
  await page.goto('/owner/reader-lab')
  await page
    .locator('[data-reader-direction-card="baseline"]')
    .getByRole('button', { name: /^View the site in this direction/ })
    .click()
  await expect(page.locator('[data-reader-direction="baseline"]')).toBeVisible()
  await expect(page.locator('[data-reader-direction-fonts]')).toHaveCount(0)
})

test('keeps a visitor on baseline even with the direction cookie', async ({ browser }) => {
  const visitor = await browser.newContext()
  try {
    await visitor.addCookies([
      { name: 'reader_lab_direction', value: 'expressive-colour', url: 'http://localhost:3100' },
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
  const captureFonts = await prepareFontCapture(page, root, {
    '--font-ec-serif': 'Fraunces',
    '--font-ec-mono': 'Martian Mono',
  })
  const destination = path.resolve('docs/worklog/blog-0044.7')
  await mkdir(destination, { recursive: true })
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 })
    for (const [name, route] of [
      ['home', '/'],
      ['article', storyPath],
      ['section', sectionPath],
    ]) {
      await captureFonts.goto(route!)
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
        await captureFonts.assertFonts()
        await page.screenshot({
          path: path.join(destination, `${name}-${width}-${fullPage ? 'full' : 'viewport'}.png`),
          fullPage,
          animations: 'disabled',
        })
      }
    }
  }
})

test('keeps the soft serif title stable on cold and warm article loads without the capture gate', async ({
  page,
}) => {
  type Shift = PerformanceEntry & {
    hadRecentInput: boolean
    value: number
    sources?: { node?: Node }[]
  }
  type MeasuredWindow = Window & { ecShifts: { total: number; title: number } }
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => {
    const measured = window as unknown as MeasuredWindow
    measured.ecShifts = { total: 0, title: 0 }
    new PerformanceObserver((entries) => {
      for (const entry of entries.getEntries() as Shift[]) {
        if (entry.hadRecentInput) continue
        measured.ecShifts.total += entry.value
        if (
          entry.sources?.some(
            ({ node }) =>
              node instanceof Element &&
              (node.matches('.ec-article-band h1') || node.closest('.ec-article-band h1')),
          )
        )
          measured.ecShifts.title += entry.value
      }
    }).observe({ type: 'layout-shift', buffered: true })
  })
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Network.clearBrowserCache')
  for (const visit of ['cold', 'warm']) {
    await page.goto(storyPath)
    await page.evaluate(async () => {
      await document.fonts.ready
      await Promise.all(
        Array.from(document.querySelectorAll<HTMLImageElement>('.ec-hero img'), (image) =>
          image.decode(),
        ),
      )
    })
    await waitForThemeToSettle(page)
    // Give buffered observer entries a frame after the last font/image layout.
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    )
    const shifts = await page.evaluate(() => (window as unknown as MeasuredWindow).ecShifts)
    expect(shifts.total, `${visit} article CLS`).toBe(0)
    expect(shifts.title, `${visit} soft-title shift`).toBe(0)
  }
})
