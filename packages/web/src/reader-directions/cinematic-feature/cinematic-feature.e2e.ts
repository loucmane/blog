import { mkdir } from 'node:fs/promises'
import path from 'node:path'

import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

import { normalizeSlug } from '../../server/content/domain'
import { labStories } from '../../server/lab/north-house'
import { prepareFontCapture } from '../capture-fonts'

const storyTitle = 'The long table: a field guide to the North House kitchen'
const storyPath = '/stories/the-long-table-a-field-guide-to-the-north-house-kitchen'
const sectionPath = '/sections/interiors'
const root = '[data-reader-direction="cinematic-feature"]'

async function waitForThemeToSettle(page: Page) {
  // The shared lab bar transitions its colours; assertions need the settled theme.
  await expect.poll(() => page.evaluate(() => document.getAnimations().length)).toBe(0)
}

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
    .locator('[data-reader-direction-card="cinematic-feature"]')
    .getByRole('button', { name: /^View the site in this direction/ })
    .click()
  await expect(page).toHaveURL('/')
  await expect(page.locator(root)).toBeVisible()
})

test('opens Cinematic Feature from the lab and renders published titles on all three pages', async ({
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
      const masthead = await page.locator('.cf-masthead').boundingBox()
      const heading = await page.locator(`${root} main .cf-title`).first().boundingBox()
      expect(heading!.y, `${path} heading clears masthead at ${width}`).toBeGreaterThanOrEqual(
        masthead!.y + masthead!.height,
      )
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
      if (story.id === 'article-lab-chair')
        await expect(page.locator('.cf-hero-text')).toHaveCount(1)
    }
  }
})

test('uses visible keyboard focus and a dark cinematic ground', async ({ page }) => {
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
  await page.keyboard.press('Enter')
  await expect(page.locator('#cf-main')).toBeFocused()
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
  ).toBe('rgb(11, 12, 12)')
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

    test(`keeps the longest article accessible over a white hero at ${width}px in ${theme} mode`, async ({
      page,
    }) => {
      test.setTimeout(120_000)
      await page.setViewportSize({ width, height: 900 })
      const longest = labStories.reduce((first, second) =>
        first.title.length >= second.title.length ? first : second,
      )
      const heroId = longest.blocks.find(({ type }) => type === 'mediaImage')?.attrs?.mediaId
      expect(longest.title.length).toBeGreaterThan(100)
      if (typeof heroId !== 'string') throw new Error('The longest seeded story needs a hero')
      // Only this browser case substitutes the image response; published copy stays intact.
      await page.route(`**/api/media/${heroId}*`, (route) =>
        route.fulfill({
          contentType: 'image/svg+xml',
          body: '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900"><rect width="1600" height="900" fill="white"/></svg>',
        }),
      )
      const fontGate = await prepareFontCapture(page, root, {
        '--font-cf-sans': 'Archivo',
        '--font-cf-mono': 'Martian Mono',
      })
      await fontGate.goto(`/stories/${normalizeSlug(longest.title)}`)
      await fontGate.assertFonts()
      await page.evaluate(
        (dark) => document.documentElement.classList.toggle('dark', dark),
        theme === 'dark',
      )
      await waitForThemeToSettle(page)
      await expect(page.locator('.cf-article-heading h1')).toHaveText(longest.title)
      await expect(page.getByRole('region', { name: 'Reader Lab', exact: true })).toBeVisible()
      // Prove the selected responsive source decoded as white, not the original dark fixture.
      const pixel = await page.locator('.cf-hero img').evaluate(async (element) => {
        const image = element as HTMLImageElement
        await image.decode()
        const canvas = document.createElement('canvas')
        canvas.width = canvas.height = 1
        const context = canvas.getContext('2d')!
        context.drawImage(image, 0, 0, 1, 1)
        return [...context.getImageData(0, 0, 1, 1).data]
      })
      expect(pixel).toEqual([255, 255, 255, 255])
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze()
      expect(result.violations, `long title over white at ${width} in ${theme}`).toEqual([])
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
  const body = page.locator('.cf-body')
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
  expect(metrics.lineHeight).toBe('34px')
  expect(Math.abs(metrics.width - metrics.measure)).toBeLessThan(1)
  expect(await body.evaluate((element) => getComputedStyle(element).animationName)).toBe('none')
  const title = page.locator('.cf-article-heading h1')
  const titleStyle = await title.evaluate((element) => {
    const style = getComputedStyle(element)
    return {
      weight: style.fontWeight,
      stretch: style.fontStretch,
      animation: style.animationName,
      transition: style.transitionDuration,
      opacity: style.opacity,
    }
  })
  expect(titleStyle).toMatchObject({
    weight: '850',
    stretch: '68%',
    animation: 'none',
    opacity: '1',
  })
  // The global reduced-motion rule uses 0.01ms, which browsers may serialize as 1e-05s.
  for (const duration of titleStyle.transition.split(',')) {
    const value = duration.trim()
    expect(value).toMatch(/^(?:\d*\.)?\d+(?:e[+-]?\d+)?m?s$/i)
    const milliseconds = Number.parseFloat(value) * (value.endsWith('ms') ? 1 : 1000)
    expect(milliseconds).toBeLessThanOrEqual(0.01)
  }
})

test('keeps the condensed title stable on cold and warm article loads without the capture gate', async ({
  page,
}) => {
  type Shift = PerformanceEntry & {
    hadRecentInput: boolean
    value: number
    sources?: { node?: Node }[]
  }
  type MeasuredWindow = Window & { cfShifts: { total: number; title: number } }
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => {
    const measured = window as unknown as MeasuredWindow
    measured.cfShifts = { total: 0, title: 0 }
    new PerformanceObserver((entries) => {
      for (const entry of entries.getEntries() as Shift[]) {
        if (entry.hadRecentInput) continue
        measured.cfShifts.total += entry.value
        if (
          entry.sources?.some(
            ({ node }) =>
              node instanceof Element && (node.matches('.cf-title') || node.closest('.cf-title')),
          )
        )
          measured.cfShifts.title += entry.value
      }
    }).observe({ type: 'layout-shift', buffered: true })
  })
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Network.clearBrowserCache')
  for (const visit of ['cold', 'warm']) {
    await page.goto(storyPath)
    await page.evaluate(async () => {
      await document.fonts.ready
    })
    await waitForThemeToSettle(page)
    // Give buffered observer entries a frame after the last font/image layout.
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    )
    const shifts = await page.evaluate(() => (window as unknown as MeasuredWindow).cfShifts)
    expect(shifts.total, `${visit} article CLS`).toBeLessThan(0.05)
    expect(shifts.title, `${visit} condensed-title shift`).toBe(0)
  }
})

test('removes Cinematic Feature font declarations when the owner switches back to baseline', async ({
  page,
}) => {
  await expect(page.locator('[data-reader-direction-fonts="cinematic-feature"]')).toHaveCount(1)
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
      { name: 'reader_lab_direction', value: 'cinematic-feature', url: 'http://localhost:3100' },
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
    '--font-cf-sans': 'Archivo',
    '--font-cf-mono': 'Martian Mono',
  })
  const destination = path.resolve('docs/worklog/blog-0044.6')
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
