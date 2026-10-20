import { mkdir } from 'node:fs/promises'
import path from 'node:path'

import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

import { dismissReaderLabIntroductions } from '../../../../../tests/e2e/support/reader-lab'
import { normalizeSlug } from '../../server/content/domain'
import { labAuthors, labStories, labTopics } from '../../server/lab/north-house'
import { prepareFontCapture } from '../capture-fonts'
import { contrastRatio } from '../contrast'
import { blockFixtureDocument } from './block-fixture'
import { storyColour, storyColours } from './colours'

const storyTitle = 'The long table: a field guide to the North House kitchen'
const storyPath = '/stories/the-long-table-a-field-guide-to-the-north-house-kitchen'
const sectionPath = '/sections/interiors'
const author = labAuthors.find(({ slug }) =>
  labStories.some((story) => story.authors.includes(slug)),
)!
const topic = labTopics.find(({ slug }) => labStories.some((story) => story.topics.includes(slug)))!
const authorPath = `/authors/${author.slug}`
const topicPath = `/topics/${topic.slug}`
const pagePaths = ['/', storyPath, sectionPath, authorPath, topicPath]
const root = '[data-reader-direction="expressive-colour"]'

interface FixtureStory {
  article: { id: string; slug: string; version: number }
  revision: { id: string }
}

const blockTest = test.extend<{ blockStoryPath: string }>({
  blockStoryPath: async ({ context }, use, testInfo) => {
    const suffix = `${testInfo.testId}-${Date.now()}-${testInfo.retry}`
    const headers = { origin: 'http://localhost:3100' }
    const created = await context.request.post('/api/owner/stories', {
      headers,
      data: {
        title: `Editorial style fixture ${suffix}`,
        dek: 'A temporary story exercising every editorial surface and list marker.',
        document: blockFixtureDocument,
        idempotencyKey: `ec-create-${suffix}`,
      },
    })
    expect(created.status()).toBe(200)
    const draft = (await created.json()) as FixtureStory
    const actions = `/api/owner/stories/${draft.article.id}/actions`
    const published = await context.request.post(actions, {
      headers,
      data: {
        action: 'publish',
        expectedVersion: draft.article.version,
        revisionId: draft.revision.id,
        idempotencyKey: `ec-publish-${suffix}`,
      },
    })
    expect(published.status()).toBe(200)
    const story = (await published.json()) as FixtureStory
    try {
      await use(`/stories/${story.article.slug}`)
    } finally {
      const unpublished = await context.request.post(actions, {
        headers,
        data: {
          action: 'unpublish',
          expectedVersion: story.article.version,
          idempotencyKey: `ec-unpublish-${suffix}`,
          reason: 'The editorial style fixture has finished.',
        },
      })
      expect(unpublished.status()).toBe(200)
    }
  },
})

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
  await expect(page.locator(root).getByRole('banner')).toHaveCount(1)
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
  for (const width of [320, 360, 390, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const path of pagePaths) {
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
      for (const control of [
        ...(await sections.getByRole('link').all()),
        ...(await page
          .locator(root)
          .getByRole('navigation', { name: 'Footer' })
          .getByRole('link')
          .all()),
        page.locator(root).getByRole('button', { name: 'Choose color theme' }),
        ...(await page.locator('.ec-topics a, .ec-credits a').all()),
      ]) {
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
      'article-lab-door-handle',
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

test('uses visible keyboard focus and the night-print reading ground in dark theme', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const skip = page.getByRole('link', { name: 'Skip to content' })
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
    .getByRole('navigation', { name: 'Sections' })
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
  ).toBe('rgb(23, 20, 31)')
})

test('places the Theme control before section pills and supports keyboard theme selection', async ({
  page,
}) => {
  const theme = page.locator(root).getByRole('button', { name: 'Choose color theme' })
  const wordmark = page.locator('.ec-masthead .ec-wordmark a')
  // The Theme control is disabled until hydration, and a disabled button is skipped by Tab.
  await expect(theme).toBeEnabled()
  await wordmark.focus()
  await page.keyboard.press('Tab')
  await expect(theme).toBeFocused()
  expect(await theme.evaluate((element) => getComputedStyle(element).outlineWidth)).toBe('3px')
  await page.keyboard.press('Enter')
  const dark = page.getByRole('menuitemradio', { name: 'Dark theme', exact: true })
  await dark.focus()
  await page.keyboard.press('Enter')
  await waitForThemeToSettle(page)
  // Base UI radio items keep the menu open after selection; Escape returns focus to the trigger.
  await page.keyboard.press('Escape')
  await expect(page.getByRole('menu', { name: 'Color theme' })).toBeHidden()
  await expect(theme).toBeFocused()
  expect(
    await page.locator(root).evaluate((element) => getComputedStyle(element).backgroundColor),
  ).toBe('rgb(23, 20, 31)')
  await page.keyboard.press('Tab')
  await expect(
    page
      .locator(root)
      .getByRole('navigation', { name: 'Sections' })
      .getByRole('link', { name: 'All stories' }),
  ).toBeFocused()
})

test('moves the lead visual on hover without a reduced-motion preference', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const card = page.locator('.ec-card-lead .ec-card-link')
  await card.hover()
  const visual = card.locator('img:visible, .ec-motif:visible').first()
  await expect
    .poll(() => visual.evaluate((element) => getComputedStyle(element).transform))
    .not.toBe('none')
})

test('removes both card motion and transforms for reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const card = page.locator('.ec-card-lead .ec-card-link')
  await card.hover()
  for (const visual of await card.locator('img, .ec-motif').all()) {
    // The shared global reduced-motion rule sets every duration to 0.01ms (!important).
    const motion = await visual.evaluate((element) => ({
      transition: parseFloat(getComputedStyle(element).transitionDuration),
      transform: getComputedStyle(element).transform,
    }))
    expect(motion.transform).toBe('none')
    expect(motion.transition).toBeLessThanOrEqual(0.00001)
  }
})

for (const width of [390, 1440]) {
  for (const theme of ['light', 'dark']) {
    test(`passes axe with the lab bar at ${width}px in ${theme} mode`, async ({ page }) => {
      test.setTimeout(120_000)
      await page.setViewportSize({ width, height: 900 })
      for (const path of pagePaths) {
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
          if (element.closest('.ec-card')) element.classList.add('ec-card-title-long')
          else element.classList.add('ec-title-long')
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

test('uses a fixed 720px measure of about 65–70 characters with reduced motion respected', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(storyPath)
  await page.evaluate(async () => {
    await document.fonts.ready
  })
  const body = page.locator('.ec-body > p').first()
  const metrics = await body.evaluate((element) => {
    const style = getComputedStyle(element)
    // Measure representative lowercase letters and spaces in the actual active face.
    const probe = document.createElement('span')
    probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap'
    const sample = 'abcdefghijklmnopqrstuvwxyz '
    probe.textContent = sample.repeat(10)
    element.append(probe)
    const average = probe.getBoundingClientRect().width / (sample.length * 10)
    probe.remove()
    return {
      width: element.getBoundingClientRect().width,
      characters: element.getBoundingClientRect().width / average,
      fontSize: style.fontSize,
      lineHeight: style.lineHeight,
    }
  })
  expect(metrics.fontSize).toBe('20px')
  expect(metrics.lineHeight).toBe('35px')
  expect(metrics.width).toBeCloseTo(720, 0)
  expect(metrics.characters).toBeGreaterThanOrEqual(65)
  expect(metrics.characters).toBeLessThanOrEqual(70)
  expect(await body.evaluate((element) => getComputedStyle(element).animationName)).toBe('none')
})

test('keeps visible lead copy and image in DOM order and the wordmark unbroken at narrow widths', async ({
  page,
}) => {
  for (const width of [320, 360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    const layout = await page.locator('.ec-card-lead .ec-card-link').evaluate((element) => {
      const children = Array.from(element.children).filter(
        (child) => getComputedStyle(child).display !== 'none',
      )
      return children.map((child) => ({
        copy: child.classList.contains('ec-card-copy'),
        x: child.getBoundingClientRect().x,
        y: child.getBoundingClientRect().y,
        order: getComputedStyle(child).order,
      }))
    })
    expect(layout.map(({ copy }) => copy)).toEqual(width < 1024 ? [false, true] : [true, false])
    expect(layout.every(({ order }) => order === '0')).toBe(true)
    if (width < 1024) expect(layout[0]!.y).toBeLessThan(layout[1]!.y)
    else expect(layout[0]!.x).toBeLessThan(layout[1]!.x)
    await expect(page.locator('.ec-card-lead img:visible')).toHaveCount(1)
    const word = await page.locator('.ec-masthead .ec-wordmark em').evaluate((element) => ({
      lines: element.getClientRects().length,
      right: element.getBoundingClientRect().right,
      wrap: getComputedStyle(element).whiteSpace,
    }))
    expect(word.lines).toBe(1)
    expect(word.wrap).toBe('nowrap')
    expect(word.right).toBeLessThanOrEqual(width)
    const theme = await page
      .locator(root)
      .getByRole('button', { name: 'Choose color theme' })
      .boundingBox()
    expect(word.right).toBeLessThanOrEqual(theme!.x)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    )
  }
})

test('keeps article, author and topic previews scoped inside the comparison frames', async ({
  page,
}) => {
  test.setTimeout(240_000)
  for (const route of [storyPath, authorPath, topicPath]) {
    await page.goto(`/owner/reader-lab/compare?page=${encodeURIComponent(route)}`)
    const frame = page.frameLocator('[data-compare-direction="expressive-colour"] iframe')
    for (const width of [390, 1440]) {
      await page
        .getByRole('radio', { name: width === 390 ? 'Mobile · 390 px' : 'Desktop · 1440 px' })
        .check()
      for (const dark of [false, true]) {
        await page.evaluate(
          (value) => document.documentElement.classList.toggle('dark', value),
          dark,
        )
        await expect(frame.locator(root)).toBeVisible()
        await expect(frame.locator(root).getByRole('heading', { level: 1 })).toHaveCount(1)
        await expect
          .poll(() =>
            frame.locator(root).evaluate((element) => getComputedStyle(element).backgroundColor),
          )
          .toBe(dark ? 'rgb(23, 20, 31)' : 'rgb(251, 244, 234)')
        expect(
          await frame
            .locator('html')
            .evaluate(
              (element) => element.scrollWidth <= element.ownerDocument.defaultView!.innerWidth,
            ),
        ).toBe(true)
        const skip = frame.getByRole('link', { name: 'Skip to content' })
        await skip.focus()
        await page.keyboard.press('Enter')
        await expect(frame.locator('#ec-main')).toBeFocused()
      }
    }
  }
})

test('opens author and topic links and derives every visible story from the current sample', async ({
  page,
}) => {
  await page.goto(storyPath)
  for (const nav of ['Sections', 'Footer']) {
    await expect(
      page.getByRole('navigation', { name: nav }).locator('[aria-current]'),
    ).toHaveAttribute('aria-current', 'true')
  }
  const byline = page.locator('.ec-credits a').first()
  const authorHref = await byline.getAttribute('href')
  await byline.click()
  await expect(page).toHaveURL(authorHref!)
  await expect(page.locator('.ec-author-mark')).toBeVisible()
  await page.goto(storyPath)
  const topicLink = page.getByRole('navigation', { name: 'Topics' }).getByRole('link').first()
  const topicHref = await topicLink.getAttribute('href')
  await topicLink.click()
  await expect(page).toHaveURL(topicHref!)
  await expect(page.locator('.ec-chip-ring')).toBeVisible()
  for (const [route, expected, name] of [
    [authorPath, labStories.filter((story) => story.authors.includes(author.slug)), author.name],
    [topicPath, labStories.filter((story) => story.topics.includes(topic.slug)), topic.name],
  ] as const) {
    await page.goto(route)
    await expect(page.locator(root).getByRole('heading', { level: 1 })).toHaveText(name)
    await expect(page.locator('.ec-grid > li')).toHaveCount(expected.length)
    for (const story of expected)
      await expect(
        page.locator('.ec-grid').getByRole('link', { name: story.title, exact: true }),
      ).toHaveAttribute('href', `/stories/${normalizeSlug(story.title)}`)
  }
})

test('lays out square and portrait heroes once, using the real focal point and matching preload', async ({
  page,
}) => {
  test.setTimeout(180_000)
  for (const width of [320, 360, 390, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const id of ['article-lab-shelf', 'article-lab-door-handle']) {
      const story = labStories.find((item) => item.id === id)!
      await page.goto(`/stories/${normalizeSlug(story.title)}`)
      const hero = page.locator('.ec-hero-cover')
      await expect(hero).toHaveCount(1)
      await expect(hero.locator('figure')).toHaveCount(1)
      await expect(hero.locator('picture')).toHaveCount(1)
      await expect(hero.locator('img')).toHaveCount(1)
      const copy = await page.locator('.ec-article-copy').boundingBox()
      const frame = await hero.boundingBox()
      const computed = await hero.locator('img').evaluate((element) => {
        const style = getComputedStyle(element)
        const host = element.closest<HTMLElement>('.ec-hero')!
        return {
          position: style.objectPosition,
          expected: host.style.objectPosition,
          fit: style.objectFit,
          height: element.getBoundingClientRect().height,
        }
      })
      expect(computed.position).toBe(computed.expected)
      expect(computed.fit).toBe('cover')
      expect(computed.height).toBeLessThanOrEqual(720)
      // React can also hoist an automatic responsive hint without href. The host
      // trace has both links for one hero, with identical AVIF sources and sizes.
      const link = page.locator('link[rel="preload"][as="image"][href]')
      await expect(link).toHaveCount(1)
      const sizes = await hero.locator('img').getAttribute('sizes')
      const source = hero.locator('source').first()
      const srcset = await source.getAttribute('srcset')
      const type = await source.getAttribute('type')
      for (const hint of await page.locator('link[rel="preload"][as="image"]').all()) {
        await expect(hint).toHaveAttribute('imagesizes', sizes!)
        await expect(hint).toHaveAttribute('imagesrcset', srcset!)
        await expect(hint).toHaveAttribute('type', type!)
      }
      if (width >= 1024) {
        expect(frame!.x).toBeGreaterThan(copy!.x + copy!.width)
        expect(
          await hero.locator('figcaption').evaluate((element) => getComputedStyle(element).color),
        ).toBe(
          await page
            .locator('.ec-article-band')
            .evaluate((element) => getComputedStyle(element).color),
        )
      } else {
        expect(frame!.y).toBeGreaterThanOrEqual(copy!.y + copy!.height)
        expect(frame!.width).toBeLessThanOrEqual(576)
        expect(
          await hero.locator('figcaption').evaluate((element) => getComputedStyle(element).color),
        ).toBe(
          await page.locator(root).evaluate((element) => {
            const probe = document.createElement('span')
            probe.style.color = 'var(--ec-ink-soft)'
            element.append(probe)
            const colour = getComputedStyle(probe).color
            probe.remove()
            return colour
          }),
        )
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      )
    }
  }
})

for (const width of [390, 1440]) {
  blockTest(
    `computed editorial styles survive resets and nesting at ${width}px`,
    async ({ page, blockStoryPath }) => {
      test.setTimeout(240_000)
      await page.setViewportSize({ width, height: 900 })
      expect((await page.goto(blockStoryPath))?.status()).toBe(200)
      await page.evaluate(async () => {
        await document.fonts.ready
      })
      const dimensions = await page.locator('.ec-body').evaluate((element) => {
        const style = (selector: string) => getComputedStyle(element.querySelector(selector)!)
        const box = (selector: string) =>
          element.querySelector(selector)!.getBoundingClientRect().width
        return {
          measure: box(':scope > p'),
          feature: box(':scope > [data-block="pull-quote"]'),
          wide: box(':scope > [data-layout="grid"]'),
          gridColumns: style(':scope > [data-layout="grid"]').gridTemplateColumns.split(' ').length,
          diptychColumns: style(':scope > [data-layout="diptych"]').gridTemplateColumns.split(' ')
            .length,
          carouselColumns: style(':scope > [data-layout="carousel"]').gridTemplateColumns.split(' ')
            .length,
          bullet: style(':scope > ul:not([data-block])').listStyleType,
          // HTML type selectors are case-insensitive. Compare attributes exactly
          // so lower/upper alpha and Roman each test their own rendered list.
          numbering: ['1', 'a', 'A', 'i', 'I'].map((type) => {
            const lists = Array.from(element.querySelectorAll(':scope > ol')).filter(
              (list) => list.getAttribute('type') === type,
            )
            return { type, count: lists.length, marker: getComputedStyle(lists[0]!).listStyleType }
          }),
          checklist: style(':scope > [data-block="checklist"]').listStyleType,
          headingSize: parseFloat(style(':scope > h2').fontSize),
          headingLeading: parseFloat(style(':scope > h2').lineHeight),
          h5Italic: style(':scope > h5').fontStyle,
          h6Family: style(':scope > h6').fontFamily,
          captionFamily: style(':scope > figure:not([data-block]) figcaption').fontFamily,
          captionSize: style(':scope > figure:not([data-block]) figcaption').fontSize,
          codeSize: style(':scope > pre code').fontSize,
          quoteWeight: style('[data-block="pull-quote"] blockquote').fontWeight,
          headingMargin: style('[data-variant="key-points"] > h2').marginTop,
        }
      })
      expect(dimensions.measure).toBeCloseTo(width === 1440 ? 720 : 358, 0)
      expect(dimensions.feature).toBeCloseTo(width === 1440 ? 896 : 358, 0)
      expect(dimensions.wide).toBeCloseTo(width === 1440 ? 1152 : 358, 0)
      expect(dimensions.gridColumns).toBe(width === 1440 ? 3 : 1)
      expect(dimensions.diptychColumns).toBe(width === 1440 ? 2 : 1)
      expect(dimensions.carouselColumns).toBe(1)
      expect(dimensions.bullet).toBe('disc')
      expect(dimensions.numbering).toEqual([
        { type: '1', count: 1, marker: 'decimal' },
        { type: 'a', count: 1, marker: 'lower-alpha' },
        { type: 'A', count: 1, marker: 'upper-alpha' },
        { type: 'i', count: 1, marker: 'lower-roman' },
        { type: 'I', count: 1, marker: 'upper-roman' },
      ])
      expect(dimensions.checklist).toBe('none')
      expect(dimensions.headingLeading).toBeCloseTo(dimensions.headingSize * 1.08, 1)
      expect(dimensions.h5Italic).toBe('italic')
      expect(dimensions.h6Family).toContain('font-ec-mono')
      expect(dimensions.captionFamily).toContain('font-ec-serif')
      expect(dimensions.captionSize).toBe('16px')
      expect(dimensions.codeSize).toBe('14px')
      expect(dimensions.quoteWeight).toBe('700')
      expect(dimensions.headingMargin).toBe('48px')

      const gaps = await page.locator('.ec-body').evaluate((element) =>
        Array.from(element.querySelectorAll(':scope > :is(h2, h3, h4, h5, h6, hr)')).map(
          (block) => ({
            tag: block.tagName,
            gap:
              block.nextElementSibling!.getBoundingClientRect().top -
              block.getBoundingClientRect().bottom,
          }),
        ),
      )
      expect(gaps.map(({ tag }) => tag)).toEqual(['H2', 'H3', 'H4', 'H5', 'H6', 'HR'])
      for (const { tag, gap } of gaps)
        expect(gap, `${tag} rendered gap`).toBeCloseTo(tag === 'HR' ? 48 : 16, 1)

      for (const dark of [false, true]) {
        await page.evaluate(
          (value) => document.documentElement.classList.toggle('dark', value),
          dark,
        )
        await waitForThemeToSettle(page)
        for (const colour of storyColours) {
          await page
            .locator('.ec-article')
            .evaluate(
              (element, name) => element.setAttribute('data-story-colour', name),
              colour.name,
            )
          const pairs = await page.locator('.ec-body').evaluate((element) => {
            function background(node: Element): string {
              const colour = getComputedStyle(node).backgroundColor
              return colour !== 'rgba(0, 0, 0, 0)' && colour !== 'transparent'
                ? colour
                : node.parentElement
                  ? background(node.parentElement)
                  : 'rgb(255, 255, 255)'
            }
            return Array.from(
              element.querySelectorAll(
                'p, h2, h3, h4, h5, h6, a, code, figcaption, figcaption > span, li > span[aria-hidden]',
              ),
            ).map((node) => ({
              text: node.tagName,
              foreground: getComputedStyle(node).color,
              background: background(node),
            }))
          })
          for (const pair of pairs)
            expect(
              contrastRatio(pair.foreground, pair.background),
              `${colour.name}, dark=${dark}, ${pair.text}`,
            ).toBeGreaterThanOrEqual(4.5)
          const link = page.locator('.ec-body > [data-variant="key-points"] > p a').first()
          await page.keyboard.press('Tab')
          await link.focus()
          const focus = await link.evaluate((element) => {
            const style = getComputedStyle(element)
            return {
              colour: style.outlineColor,
              style: style.outlineStyle,
              width: style.outlineWidth,
            }
          })
          expect(focus.style).toBe('solid')
          expect(focus.width).toBe('3px')
          expect(contrastRatio(focus.colour, colour.background)).toBeGreaterThanOrEqual(3)
        }
        const axe = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze()
        expect(axe.violations).toEqual([])
      }
    },
  )
}

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

test('captures the developed pages in both themes at the three review widths', async ({ page }) => {
  test.setTimeout(300_000)
  const captureFonts = await prepareFontCapture(page, root, {
    '--font-ec-serif': 'Fraunces',
    '--font-ec-mono': 'Martian Mono',
  })
  const destination = path.resolve('docs/worklog/blog-0044.53')
  await mkdir(destination, { recursive: true })
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 })
    for (const [name, route] of [
      ['home', '/'],
      ['section', sectionPath],
      ['article', storyPath],
      [
        'shelf',
        `/stories/${normalizeSlug(labStories.find(({ id }) => id === 'article-lab-shelf')!.title)}`,
      ],
      [
        'chair',
        `/stories/${normalizeSlug(labStories.find(({ id }) => id === 'article-lab-chair')!.title)}`,
      ],
      [
        'door-handle',
        `/stories/${normalizeSlug(labStories.find(({ id }) => id === 'article-lab-door-handle')!.title)}`,
      ],
      ['author', authorPath],
      ['topic', topicPath],
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
      for (const theme of ['light', 'dark']) {
        await page.evaluate(
          (dark) => document.documentElement.classList.toggle('dark', dark),
          theme === 'dark',
        )
        await waitForThemeToSettle(page)
        for (const fullPage of [false, true]) {
          await captureFonts.assertFonts()
          await page.screenshot({
            path: path.join(
              destination,
              `${name}-${width}-${theme}-${fullPage ? 'full' : 'viewport'}.png`,
            ),
            fullPage,
            animations: 'disabled',
          })
        }
      }
    }
  }
})

test('keeps home, section and article stable on cold and warm loads without the capture gate', async ({
  page,
}) => {
  test.setTimeout(180_000)
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
              (node.matches('.ec-article-band h1, .ec-wordmark-home, .ec-section-header h1') ||
                node.closest('.ec-article-band h1, .ec-wordmark-home, .ec-section-header h1')),
          )
        )
          measured.ecShifts.title += entry.value
      }
    }).observe({ type: 'layout-shift', buffered: true })
  })
  const cdp = await page.context().newCDPSession(page)
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const theme of ['light', 'dark']) {
      await page.evaluate((value) => localStorage.setItem('theme', value), theme)
      for (const route of pagePaths) {
        await cdp.send('Network.clearBrowserCache')
        for (const visit of ['cold', 'warm']) {
          await page.goto(route)
          await page.evaluate(async () => {
            await document.fonts.ready
            await Promise.all(
              Array.from(
                document.querySelectorAll<HTMLImageElement>('.ec-hero img, .ec-card-lead img'),
                (image) => image.decode(),
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
          expect(shifts.total, `${visit} ${route} ${theme} ${width} CLS`).toBe(0)
          expect(shifts.title, `${visit} ${route} ${theme} ${width} title shift`).toBe(0)
        }
      }
    }
  }
})
