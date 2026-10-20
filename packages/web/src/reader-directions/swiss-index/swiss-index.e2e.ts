import { statSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

import AxeBuilder from '@axe-core/playwright'
import {
  expect,
  test,
  type Browser,
  type BrowserContextOptions,
  type Locator,
  type Page,
} from '@playwright/test'

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
const craftPath = '/sections/craft'
// No story has this slug: the root not-found page, which upgrades to the direction's own view.
const missingPath = '/stories/a-story-that-was-never-published'
const origin = 'http://localhost:3100'
const ownerToken = 'task43-owner-test-token-with-more-than-thirty-two-bytes'
const axeTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const fontFiles = '**/reader-directions/swiss-index/fonts/*.woff2'
// The generated mono family first; Chromium may serialize the name without quotes.
const monoFamily = /^"?reader-swiss-index__font-si-mono"?,/

function storyRoute(id: string) {
  return `/stories/${normalizeSlug(labStories.find((story) => story.id === id)!.title)}`
}

/** Resolves a token through a probe in the direction's root, as the cascade computes it. */
async function resolvedToken(page: Page, property: string, token: `--${string}`) {
  return page.locator(root).evaluate(
    (element, { property, token }) => {
      const probe = document.createElement('div')
      probe.setAttribute('data-probe', token)
      probe.style.setProperty(property, `var(${token})`)
      element.append(probe)
      const value = getComputedStyle(probe).getPropertyValue(property)
      probe.remove()
      return value
    },
    { property, token },
  )
}

/**
 * A new signed-in owner context in this direction. Its caches start empty, so every visit in it is
 * a first visit and each image candidate is chosen afresh.
 */
async function ownerContext(browser: Browser, options: BrowserContextOptions = {}) {
  const context = await browser.newContext({ baseURL: origin, ...options })
  await dismissReaderLabIntroductions(context)
  const session = await context.request.post('/api/owner/fixture-session', {
    headers: { authorization: `Bearer ${ownerToken}` },
  })
  expect(session.status()).toBe(200)
  await context.addCookies([{ name: 'reader_lab_direction', url: origin, value: 'swiss-index' }])
  return context
}

interface AuditedImage {
  /** The AVIF candidate a 1x screen picks for the `sizes` width: the narrowest that covers it. */
  readonly candidate: string | null
  /** The width of the candidate the browser chose, from its descriptor. */
  readonly chosen: number | null
  readonly currentSrc: string
  /** A plate cell's focal point, from its inline `--si-focus`. */
  readonly focus: string | null
  /** The width the image box is laid out at. */
  readonly laidOut: number
  readonly objectPosition: string
  /** The width the picture is drawn at: a cell that crops a wider source draws it wider. */
  readonly painted: number
  readonly slot: string
  /** The width the image's `sizes` names at this viewport. */
  readonly wanted: number
  /** The widest candidate, the original's width when it is narrower than the variants. */
  readonly widest: number | null
}

/** Every responsive picture in the page's main content, measured where it is laid out now. */
function auditImages(page: Page) {
  return page.locator(root).evaluate((element) => {
    const probe = document.createElement('div')
    probe.setAttribute('data-probe', 'sizes')
    probe.style.cssText = 'position: absolute; height: 0; visibility: hidden'
    document.body.append(probe)
    // The first entry whose media condition matches, measured like a CSS width.
    const resolve = (sizes: string) => {
      for (const entry of sizes.split(/,\s*(?![^()]*\))/)) {
        const match = /^(\([^()]*\))\s+(.+)$/.exec(entry.trim())
        if (match && !matchMedia(match[1]!).matches) continue
        probe.style.width = match ? match[2]! : entry.trim()
        return probe.getBoundingClientRect().width
      }
      return 0
    }
    // Plates first; then heroes, and figures and galleries at text width.
    const slots = [
      ['.si-plate-lead .si-plate-image', 'lead plate'],
      ['.si-plate-image', 'plate'],
      ['.si-hero-upright', 'upright hero'],
      ['.si-hero', 'hero'],
      ['.si-body > [data-block="gallery"]', 'gallery'],
      ['.si-body > figure', 'figure'],
    ] as const
    const images: AuditedImage[] = Array.from(
      element.querySelectorAll<HTMLImageElement>('main picture img[sizes]'),
      (image) => {
        const box = image.getBoundingClientRect()
        const ratio = Number(image.getAttribute('width')) / Number(image.getAttribute('height'))
        const cell = image.closest<HTMLElement>('.si-plate-image')
        const wanted = resolve(image.sizes)
        const candidates = (image.closest('picture')?.querySelector('source')?.srcset ?? '')
          .split(',')
          .map((entry) => {
            const [url = '', descriptor = ''] = entry.trim().split(/\s+/)
            return { url: new URL(url, location.href).href, width: parseInt(descriptor, 10) }
          })
          .filter(({ width }) => width > 0)
          .sort((first, second) => first.width - second.width)
        return {
          candidate:
            (candidates.find(({ width }) => width >= wanted) ?? candidates.at(-1))?.url ?? null,
          chosen: candidates.find(({ url }) => url === image.currentSrc)?.width ?? null,
          currentSrc: image.currentSrc,
          focus: cell ? cell.style.getPropertyValue('--si-focus').trim() : null,
          laidOut: box.width,
          objectPosition: getComputedStyle(image).objectPosition,
          painted: cell && ratio > 0 ? Math.max(box.width, box.height * ratio) : box.width,
          slot: slots.find(([selector]) => image.closest(selector))?.[1] ?? 'nested',
          wanted,
          widest: candidates.at(-1)?.width ?? null,
        }
      },
    )
    probe.remove()
    return {
      images,
      // Classic scrollbars narrow the layout but not 100vw; overlay scrollbars take nothing.
      scrollbar: window.innerWidth - document.documentElement.clientWidth,
    }
  })
}

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
  // The sample's tasks hold one paragraph; nest a numbered list in the first exactly as the shared
  // renderer emits it, with its inline list-style-type (a bare type hint loses to Tailwind's reset).
  const styles = await checklist.evaluate((list) => {
    const task = list.querySelector(':scope > li')!
    task.insertAdjacentHTML(
      'beforeend',
      '<ol start="1" type="1" style="list-style-type: decimal"><li><p>Plates</p></li><li><p>Glasses</p></li></ol>',
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
  // The global smooth scroll (globals.css) can stall mid-way under load; this test checks the
  // keyboard path, not the animation, so reduced motion makes Back to top instant.
  await page.emulateMedia({ reducedMotion: 'reduce' })
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
  // A radio item keeps the menu open after a choice; Escape closes it and returns to the trigger.
  await page.keyboard.press('Escape')
  await expect(dark).toBeHidden()
  await expect(theme).toBeFocused()
  await waitForThemeToSettle(page)
  expect(
    await page.locator(root).evaluate((element) => getComputedStyle(element).backgroundColor),
  ).toBe('rgb(0, 0, 0)')
  // The trigger moves nothing under reduced motion either: the shared guard leaves 0.01ms.
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const durations = await theme.evaluate((element) =>
    getComputedStyle(element)
      .transitionDuration.split(',')
      .map((value) => parseFloat(value)),
  )
  expect(Math.max(...durations)).toBeLessThanOrEqual(0.00001)
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

test('requests only the faces each page uses, within the font budgets', async ({ page }) => {
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
  let requested = new Set<string>()
  page.on('request', (request) => {
    if (request.resourceType() === 'font')
      requested.add(path.basename(new URL(request.url()).pathname))
  })
  const folder = path.resolve('packages/web/public/reader-directions/swiss-index/fonts')
  const upright = [
    'ibm-plex-mono-latin-400-normal.woff2',
    'ibm-plex-mono-latin-500-normal.woff2',
    'schibsted-grotesk-latin-400-normal.woff2',
    'schibsted-grotesk-latin-700-normal.woff2',
    'schibsted-grotesk-latin-800-normal.woff2',
  ]
  // Spec section 10. Only emphasis in story text is italic, and the sample has no bold emphasis:
  // the story adds the 400 italic, and no page requests the 700 italic. The spec budgets home and
  // the article; author, topic and failure pages set no italic text and stay within home's.
  for (const [route, italics, budget] of [
    ['/', [], 105_000],
    [storyPath, ['schibsted-grotesk-latin-400-italic.woff2'], 130_000],
    [sectionPath, [], 105_000],
    [authorPath, [], 105_000],
    [topicPath, [], 105_000],
    [missingPath, [], 105_000],
  ] as const) {
    requested = new Set()
    await page.goto(route)
    // A missing page upgrades to this direction after hydration, and its faces load from then on.
    await expect(page.locator(root).getByRole('heading', { level: 1 })).toBeVisible()
    await page.evaluate(async () => {
      await document.fonts.ready
    })
    const expected = [...upright, ...italics].sort()
    // The faces are requested as the first layout needs them, which on a missing page follows the
    // upgrade; wait for the set rather than one moment.
    await expect.poll(() => [...requested].sort(), { message: route }).toEqual(expected)
    const bytes = expected.reduce(
      (total, file) => total + statSync(path.join(folder, file)).size,
      0,
    )
    expect(bytes, route).toBeLessThanOrEqual(budget)
  }
})

test('sets emphasis in the genuine 400 and 700 italics', async ({ page }) => {
  // This controls first layout to inspect faces; it is not cold-load evidence.
  const captureFonts = await prepareFontCapture(page, root, {
    '--font-si-sans': 'Schibsted Grotesk',
    '--font-si-mono': 'IBM Plex Mono',
  })
  await captureFonts.goto(storyPath)
  // The sample's emphasis is all in body text; probes add it to bold text, headings and quotes.
  await page.locator('.si-body').evaluate((body) => {
    const emphasis = () => {
      const element = document.createElement('em')
      element.textContent = 'genuine italic emphasis'
      return element
    }
    const paragraph = document.createElement('p')
    paragraph.dataset.probe = 'strong'
    const strong = document.createElement('strong')
    strong.append('Bold text with ', emphasis())
    paragraph.append(strong)
    const heading = document.createElement('h2')
    heading.dataset.probe = 'heading'
    heading.append('A heading with ', emphasis())
    // The renderer's pull quote: figure, blockquote, paragraph.
    const quote = document.createElement('figure')
    quote.dataset.block = 'pull-quote'
    quote.dataset.probe = 'pull-quote'
    const blockquote = document.createElement('blockquote')
    const line = document.createElement('p')
    line.append('A quote with ', emphasis())
    blockquote.append(line)
    quote.append(blockquote)
    body.append(paragraph, heading, quote)
  })
  await captureFonts.assertFonts()
  const cdp = await page.context().newCDPSession(page)
  try {
    await cdp.send('DOM.enable')
    await cdp.send('CSS.enable')
    const { root: documentNode } = await cdp.send('DOM.getDocument')
    for (const [selector, face] of [
      ['.si-body > p:not([data-probe]) em', 'SchibstedGrotesk-Italic'],
      ['[data-probe="strong"] em', 'SchibstedGrotesk-BoldItalic'],
      ['[data-probe="heading"] em', 'SchibstedGrotesk-BoldItalic'],
      ['[data-probe="pull-quote"] em', 'SchibstedGrotesk-BoldItalic'],
    ] as const) {
      await expect(page.locator(`${root} ${selector}`).first()).toHaveCSS('font-style', 'italic')
      const { nodeId } = await cdp.send('DOM.querySelector', {
        nodeId: documentNode.nodeId,
        selector: `${root} ${selector}`,
      })
      const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId })
      // The PostScript name tells a genuine italic from a slanted upright face of the family.
      expect(
        fonts
          .filter((font) => font.glyphCount > 0)
          .map((font) => [font.postScriptName, font.isCustomFont]),
        selector,
      ).toEqual([[face, true]])
    }
  } finally {
    await cdp.detach()
  }
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

/** Every page type, the upright hero and the not-found page, each with a name for evidence. */
const namedRoutes = [
  ['home', '/'],
  ['article', storyPath],
  ['upright', uprightPath],
  ['section', sectionPath],
  ['author', authorPath],
  ['topic', topicPath],
  ['not-found', missingPath],
] as const

test('upgrades a missing page to its own not-found view: a label row, one h1, the way back, the page title type and 44px targets', async ({
  page,
}) => {
  test.setTimeout(300_000)
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' })
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      const response = await page.goto(missingPath)
      // The server sends baseline; the client upgrade changes the presentation, never the status.
      expect(response?.status()).toBe(404)
      const swiss = page.locator(root)
      await expect(swiss.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible()
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
      await expect(page.getByRole('main')).toHaveCount(1)
      const name = `${missingPath} at ${width}px in ${colorScheme}`
      const block = swiss.locator('main > .si-failure')
      await expect(block.locator('.si-label-row')).toHaveText('Error 404')
      await expect(block.locator('.si-dek')).toHaveText('We could not find the page you requested.')
      await expect(block.getByRole('link', { name: 'Front page' })).toHaveAttribute('href', '/')
      await expect(block.getByRole('button')).toHaveCount(0)
      // The site name is a link, not another heading, and nothing on the page is current.
      await expect(swiss.locator('.si-masthead p.si-wordmark a[href="/"]')).toHaveCount(1)
      await expect(swiss.locator('[aria-current]')).toHaveCount(0)
      // The shared failure model knows no sections: both indexes hold "Front page" alone.
      for (const index of ['Sections', 'Site index']) {
        await expect(swiss.getByRole('navigation', { name: index }).getByRole('link')).toHaveText([
          'Front page',
        ])
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        name,
      ).toBe(true)
      await expect(swiss.getByRole('button', { name: 'Choose color theme' })).toBeEnabled()
      for (const part of ['.si-masthead', 'main', '.si-footer']) {
        await expectTouchTargets(swiss.locator(part), `${name} ${part}`)
      }
      if (width !== 390 && width !== 1440) continue
      // Spec 2.7: the block across columns 1-3 on desktops and full width below, under an h1 set
      // as a page title.
      const layout = await block.evaluate((element) => {
        const main = element.closest('main')!.getBoundingClientRect()
        const title = getComputedStyle(element.querySelector('h1')!)
        return {
          parts: Array.from(element.children, (child) => {
            const box = child.getBoundingClientRect()
            return { left: box.left - main.left, right: box.right - main.left }
          }),
          titleSize: parseFloat(title.fontSize),
          titleWeight: title.fontWeight,
          width: main.width,
        }
      })
      const span = width >= 1024 ? (3 * (layout.width - 3 * 24)) / 4 + 2 * 24 : layout.width
      expect(layout.parts, name).toHaveLength(4)
      for (const part of layout.parts) {
        expect(Math.abs(part.left), name).toBeLessThan(1)
        expect(part.right, name).toBeLessThanOrEqual(span + 1)
      }
      // The label row fills its area.
      expect(Math.abs(layout.parts[0]!.right - span), name).toBeLessThan(1)
      expect(layout.titleSize, name).toBeCloseTo(
        parseFloat(await resolvedToken(page, 'font-size', '--si-title')),
        1,
      )
      expect(layout.titleWeight, name).toBe('800')
      await expect
        .poll(() => page.evaluate(() => document.documentElement.classList.contains('dark')))
        .toBe(colorScheme === 'dark')
      await waitForThemeToSettle(page)
      expect(
        await swiss.evaluate((element) => getComputedStyle(element).backgroundColor),
        name,
      ).toBe(colorScheme === 'dark' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)')
      await expect(page.getByRole('region', { name: 'Reader Lab', exact: true })).toBeVisible()
      const result = await new AxeBuilder({ page }).withTags(axeTags).analyze()
      expect(result.violations, name).toEqual([])
    }
  }
  // The way back works from the keyboard.
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(missingPath)
  const swiss = page.locator(root)
  await expect(swiss.getByRole('button', { name: 'Choose color theme' })).toBeEnabled()
  const home = swiss.locator('main').getByRole('link', { name: 'Front page' })
  await tabTo(page, home, 40)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL('/')
  await expect(swiss.getByRole('list', { name: 'Latest stories' })).toBeVisible()
})

test('keeps every numbered-list marker in the real cascade, 1, a, A, i and I, in upright mono', async ({
  page,
}) => {
  // The markers ArticleBody sets inline for each numbering (reader/components/article-body.tsx).
  const markers = {
    '1': 'decimal',
    a: 'lower-alpha',
    A: 'upper-alpha',
    i: 'lower-roman',
    I: 'upper-roman',
  } as const
  const lettered = labStories.find(({ blocks }) =>
    blocks.some(({ attrs, type }) => type === 'orderedList' && attrs?.type === 'a'),
  )!
  await page.goto(`/stories/${normalizeSlug(lettered.title)}`)
  const body = page.locator(root).locator('.si-body')
  // The seeded lists, as the shared renderer drew them. ol[type="a"] also matches type="A" (HTML
  // compares the attribute case-insensitively), so the lists are filtered on its exact value.
  const lists = body.locator(':scope > ol')
  await expect(lists.first()).toBeAttached()
  expect(
    await lists.evaluateAll((elements) =>
      elements
        .filter((list) => list.getAttribute('type') === 'a')
        .map((list) => getComputedStyle(list.querySelector('li')!).listStyleType),
    ),
  ).toEqual(
    lettered.blocks
      .filter(({ attrs, type }) => type === 'orderedList' && attrs?.type === 'a')
      .map(() => 'lower-alpha'),
  )
  // Every numbering, in the same markup: the type attribute and the marker inline. Each probe is
  // marked data-probe, so it is never taken for seeded content.
  const rendered = await body.evaluate((element, markers) => {
    const template = element.querySelector('ol:not([data-probe])')!
    return Object.entries(markers).map(([type, marker]) => {
      const list = template.cloneNode(true) as HTMLOListElement
      list.setAttribute('data-probe', type)
      list.setAttribute('type', type)
      list.style.listStyleType = marker
      element.append(list)
      const item = list.querySelector('li')!
      const style = getComputedStyle(item, '::marker')
      return {
        family: style.fontFamily,
        marker: getComputedStyle(item).listStyleType,
        style: style.fontStyle,
        type,
      }
    })
  }, markers)
  expect(rendered.map(({ type }) => type)).toEqual(Object.keys(markers))
  for (const { family, marker, style, type } of rendered) {
    expect(marker, type).toBe(markers[type as keyof typeof markers])
    expect(family, type).toMatch(monoFamily)
    expect(style, type).toBe('normal')
  }
  // Story lists in the direction's own chrome keep no markers.
  expect(
    await page
      .locator(root)
      .locator('ol[role="list"] > li')
      .first()
      .evaluate((element) => getComputedStyle(element).listStyleType),
  ).toBe('none')
})

test('keeps inline code in the upright regular mono face in either order of marks, in the real cascade', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(storyPath)
  const body = page.locator(root).locator('.si-body')
  const faces = await body.evaluate((element) => {
    // The shared renderer nests marks in order: the first one wraps the text.
    const paragraph = document.createElement('p')
    paragraph.setAttribute('data-probe', 'marks')
    paragraph.innerHTML = [
      '<code><em>code around em</em></code>',
      '<em><code>em around code</code></em>',
      '<code><strong>code around strong</strong></code>',
      '<strong><code>strong around code</code></strong>',
      '<em>emphasis</em>',
      '<strong>bold</strong>',
    ].join(' ')
    element.append(paragraph)
    const read = (node: Element) => {
      const style = getComputedStyle(node)
      return { family: style.fontFamily, style: style.fontStyle, weight: style.fontWeight }
    }
    const child = (text: string) =>
      Array.from(paragraph.children).find((node) => node.textContent === text)!
    return {
      bold: read(child('bold')),
      code: Array.from(paragraph.querySelectorAll('code, code *'), (node) => ({
        name: `${node.localName}: ${node.textContent}`,
        ...read(node),
      })),
      emphasis: read(child('emphasis')),
      // The seeded code mark, "NH-01 Proof", in plain text.
      seeded: read(element.querySelector(':scope > p:not([data-probe]) code')!),
    }
  })
  // The controls: emphasis and bold outside code keep the italic and the bold face.
  expect(faces.emphasis.style).toBe('italic')
  expect(faces.bold.weight).toBe('700')
  // Four code elements, and the em and strong inside two of them.
  expect(faces.code).toHaveLength(6)
  for (const { family, name, style, weight } of [
    ...faces.code,
    { name: 'seeded', ...faces.seeded },
  ]) {
    expect(family, name).toMatch(monoFamily)
    expect(style, name).toBe('normal')
    expect(weight, name).toBe('400')
  }
})

test('keeps emphasis and bold visible on a cold view, where every face misses its block period', async ({
  browser,
  page,
}, testInfo) => {
  // A first view over a slow connection: no web face arrives within its optional block period, so
  // each family keeps its upright, metric-adjusted fallback. Failing the requests gives that state.
  await page.route(fontFiles, (route) => route.abort())
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(storyPath)
  await page.evaluate(async () => {
    await document.fonts.ready
  })
  const body = page.locator(root).locator('.si-body')
  // No web face painted this text, so the view really is cold.
  const cdp = await page.context().newCDPSession(page)
  const painted: Record<string, string[]> = {}
  try {
    await cdp.send('DOM.enable')
    await cdp.send('CSS.enable')
    const { root: documentNode } = await cdp.send('DOM.getDocument')
    for (const [name, selector] of [
      ['title', '.si-article-header h1'],
      ['body', '.si-body > p'],
      ['emphasis', '.si-body em'],
      ['rail', '.si-rail dd'],
    ] as const) {
      const { nodeId } = await cdp.send('DOM.querySelector', {
        nodeId: documentNode.nodeId,
        selector: `${root} ${selector}`,
      })
      const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId })
      const faces = fonts
        .filter(({ glyphCount }) => glyphCount > 0)
        .map(({ familyName, postScriptName }) => postScriptName || familyName)
      painted[name] = faces
      expect(faces.join(', '), name).not.toMatch(/schibsted|plex/i)
    }
  } finally {
    await cdp.detach()
  }
  /** Whether the element paints differently with `property` set to `value`, at the same place. */
  const differs = async (locator: Locator, property: string, value: string) => {
    const styled = await locator.screenshot({ animations: 'disabled', caret: 'hide' })
    await locator.evaluate(
      (element, [property, value]) => (element as HTMLElement).style.setProperty(property!, value!),
      [property, value],
    )
    const plain = await locator.screenshot({ animations: 'disabled', caret: 'hide' })
    await locator.evaluate(
      (element, property) => (element as HTMLElement).style.removeProperty(property),
      property,
    )
    return !styled.equals(plain)
  }
  // The same words as emphasis and as bold in the body's fallback: neither may read as plain text.
  await body.evaluate((element) => {
    const paragraph = document.createElement('p')
    paragraph.setAttribute('data-probe', 'cold')
    paragraph.innerHTML =
      '<em>Emphasis stays visible on a cold view</em> <strong>and so does bold text</strong>'
    element.prepend(paragraph)
  })
  const probe = body.locator('[data-probe="cold"]')
  expect(await differs(probe.locator('em'), 'font-style', 'normal')).toBe(true)
  expect(await differs(probe.locator('strong'), 'font-weight', '400')).toBe(true)
  await testInfo.attach('cold-view-faces.json', {
    body: JSON.stringify({ browser: browser.version(), painted }, null, 2),
    contentType: 'application/json',
  })
})

test('keeps home and the article still on cold and warm loads, and leads with the spec’s LCP element', async ({
  page,
}, testInfo) => {
  test.setTimeout(420_000)
  type Shift = PerformanceEntry & {
    hadRecentInput: boolean
    sources?: readonly { node?: Node | null }[]
    value: number
  }
  type Measured = Window & {
    siLargest: Element | null
    siShifts: { lead: number; total: number }
  }
  await page.addInitScript(() => {
    const measured = window as unknown as Measured
    measured.siLargest = null
    measured.siShifts = { lead: 0, total: 0 }
    // Spec section 10: the wordmark and the page's h1 never move.
    const lead = '.si-wordmark, main h1'
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as Shift[]) {
        if (entry.hadRecentInput) continue
        measured.siShifts.total += entry.value
        const moved = entry.sources?.some(({ node }) => {
          const element = node instanceof Element ? node : (node?.parentElement ?? null)
          return element ? element.closest(lead) !== null : false
        })
        if (moved) measured.siShifts.lead += entry.value
      }
    }).observe({ buffered: true, type: 'layout-shift' })
    new PerformanceObserver((list) => {
      const latest = list.getEntries().at(-1) as
        (PerformanceEntry & { element?: Element | null }) | undefined
      if (latest) measured.siLargest = latest.element ?? null
    }).observe({ buffered: true, type: 'largest-contentful-paint' })
  })
  const cdp = await page.context().newCDPSession(page)
  const evidence: unknown[] = []
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const colorScheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme })
      for (const route of ['/', storyPath, sectionPath, authorPath, topicPath]) {
        // The spec budgets home and the article; the other page types are recorded.
        const budgeted = route === '/' || route === storyPath
        await cdp.send('Network.clearBrowserCache')
        for (const visit of budgeted ? ['cold', 'warm'] : ['cold']) {
          await page.goto(route)
          await page.evaluate(async () => {
            await document.fonts.ready
            await Promise.all(
              Array.from(
                document.querySelectorAll<HTMLImageElement>('main img:not([loading="lazy"])'),
                (image) => image.decode().catch(() => {}),
              ),
            )
          })
          await waitForThemeToSettle(page)
          // Give buffered observer entries a frame after the last font and image layout.
          await page.evaluate(
            () =>
              new Promise<void>((resolve) =>
                requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
              ),
          )
          const measured = await page.evaluate(async () => {
            const { siLargest: largest, siShifts: shifts } = window as unknown as Measured
            const lead = document.querySelector<HTMLImageElement>('main img[fetchpriority="high"]')
            // Spec section 10: home's lead is plate 01's image or its title; elsewhere the h1.
            const title =
              document.querySelector('main .si-plate-lead .si-plate-title') ??
              document.querySelector('main h1')
            // Chromium skips an image under 0.05 bits per painted pixel as an LCP candidate. The
            // blurred sample illustrations fall under it at desktop sizes; a photograph does not.
            // Only a decoded image from an OK image response qualifies: a broken one stays asserted.
            let leadBitsPerPixel: number | null = null
            const response =
              lead?.currentSrc && lead.complete && lead.naturalWidth > 0 && lead.naturalHeight > 0
                ? await fetch(lead.currentSrc, { cache: 'force-cache' })
                : null
            if (
              lead &&
              response?.ok &&
              response.headers.get('content-type')?.startsWith('image/')
            ) {
              const bytes = (await response.blob()).size
              const box = lead.getBoundingClientRect()
              const visible =
                Math.max(0, Math.min(box.right, innerWidth) - Math.max(box.left, 0)) *
                Math.max(0, Math.min(box.bottom, innerHeight) - Math.max(box.top, 0))
              leadBitsPerPixel = visible ? (bytes * 8) / visible : null
            }
            return {
              hasLead: lead !== null,
              largest:
                largest === null
                  ? null
                  : largest === lead
                    ? 'lead image'
                    : title?.contains(largest)
                      ? 'title'
                      : [largest.tagName.toLowerCase(), ...largest.classList].join('.'),
              leadBitsPerPixel,
              shifts,
            }
          })
          const name = `${visit} ${route} at ${width}px in ${colorScheme}`
          evidence.push({ name, ...measured })
          if (!budgeted) continue
          expect(measured.shifts.total, `${name}: CLS`).toBeLessThan(0.01)
          expect(measured.shifts.lead, `${name}: wordmark and h1`).toBe(0)
          // The lead image, or else its title. Below the entropy threshold the browser cannot pick
          // the image, so the evidence only records the element.
          if (measured.hasLead && (measured.leadBitsPerPixel ?? 1) >= 0.05) {
            expect(['lead image', 'title'], `${name}: LCP element`).toContain(measured.largest)
          }
        }
      }
    }
  }
  await testInfo.attach('layout-shift-and-lcp.json', {
    body: JSON.stringify(evidence, null, 2),
    contentType: 'application/json',
  })
})

test('chooses every picture’s file from sizes that match its layout, and crops plates on their focal point, at 390, 768 and 1440px', async ({
  browser,
}, testInfo) => {
  test.setTimeout(600_000)
  const audited = [
    '/',
    storyPath,
    uprightPath,
    storyRoute('article-lab-three-cabins'),
    sectionPath,
    craftPath,
    topicPath,
  ]
  const evidence: unknown[] = []
  for (const width of [390, 768, 1440]) {
    for (const route of audited) {
      // One context per page: its cache starts empty, so no earlier, wider file stands in.
      const context = await ownerContext(browser, { viewport: { width, height: 900 } })
      try {
        const page = await context.newPage()
        await page.goto(route)
        await expect(page.locator(root)).toBeVisible()
        // Load every picture now, at this width, as a reader scrolling down would.
        await page.evaluate(async () => {
          for (const image of document.images) image.loading = 'eager'
          await Promise.all(Array.from(document.images, (image) => image.decode().catch(() => {})))
        })
        const { images, scrollbar } = await auditImages(page)
        evidence.push({ images, route, scrollbar, width })
        expect(images.length, `${route} at ${width}px`).toBeGreaterThan(0)
        for (const image of images) {
          const name = `${image.slot} on ${route} at ${width}px`
          // The browser takes the 1x file its sizes name, and that file covers the width the picture
          // is drawn at, a cropped plate's included, unless no wider file exists.
          expect(image.currentSrc, `${name}: the 1x file for its sizes`).toBe(image.candidate)
          expect(image.chosen, `${name}: a listed candidate`).not.toBeNull()
          expect(image.chosen!, `${name}: never under-fetched`).toBeGreaterThanOrEqual(
            Math.min(image.painted - 1, image.widest ?? 0),
          )
          // Grid slots: the sizes name the drawn width, so nothing is over-fetched either. Text-width
          // slots follow the 65ch measure of whichever face the first view keeps (spec section 10),
          // and two-up galleries take the one gallery hint (spec section 6): the check above
          // covers them, and the evidence records the rest.
          const crop = image.painted / image.laidOut
          if (['lead plate', 'plate', 'hero', 'upright hero'].includes(image.slot)) {
            expect(Math.abs(image.wanted - image.painted), name).toBeLessThanOrEqual(
              (1 + scrollbar) * crop,
            )
          }
          // Spec section 6: every cropping cell crops on its image's focal point.
          if (image.focus !== null) {
            expect(image.objectPosition, `${name}: focal point`).toBe(image.focus)
          }
        }
      } finally {
        await context.close()
      }
    }
  }
  await testInfo.attach('image-audit.json', {
    body: JSON.stringify(evidence, null, 2),
    contentType: 'application/json',
  })
})

test('keeps the lead image and the images loaded without scrolling within the spec budgets at 1x and 2x', async ({
  browser,
}, testInfo) => {
  test.setTimeout(300_000)
  const evidence: unknown[] = []
  for (const deviceScaleFactor of [1, 2]) {
    for (const viewport of [
      { width: 390, height: 844 },
      { width: 1440, height: 900 },
    ]) {
      // Spec section 10 budgets home and the article; section and topic are recorded.
      for (const [route, budget] of [
        ['/', 400_000],
        [storyPath, 300_000],
        [sectionPath, null],
        [topicPath, null],
      ] as const) {
        const context = await ownerContext(browser, { deviceScaleFactor, viewport })
        try {
          const page = await context.newPage()
          await page.goto(route)
          await expect(page.locator(root)).toBeVisible()
          await page.waitForLoadState('networkidle')
          const measured = await page.evaluate(() => {
            const media = (
              performance.getEntriesByType('resource') as PerformanceResourceTiming[]
            ).filter(({ name }) => new URL(name).pathname.startsWith('/api/media/'))
            const lead = document.querySelector<HTMLImageElement>('main img[fetchpriority="high"]')
            return {
              lead: lead
                ? (media.find(({ name }) => name === lead.currentSrc)?.transferSize ?? null)
                : null,
              requests: media.map(({ name, transferSize }) => [
                new URL(name).pathname + new URL(name).search,
                transferSize,
              ]),
              total: media.reduce((sum, { transferSize }) => sum + transferSize, 0),
            }
          })
          const name = `${route} at ${viewport.width} by ${viewport.height}px, ${deviceScaleFactor}x`
          evidence.push({ name, ...measured })
          if (budget === null) continue
          // Both lead with a picture in the sample; its transfer is the chosen candidate's.
          expect(measured.lead, `${name}: lead image`).not.toBeNull()
          expect(measured.lead!, `${name}: lead image`).toBeLessThanOrEqual(150_000)
          // Lazy images the browser loads before any scrolling are included.
          expect(measured.total, `${name}: images loaded without scrolling`).toBeLessThanOrEqual(
            budget,
          )
        } finally {
          await context.close()
        }
      }
    }
  }
  await testInfo.attach('image-bytes.json', {
    body: JSON.stringify(evidence, null, 2),
    contentType: 'application/json',
  })
})

test('keeps one preload and one high-priority image per page, both for its lead picture, and records lazy pictures in the first view', async ({
  page,
}, testInfo) => {
  test.setTimeout(240_000)
  const evidence: unknown[] = []
  for (const [width, height] of [
    [390, 844],
    [1440, 900],
  ] as const) {
    await page.setViewportSize({ width, height })
    for (const [label, route] of [
      ...namedRoutes,
      ['image-free article', storyRoute('article-lab-chair')],
      ['section led by an image-free story', craftPath],
    ] as const) {
      await page.goto(route)
      await expect(page.locator(root).getByRole('heading', { level: 1 })).toBeVisible()
      const measured = await page.locator(root).evaluate((element) => {
        // Spec section 6: plate 01 of the page's own list, or the article's hero.
        const lead = element.querySelector<HTMLImageElement>(
          'main > .si-plates > li:first-child .si-plate-image img, main .si-hero img',
        )
        const source = lead?.closest('picture')?.querySelector('source')
        // React adds href-less hints of its own for srcset images; the direction's carries href.
        const hints = Array.from(
          document.querySelectorAll<HTMLLinkElement>('link[rel="preload"][as="image"][href]'),
          (link) => ({
            sizes: link.getAttribute('imagesizes'),
            srcset: link.getAttribute('imagesrcset'),
          }),
        )
        const priority = Array.from(element.querySelectorAll('img[fetchpriority="high"]'))
        // The first view's lazy pictures: each needs eager loading once the shared option lands.
        const lazyInView = Array.from(
          element.querySelectorAll<HTMLImageElement>('main img[loading="lazy"]'),
        )
          .filter((image) => {
            const box = image.getBoundingClientRect()
            return box.width > 0 && box.bottom > 0 && box.top < innerHeight
          })
          .map((image) => {
            const item = image.closest('li')
            const list = item?.parentElement
            return item && list
              ? `${[list.localName, ...list.classList].join('.')} > li:nth-child(${Array.prototype.indexOf.call(list.children, item) + 1})`
              : [image.localName, ...image.classList].join('.')
          })
        return {
          hints,
          lazyInView,
          lead: lead
            ? {
                loading: lead.getAttribute('loading'),
                sizes: lead.getAttribute('sizes'),
                srcset: source?.getAttribute('srcset') ?? null,
              }
            : null,
          priority: priority.length,
          priorityIsLead: priority.length === 1 && priority[0] === lead,
        }
      })
      const name = `${label} at ${width} by ${height}px`
      evidence.push({ name, route, ...measured })
      expect(measured.hints, name).toHaveLength(measured.lead ? 1 : 0)
      expect(measured.priority, name).toBe(measured.lead ? 1 : 0)
      if (measured.lead) {
        expect(measured.priorityIsLead, name).toBe(true)
        expect(measured.lead.loading, name).toBeNull()
        expect(measured.hints[0], name).toEqual({
          sizes: measured.lead.sizes,
          srcset: measured.lead.srcset,
        })
      }
      // A picture in the first view never waits for lazy loading (first-row plates load eagerly).
      expect(measured.lazyInView, `${name}: lazy pictures in the first view`).toEqual([])
    }
  }
  await testInfo.attach('preload-priority-and-lazy-first-view.json', {
    body: JSON.stringify(evidence, null, 2),
    contentType: 'application/json',
  })
})

test('delivers a story in this direction within the story HTML budget', async ({ page }) => {
  // The visitor check (tests/e2e/homepage.spec.ts), repeated with the owner's direction cookie.
  const response = await page.context().request.get(storyPath)
  const body = await response.text()
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toContain('text/html')
  expect(body).toContain('data-reader-direction="swiss-index"')
  expect(body).toContain(storyTitle)
  expect(body).not.toMatch(/tiptap|prosemirror|lexical|contenteditable/i)
  expect(Buffer.byteLength(body)).toBeLessThan(150_000)
})

for (const width of [390, 1440]) {
  test(`keeps focus, boxes and controls visible in forced colours at ${width}px`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(240_000)
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' })
    for (const [label, route] of namedRoutes) {
      await page.goto(route)
      const swiss = page.locator(root)
      await expect(swiss.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(swiss.getByRole('button', { name: 'Choose color theme' })).toBeEnabled()
      await page.evaluate(async () => {
        await document.fonts.ready
      })
      const name = `${label} at ${width}px in forced colours`
      const skip = page.getByRole('link', { name: 'Skip to content' })
      await tabTo(page, skip, 12)
      expect(
        await skip.evaluate((element) => {
          const style = getComputedStyle(element)
          return [style.outlineStyle, style.outlineWidth]
        }),
        name,
      ).toEqual(['solid', '2px'])
      // The focused skip link overlays the masthead only while focused; axe would count that
      // transient overlap as obscured targets, so audit the page at rest.
      await skip.blur()
      // In forced colours the user's palette sets contrast, and axe pairs authored text colours
      // with forced backgrounds: contrast is checked in the normal themes, and the screenshots
      // are the evidence here.
      const result = await new AxeBuilder({ page })
        .withTags(axeTags)
        .disableRules(['color-contrast'])
        .analyze()
      expect(result.violations, name).toEqual([])
      await testInfo.attach(`forced-colours-${label}-${width}.png`, {
        body: await page.screenshot({ animations: 'disabled', fullPage: true }),
        contentType: 'image/png',
      })
    }
    // A done task's box stays filled, in the system text colour. Chromium reports the authored
    // ink as an element's computed color under forced colours, so resolve CanvasText directly.
    await page.goto(storyPath)
    const [fill, canvasText] = await page
      .locator(root)
      .locator('[data-block="checklist"] > li[data-checked="true"]')
      .first()
      .evaluate((item) => {
        const probe = document.createElement('span')
        probe.style.color = 'CanvasText'
        item.append(probe)
        const resolved = getComputedStyle(probe).color
        probe.remove()
        return [getComputedStyle(item, '::before').backgroundColor, resolved]
      })
    expect(fill).toBe(canvasText)
  })
}

test('prints one column without the indexes, the Theme control, number plates or related stories', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  for (const route of ['/', storyPath, sectionPath, craftPath]) {
    await page.goto(route)
    await page.emulateMedia({ media: 'print' })
    const swiss = page.locator(root)
    for (const selector of [
      '.si-skip',
      '.si-nav',
      '.si-theme',
      '.si-top-link',
      '.si-number-plate',
      '.si-related',
    ]) {
      for (const element of await swiss.locator(selector).all()) {
        await expect(element, `${selector} on ${route}`).toBeHidden()
      }
    }
    for (const selector of ['.si-plates', '.si-article', '.si-end > div']) {
      for (const element of await swiss.locator(selector).all()) {
        await expect(element, `${selector} on ${route}`).toHaveCSS('display', 'block')
      }
    }
    await page.emulateMedia({ media: 'screen' })
  }
})

test('reflows every page type at 320 and 640 pixels with text-spacing overrides, clipping no text', async ({
  page,
}) => {
  test.setTimeout(300_000)
  // 640px is a 1280px window at 200% zoom; the spacing is success criterion 1.4.12's.
  for (const width of [320, 640]) {
    await page.setViewportSize({ width, height: 900 })
    for (const [label, route] of namedRoutes) {
      await page.goto(route)
      await expect(page.locator(root).getByRole('heading', { level: 1 })).toBeVisible()
      await page.addStyleTag({
        content: `${root} .si-page * { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } ${root} .si-page p { margin-bottom: 2em !important; }`,
      })
      await page.evaluate(async () => {
        await document.fonts.ready
      })
      const name = `${label} at ${width}px with text spacing`
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        name,
      ).toBe(true)
      // Text containers have minimum heights only (spec section 9): nothing that clips holds text
      // it cuts off.
      const clipped = await page.locator(root).evaluate((element) =>
        Array.from(element.querySelectorAll<HTMLElement>('*'))
          .filter((node) => {
            if (node.closest('.sr-only') || !node.textContent?.trim()) return false
            const style = getComputedStyle(node)
            if (style.overflowX === 'visible' && style.overflowY === 'visible') return false
            return (
              node.scrollWidth > node.clientWidth + 1 || node.scrollHeight > node.clientHeight + 1
            )
          })
          .map((node) => [node.localName, ...node.classList].join('.')),
      )
      expect(clipped, name).toEqual([])
    }
  }
})

test('keeps every focusable element out of boxes that clip, so no focus ring is cut off', async ({
  page,
}) => {
  test.setTimeout(180_000)
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const [label, route] of namedRoutes) {
      await page.goto(route)
      await expect(page.locator(root).getByRole('heading', { level: 1 })).toBeVisible()
      const clipped = await page.locator(root).evaluate((element) =>
        Array.from(element.querySelectorAll<HTMLElement>('a[href], button, [tabindex]')).flatMap(
          (node) => {
            for (
              let parent = node.parentElement;
              parent && parent !== element;
              parent = parent.parentElement
            ) {
              const style = getComputedStyle(parent)
              if (/hidden|clip/.test(`${style.overflowX} ${style.overflowY}`)) {
                return [
                  `${node.textContent?.trim()} in ${[parent.localName, ...parent.classList].join('.')}`,
                ]
              }
            }
            return []
          },
        ),
      )
      expect(clipped, `${label} at ${width}px`).toEqual([])
    }
  }
})

test('captures home, section, article, author, topic and not-found pages at 390, 768 and 1440 pixels in both themes, and cold views, for review', async ({
  page,
}) => {
  test.setTimeout(900_000)
  const destination = path.resolve('docs/worklog/blog-0044.48')
  await mkdir(destination, { recursive: true })
  // Cold views, without the capture gate: no web face arrives, so each family keeps its upright,
  // metric-adjusted fallback, as on a slow first visit (spec section 10). Synthesis keeps emphasis
  // slanted and bold text bold.
  const cold = await page.context().newPage()
  try {
    await cold.route(fontFiles, (route) => route.abort())
    for (const theme of ['light', 'dark'] as const) {
      await cold.emulateMedia({ colorScheme: theme })
      for (const [width, height] of [
        [390, 844],
        [1440, 1000],
      ] as const) {
        await cold.setViewportSize({ width, height })
        for (const [name, route] of [
          ['home', '/'],
          ['article-landscape', storyPath],
        ] as const) {
          await cold.goto(route)
          await cold.evaluate(async () => {
            await document.fonts.ready
          })
          await waitForThemeToSettle(cold)
          await cold.screenshot({
            animations: 'disabled',
            path: path.join(destination, `cold-${name}-${width}-${theme}.png`),
          })
        }
      }
    }
  } finally {
    await cold.close()
  }
  const captureFonts = await prepareFontCapture(page, root, {
    '--font-si-sans': 'Schibsted Grotesk',
    '--font-si-mono': 'IBM Plex Mono',
  })
  for (const theme of ['light', 'dark'] as const) {
    // The theme follows the device setting, so it holds through a client-rendered not-found page.
    await page.emulateMedia({ colorScheme: theme })
    for (const [width, height] of [
      [390, 844],
      [768, 1024],
      [1440, 1000],
    ] as const) {
      await page.setViewportSize({ width, height })
      for (const [name, route] of [
        ['home', '/'],
        ['section', sectionPath],
        ['article-landscape', storyPath],
        ['article-upright', uprightPath],
        ['author', authorPath],
        ['topic', topicPath],
        ['not-found', missingPath],
      ] as const) {
        // A fresh capture document for each page: a full-page shot can latch optional fallbacks.
        await captureFonts.goto(route)
        await expect(page.locator(root).getByRole('heading', { level: 1 })).toBeVisible()
        await expect
          .poll(() => page.evaluate(() => document.documentElement.classList.contains('dark')))
          .toBe(theme === 'dark')
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
