import { mkdir } from 'node:fs/promises'
import path from 'node:path'

import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

import { dismissReaderLabIntroductions } from '../../../../../tests/e2e/support/reader-lab'
import { normalizeSlug } from '../../server/content/domain'
import { labAuthors, labStories, labTopics } from '../../server/lab/north-house'
import { prepareFontCapture } from '../capture-fonts'
import { observeCaptureFonts } from './capture-font-diagnostics'

const storyTitle = 'The long table: a field guide to the North House kitchen'
const storyPath = '/stories/the-long-table-a-field-guide-to-the-north-house-kitchen'
const sectionPath = '/sections/interiors'
const root = '[data-reader-direction="literary-longread"]'
const longRead = labStories.find(({ id }) => id === 'article-lab-long-table')!
const doorHandle = labStories.find(({ id }) => id === 'article-lab-door-handle')!
const author = labAuthors.find(({ slug }) => slug === longRead.authors[0])!
const topic = labTopics.find(({ slug }) => slug === longRead.topics[0])!
const authorPath = `/authors/${author.slug}`
const topicPath = `/topics/${topic.slug}`
const routes = ['/', storyPath, sectionPath, authorPath, topicPath]
const leadStory = [...labStories].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0]!

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
    .locator('[data-reader-direction-card="literary-longread"]')
    .getByRole('button', { name: /^View the site in this direction/ })
    .click()
  await expect(page).toHaveURL('/')
  await expect(page.locator(root)).toBeVisible()
})

test('keeps the direction through article, author, topic and story navigation', async ({
  page,
}) => {
  await expect(
    page.locator(root).getByRole('heading', { name: storyTitle, exact: true }),
  ).toBeVisible()
  await page.goto(storyPath)
  await expect(page.locator(root).getByRole('heading', { level: 1 })).toHaveText(storyTitle)
  await page.locator('.ll-byline').getByRole('link', { name: author.name, exact: true }).click()
  await expect(page).toHaveURL(authorPath)
  await expect(page.locator(root).getByRole('heading', { level: 1 })).toHaveText(author.name)
  await expect(page.locator('.ll-index-row')).toHaveCount(
    labStories.filter((story) => story.authors.includes(author.slug)).length,
  )
  await page.locator('.ll-index').getByRole('link', { name: storyTitle, exact: true }).click()
  await page.locator('.ll-topics').getByRole('link', { name: topic.name, exact: true }).click()
  await expect(page).toHaveURL(topicPath)
  await expect(page.locator(root).getByRole('heading', { level: 1 })).toHaveText(topic.name)
  await expect(page.locator('.ll-index-row')).toHaveCount(
    labStories.filter((story) => story.topics.includes(topic.slug)).length,
  )
  await page.locator('.ll-index').getByRole('link', { name: storyTitle, exact: true }).click()
  await expect(page.locator(root)).toBeVisible()
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
  for (const width of [320, 390, 767, 768, 1023, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const path of routes) {
      await page.goto(path)
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        `${path} at ${width}`,
      ).toBe(true)
      const sections = page.locator(root).getByRole('navigation', { name: 'Sections' })
      await expect(sections).toBeVisible()
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
      if (story.id === 'article-lab-chair') await expect(page.locator('.ll-hero')).toHaveCount(0)
    }
  }
})

test('uses visible keyboard focus and a warm dark reading ground', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
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
  await expect(page.locator('#ll-main')).toBeFocused()
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
  ).toBe('rgb(27, 25, 23)')
})

for (const width of [390, 768, 1440]) {
  for (const theme of ['light', 'dark']) {
    test(`passes axe with the lab bar at ${width}px in ${theme} mode`, async ({ page }) => {
      test.setTimeout(120_000)
      await page.setViewportSize({ width, height: 900 })
      for (const path of routes) {
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
  }
}

test('uses the b1 cover, card and index geometry across both layout transitions', async ({
  page,
}) => {
  test.setTimeout(180_000)
  for (const width of [320, 390, 767, 768, 1023, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    const desktop = width >= 1024
    const tablet = width >= 768
    const gutter = desktop ? 48 : tablet ? 24 : 20
    const contentWidth = Math.min(width - gutter * 2, 1248)
    await page.goto('/')
    const main = await page.locator('#ll-main').boundingBox()
    expect(main!.width).toBeCloseTo(contentWidth, 0)
    expect(main!.x).toBeCloseTo((width - contentWidth) / 2, 0)
    await expect(page.locator('.ll-cover-title')).toHaveCSS(
      'font-size',
      desktop ? '56px' : tablet ? '40px' : '38px',
    )
    await expect(page.locator('.ll-cover-title')).toHaveCSS('text-transform', 'none')
    await expect(page.locator('.ll-wordmark')).toHaveCSS(
      'font-size',
      desktop ? '44px' : tablet ? '36px' : '28px',
    )
    await expect(page.locator('.ll-read')).toHaveAccessibleName(
      `Read the story: ${leadStory.title}`,
    )
    await expect(page.locator('.ll-card-title').first()).toHaveCSS(
      'font-size',
      desktop ? '34px' : tablet ? '30px' : '28px',
    )
    await expect(page.locator('.ll-card-dek').first()).toHaveCSS(
      'font-size',
      desktop ? '20px' : '18px',
    )
    await expect(page.locator('.ll-cover-dek')).toHaveCSS(
      'font-size',
      desktop ? '28px' : tablet ? '26px' : '22px',
    )
    await expect(page.locator('.ll-label').first()).toHaveCSS('font-size', '13px')
    await expect(page.locator('.ll-label').first()).toHaveCSS('font-weight', '600')
    const cards = await page.locator('.ll-grid').evaluate((element) => {
      const style = getComputedStyle(element)
      return { columns: style.gridTemplateColumns.split(' ').length, gap: style.gap }
    })
    expect(cards).toEqual({ columns: tablet ? 2 : 1, gap: tablet ? '24px' : '40px' })
    const panel = await page.locator('.ll-cover-panel').boundingBox()
    const frame = await page.locator('.ll-cover-image .ll-image-frame').boundingBox()
    expect(frame!.width).toBeCloseTo(tablet ? contentWidth / 2 : contentWidth, 0)
    if (tablet) {
      expect(frame!.y).toBeCloseTo(panel!.y, 0)
      expect(frame!.height).toBeGreaterThanOrEqual(frame!.width * 1.25 - 1)
    } else {
      expect(frame!.y).toBeCloseTo(panel!.y + panel!.height, 0)
      expect(frame!.height).toBeCloseTo(frame!.width * 0.75, 0)
    }
    const caption = page.locator('.ll-cover-image figcaption')
    if (await caption.count()) {
      expect((await caption.boundingBox())!.y).toBeGreaterThanOrEqual(frame!.y + frame!.height)
      await expect(caption).toHaveCSS('font-size', '14px')
    }
    for (const cardFrame of await page.locator('.ll-card-image .ll-image-frame').all()) {
      const box = (await cardFrame.boundingBox())!
      expect(box.height).toBeCloseTo(box.width * 0.75, 0)
    }
    await page.goto(sectionPath)
    await expect(page.locator('.ll-section-header h1')).toHaveCSS(
      'font-size',
      desktop ? '72px' : tablet ? '56px' : '42px',
    )
    await expect(page.locator('.ll-index-copy h2').first()).toHaveCSS(
      'font-size',
      desktop ? '36px' : tablet ? '30px' : '28px',
    )
    for (const row of await page.locator('.ll-index-row').all()) {
      const rowBox = (await row.boundingBox())!
      const copy = (await row.locator('.ll-index-copy').boundingBox())!
      const date = (await row.locator('.ll-date').boundingBox())!
      const thumbnail = row.locator('.ll-index-image .ll-image-frame')
      if (await thumbnail.count()) {
        const box = (await thumbnail.boundingBox())!
        expect(box.width).toBeCloseTo(desktop ? 160 : tablet ? 96 : 80, 0)
        expect(box.height).toBeCloseTo(box.width * 0.75, 0)
      } else {
        expect(copy.x + copy.width).toBeCloseTo(rowBox.x + rowBox.width, 0)
      }
      if (desktop) {
        expect(copy.x - date.x).toBeCloseTo(152, 0)
      } else {
        expect(copy.x).toBeCloseTo(date.x, 0)
        expect(copy.y).toBeGreaterThanOrEqual(date.y + date.height)
      }
    }
  }
})

test('uses a 65-character reading measure and genuine italic text, with reduced motion respected', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(storyPath)
  await page.evaluate(async () => {
    await document.fonts.ready
  })
  const body = page.locator('.ll-body')
  const metrics = await body
    .locator(':scope > p')
    .first()
    .evaluate((element) => {
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
  expect(metrics.lineHeight).toBe('33px')
  expect(metrics.width).toBeCloseTo(Math.min(metrics.measure, 672), 0)
  expect((await body.boundingBox())!.width).toBeCloseTo(672, 0)
  expect(
    await page.locator('.ll-dek').evaluate((element) => getComputedStyle(element).fontStyle),
  ).toBe('italic')
  expect(
    await body
      .locator('p')
      .first()
      .evaluate((element) => getComputedStyle(element, '::first-letter').cssFloat),
  ).toBe('left')
  expect(await body.evaluate((element) => getComputedStyle(element).animationName)).toBe('none')
  expect(
    Number.parseFloat(
      await body.evaluate((element) => getComputedStyle(element).transitionDuration),
    ),
  ).toBeLessThanOrEqual(0.00001)
})

test('preserves all five ordered numbering styles and starts in the article cascade', async ({
  page,
}) => {
  await page.goto(storyPath)
  await expect(page.locator('.ll-body ol[type="1"]').first()).toHaveCSS(
    'list-style-type',
    'decimal',
  )
  await page.goto(`/stories/${normalizeSlug(doorHandle.title)}`)
  await expect(page.locator('.ll-body ol[type="a"]').first()).toHaveCSS(
    'list-style-type',
    'lower-alpha',
  )
  // North House has no upper-alpha or Roman lists. Match the shared renderer's
  // type plus inline marker style, rather than mutating only its type attribute.
  const markers = {
    A: 'upper-alpha',
    i: 'lower-roman',
    I: 'upper-roman',
  }
  for (const [type, marker] of Object.entries(markers)) {
    await page.locator('.ll-body').evaluate(
      (element, { type, marker }) => {
        element.insertAdjacentHTML(
          'beforeend',
          `<ol data-probe="${type}" type="${type}" start="4" style="list-style-type: ${marker}"><li><p>Numbering probe</p></li></ol>`,
        )
      },
      { type, marker },
    )
    // Attribute selectors match type case-insensitively (A also matches the real a list), so
    // the probe is addressed by its own marker attribute.
    const list = page.locator(`.ll-body ol[data-probe="${type}"]`)
    await expect(list).toHaveCSS('list-style-type', marker)
    expect(await list.evaluate((element) => (element as HTMLOListElement).start)).toBe(4)
  }
})

test('aligns article title, dek, label and byline to the same mobile left edge', async ({
  page,
}) => {
  for (const width of [700, 767]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(storyPath)
    const header = page.locator('.ll-article-header')
    const label = (await header.locator('.ll-label').boundingBox())!
    for (const selector of ['h1', '.ll-dek', '.ll-byline']) {
      const element = header.locator(selector)
      await expect(element).toHaveCSS('margin-left', '0px')
      await expect(element).toHaveCSS('margin-right', '0px')
      expect((await element.boundingBox())!.x, `${selector} at ${width}px`).toBeCloseTo(label.x, 1)
    }
  }
})

test('computes the article scale, body layout, list markers and end matter at each breakpoint', async ({
  page,
}) => {
  test.setTimeout(180_000)
  for (const width of [390, 767, 768, 1023, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(storyPath)
    const desktop = width >= 1024
    const tablet = width >= 768
    const body = page.locator('.ll-body')
    await expect(body).toHaveCSS('font-size', tablet ? '20px' : '18px')
    await expect(body).toHaveCSS('line-height', tablet ? '33px' : '29.7px')
    await expect(page.locator('.ll-article-header')).toHaveCSS(
      'text-align',
      tablet ? 'center' : 'left',
    )
    if (tablet) {
      for (const selector of ['h1', '.ll-dek']) {
        const margins = await page.locator(`.ll-article-header ${selector}`).evaluate((element) => {
          // Typed computed styles retain auto; getComputedStyle resolves it to pixels.
          const style = element.computedStyleMap()
          return {
            start: style.get('margin-inline-start')?.toString(),
            end: style.get('margin-inline-end')?.toString(),
          }
        })
        expect(margins, `${selector} at ${width}px`).toEqual({ start: 'auto', end: 'auto' })
      }
    }
    await expect(page.locator('.ll-article-header h1')).toHaveCSS(
      'font-size',
      desktop ? '72px' : tablet ? '56px' : '42px',
    )
    await expect(page.locator('.ll-dek')).toHaveCSS(
      'font-size',
      desktop ? '28px' : tablet ? '26px' : '22px',
    )
    await expect(body.locator('h2').first()).toHaveCSS(
      'font-size',
      desktop ? '40px' : tablet ? '36px' : '30px',
    )
    await expect(body.locator('h3').first()).toHaveCSS(
      'font-size',
      desktop ? '32px' : tablet ? '30px' : '26px',
    )
    await expect(body.locator('h4').first()).toHaveCSS('font-size', '24px')
    await expect(body.locator('[data-block="pull-quote"] blockquote')).toHaveCSS(
      'font-size',
      desktop ? '40px' : tablet ? '32px' : '28px',
    )
    await expect(body.locator('ul:not([data-block])').first()).toHaveCSS('list-style-type', 'disc')
    await expect(body.locator('ol[type="1"]').first()).toHaveCSS('list-style-type', 'decimal')
    await expect(body.locator('[data-block="gallery"]')).toHaveCSS('gap', '24px')
    await expect(body.locator('[data-block="gallery"]')).toHaveCSS('transform', 'none')
    await expect(body.locator('[data-block="checklist"]')).toHaveCSS('list-style-type', 'none')
    await expect(body.locator('[data-block="callout"]')).toHaveCSS(
      'padding',
      tablet ? '24px' : '16px',
    )
    expect(
      await body
        .locator(':scope > p')
        .first()
        .evaluate((element) => getComputedStyle(element, '::first-letter').cssFloat),
    ).toBe(tablet ? 'left' : 'none')
    const gallery = await body.locator('[data-block="gallery"]').evaluate((element) => ({
      width: element.getBoundingClientRect().width,
      columns: getComputedStyle(element).gridTemplateColumns.split(' ').length,
    }))
    expect(gallery.width).toBeCloseTo(Math.min(width - (tablet ? (desktop ? 96 : 48) : 40), 672), 0)
    expect(gallery.columns).toBe(tablet ? 2 : 1)
    expect(
      await page
        .locator('.ll-related-grid')
        .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length),
    ).toBe(desktop ? 3 : 1)
    for (const link of await page.locator('.ll-byline a, .ll-authors a, .ll-topics a').all()) {
      const box = (await link.boundingBox())!
      expect(box.width).toBeGreaterThanOrEqual(44)
      expect(box.height).toBeGreaterThanOrEqual(44)
      await expect(link).toHaveCSS('text-decoration-line', 'underline')
    }
    // These semantic levels are absent from North House. Add isolated DOM probes
    // to the real body to verify the active cascade, without altering stored content.
    await body.evaluate((element) => {
      element.insertAdjacentHTML(
        'beforeend',
        '<h5 data-probe>Fifth level</h5><h6 data-probe>Sixth level</h6>',
      )
      element.insertAdjacentHTML('afterbegin', '<h2 data-probe>A heading-led article</h2>')
    })
    await expect(body.locator('h5[data-probe]')).toHaveCSS('font-size', '22px')
    await expect(body.locator('h6[data-probe]')).toHaveCSS('font-size', '20px')
    for (const level of [2, 3, 4, 5, 6]) {
      const heading = body.locator(`h${level}`).first()
      await expect(heading).toHaveCSS('margin-top', '44px')
      await expect(heading).toHaveCSS('margin-bottom', '16px')
    }
    const embed = body.locator(':scope > figure[data-block="embed"]')
    await expect(embed).toHaveCount(1)
    // The resolved 65ch cap should match prose even when the available shell
    // is narrower. Compare the cap as well as the final box.
    const prose = body.locator(':scope > p').first()
    await expect(embed).toHaveCSS(
      'max-width',
      await prose.evaluate((element) => getComputedStyle(element).maxWidth),
    )
    expect((await embed.boundingBox())!.width).toBeCloseTo((await prose.boundingBox())!.width, 0)
    expect(
      await body
        .locator(':scope > p')
        .first()
        .evaluate((element) => getComputedStyle(element, '::first-letter').cssFloat),
    ).toBe('none')
  }
})

test('computes gold cover focus and accent focus elsewhere in both themes', async ({ page }) => {
  for (const dark of [false, true]) {
    await page.goto('/')
    await page.evaluate((value) => document.documentElement.classList.toggle('dark', value), dark)
    await waitForThemeToSettle(page)
    await page.keyboard.press('Tab')
    const cover = page.locator('.ll-read')
    await cover.focus()
    await expect(cover).toHaveCSS('outline-color', 'rgb(201, 168, 106)')
    await expect(cover).toHaveCSS('outline-width', '2px')
    await expect(cover).toHaveCSS('outline-offset', '4px')
    const ordinary = page.locator('.ll-card-title a').first()
    await ordinary.focus()
    await expect(ordinary).toHaveCSS(
      'outline-color',
      dark ? 'rgb(229, 154, 145)' : 'rgb(155, 44, 44)',
    )
    await expect(ordinary).toHaveCSS('outline-width', '2px')

    await page.goto(storyPath)
    await page.evaluate((value) => document.documentElement.classList.toggle('dark', value), dark)
    await waitForThemeToSettle(page)
    await page.keyboard.press('Tab')
    for (const selector of [
      '.ll-byline a',
      '.ll-authors a',
      '.ll-topics a',
      '.ll-article-exit a',
    ]) {
      const link = page.locator(selector).first()
      await link.focus()
      await expect(link).toBeFocused()
      expect(await link.evaluate((element) => element.matches(':focus-visible'))).toBe(true)
      await expect(link).toHaveCSS('color', dark ? 'rgb(229, 154, 145)' : 'rgb(155, 44, 44)')
      await expect(link).toHaveCSS(
        'outline-color',
        dark ? 'rgb(229, 154, 145)' : 'rgb(155, 44, 44)',
      )
      await expect(link).toHaveCSS('outline-width', '2px')
    }
  }
})

test('keeps all five pages scoped and readable in the comparison frames', async ({ page }) => {
  test.setTimeout(180_000)
  for (const route of routes) {
    await page.goto(`/owner/reader-lab/compare?page=${encodeURIComponent(route)}`)
    const frame = page.frameLocator('iframe[title="Literary Long-read — selected page preview"]')
    for (const width of [390, 1440]) {
      await page.getByRole('radio', { name: width === 390 ? /Mobile/ : /Desktop/ }).check()
      for (const dark of [false, true]) {
        await page.evaluate(
          (value) => document.documentElement.classList.toggle('dark', value),
          dark,
        )
        await expect(frame.locator(root)).toHaveCSS(
          'background-color',
          dark ? 'rgb(27, 25, 23)' : 'rgb(251, 248, 242)',
        )
        await expect(frame.locator('h1')).toHaveCount(1)
        await expect(frame.locator('main')).toHaveCount(1)
        expect(
          await frame
            .locator('html')
            .evaluate((element) => element.scrollWidth <= element.clientWidth),
        ).toBe(true)
        await expect(frame.locator('.ll-page')).toHaveCSS(
          'font-size',
          width === 390 ? '18px' : '20px',
        )
        if (route === storyPath) {
          await expect(frame.locator('.ll-body')).toHaveCSS(
            'font-size',
            width === 390 ? '18px' : '20px',
          )
        }
      }
    }
  }
})

test('removes literary font declarations when the owner switches back to baseline', async ({
  page,
}) => {
  await expect(page.locator('[data-reader-direction-fonts="literary-longread"]')).toHaveCount(1)
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
      { name: 'reader_lab_direction', value: 'literary-longread', url: 'http://localhost:3100' },
    ])
    const page = await visitor.newPage()
    const fonts: string[] = []
    page.on('request', (request) => {
      if (request.resourceType() === 'font') fonts.push(request.url())
    })
    for (const path of routes) {
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

test('decodes crop sources against measured frames at DPR 1 and 2', async ({
  browser,
  context,
  page,
}, testInfo) => {
  test.setTimeout(240_000)
  const observations = []
  for (const deviceScaleFactor of [1, 2]) {
    const measured = await browser.newContext({
      baseURL: new URL(page.url()).origin,
      storageState: await context.storageState(),
      deviceScaleFactor,
    })
    try {
      for (const width of [390, 768, 1024, 1440]) {
        const tab = await measured.newPage()
        await tab.setViewportSize({ width, height: 900 })
        for (const route of routes) {
          await tab.goto(route)
          await expect(tab.locator(root)).toBeVisible()
          // Selection evidence only: this eagerly loaded run is not a CWV/transfer benchmark.
          const crops = await tab.locator('.ll-image-frame img').evaluateAll(async (elements) => {
            return Promise.all(
              elements.map(async (element) => {
                const img = element as HTMLImageElement
                img.loading = 'eager'
                await img.decode()
                const frame = img.closest('.ll-image-frame')!.getBoundingClientRect()
                const bitmap = await createImageBitmap(await (await fetch(img.currentSrc)).blob())
                const sourceWidth = Number(img.getAttribute('width'))
                const sourceHeight = Number(img.getAttribute('height'))
                const descriptors = img.srcset
                  .split(',')
                  .map((candidate) =>
                    Number.parseFloat(candidate.trim().split(/\s+/).at(-1) ?? '0'),
                  )
                const maximum = Math.max(...descriptors)
                const required =
                  Math.max(
                    frame.width,
                    sourceHeight ? (frame.height * sourceWidth) / sourceHeight : frame.width,
                  ) * devicePixelRatio
                const observation = {
                  src: img.currentSrc,
                  sizes: img.sizes,
                  frame: { width: frame.width, height: frame.height },
                  sourceWidth,
                  sourceHeight,
                  decodedWidth: bitmap.width,
                  required,
                  maximum,
                  limitedBySource: required > maximum,
                  objectPosition: getComputedStyle(img).objectPosition,
                }
                bitmap.close()
                return observation
              }),
            )
          })
          observations.push({ route, width, deviceScaleFactor, crops })
          for (const crop of crops) {
            // If the original/variant ceiling is too small, record it rather than invent pixels.
            expect
              .soft(crop.decodedWidth, `${route} ${width}px DPR${deviceScaleFactor}: ${crop.src}`)
              .toBeGreaterThanOrEqual(Math.min(crop.required, crop.maximum) - 2)
          }
          const preload = tab.locator(`${root} link[as="image"][href], head link[as="image"][href]`)
          if (await preload.count()) {
            await expect(preload).toHaveCount(1)
            await expect(preload).toHaveAttribute(
              'imagesizes',
              (await tab.locator(`${root} main img`).first().getAttribute('sizes'))!,
            )
          }
        }
        await tab.close()
      }
    } finally {
      await measured.close()
    }
  }
  await testInfo.attach('decoded-crop-selection', {
    body: JSON.stringify(observations, null, 2),
    contentType: 'application/json',
  })
})

test('places index captions below the whole row on phones and tablets', async ({ page }) => {
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const route of [sectionPath, authorPath, topicPath]) {
      await page.goto(route)
      for (const row of await page.locator('.ll-index-row:has(figcaption)').all()) {
        const caption = row.locator('figcaption')
        const box = (await caption.boundingBox())!
        const frame = (await row.locator('.ll-image-frame').boundingBox())!
        const copy = (await row.locator('.ll-index-copy').boundingBox())!
        await expect(caption).toHaveCSS('font-size', '14px')
        expect(box.y).toBeGreaterThanOrEqual(frame.y + frame.height - 1)
        if (width < 1024) {
          expect(box.y).toBeGreaterThanOrEqual(copy.y + copy.height - 1)
          expect(box.x).toBeCloseTo(copy.x, 0)
          expect(box.width).toBeGreaterThan(frame.width * 2)
          await expect(caption).toHaveCSS('grid-column', '1 / -1')
        }
      }
    }
  }
})

test('renders the authorized missing-page shell and keeps failure recovery keyboard accessible', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const dark of [false, true]) {
      const response = await page.goto('/stories/literary-b3-missing-story')
      expect(response?.status()).toBe(404)
      await expect(page.locator(`${root} .ll-failure`)).toBeVisible()
      await page.evaluate((value) => document.documentElement.classList.toggle('dark', value), dark)
      await waitForThemeToSettle(page)
      await expect(page.locator('h1')).toHaveCount(1)
      await expect(page.locator('main')).toHaveCount(1)
      await expect(page.locator('h1')).toHaveText('Page not found')
      await expect(page.locator(`${root} main img`)).toHaveCount(0)
      expect((await page.locator('.ll-failure').boundingBox())!.width).toBeLessThanOrEqual(
        Math.min(width - 40, 640),
      )
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze()
      expect(result.violations).toEqual([])
      await page.keyboard.press('Tab')
      const home = page.getByRole('link', { name: 'Return to all stories' })
      await home.focus()
      await expect(home).toHaveCSS('outline-width', '2px')
      await expect(home).toHaveCSS('outline-offset', '4px')
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL('/')
    }
  }
})

test('prints light paper and full-composition images from either theme', async ({ page }) => {
  for (const route of ['/', storyPath, sectionPath]) {
    await page.goto(route)
    await page.evaluate(() => document.documentElement.classList.add('dark'))
    await page.emulateMedia({ media: 'print' })
    await expect(page.locator(root)).toHaveCSS('background-color', 'rgb(251, 248, 242)')
    await expect(page.locator('.ll-page')).toHaveCSS('color', 'rgb(20, 20, 20)')
    await expect(page.locator('.ll-masthead nav')).toBeHidden()
    await expect(page.locator('[data-reader-lab-bar]')).toBeHidden()
    for (const image of await page.locator('.ll-image-frame img').all()) {
      await expect(image).toHaveCSS('position', 'static')
      await expect(image).toHaveCSS('object-fit', 'contain')
      const ratio = await image.evaluate((element) => {
        const img = element as HTMLImageElement
        const box = img.getBoundingClientRect()
        return {
          actual: box.width / box.height,
          original: Number(img.getAttribute('width')) / Number(img.getAttribute('height')),
        }
      })
      expect(ratio.actual).toBeCloseTo(ratio.original, 2)
    }
    await page.emulateMedia({ media: 'screen' })
  }
})

test('reflows all five pages with enlarged text and text-spacing overrides', async ({ page }) => {
  test.setTimeout(120_000)
  await page.setViewportSize({ width: 390, height: 900 })
  for (const route of routes) {
    await page.goto(route)
    await page.addStyleTag({
      content: `
        html { font-size: 200% !important; }
        .ll-page * { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }
        .ll-page p { margin-bottom: 2em !important; }
      `,
    })
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      `${route}: enlarged text with spacing`,
    ).toBe(true)
    for (const caption of await page.locator('.ll-page figcaption').all()) {
      expect(
        await caption.evaluate((element) => element.scrollHeight <= element.clientHeight + 1),
      ).toBe(true)
    }
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('.ll-footer a')).toBeVisible()
  }
})

for (const width of [390, 1440]) {
  for (const theme of ['light', 'dark'] as const) {
    test(`records natural cold/warm loading and interactions at ${width}px in ${theme}`, async ({
      browser,
      context,
      page,
    }, testInfo) => {
      test.setTimeout(240_000)
      type Measurements = {
        shifts: { startTime: number; value: number }[]
        lcp: { startTime: number; element: string; url: string }[]
        interactions: { name: string; duration: number; interactionId: number }[]
      }
      type MeasuredWindow = Window & { llMeasurements: Measurements }
      const observations = []
      for (const route of routes) {
        // A fresh context for each page type makes its first navigation browser-cache cold.
        const measured = await browser.newContext({
          baseURL: new URL(page.url()).origin,
          storageState: await context.storageState(),
          viewport: { width, height: 900 },
          deviceScaleFactor: width === 390 ? 2 : 1,
          colorScheme: theme,
        })
        try {
          await measured.addInitScript((theme) => {
            localStorage.setItem('theme', theme)
            const metrics: Measurements = { shifts: [], lcp: [], interactions: [] }
            ;(window as unknown as MeasuredWindow).llMeasurements = metrics
            new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                const shift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number }
                if (!shift.hadRecentInput) {
                  metrics.shifts.push({ startTime: shift.startTime, value: shift.value })
                }
              }
            }).observe({ type: 'layout-shift', buffered: true })
            new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                const lcp = entry as PerformanceEntry & { element?: Element; url?: string }
                metrics.lcp.push({
                  startTime: lcp.startTime,
                  element: lcp.element ? `${lcp.element.tagName}.${lcp.element.className}` : '',
                  url: lcp.url ?? '',
                })
              }
            }).observe({ type: 'largest-contentful-paint', buffered: true })
            new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                const event = entry as PerformanceEntry & { interactionId: number }
                if (event.interactionId) {
                  metrics.interactions.push({
                    name: event.name,
                    duration: event.duration,
                    interactionId: event.interactionId,
                  })
                }
              }
            }).observe({
              type: 'event',
              buffered: true,
              durationThreshold: 16,
            } as PerformanceObserverInit)
          }, theme)
          const tab = await measured.newPage()
          for (const cache of ['cold', 'warm']) {
            await tab.goto(route)
            await expect(tab.locator(root)).toBeVisible()
            await tab.evaluate(async () => {
              await document.fonts.ready
            })
            // Observe real optional fonts and lazy images; no capture-font loading or eager mutation.
            await tab.waitForTimeout(500)
            for (let step = 0; step < 150; step++) {
              const atEnd = await tab.evaluate(() => {
                window.scrollBy({ top: innerHeight * 0.8, behavior: 'instant' })
                return scrollY + innerHeight >= document.documentElement.scrollHeight - 1
              })
              await tab.waitForTimeout(80)
              if (atEnd) break
            }
            await tab.evaluate(async () => {
              await Promise.all(Array.from(document.images, (img) => img.decode()))
            })
            // Literary Long-read has no Theme control (its spec defines none), so the measured
            // interactions are keyboard steps and a click on plain text (on home the h1 is a link).
            await tab.keyboard.press('Tab')
            await tab.keyboard.press('Tab')
            const urlBefore = tab.url()
            await tab.locator(`${root} main p:not(:has(a))`).first().click()
            expect(tab.url()).toBe(urlBefore)
            await tab.waitForTimeout(500)
            const result = await tab.evaluate(() => ({
              ...(window as unknown as MeasuredWindow).llMeasurements,
              fonts: [...document.fonts].map(({ family, style, weight, status }) => ({
                family,
                style,
                weight,
                status,
              })),
              resources: performance.getEntriesByType('resource').map((entry) => {
                const resource = entry as PerformanceResourceTiming
                return {
                  name: resource.name,
                  type: resource.initiatorType,
                  transferSize: resource.transferSize,
                  encodedBodySize: resource.encodedBodySize,
                }
              }),
            }))
            // CLS is the largest session window (<=1s gap, <=5s duration), not a lifetime sum.
            let cls = 0
            let start = 0
            let previous = -Infinity
            let sum = 0
            for (const shift of result.shifts) {
              if (shift.startTime - previous > 1000 || shift.startTime - start > 5000) {
                start = shift.startTime
                sum = 0
              }
              sum += shift.value
              previous = shift.startTime
              cls = Math.max(cls, sum)
            }
            observations.push({ route, width, theme, cache, cls, ...result })
            expect.soft(cls, `${route} ${cache} CLS`).toBeLessThanOrEqual(0.05)
            for (const interaction of result.interactions) {
              expect
                .soft(interaction.duration, `${route} ${cache} ${interaction.name}`)
                .toBeLessThanOrEqual(200)
            }
          }
        } finally {
          await measured.close()
        }
      }
      // This is unthrottled lab evidence. Empty Event Timing entries are not an INP pass;
      // Lighthouse's three-run median and field p75 need separate measurements.
      await testInfo.attach('natural-loading-and-interactions', {
        body: JSON.stringify(observations, null, 2),
        contentType: 'application/json',
      })
    })
  }
}

test('captures five page types in both themes for review', async ({ page }, testInfo) => {
  test.setTimeout(300_000)
  const diagnostics = await observeCaptureFonts(page)
  const captureFonts = await prepareFontCapture(page, root, {
    '--font-ll-serif': 'Newsreader',
    '--font-ll-sans': 'Libre Franklin',
  })
  const destination = path.resolve('docs/worklog/blog-0044.45')
  await mkdir(destination, { recursive: true })
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 })
    for (const [name, route] of [
      ['home', '/'],
      ['article', storyPath],
      ['section', sectionPath],
      ['author', authorPath],
      ['topic', topicPath],
    ]) {
      try {
        await captureFonts.goto(route!)
        await diagnostics.checkpoint('after capture goto / before images')
        // Load lazy images before the full-page capture, then return to the cover.
        await page.evaluate(async () => {
          for (const image of document.images) image.loading = 'eager'
          await Promise.all(Array.from(document.images, (image) => image.decode().catch(() => {})))
          window.scrollTo(0, 0)
        })
        await diagnostics.checkpoint('after images / before theme')
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
          await diagnostics.checkpoint(`${theme}: after toggle / before settle`)
          await waitForThemeToSettle(page)
          await diagnostics.checkpoint(`${theme}: after settle`)
          for (const fullPage of [false, true]) {
            if (theme === 'dark' && !fullPage) {
              // The light full-page screenshot can recreate FontFace objects and latch optional
              // fallbacks (blog-0044.59), so the dark captures start from a fresh first layout.
              await captureFonts.goto(route!)
              await page.evaluate(async () => {
                for (const image of document.images) image.loading = 'eager'
                await Promise.all(
                  Array.from(document.images, (image) => image.decode().catch(() => {})),
                )
                window.scrollTo(0, 0)
              })
              await page.evaluate(() => document.documentElement.classList.add('dark'))
              await waitForThemeToSettle(page)
            }
            await diagnostics.checkpoint(`${theme}: before assertFonts / fullPage=${fullPage}`)
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
      } finally {
        try {
          await diagnostics.checkpoint('route finished or failed')
          await diagnostics.attach(testInfo, `${name}-${width}-font-lifecycle`)
        } catch {
          // A closed page can prevent diagnostics; preserve the original capture error.
        }
      }
    }
  }
})
