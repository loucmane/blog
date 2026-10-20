import { mkdir } from 'node:fs/promises'
import path from 'node:path'

import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Locator, type Page } from '@playwright/test'

import { dismissReaderLabIntroductions } from '../../../../../tests/e2e/support/reader-lab'
import { normalizeSlug } from '../../server/content/domain'
import { labAuthors, labImages, labStories, labTopics } from '../../server/lab/north-house'
import { prepareFontCapture } from '../capture-fonts'

const storyTitle = 'The long table: a field guide to the North House kitchen'
const storyPath = '/stories/the-long-table-a-field-guide-to-the-north-house-kitchen'
const sectionPath = '/sections/interiors'
const root = '[data-reader-direction="swiss-index"]'

/** The seeded stories whose hero, the image that opens them, is upright: below 1.2 times its height. */
const uprightStories = labStories.filter(({ blocks: [first] }) => {
  const image = labImages.find(
    ({ id }) => first?.type === 'mediaImage' && id === first.attrs?.mediaId,
  )
  return image !== undefined && image.illustration.width < 1.2 * image.illustration.height
})
const uprightPath = `/stories/${normalizeSlug(uprightStories[0]!.title)}`
const author = labAuthors.find(({ bio }) => bio)!
const authorPath = `/authors/${author.slug}`
const topic = labTopics[0]!
const topicPath = `/topics/${topic.slug}`

async function waitForThemeToSettle(page: Page) {
  // The shared lab bar transitions its colours; assertions need the settled theme.
  await expect.poll(() => page.evaluate(() => document.getAnimations().length)).toBe(0)
}

/** Tabs until `target` has focus; the lab bar comes first in the tab order. */
async function tabTo(page: Page, target: Locator, limit = 20) {
  for (
    let tabs = 0;
    tabs < limit && !(await target.evaluate((element) => element === document.activeElement));
    tabs++
  ) {
    await page.keyboard.press('Tab')
  }
  await expect(target).toBeFocused()
}

/** Every rendered link and button in `scope` is at least 44 by 44 pixels. */
async function expectTouchTargets(scope: Locator, label: string) {
  for (const control of await scope.locator('a, button').filter({ visible: true }).all()) {
    const box = await control.boundingBox()
    const name = `${label}: ${(await control.textContent())?.trim()}`
    expect(box?.width, name).toBeGreaterThanOrEqual(44)
    expect(box?.height, name).toBeGreaterThanOrEqual(44)
  }
}

/** The names of the links that Tab reaches in `row`, from the start of the row until focus leaves it. */
async function tabOrder(page: Page, row: Locator) {
  // Focus on the row itself, with tabindex -1, starts sequential navigation there.
  await row.evaluate((item) => {
    item.tabIndex = -1
    item.focus()
  })
  const names: string[] = []
  for (let tabs = 0; tabs < 10; tabs++) {
    await page.keyboard.press('Tab')
    const name = await row.evaluate((item) =>
      item !== document.activeElement && item.contains(document.activeElement)
        ? document.activeElement!.textContent!.trim()
        : null,
    )
    if (name === null) break
    names.push(name)
  }
  await row.evaluate((item) => item.removeAttribute('tabindex'))
  return names
}

/**
 * The names of the rendered links in `row` in reading order, top to bottom and left to right by
 * column: of two links side by side, the left one, even when it starts lower (a tablet row reads
 * column 1, then column 2); of two that share a column, the upper one.
 */
async function readingOrder(row: Locator) {
  return row.evaluate((item) =>
    [...item.querySelectorAll('a')]
      .filter((link) => link.checkVisibility())
      .map((link) => ({ box: link.getBoundingClientRect(), name: link.textContent!.trim() }))
      .sort(({ box: a }, { box: b }) =>
        a.right <= b.left || b.right <= a.left ? a.left - b.left : a.top - b.top,
      )
      .map(({ name }) => name),
  )
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
    .locator('[data-reader-direction-card="swiss-index"]')
    .getByRole('button', { name: /^View the site in this direction/ })
    .click()
  await expect(page).toHaveURL('/')
  await expect(page.locator(root)).toBeVisible()
})

test('opens Swiss Index from the lab and renders published titles on all three pages', async ({
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

test('renders an author as a bibliography and a topic as plates, each with one h1 naming it', async ({
  page,
}) => {
  const swiss = page.locator(root)
  await page.goto(authorPath)
  await expect(swiss.getByRole('heading', { level: 1 })).toHaveCount(1)
  await expect(swiss.getByRole('heading', { level: 1 })).toHaveText(author.name)
  await expect(swiss.locator('.si-page-header .si-bio')).toHaveText(author.bio)
  const stories = swiss.getByRole('region', { name: 'Stories', exact: true })
  await expect(stories.getByRole('listitem')).toHaveCount(
    labStories.filter(({ authors }) => authors.includes(author.slug)).length,
  )
  await expect(swiss.locator('main img')).toHaveCount(0)
  await expect(page.locator('link[rel="preload"][as="image"]')).toHaveCount(0)
  await page.goto(topicPath)
  await expect(swiss.getByRole('heading', { level: 1 })).toHaveCount(1)
  await expect(swiss.getByRole('heading', { level: 1 })).toHaveText(topic.name)
  const onTopic = labStories.filter(({ topics }) => topics.includes(topic.slug))
  await expect(
    swiss.getByRole('list', { name: `${topic.name} stories` }).getByRole('listitem'),
  ).toHaveCount(Math.min(4, onTopic.length))
  await swiss
    .getByRole('list', { name: `${topic.name} stories` })
    .getByRole('heading', { level: 2 })
    .first()
    .getByRole('link')
    .click()
  await expect(page).toHaveURL(`/stories/${normalizeSlug(onTopic[0]!.title)}`)
})

test('sets the rail beside the story from 1024 pixels and under the header below, in DOM order', async ({
  page,
}) => {
  test.setTimeout(120_000)
  const swiss = page.locator(root)
  const box = async (locator: Locator) => (await locator.boundingBox())!
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const path of [storyPath, uprightPath]) {
      await page.goto(path)
      await page.evaluate(async () => {
        await document.fonts.ready
      })
      const label = `${path} at ${width}`
      const header = await box(swiss.locator('.si-article-header'))
      const rail = await box(swiss.locator('.si-rail'))
      const hero = await box(swiss.locator('.si-hero'))
      const body = await box(swiss.locator('.si-body'))
      const end = await box(swiss.locator('.si-end'))
      if (width >= 1024) {
        // Column 1 holds the rail, level with the header; header, hero and body start at column 2.
        expect(rail.x + rail.width, label).toBeLessThanOrEqual(header.x)
        expect(Math.abs(rail.y - header.y), label).toBeLessThan(2)
        expect(Math.abs(hero.x - header.x), label).toBeLessThan(1)
        expect(Math.abs(body.x - header.x), label).toBeLessThan(1)
      } else {
        // One column: header, rail, hero, body.
        expect(rail.y, label).toBeGreaterThanOrEqual(header.y + header.height)
        expect(hero.y, label).toBeGreaterThanOrEqual(rail.y + rail.height)
        expect(Math.abs(rail.x - header.x), label).toBeLessThan(1)
      }
      expect(body.y, label).toBeGreaterThanOrEqual(hero.y + hero.height)
      // The end matter spans all four columns, under the body.
      expect(end.y, label).toBeGreaterThanOrEqual(body.y + body.height)
      expect(Math.abs(end.x - (width >= 1024 ? rail.x : header.x)), label).toBeLessThan(1)
    }
  }
})

test('sets upright heroes beside their caption from 600 pixels and above it on phones, landscape heroes above theirs', async ({
  page,
}) => {
  test.setTimeout(120_000)
  const swiss = page.locator(root)
  const box = async (locator: Locator) => (await locator.boundingBox())!
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const story of uprightStories) {
      await page.goto(`/stories/${normalizeSlug(story.title)}`)
      const label = `${story.id} at ${width}`
      const hero = await box(swiss.locator('.si-hero.si-hero-upright'))
      const image = await box(swiss.locator('.si-hero img'))
      const caption = await box(swiss.locator('.si-hero figcaption'))
      if (width >= 600) {
        // Two of the hero's three columns from 1024px, one of its two below; the caption beside.
        const share = width >= 1024 ? 2 / 3 : 1 / 2
        expect(image.width, label).toBeLessThan(hero.width * share + 1)
        expect(image.width, label).toBeGreaterThan(hero.width * share - 24)
        expect(image.x + image.width, label).toBeLessThanOrEqual(caption.x)
        expect(caption.y + caption.height, label).toBeLessThanOrEqual(image.y + image.height + 1)
      } else {
        expect(Math.abs(image.width - hero.width), label).toBeLessThan(1)
        expect(caption.y, label).toBeGreaterThanOrEqual(image.y + image.height)
      }
    }
    await page.goto(storyPath)
    const image = await box(swiss.locator('.si-hero img'))
    const caption = await box(swiss.locator('.si-hero figcaption'))
    await expect(swiss.locator('.si-hero-upright')).toHaveCount(0)
    expect(caption.y, `landscape at ${width}`).toBeGreaterThanOrEqual(image.y + image.height)
  }
})

test('sets end-matter terms beside their values from 1024 pixels, and related plates four, two and one to a row', async ({
  page,
}) => {
  const swiss = page.locator(root)
  const story = labStories.find(({ id }) => id === 'article-lab-long-table')!
  // Related stories: the newest other stories in the story's section, at most four.
  const related = labStories
    .filter(({ id, section }) => section === story.section && id !== story.id)
    .slice(0, 4)
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(storyPath)
    const label = `${width}px`
    const term = (await swiss.locator('.si-end dt').first().boundingBox())!
    const value = (await swiss.locator('.si-end dd').first().boundingBox())!
    if (width >= 1024) expect(term.x + term.width, label).toBeLessThanOrEqual(value.x)
    else expect(term.y + term.height, label).toBeLessThanOrEqual(value.y)
    const plates = swiss.getByRole('region', { name: 'Related stories' }).getByRole('listitem')
    await expect(plates).toHaveCount(related.length)
    await expect(plates.getByRole('heading', { level: 3 })).toHaveText(
      related.map(({ title }) => title),
    )
    const tops = await plates.evaluateAll((items) =>
      items.map((item) => Math.round(item.getBoundingClientRect().top)),
    )
    const perRow = width >= 1024 ? 4 : width >= 600 ? 2 : 1
    expect(new Set(tops).size, label).toBe(Math.ceil(tops.length / perRow))
    expect(tops.filter((top) => top === tops[0]).length, label).toBe(Math.min(perRow, tops.length))
  }
})

test('applies the article and block treatments over the shared resets, read from computed styles', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(storyPath)
  const swiss = page.locator(root)
  const read = (selector: string, properties: readonly string[], pseudo: string | null = null) =>
    swiss
      .locator(selector)
      .first()
      .evaluate(
        (element, [names, pseudoElement]) => {
          const style = getComputedStyle(element, pseudoElement)
          return Object.fromEntries(names.map((name) => [name, style.getPropertyValue(name)]))
        },
        [properties, pseudo] as const,
      )
  // Page h1, dek and rail.
  expect(await read('.si-article-header h1', ['font-weight', 'text-wrap-style'])).toEqual({
    'font-weight': '800',
    'text-wrap-style': 'balance',
  })
  expect(await read('.si-article-header .si-dek', ['color'])).toEqual({
    color: 'rgb(106, 106, 106)',
  })
  expect(await read('.si-rail', ['border-top-width'])).toEqual({ 'border-top-width': '4px' })
  expect(await read('.si-rail dt', ['font-size', 'color'])).toEqual({
    'font-size': '12px',
    color: 'rgb(106, 106, 106)',
  })
  expect(await read('.si-rail dd', ['font-size'])).toEqual({ 'font-size': '13px' })
  // Body headings, links and inline marks.
  expect(
    await read('.si-body h2', ['border-top-width', 'border-top-style', 'padding-top']),
  ).toEqual({
    'border-top-width': '1px',
    'border-top-style': 'solid',
    'padding-top': '12px',
  })
  expect(await read('.si-body p a', ['text-decoration-line', 'text-decoration-thickness'])).toEqual(
    { 'text-decoration-line': 'underline', 'text-decoration-thickness': '1px' },
  )
  expect(await read('.si-body u', ['text-decoration-style'])).toEqual({
    'text-decoration-style': 'dotted',
  })
  // Checklist boxes: the glyphs are hidden and a 1em square drawn, filled when done.
  expect(await read('[data-block="checklist"] li > span[aria-hidden]', ['display'])).toEqual({
    display: 'none',
  })
  const box = await swiss
    .locator('[data-block="checklist"] li[data-checked="true"]')
    .first()
    .evaluate((item) => {
      const marker = getComputedStyle(item, '::before')
      return {
        background: marker.backgroundColor,
        border: marker.borderTopWidth,
        square: marker.width === getComputedStyle(item).fontSize && marker.height === marker.width,
      }
    })
  expect(box).toEqual({ background: 'rgb(14, 14, 14)', border: '2px', square: true })
  expect(
    await read(
      '[data-block="checklist"] li[data-checked="false"]',
      ['background-color'],
      '::before',
    ),
  ).toEqual({ 'background-color': 'rgba(0, 0, 0, 0)' })
  // Callouts, code, the embed card and editorial blocks.
  expect(await read('[data-block="callout"][data-variant="tip"]', ['background-color'])).toEqual({
    'background-color': 'rgb(242, 242, 242)',
  })
  expect(await read('[data-block="callout"] > p', ['text-transform'])).toEqual({
    'text-transform': 'uppercase',
  })
  expect(await read('.si-body pre', ['background-color'])).toEqual({
    'background-color': 'rgb(242, 242, 242)',
  })
  expect(await read('[data-block="embed"] a', ['font-weight'])).toEqual({ 'font-weight': '700' })
  expect((await read('[data-block="embed"] a', ['content'], '::after')).content).toContain('↗')
  expect(await read('[data-variant="key-points"]', ['border-top-width'])).toEqual({
    'border-top-width': '4px',
  })
  expect(await read('[data-variant="key-points"]', ['display'], '::before')).toEqual({
    display: 'block',
  })
  expect((await read('.si-body figure', ['content'], '::before')).content).toContain('Fig.')
  // A warning callout carries a 4px signal rule at the left.
  await page.goto(
    `/stories/${normalizeSlug(labStories.find(({ id }) => id === 'article-lab-wood-finishes')!.title)}`,
  )
  expect(
    await read('[data-block="callout"][data-variant="warning"]', [
      'border-left-width',
      'border-left-color',
    ]),
  ).toEqual({ 'border-left-width': '4px', 'border-left-color': 'rgb(255, 79, 31)' })
})

test('boxes only a checklist’s own items: a numbered list inside a task keeps its numbers and no box', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(storyPath)
  const checklist = page.locator(root).locator('.si-body > [data-block="checklist"]')
  await expect(checklist).toHaveCount(1)
  // The sample's tasks hold one paragraph; nest a numbered list in the first, as the renderer would.
  const styles = await checklist.evaluate((list) => {
    const task = list.querySelector(':scope > li')!
    task.insertAdjacentHTML(
      'beforeend',
      '<ol start="1" type="1"><li><p>Plates</p></li><li><p>Glasses</p></li></ol>',
    )
    const read = (item: Element) => {
      const own = getComputedStyle(item)
      return {
        box: getComputedStyle(item, '::before').content,
        markers: own.listStyleType,
        paddingLeft: own.paddingLeft,
        position: own.position,
      }
    }
    return {
      nested: [...task.lastElementChild!.children].map(read),
      // The story's own numbered list, outside any checklist.
      outside: read(document.querySelector('.si-body > ol > li')!),
      task: read(task),
    }
  })
  expect(styles.task.box).not.toBe('none')
  expect(styles.outside).toMatchObject({ box: 'none', markers: 'decimal' })
  for (const item of styles.nested) expect(item).toEqual(styles.outside)
})

test('describes every gallery image at least as wide as it shows, in the grid, diptych and carousel layouts', async ({
  page,
}) => {
  test.setTimeout(120_000)
  for (const width of [390, 640, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(storyPath)
    await page.evaluate(async () => {
      await document.fonts.ready
    })
    const gallery = page.locator(root).locator('.si-body > [data-block="gallery"]')
    await expect(gallery).toHaveCount(1)
    for (const layout of ['grid', 'diptych', 'carousel']) {
      const label = `${layout} at ${width}`
      // The sample has no carousel; the layout attribute alone sets a gallery's columns.
      const { images, text } = await gallery.evaluate((list, value) => {
        list.setAttribute('data-layout', value)
        const probe = document.createElement('div')
        probe.style.cssText = 'position: absolute; visibility: hidden'
        document.body.append(probe)
        /** The width a sizes attribute gives at this viewport: the length of its first match. */
        const describe = (sizes: string | null) => {
          for (const entry of sizes?.split(',') ?? []) {
            const [, condition, length] = /^(\(.+?\))?\s*(.+)$/.exec(entry.trim())!
            if (condition && !matchMedia(condition).matches) continue
            probe.style.width = length!
            return probe.getBoundingClientRect().width
          }
          return null
        }
        const measured = {
          images: [...list.querySelectorAll('picture')].map((picture) => ({
            described: [...picture.querySelectorAll('source, img')].map((element) =>
              describe(element.getAttribute('sizes')),
            ),
            shown: picture.querySelector('img')!.getBoundingClientRect().width,
          })),
          text: list.closest('.si-body')!.getBoundingClientRect().width,
        }
        probe.remove()
        return measured
      }, layout)
      expect(images.length, label).toBeGreaterThan(1)
      // A carousel sets one image across the text; grid and diptych two, 1.5rem apart, from 600px.
      const columns = layout !== 'carousel' && width >= 600 ? 2 : 1
      for (const { described, shown } of images) {
        expect(Math.abs(shown - (text - (columns - 1) * 24) / columns), label).toBeLessThan(1)
        // Each of the picture's sources and the image itself.
        expect(described.length, label).toBeGreaterThan(1)
        for (const value of described) {
          expect(value, label).not.toBeNull()
          expect(value!, label).toBeGreaterThanOrEqual(shown - 0.5)
        }
      }
    }
  }
})

test('keeps article, author and topic pages free of overflow from 320 pixels, with touch-sized controls', async ({
  page,
}) => {
  test.setTimeout(300_000)
  for (const width of [320, 360, 390, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const path of [storyPath, uprightPath, authorPath, topicPath]) {
      await page.goto(path)
      await page.evaluate(async () => {
        await document.fonts.ready
      })
      const label = `${path} at ${width}`
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        label,
      ).toBe(true)
      // Links inside body text are exempt from the 44px target size.
      const parts = path.startsWith('/stories/')
        ? ['.si-masthead', '.si-rail', '.si-hero', '.si-end', '.si-related', '.si-footer']
        : ['.si-masthead', 'main', '.si-footer']
      for (const part of parts) {
        await expectTouchTargets(page.locator(root).locator(part), `${label} ${part}`)
      }
    }
  }
})

test('tabs through an article in DOM order from the skip link to the footer, at 390, 768 and 1440 pixels', async ({
  page,
}) => {
  test.setTimeout(120_000)
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const path of [storyPath, uprightPath]) {
      await page.goto(path)
      await expect(
        page.locator(root).getByRole('button', { name: 'Choose color theme' }),
      ).toBeEnabled()
      const skip = page.getByRole('link', { name: 'Skip to content' })
      await tabTo(page, skip, 12)
      await page.keyboard.press('Enter')
      await expect(page.locator('#si-main')).toBeFocused()
      // Every rendered link and button in the story, the related stories and the footer.
      const expected = await page
        .locator(root)
        .evaluate((swiss) =>
          [...swiss.querySelectorAll('main a[href], main button, footer a[href], footer button')]
            .filter((element) => element.checkVisibility())
            .map((element) => element.textContent!.trim()),
        )
      expect(expected.length).toBeGreaterThan(4)
      const order: string[] = []
      for (const _ of expected) {
        await page.keyboard.press('Tab')
        order.push(await page.evaluate(() => document.activeElement?.textContent?.trim() ?? ''))
      }
      expect(order, `${path} at ${width}`).toEqual(expected)
      expect(order.at(-1)).toBe('Back to top')
    }
  }
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

test('keeps home and section free of overflow from 320 pixels, with touch-sized controls throughout', async ({
  page,
}) => {
  test.setTimeout(180_000)
  for (const width of [320, 360, 390, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const path of ['/', sectionPath]) {
      await page.goto(path)
      await page.evaluate(async () => {
        await document.fonts.ready
      })
      const label = `${path} at ${width}`
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        label,
      ).toBe(true)
      await expect(
        page.locator(root).getByRole('button', { name: 'Choose color theme' }),
      ).toBeEnabled()
      for (const part of ['.si-masthead', 'main', '.si-footer']) {
        await expectTouchTargets(page.locator(root).locator(part), `${label} ${part}`)
      }
    }
  }
})

test('sets the cover and the earlier stories as numbered lists and makes each plate one link', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const cover = page.locator(root).getByRole('list', { name: 'Latest stories' })
  await expect(cover.getByRole('listitem')).toHaveCount(3)
  await expect(cover.locator('.si-number')).toHaveText(['01', '02', '03'])
  const earlier = page.locator(root).getByRole('region', { name: 'Earlier stories' })
  await expect(earlier.getByRole('list')).toHaveAttribute('start', '4')
  await expect(earlier.getByRole('heading', { level: 3, name: storyTitle })).toBeVisible()
  // A click on the lead image follows the title link; the section link keeps its own target.
  const lead = cover.getByRole('listitem').first()
  const image = await lead.locator('.si-plate-image').boundingBox()
  await page.mouse.click(image!.x + image!.width / 2, image!.y + image!.height / 2)
  await expect(page).toHaveURL(/\/stories\/[a-z0-9-]+$/)
  await page.goBack()
  await lead.locator('.si-plate-meta').getByRole('link').click()
  await expect(page).toHaveURL(/\/sections\/[a-z0-9-]+$/)
})

test('keeps the cover spacing, balanced titles and underlined links over the element resets', async ({
  page,
}) => {
  const wrapping = (locator: Locator) =>
    locator.evaluateAll((elements) =>
      elements.map((element) => getComputedStyle(element).getPropertyValue('text-wrap-style')),
    )
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const path of ['/', sectionPath]) {
      await page.goto(path)
      const swiss = page.locator(root)
      const label = `${path} at ${width}`
      const titles = await wrapping(swiss.locator('.si-plate-title'))
      expect(titles.length, label).toBeGreaterThan(0)
      expect(new Set(titles), label).toEqual(new Set(['balance']))
      if (path === '/') {
        expect(
          await swiss
            .locator('.si-cover')
            .evaluate((element) => getComputedStyle(element).paddingTop),
          label,
        ).toBe('24px')
        expect(
          new Set(await wrapping(swiss.locator('.si-row-title, .si-label-row h2'))),
          label,
        ).toEqual(new Set(['pretty']))
      } else {
        expect(await wrapping(swiss.locator('main h1')), label).toEqual(['balance'])
      }
      expect(
        await swiss
          .getByRole('link', { name: 'Back to top' })
          .evaluate((element) => getComputedStyle(element).textDecorationLine),
        label,
      ).toBe('underline')
    }
  }
})

test('sets earlier stories as a metadata line above the title on phones and in columns from 600 pixels', async ({
  page,
}) => {
  const box = async (locator: Locator) => (await locator.boundingBox())!
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await page.evaluate(async () => {
      await document.fonts.ready
    })
    const rows = page
      .locator(root)
      .getByRole('region', { name: 'Earlier stories' })
      .getByRole('listitem')
    // Home shows plates 01-03; every other published sample story is an earlier row.
    await expect(rows).toHaveCount(labStories.length - 3)
    for (const row of await rows.all()) {
      const heading = row.getByRole('heading', { level: 3 })
      const name = `${await heading.textContent()} at ${width}`
      const title = await box(heading)
      const number = await box(row.locator('.si-number'))
      // The styles render one of the two copies of the section and reading time.
      const section = await box(row.locator('.si-row-facts a').filter({ visible: true }))
      const metadata = [
        number,
        await box(row.locator('time')),
        section,
        await box(row.locator('.si-row-facts .si-reading-time').filter({ visible: true })),
      ]
      if (width < 600) {
        // One metadata line, wrapped where it must, then the title.
        for (const part of metadata) expect(part.y + part.height, name).toBeLessThanOrEqual(title.y)
      } else if (width < 1024) {
        // Column 1 holds all the metadata, column 2 the title and dek.
        for (const part of metadata) expect(part.x + part.width, name).toBeLessThanOrEqual(title.x)
      } else {
        // Number and date, then the title and dek, then the section and reading time.
        expect(number.x + number.width, name).toBeLessThanOrEqual(title.x)
        expect(title.x + title.width, name).toBeLessThanOrEqual(section.x)
        expect(section.y, name).toBeLessThan(title.y + title.height)
      }
      expect((await box(row.locator('.si-row-dek'))).y, name).toBeGreaterThanOrEqual(
        title.y + title.height,
      )
    }
  }
})

test('tabs through each earlier story in reading order, with one rendered and focusable section link, at 390, 768 and 1440 pixels', async ({
  page,
}) => {
  test.setTimeout(120_000)
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await page.evaluate(async () => {
      await document.fonts.ready
    })
    const rows = page
      .locator(root)
      .getByRole('region', { name: 'Earlier stories' })
      .getByRole('listitem')
    // Home shows plates 01-03; every other published sample story is an earlier row.
    await expect(rows).toHaveCount(labStories.length - 3)
    for (const row of await rows.all()) {
      const title = (await row.getByRole('heading', { level: 3 }).textContent())!.trim()
      const name = `${title} at ${width}`
      // Both copies are in the DOM: the metadata's below 1024px, the one after the dek from 1024px.
      const copies = row.locator('.si-row-facts a')
      await expect(copies, name).toHaveCount(2)
      const narrow = width < 1024
      await expect(copies.nth(narrow ? 0 : 1), name).toBeVisible()
      await expect(copies.nth(narrow ? 1 : 0), name).toBeHidden()
      expect(
        await copies.evaluateAll((links) =>
          links.map((link) => {
            link.focus()
            return document.activeElement === link
          }),
        ),
        name,
      ).toEqual([narrow, !narrow])
      await expect(row.getByRole('link'), name).toHaveCount(2)
      const section = (await copies.nth(narrow ? 0 : 1).textContent())!.trim()
      const order = await readingOrder(row)
      expect(order, name).toEqual(narrow ? [section, title] : [title, section])
      expect(await tabOrder(page, row), name).toEqual(order)
    }
  }
})

test('shows a number plate where an image-free plate shares its row, and none on phones', async ({
  page,
}) => {
  for (const [width, shown] of [
    [390, false],
    [768, true],
    [1440, true],
  ] as const) {
    await page.setViewportSize({ width, height: 900 })
    // The chair story has no image: 03 on the cover beside 02, and 01 in Craft beside 02.
    for (const path of ['/', '/sections/craft']) {
      await page.goto(path)
      const plate = page.locator(root).locator('.si-plates .si-number-plate')
      await expect(plate, `${path} at ${width}`).toHaveCount(1)
      if (shown) await expect(plate, `${path} at ${width}`).toBeVisible()
      else await expect(plate, `${path} at ${width}`).toBeHidden()
    }
  }
})

test('keeps the section index and the site index at 13 pixels on phones', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  for (const path of ['/', sectionPath]) {
    await page.goto(path)
    for (const name of ['Sections', 'Site index']) {
      const sizes = await page
        .locator(root)
        .getByRole('navigation', { name })
        .getByRole('link')
        .evaluateAll((links) => links.map((link) => getComputedStyle(link).fontSize))
      expect(new Set(sizes), `${name} on ${path}`).toEqual(new Set(['13px']))
    }
  }
})

test('walks the keyboard from the skip link through the masthead to the footer and back to top', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(sectionPath)
  const swiss = page.locator(root)
  const theme = swiss.getByRole('button', { name: 'Choose color theme' })
  await expect(theme).toBeEnabled()
  const skip = page.getByRole('link', { name: 'Skip to content' })
  await tabTo(page, skip, 12)
  expect(await skip.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe('solid')
  await page.keyboard.press('Tab')
  await expect(swiss.locator('.si-wordmark a')).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(theme).toBeFocused()
  const sections = swiss.getByRole('navigation', { name: 'Sections' })
  await page.keyboard.press('Tab')
  await expect(sections.getByRole('link', { name: 'Front page' })).toBeFocused()
  const current = sections.getByRole('link', { name: 'Interiors', exact: true })
  await expect(current).toHaveAttribute('aria-current', 'page')
  const cell = await current.evaluate((element) => {
    const style = getComputedStyle(element.closest('li')!)
    return { color: style.borderLeftColor, width: style.borderLeftWidth }
  })
  expect(cell).toEqual({ color: 'rgb(255, 79, 31)', width: '4px' })
  expect(await current.evaluate((element) => getComputedStyle(element).textDecorationLine)).toBe(
    'underline',
  )
  const top = swiss.getByRole('contentinfo').getByRole('link', { name: 'Back to top' })
  await tabTo(page, top, 60)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#si-top$/)
  await expect
    // Smooth scrolling (globals.css) up a long page can take several seconds under load.
    .poll(
      () => page.evaluate(() => document.getElementById('si-top')!.getBoundingClientRect().top),
      {
        timeout: 15_000,
      },
    )
    .toBeGreaterThanOrEqual(0)
  await page.goto(sectionPath)
  await tabTo(page, skip, 12)
  await page.keyboard.press('Enter')
  await expect(page.locator('#si-main')).toBeFocused()
})

test('switches to the true black theme with the square Theme control from the keyboard', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const theme = page.locator(root).getByRole('button', { name: 'Choose color theme' })
  await expect(theme).toBeEnabled()
  const style = await theme.evaluate((element) => {
    const computed = getComputedStyle(element)
    return {
      height: element.getBoundingClientRect().height,
      radius: computed.borderTopLeftRadius,
      transition: computed.transitionDuration,
    }
  })
  expect(style.height).toBeGreaterThanOrEqual(44)
  expect(style.radius).toBe('0px')
  expect(style.transition).toBe('0s')
  await theme.focus()
  await page.keyboard.press('Enter')
  const dark = page.getByRole('menuitemradio', { name: 'Dark theme' })
  await expect(dark).toBeVisible()
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ArrowDown')
  await expect(dark).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('html')).toHaveClass(/\bdark\b/)
  await waitForThemeToSettle(page)
  expect(
    await page.locator(root).evaluate((element) => getComputedStyle(element).backgroundColor),
  ).toBe('rgb(0, 0, 0)')
})

test('keeps the seeded long-title, image-free, short, long-read and upright-hero stories readable at every width', async ({
  page,
}) => {
  test.setTimeout(300_000)
  const cases = labStories.filter(
    (story) =>
      uprightStories.includes(story) ||
      [
        'article-lab-boathouse',
        'article-lab-chair',
        'article-lab-shelf',
        'article-lab-long-table',
      ].includes(story.id),
  )
  for (const width of [320, 360, 390, 768, 1024, 1280, 1440]) {
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
      if (story.id === 'article-lab-chair') await expect(page.locator('.si-hero')).toHaveCount(0)
      await expect(page.locator('.si-hero-upright')).toHaveCount(
        uprightStories.includes(story) ? 1 : 0,
      )
    }
  }
})

test('uses visible keyboard focus and a true black reading ground', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const skip = page.getByRole('link', { name: 'Skip to content' })
  await tabTo(page, skip, 12)
  expect(await skip.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe('solid')
  await page.keyboard.press('Enter')
  await expect(page.locator('#si-main')).toBeFocused()
  await page.goto('/')
  const interiors = page
    .locator(root)
    .getByRole('navigation', { name: 'Sections' })
    .getByRole('link', { name: 'Interiors' })
  await tabTo(page, interiors)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(sectionPath)
  await page.evaluate(() => document.documentElement.classList.add('dark'))
  await waitForThemeToSettle(page)
  expect(
    await page.locator(root).evaluate((element) => getComputedStyle(element).backgroundColor),
  ).toBe('rgb(0, 0, 0)')
})

for (const width of [390, 1440]) {
  for (const theme of ['light', 'dark']) {
    test(`passes axe with the lab bar at ${width}px in ${theme} mode`, async ({ page }) => {
      test.setTimeout(240_000)
      await page.setViewportSize({ width, height: 900 })
      for (const path of ['/', storyPath, uprightPath, sectionPath, authorPath, topicPath]) {
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

test('uses a 65-character reading measure with reduced motion respected', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(storyPath)
  await page.evaluate(async () => {
    await document.fonts.ready
  })
  const body = page.locator('.si-body')
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
  expect(metrics.lineHeight).toBe('33px')
  expect(Math.abs(metrics.width - metrics.measure)).toBeLessThan(1)
  expect(await body.evaluate((element) => getComputedStyle(element).animationName)).toBe('none')
})

test('removes Swiss Index font declarations when the owner switches back to baseline', async ({
  page,
}) => {
  await expect(page.locator('[data-reader-direction-fonts="swiss-index"]')).toHaveCount(1)
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
      { name: 'reader_lab_direction', value: 'swiss-index', url: 'http://localhost:3100' },
    ])
    const page = await visitor.newPage()
    const fonts: string[] = []
    page.on('request', (request) => {
      if (request.resourceType() === 'font') fonts.push(request.url())
    })
    for (const path of ['/', storyPath, sectionPath, authorPath, topicPath]) {
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

test('captures the article, author and topic pages at 390, 768 and 1440 pixels in both themes for review', async ({
  page,
}) => {
  test.setTimeout(600_000)
  const captureFonts = await prepareFontCapture(page, root, {
    '--font-si-sans': 'Schibsted Grotesk',
    '--font-si-mono': 'IBM Plex Mono',
  })
  const destination = path.resolve('docs/worklog/blog-0044.47')
  await mkdir(destination, { recursive: true })
  for (const theme of ['light', 'dark']) {
    for (const [width, height] of [
      [390, 844],
      [768, 1024],
      [1440, 1000],
    ] as const) {
      await page.setViewportSize({ width, height })
      for (const [name, route] of [
        ['article-landscape', storyPath],
        ['article-upright', uprightPath],
        ['author', authorPath],
        ['topic', topicPath],
      ] as const) {
        await captureFonts.goto(route)
        await page.evaluate(
          (dark) => document.documentElement.classList.toggle('dark', dark),
          theme === 'dark',
        )
        await waitForThemeToSettle(page)
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
