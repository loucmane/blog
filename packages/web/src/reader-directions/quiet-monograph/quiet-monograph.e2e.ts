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
const craftPath = '/sections/craft'
// An author with a biography, so the page shows one, and the first sample topic.
const author = labAuthors.find(({ bio }) => bio)!
const authorPath = `/authors/${author.slug}`
const topic = labTopics[0]!
const topicPath = `/topics/${topic.slug}`
const routes = ['/', storyPath, sectionPath, craftPath, authorPath, topicPath]
// No story has this slug: the root not-found page, which upgrades to the direction's own view.
const missingPath = '/stories/a-story-that-was-never-published'
const root = '[data-reader-direction="quiet-monograph"]'
const fontFiles = '**/reader-directions/quiet-monograph/fonts/*.woff2'
const ownerToken = 'task43-owner-test-token-with-more-than-thirty-two-bytes'
const axeTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const widths = [320, 360, 390, 768, 1024, 1280, 1440]
const ink = 'rgb(28, 27, 25)'
const stoneInk = 'rgb(107, 102, 94)'
const stone = 'rgb(122, 118, 110)'
// The generated Cormorant and Jost families first; Chromium may serialize names without quotes.
const displayFamily = /^"?reader-quiet-monograph__font-qm-display"?,/
const textFamily = /^"?reader-quiet-monograph__font-qm-text"?,/

function storyRoute(id: string) {
  return `/stories/${normalizeSlug(labStories.find((story) => story.id === id)!.title)}`
}

/** Stories that open with a 4:5 picture: their hero is drawn at 0.533 of the box from 768px. */
const portraitHeroes = labStories.filter(({ blocks }) => {
  const [first] = blocks
  if (first?.type !== 'mediaImage') return false
  const image = labImages.find(({ id }) => id === first.attrs?.mediaId)
  return image ? image.illustration.width * 5 === image.illustration.height * 4 : false
})

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

/**
 * A new signed-in owner context in this direction. Its caches start empty, so every visit in it is
 * a first visit and each image candidate is chosen afresh.
 */
async function ownerContext(browser: Browser, options: BrowserContextOptions) {
  const context = await browser.newContext(options)
  await dismissReaderLabIntroductions(context)
  const session = await context.request.post('/api/owner/fixture-session', {
    headers: { authorization: `Bearer ${ownerToken}` },
  })
  expect(session.status()).toBe(200)
  await context.addCookies([
    { name: 'reader_lab_direction', url: 'http://localhost:3100', value: 'quiet-monograph' },
  ])
  return context
}

interface AuditedImage {
  /** The AVIF candidate a 1x screen picks for the `sizes` width: the narrowest that covers it. */
  readonly candidate: string | null
  readonly currentSrc: string
  /** The width the image box is laid out at. */
  readonly laidOut: number
  /** The width the picture is painted at: a contained portrait can be narrower than its box. */
  readonly painted: number
  readonly slot: string
  /** The width the image's `sizes` names at this viewport. */
  readonly wanted: number
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
    // Plates first; then body figures and galleries, which step out of the text column.
    const slots = [
      ['.qm-cover', 'cover'],
      ['.qm-hero', 'hero'],
      ['.qm-room', 'room'],
      ['.qm-hang-item', 'bay'],
      ['.qm-body > [data-block="gallery"][data-layout="carousel"]', 'carousel'],
      ['.qm-body > [data-block="gallery"]', 'gallery'],
      ['.qm-body > figure', 'figure'],
    ] as const
    const images: AuditedImage[] = Array.from(
      element.querySelectorAll<HTMLImageElement>('main picture img[sizes]'),
      (image) => {
        const box = image.getBoundingClientRect()
        const ratio = Number(image.getAttribute('width')) / Number(image.getAttribute('height'))
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
          currentSrc: image.currentSrc,
          laidOut: box.width,
          painted: ratio > 0 ? Math.min(box.width, box.height * ratio) : box.width,
          slot: slots.find(([selector]) => image.closest(selector))?.[1] ?? 'nested',
          wanted,
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

test.beforeEach(async ({ context, page, request }) => {
  await dismissReaderLabIntroductions(context)
  const seed = await request.post('/api/internal/lab-seed', {
    headers: { authorization: 'Bearer task44-lab-seed-token-with-more-than-32-bytes' },
  })
  expect(seed.status()).toBe(200)
  const session = await context.request.post('/api/owner/fixture-session', {
    headers: { authorization: `Bearer ${ownerToken}` },
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

test('opens Quiet Monograph from the lab and renders published titles on all five page types', async ({
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
  // The author's latest story and the topic's first, newest first like the sample.
  for (const [route, name, latest] of [
    [authorPath, author.name, labStories.find(({ authors }) => authors.includes(author.slug))!],
    [topicPath, topic.name, labStories.find(({ topics }) => topics.includes(topic.slug))!],
  ] as const) {
    await page.goto(route)
    await expect(page.locator(root).getByRole('heading', { level: 1 })).toHaveText(name)
    await expect(
      page.locator(root).getByRole('heading', { level: 2, name: latest.title, exact: true }),
    ).toBeVisible()
  }
})

test('has no overflow from 320 to 1440px, one Sections navigation and touch-sized targets', async ({
  page,
}) => {
  test.setTimeout(360_000)
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 })
    for (const route of routes) {
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

test('sets the cover title at the spec line height, not the general heading leading', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  const title = page.locator(root).locator('.qm-cover-title')
  const [lineHeight, fontSize] = await title.evaluate((element) => {
    const style = getComputedStyle(element)
    return [parseFloat(style.lineHeight), parseFloat(style.fontSize)]
  })
  expect(lineHeight / fontSize).toBeCloseTo(1.05, 2)
})

test('shows each article hero whole in the cover box, centred, with its caption below', async ({
  page,
}) => {
  test.setTimeout(120_000)
  // The cover box is 3:2 from 768px and 4:5 below, at most 58rem wide (spec section 6).
  for (const [width, height, boxRatio] of [
    [390, 844, 4 / 5],
    [1440, 900, 3 / 2],
  ] as const) {
    await page.setViewportSize({ width, height })
    for (const route of [storyPath, ...portraitHeroes.map(({ id }) => storyRoute(id))]) {
      await page.goto(route)
      const direction = page.locator(root)
      const hero = direction.locator('.qm-hero')
      const image = hero.locator('figure img')
      const ratio = await image.evaluate(
        (element) => Number(element.getAttribute('width')) / Number(element.getAttribute('height')),
      )
      const mainBox = (await direction.locator('main').boundingBox())!
      const box = (await hero.boundingBox())!
      const picture = (await image.boundingBox())!
      const caption = (await hero.locator('figcaption').boundingBox())!
      const title = (await direction.getByRole('heading', { level: 1 }).boundingBox())!
      const name = `${route} at ${width}px`
      expect(box.width, name).toBeCloseTo(Math.min(mainBox.width, 58 * 16), 0)
      const fit = Math.min(1, Math.round((ratio / boxRatio) * 1000) / 1000)
      expect(Math.abs(picture.width - box.width * fit), name).toBeLessThan(1.5)
      expect(Math.abs(picture.height - picture.width / ratio), name).toBeLessThan(1.5)
      // Whole inside its box: never taller than the box allows.
      expect(picture.height, name).toBeLessThanOrEqual(box.width / boxRatio + 1)
      expect(Math.abs(picture.x + picture.width / 2 - (box.x + box.width / 2)), name).toBeLessThan(
        1,
      )
      // The caption is a wall label under the picture; the header follows the plate.
      expect(caption.y, name).toBeGreaterThanOrEqual(picture.y + picture.height + 15)
      expect(Math.abs(caption.x + caption.width / 2 - (box.x + box.width / 2)), name).toBeLessThan(
        1,
      )
      expect(title.y, name).toBeGreaterThan(caption.y + caption.height)
      expect(await image.evaluate((element) => getComputedStyle(element).boxShadow), name).not.toBe(
        'none',
      )
    }
  }
})

test('sets the article header, end matter and Read next to the spec in the real cascade', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(storyPath)
  const direction = page.locator(root)
  const header = direction.locator('.qm-article-header')
  const title = header.getByRole('heading', { level: 1 })
  const titleStyle = await title.evaluate((element) => {
    const style = getComputedStyle(element)
    return {
      family: style.fontFamily,
      lineHeight: parseFloat(style.lineHeight),
      maxWidth: parseFloat(style.maxWidth),
      size: parseFloat(style.fontSize),
    }
  })
  expect(titleStyle.size).toBeCloseTo(
    parseFloat(await resolvedToken(page, 'font-size', '--qm-title')),
    1,
  )
  expect(titleStyle.lineHeight / titleStyle.size).toBeCloseTo(1.05, 2)
  expect(titleStyle.maxWidth).toBeCloseTo(14 * titleStyle.size, 0)
  expect(titleStyle.family).toMatch(displayFamily)
  // The dek in Cormorant italic at most 20em; the byline in stone ink with author links in ink.
  const dek = await header.locator('.qm-dek').evaluate((element) => {
    const style = getComputedStyle(element)
    return {
      measure: parseFloat(style.maxWidth) / parseFloat(style.fontSize),
      style: style.fontStyle,
    }
  })
  expect(dek.style).toBe('italic')
  expect(dek.measure).toBeCloseTo(20, 2)
  const byline = header.locator('.qm-byline')
  expect(await byline.evaluate((element) => getComputedStyle(element).color)).toBe(stoneInk)
  const authorLinks = await byline.getByRole('link').all()
  expect(authorLinks.length).toBe(
    labStories.find(({ title }) => title === storyTitle)!.authors.length,
  )
  for (const link of authorLinks) {
    expect(
      await link.evaluate((element) => {
        const style = getComputedStyle(element)
        return [style.color, style.textDecorationLine]
      }),
    ).toEqual([ink, 'underline'])
  }
  expect(
    await header.locator('.qm-meta').evaluate((element) => getComputedStyle(element).color),
  ).toBe(stoneInk)
  // The body is a 30em column.
  const column = await direction.locator('.qm-body').evaluate((element) => {
    const style = getComputedStyle(element)
    return {
      em: parseFloat(style.fontSize),
      measure: parseFloat(style.maxWidth),
      width: element.getBoundingClientRect().width,
    }
  })
  expect(column.measure / column.em).toBeCloseTo(30, 2)
  expect(column.width).toBeLessThanOrEqual(column.measure + 0.5)

  // End matter: a centred 4rem stone rule, the label "Topics", then 44px topic links in ink.
  const end = direction.locator('footer.qm-end')
  expect(
    await end.evaluate((element) => {
      const rule = getComputedStyle(element, '::before')
      return [rule.width, rule.borderTopWidth, rule.borderTopColor]
    }),
  ).toEqual(['64px', '1px', stone])
  expect(
    await end.getByRole('heading', { level: 2, name: 'Topics' }).evaluate((element) => {
      const style = getComputedStyle(element)
      return [style.textTransform, style.color]
    }),
  ).toEqual(['uppercase', stoneInk])
  const topicLinks = await end.getByRole('link').all()
  expect(topicLinks.length).toBeGreaterThan(0)
  const articleBox = (await direction.locator('article').boundingBox())!
  for (const link of topicLinks) {
    const box = (await link.boundingBox())!
    expect(box.width).toBeGreaterThanOrEqual(44)
    expect(box.height).toBeGreaterThanOrEqual(44)
    expect(await link.evaluate((element) => getComputedStyle(element).color)).toBe(ink)
  }
  // The row is centred on the page's axis.
  const linkBoxes = await Promise.all(topicLinks.map(async (link) => (await link.boundingBox())!))
  const left = Math.min(...linkBoxes.map(({ x }) => x))
  const right = Math.max(...linkBoxes.map(({ x, width }) => x + width))
  expect(Math.abs((left + right) / 2 - (articleBox.x + articleBox.width / 2))).toBeLessThan(2)

  // Read next: centred label, the first story as a room plate, the rest as rows, in a 46rem column.
  const readNext = direction.locator('.qm-read-next')
  expect((await readNext.boundingBox())!.width).toBeLessThanOrEqual(46 * 16 + 0.5)
  expect(
    await readNext
      .getByRole('heading', { level: 2, name: 'Read next' })
      .evaluate((element) => getComputedStyle(element).textAlign),
  ).toBe('center')
  const items = readNext.locator('ul[role="list"] > li')
  await expect(items.first()).toHaveClass(/qm-room/)
  // Only the hero is the lead image; the room's picture loads lazily.
  for (const image of await items.first().locator('img').all()) {
    await expect(image).toHaveAttribute('loading', 'lazy')
  }
  await expect(readNext.locator('li.qm-row')).toHaveCount((await items.count()) - 1)

  // A title over 80 characters takes the long-title size.
  await page.goto(storyRoute('article-lab-boathouse'))
  expect(
    await direction
      .getByRole('heading', { level: 1 })
      .evaluate((element) => parseFloat(getComputedStyle(element).fontSize)),
  ).toBeCloseTo(parseFloat(await resolvedToken(page, 'font-size', '--qm-title-long')), 1)
})

test('sets every editorial block of the long read to the spec in the real cascade', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(storyPath)
  const body = page.locator(root).locator('.qm-body')
  const computed = (locator: Locator, properties: readonly string[], pseudo?: string) =>
    locator.evaluate(
      (element, { properties, pseudo }) => {
        const style = getComputedStyle(element, pseudo)
        return properties.map((property) => style.getPropertyValue(property))
      },
      { properties, pseudo: pseudo ?? null },
    )

  // Figures: 42rem wide, the picture whole and at most 85svh high, on a transparent ground.
  const figure = body.locator(':scope > figure:has(picture)').first()
  expect((await figure.boundingBox())!.width).toBeCloseTo(42 * 16, 0)
  const figureImage = figure.locator('img')
  expect(await computed(figureImage, ['max-height', 'object-fit', 'background-color'])).toEqual([
    `${0.85 * 900}px`,
    'contain',
    'rgba(0, 0, 0, 0)',
  ])
  expect((await figureImage.boundingBox())!.height).toBeLessThanOrEqual(0.85 * 900 + 0.5)
  expect(await computed(figure.locator('figcaption'), ['text-align'])).toEqual(['center'])

  // Two-up galleries: square bays, pictures on the bottom edge, captions aligned below.
  const gallery = body.locator('[data-block="gallery"]').first()
  const cells = await gallery.locator(':scope > li').all()
  expect(cells.length).toBeGreaterThan(1)
  const [firstCell, secondCell] = await Promise.all(
    cells.slice(0, 2).map(async (cell) => ({
      caption: (await cell.locator('figcaption').boundingBox())!,
      image: (await cell.locator('img').boundingBox())!,
    })),
  )
  for (const cell of [firstCell!, secondCell!]) {
    expect(Math.abs(cell.image.width - cell.image.height)).toBeLessThan(1)
  }
  expect(Math.abs(firstCell!.image.y - secondCell!.image.y)).toBeLessThan(1)
  expect(Math.abs(firstCell!.caption.y - secondCell!.caption.y)).toBeLessThan(1)
  expect(await computed(cells[0]!.locator('img'), ['object-position'])).toEqual(['50% 100%'])

  // Pull quotes in Cormorant italic at the heading size, attributed in the label style.
  const pullQuote = body.locator('[data-block="pull-quote"]').first()
  const [quoteStyle, quoteSize] = await computed(pullQuote.locator('blockquote'), [
    'font-style',
    'font-size',
  ])
  expect(quoteStyle).toBe('italic')
  expect(parseFloat(quoteSize!)).toBeCloseTo(
    parseFloat(await resolvedToken(page, 'font-size', '--qm-heading')),
    1,
  )
  const [attribution, tracking] = await computed(pullQuote.locator('figcaption'), [
    'text-transform',
    'letter-spacing',
  ])
  expect(attribution).toBe('uppercase')
  expect(parseFloat(tracking!)).toBeCloseTo(0.18 * 12, 2)

  // Headings keep 3rem above and 1.25rem below, measured on the long read's h2s that open a
  // paragraph ("The table" first). Playwright's :has() searches only inside an element, so a
  // sibling :has(+ p) never matches; XPath names the next sibling.
  const longRead = labStories.find(({ title }) => title === storyTitle)!.blocks
  const opening = longRead.filter(
    ({ attrs, type }, index) =>
      type === 'heading' && attrs?.level === 2 && longRead[index + 1]?.type === 'paragraph',
  ).length
  expect(opening).toBeGreaterThan(0)
  const headings = body.locator('xpath=h2[following-sibling::*[1][self::p]]')
  await expect(headings).toHaveCount(opening)
  const heading = headings.first()
  const [above, below] = await computed(heading, ['margin-top', 'margin-bottom'])
  expect([above, below]).toEqual(['48px', '20px'])
  const gap = await heading.evaluate(
    (element) =>
      element.nextElementSibling!.getBoundingClientRect().top -
      element.getBoundingClientRect().bottom,
  )
  expect(gap).toBeCloseTo(20, 0)

  // Lists: discs and numbers, with stone-ink markers.
  for (const [selector, marker] of [
    [':scope > ul:not([data-block]) > li', 'disc'],
    [':scope > ol > li', 'decimal'],
  ] as const) {
    const item = body.locator(selector).first()
    expect(await computed(item, ['list-style-type'])).toEqual([marker])
    expect(await computed(item, ['color'], '::marker')).toEqual([stoneInk])
  }

  // Checklists: an ink box in place of each glyph, ticked with two borders when done.
  const checklist = body.locator('[data-block="checklist"]')
  for (const checked of ['true', 'false'] as const) {
    const box = checklist
      .locator(`li[data-checked="${checked}"] > span[aria-hidden="true"]`)
      .first()
    const [boxWidth, border, borderColor, color] = await computed(box, [
      'width',
      'border-top-width',
      'border-top-color',
      'color',
    ])
    const size = parseFloat((await computed(box, ['font-size']))[0]!)
    expect(parseFloat(boxWidth!)).toBeCloseTo(0.85 * size, 0)
    expect([border, borderColor, color]).toEqual(['1px', ink, 'rgba(0, 0, 0, 0)'])
    const tick = await computed(
      box,
      ['content', 'border-right-width', 'border-top-width'],
      '::after',
    )
    expect(tick).toEqual(checked === 'true' ? ['""', '1px', '0px'] : ['none', '0px', '0px'])
  }

  // Callouts: a 1px sand box with the label in the label style.
  const callout = body.locator('[data-block="callout"]').first()
  expect(await computed(callout, ['border-top-width'])).toEqual(['1px'])
  expect(
    await computed(callout.locator('p').first().locator('strong'), ['text-transform']),
  ).toEqual(['uppercase'])
  // Editorial blocks repeat their name visibly, with an empty alternative so it is read once: the
  // accessibility tree names the region, and no text node repeats the name.
  const editorial = body.locator('[data-block="editorial"]').first()
  const label = (await editorial.getAttribute('aria-label'))!
  const [content, display, transform] = await computed(
    editorial,
    ['content', 'display', 'text-transform'],
    '::before',
  )
  expect(content).not.toBe('none')
  expect([display, transform]).toEqual(['block', 'uppercase'])
  const cdp = await page.context().newCDPSession(page)
  const { nodes } = await cdp.send('Accessibility.getFullAXTree')
  const named = (role: string) =>
    nodes.filter((node) => !node.ignored && node.role?.value === role && node.name?.value === label)
  expect(named('region')).toHaveLength(1)
  expect(named('StaticText')).toHaveLength(0)
  if ((await editorial.getAttribute('data-variant')) === 'key-points') {
    expect(await computed(editorial, ['border-top-width', 'border-left-width'])).toEqual([
      '1px',
      '0px',
    ])
  }
  // Embeds: a link card with the title in Cormorant at the card size, a 44px target.
  const embed = body.locator('[data-block="embed"] a').first()
  expect(parseFloat((await computed(embed, ['font-size']))[0]!)).toBeCloseTo(
    parseFloat(await resolvedToken(page, 'font-size', '--qm-card')),
    1,
  )
  expect((await computed(embed, ['font-family']))[0]).toMatch(displayFamily)
  expect((await embed.boundingBox())!.height).toBeGreaterThanOrEqual(44)
  // Inline marks: a dotted stone underline that does not read as a link; struck text.
  expect(
    await computed(body.locator('u').first(), [
      'text-decoration-line',
      'text-decoration-style',
      'text-decoration-color',
    ]),
  ).toEqual(['underline', 'dotted', stone])
  expect(await computed(body.locator('s').first(), ['text-decoration-line'])).toEqual([
    'line-through',
  ])

  // Warnings are a 2px ink box, told apart by line weight and their label, not colour.
  await page.goto(
    `/stories/${normalizeSlug(
      labStories.find(({ blocks }) =>
        blocks.some(({ attrs, type }) => type === 'callout' && attrs?.variant === 'warning'),
      )!.title,
    )}`,
  )
  expect(
    await computed(body.locator('[data-block="callout"][data-variant="warning"]').first(), [
      'border-top-width',
      'border-top-color',
    ]),
  ).toEqual(['2px', ink])

  // At night the plate loses its print shadow and the boxes stay in (night) ink.
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto(storyPath)
  await waitForThemeToSettle(page)
  expect(await computed(page.locator(root).locator('.qm-hero img'), ['box-shadow'])).toEqual([
    'none',
  ])
  expect(
    await computed(checklist.locator('span[aria-hidden="true"]').first(), ['border-top-color']),
  ).toEqual(['rgb(238, 235, 228)'])
})

test('keeps every numbered-list marker in the real cascade: 1, a, A, i and I', async ({ page }) => {
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
  const body = page.locator(root).locator('.qm-body')
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
      return [type, getComputedStyle(item).listStyleType, getComputedStyle(item, '::marker').color]
    })
  }, markers)
  expect(rendered).toEqual(
    Object.entries(markers).map(([type, marker]) => [type, marker, stoneInk]),
  )
  // Story lists in the direction's own chrome keep no markers.
  expect(
    await page
      .locator(root)
      .locator('ul[role="list"] > li')
      .first()
      .evaluate((element) => getComputedStyle(element).listStyleType),
  ).toBe('none')
})

test('sets the author and topic pages to the spec in the real cascade', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(authorPath)
  const direction = page.locator(root)
  const name = direction.getByRole('heading', { level: 1 })
  await expect(name).toHaveText(author.name)
  expect(
    await name.evaluate((element) => parseFloat(getComputedStyle(element).fontSize)),
  ).toBeCloseTo(parseFloat(await resolvedToken(page, 'font-size', '--qm-title')), 1)
  // The bio in Cormorant italic, at most 24em, keeping the author's line breaks.
  const bio = await direction.locator('.qm-bio').evaluate((element) => {
    const style = getComputedStyle(element)
    return {
      family: style.fontFamily,
      measure: parseFloat(style.maxWidth) / parseFloat(style.fontSize),
      style: style.fontStyle,
      whiteSpace: style.whiteSpace,
    }
  })
  expect(bio.measure).toBeCloseTo(24, 2)
  expect(bio.family).toMatch(displayFamily)
  expect([bio.style, bio.whiteSpace]).toEqual(['italic', 'pre-line'])
  // The latest story is a room whose picture leads the page; the rest are rows.
  const room = direction.locator('main li.qm-room')
  await expect(room).toHaveCount(1)
  const latest = labStories.find(({ authors }) => authors.includes(author.slug))!
  await expect(room.getByRole('heading', { level: 2 })).toHaveText(latest.title)
  if ((await room.locator('img').count()) > 0) {
    await expect(room.locator('img')).toHaveAttribute('fetchpriority', 'high')
    expect((await room.locator('img').boundingBox())!.width).toBeLessThanOrEqual(46 * 16 + 0.5)
  }
  await expect(direction.locator('.qm-earlier li.qm-row')).toHaveCount(
    labStories.filter(({ authors }) => authors.includes(author.slug)).length - 1,
  )

  await page.goto(topicPath)
  const topicName = direction.getByRole('heading', { level: 1 })
  await expect(topicName).toHaveText(topic.name)
  expect(
    await topicName.evaluate((element) => parseFloat(getComputedStyle(element).fontSize)),
  ).toBeCloseTo(parseFloat(await resolvedToken(page, 'font-size', '--qm-section-title')), 1)
  // Two columns from 768px, and every plate keeps its section label.
  const plates = await direction.locator('.qm-hang > li').all()
  const filed = labStories.filter(({ topics }) => topics.includes(topic.slug))
  expect(plates.length).toBe(Math.min(6, filed.length))
  if (plates.length > 1) {
    const [first, second] = await Promise.all(
      plates.slice(0, 2).map(async (plate) => (await plate.boundingBox())!),
    )
    expect(Math.abs(first!.y - second!.y)).toBeLessThan(1)
    expect(second!.x).toBeGreaterThan(first!.x + first!.width)
  }
  for (const plate of plates) await expect(plate.locator('.qm-label a')).toHaveCount(1)
})

test('tabs through an article in DOM order: plate, header, body, topics, Read next', async ({
  page,
}) => {
  for (const [width, height] of [
    [390, 844],
    [1440, 900],
  ] as const) {
    await page.setViewportSize({ width, height })
    await page.goto(storyPath)
    const main = page.locator(root).locator('main')
    const expected = await main.evaluate((element) =>
      Array.from(element.querySelectorAll<HTMLElement>('a[href], button, summary'))
        .filter((node) => node.checkVisibility())
        .map((node) => `${node.tagName} ${node.textContent?.trim()}`),
    )
    expect(expected.length).toBeGreaterThan(0)
    await main.focus()
    const visited: string[] = []
    for (let index = 0; index < expected.length; index++) {
      await page.keyboard.press('Tab')
      visited.push(
        await page.evaluate(
          () => `${document.activeElement?.tagName} ${document.activeElement?.textContent?.trim()}`,
        ),
      )
    }
    expect(visited, `${width}px`).toEqual(expected)
  }
})

test('keeps the seeded long-title, image-free, short, long-read and 4:5-hero stories readable at every width', async ({
  page,
}) => {
  test.setTimeout(240_000)
  const cases = labStories.filter(
    ({ id }) =>
      [
        'article-lab-boathouse',
        'article-lab-chair',
        'article-lab-shelf',
        'article-lab-long-table',
      ].includes(id) || portraitHeroes.some((story) => story.id === id),
  )
  expect(portraitHeroes.length).toBeGreaterThan(0)
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
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto')
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

  // Open the cover story from the front page by keyboard, then continue to the footer.
  const coverLink = direction.locator('.qm-cover-title a')
  const coverPath = await coverLink.getAttribute('href')
  await tabTo(page, coverLink, 40)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(coverPath ?? /\/stories\//)
  await expect(direction.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto')
  const backToTop = direction.getByRole('link', { name: 'Back to top' })
  await tabTo(page, backToTop, 60)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#qm-top$/)
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
      test.setTimeout(240_000)
      await page.emulateMedia({ colorScheme })
      await page.setViewportSize({ width, height: 900 })
      for (const route of routes) {
        await page.goto(route)
        await page.evaluate(async () => {
          await document.fonts.ready
        })
        expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(
          colorScheme === 'dark',
        )
        await waitForThemeToSettle(page)
        await expect(page.getByRole('region', { name: 'Reader Lab', exact: true })).toBeVisible()
        const result = await new AxeBuilder({ page }).withTags(axeTags).analyze()
        expect(result.violations, `${route} at ${width} in ${colorScheme}`).toEqual([])
      }
    })
  }
}

test('requests only the faces each page uses, within the font budgets', async ({ page }) => {
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
  let requested = new Set<string>()
  page.on('request', (request) => {
    if (request.resourceType() === 'font')
      requested.add(path.basename(new URL(request.url()).pathname))
  })
  const folder = path.resolve('packages/web/public/reader-directions/quiet-monograph/fonts')
  const upright = [
    'cormorant-garamond-latin-400-normal.woff2',
    'cormorant-garamond-latin-500-normal.woff2',
    'jost-latin-400-normal.woff2',
    'jost-latin-500-normal.woff2',
  ]
  // Deks, bios and pull quotes are Cormorant italic; only emphasis in story text needs the Jost
  // italic. Sections and topics without a description, and failure pages, have no italic text.
  // Pages without a budget of their own stay within home's.
  for (const [route, italics, budget] of [
    ['/', ['cormorant-garamond-latin-400-italic.woff2'], 95_000],
    [
      storyPath,
      ['cormorant-garamond-latin-400-italic.woff2', 'jost-latin-400-italic.woff2'],
      105_000,
    ],
    [sectionPath, [], 95_000],
    [authorPath, ['cormorant-garamond-latin-400-italic.woff2'], 95_000],
    [topicPath, [], 95_000],
    [missingPath, [], 95_000],
  ] as const) {
    requested = new Set()
    await page.goto(route)
    // A missing page upgrades to this direction after hydration, and its faces load from then on.
    await expect(page.locator(root).getByRole('heading', { level: 1 })).toBeVisible()
    await page.evaluate(async () => {
      await document.fonts.ready
    })
    const expected = [...upright, ...italics].sort()
    expect([...requested].sort(), route).toEqual(expected)
    const bytes = expected.reduce(
      (total, file) => total + statSync(path.join(folder, file)).size,
      0,
    )
    expect(bytes, route).toBeLessThanOrEqual(budget)
  }
})

test('sets deks and emphasis in the genuine italic faces', async ({ page }) => {
  const captureFonts = await prepareFontCapture(page, root, {
    '--font-qm-display': 'Cormorant Garamond',
    '--font-qm-text': 'Jost',
  })
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('DOM.enable')
  await cdp.send('CSS.enable')
  for (const [route, selector, face] of [
    ['/', '.qm-cover .qm-dek', 'CormorantGaramondLight-Italic'],
    [storyPath, '.qm-article-header .qm-dek', 'CormorantGaramondLight-Italic'],
    [storyPath, '.qm-body [data-block="pull-quote"] blockquote p', 'CormorantGaramondLight-Italic'],
    [storyPath, '.qm-body em', 'Jost-Italic'],
    [authorPath, '.qm-bio', 'CormorantGaramondLight-Italic'],
  ] as const) {
    await captureFonts.goto(route)
    const { root: documentNode } = await cdp.send('DOM.getDocument')
    const { nodeId } = await cdp.send('DOM.querySelector', {
      nodeId: documentNode.nodeId,
      selector: `${root} ${selector}`,
    })
    const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId })
    // The PostScript name tells the italic face from an upright one of the same family.
    expect(
      fonts
        .filter((font) => font.glyphCount > 0)
        .map((font) => [font.postScriptName, font.isCustomFont]),
      `${selector} on ${route}`,
    ).toEqual([[face, true]])
  }
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
    for (const route of ['/', storyPath, sectionPath, authorPath, topicPath]) {
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

test('upgrades a missing page to its own not-found view: one h1, the way home, the spec type and 44px targets', async ({
  page,
}) => {
  test.setTimeout(300_000)
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme })
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      const response = await page.goto(missingPath)
      // The server sends baseline; the client upgrade changes the presentation, never the status.
      expect(response?.status()).toBe(404)
      const direction = page.locator(root)
      await expect(
        direction.getByRole('heading', { level: 1, name: 'Page not found' }),
      ).toBeVisible()
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
      await expect(page.getByRole('main')).toHaveCount(1)
      const name = `${missingPath} at ${width}px in ${colorScheme}`
      const block = direction.locator('main .qm-failure')
      await expect(block.locator('.qm-label').first()).toHaveText('Not found')
      await expect(block.locator('.qm-failure-message')).toHaveText(
        'The page may have moved, or the address may be mistyped.',
      )
      const home = block.getByRole('link', { name: 'Front page' })
      await expect(home).toHaveAttribute('href', '/')
      // The site name is a link, not another heading, and nothing on the page is current.
      const masthead = direction.locator('header.qm-masthead')
      await expect(masthead.locator('p.qm-wordmark a[href="/"]')).toHaveCount(1)
      await expect(direction.locator('[aria-current]')).toHaveCount(0)
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        name,
      ).toBe(true)
      if (width === 390 || width === 1440) {
        // Spec 2.7: centred, --qm-space below the masthead, the h1 at the title size and one
        // sentence in Jost at the body size.
        const styles = await block.evaluate((element) => {
          const title = getComputedStyle(element.querySelector('h1')!)
          const sentence = getComputedStyle(element.querySelector('.qm-failure-message')!)
          return {
            align: getComputedStyle(element).textAlign,
            sentenceFamily: sentence.fontFamily,
            sentenceSize: parseFloat(sentence.fontSize),
            space: parseFloat(getComputedStyle(element).paddingTop),
            titleFamily: title.fontFamily,
            titleLeading: parseFloat(title.lineHeight) / parseFloat(title.fontSize),
            titleSize: parseFloat(title.fontSize),
          }
        })
        expect(styles.align, name).toBe('center')
        expect(styles.space, name).toBeCloseTo(
          parseFloat(await resolvedToken(page, 'padding-top', '--qm-space')),
          1,
        )
        expect(styles.titleSize, name).toBeCloseTo(
          parseFloat(await resolvedToken(page, 'font-size', '--qm-title')),
          1,
        )
        expect(styles.titleLeading, name).toBeCloseTo(1.05, 2)
        expect(styles.titleFamily, name).toMatch(displayFamily)
        expect(styles.sentenceFamily, name).toMatch(textFamily)
        expect(styles.sentenceSize, name).toBeCloseTo(
          parseFloat(await resolvedToken(page, 'font-size', '--qm-body')),
          1,
        )
        expect(
          await page.evaluate(() => document.documentElement.classList.contains('dark')),
          name,
        ).toBe(colorScheme === 'dark')
        await waitForThemeToSettle(page)
        expect(
          await direction.evaluate((element) => getComputedStyle(element).backgroundColor),
          name,
        ).toBe(colorScheme === 'dark' ? 'rgb(46, 43, 39)' : 'rgb(246, 245, 241)')
        await expect(page.getByRole('region', { name: 'Reader Lab', exact: true })).toBeVisible()
        const result = await new AxeBuilder({ page }).withTags(axeTags).analyze()
        expect(result.violations, name).toEqual([])
      }
      const targets = [
        masthead.locator('.qm-wordmark a'),
        masthead.getByRole('button', { name: 'Choose color theme' }),
        home,
        ...(await direction.locator('footer a').all()),
      ]
      if (width < 1024) {
        const menu = masthead.locator('summary')
        await menu.click()
        targets.push(menu)
      }
      // The shared failure model knows no sections: one Sections navigation, "Front page" alone.
      const sections = direction.getByRole('navigation', { name: 'Sections' })
      await expect(sections).toHaveCount(1)
      await expect(sections.getByRole('link')).toHaveText(['Front page'])
      targets.push(...(await sections.getByRole('link').all()))
      for (const control of targets) {
        const box = await control.boundingBox()
        const label = `${await control.textContent()} on ${name}`
        expect(box?.width, label).toBeGreaterThanOrEqual(44)
        expect(box?.height, label).toBeGreaterThanOrEqual(44)
      }
    }
  }
})

test('delivers a story in this direction within the story HTML budget', async ({ page }) => {
  // The visitor check (tests/e2e/homepage.spec.ts), repeated with the owner's direction cookie.
  const response = await page.context().request.get(storyPath)
  const body = await response.text()
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toContain('text/html')
  expect(body).toContain('data-reader-direction="quiet-monograph"')
  expect(body).toContain(storyTitle)
  expect(body).not.toMatch(/tiptap|prosemirror|lexical|contenteditable/i)
  expect(Buffer.byteLength(body)).toBeLessThan(150_000)
})

test('animates only the plate shadow, and nothing under reduced motion, in the real cascade', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  const plate = page.locator(root).locator('.qm-plate-box picture img').first()
  const transition = () =>
    plate.evaluate((element) => {
      const style = getComputedStyle(element)
      return {
        durations: style.transitionDuration.split(',').map((value) => parseFloat(value)),
        property: style.transitionProperty,
        timing: style.transitionTimingFunction,
      }
    })
  expect(await transition()).toEqual({
    durations: [0.2],
    property: 'box-shadow',
    timing: 'ease-out',
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const reduced = await transition()
  expect(reduced.property).toBe('none')
  // The shared reduced-motion rule still leaves 0.01ms, !important, on every element.
  expect(Math.max(...reduced.durations)).toBeLessThanOrEqual(0.00001)
})

test('keeps emphasis visible on a cold view, where every face misses its block period', async ({
  browser,
  page,
}) => {
  // A first view over a slow connection: no web face arrives within its optional block period, so
  // each family keeps its upright, metric-adjusted fallback. Failing the requests gives that state.
  await page.route(fontFiles, (route) => route.abort())
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(storyPath)
  await page.evaluate(async () => {
    await document.fonts.ready
  })
  const direction = page.locator(root)
  const body = direction.locator('.qm-body')
  const dek = direction.locator('.qm-article-header .qm-dek')
  // Emphasis alone may be slanted; deks, bios and pull quotes keep the letter of no synthesis.
  const synthesis = (locator: Locator) =>
    locator.evaluate((element) =>
      getComputedStyle(element).getPropertyValue('font-synthesis-style'),
    )
  expect(await synthesis(body.locator('em').first())).toBe('auto')
  expect(await synthesis(body.locator('p').first())).toBe('none')
  expect(await synthesis(dek)).toBe('none')
  // No web face painted this text, so the view really is cold.
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('DOM.enable')
  await cdp.send('CSS.enable')
  const { root: documentNode } = await cdp.send('DOM.getDocument')
  const painted: Record<string, string[]> = {}
  for (const [name, selector] of [
    ['title', '.qm-article-header h1'],
    ['dek', '.qm-article-header .qm-dek'],
    ['body', '.qm-body > p'],
    ['emphasis', '.qm-body em'],
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
    expect(faces.join(', '), name).not.toMatch(/cormorant|jost/i)
  }
  /** Whether the element paints differently in italic than upright, at the same place. */
  const slanted = async (locator: Locator) => {
    const italic = await locator.screenshot({ animations: 'disabled', caret: 'hide' })
    await locator.evaluate((element) => element.style.setProperty('font-style', 'normal'))
    const upright = await locator.screenshot({ animations: 'disabled', caret: 'hide' })
    await locator.evaluate((element) => element.style.removeProperty('font-style'))
    return !italic.equals(upright)
  }
  // The same words as emphasis in the body's fallback: they must not look like plain text.
  await body.evaluate((element) => {
    const paragraph = document.createElement('p')
    paragraph.setAttribute('data-probe', 'emphasis')
    const emphasis = document.createElement('em')
    emphasis.textContent = 'Emphasis stays visible on a cold view'
    paragraph.append(emphasis)
    element.prepend(paragraph)
  })
  expect(await slanted(body.locator('[data-probe="emphasis"] em'))).toBe(true)
  // Deks stay upright where the local fallback face is installed. Recorded, not asserted: without
  // it the generic family takes over, and that family may have an italic of its own.
  await test.info().attach('cold-view-emphasis.json', {
    body: JSON.stringify({ browser: browser.version(), dekSlanted: await slanted(dek), painted }),
    contentType: 'application/json',
  })
})

test('keeps home and article still on cold and warm loads, and leads with the spec LCP element', async ({
  page,
}) => {
  test.setTimeout(420_000)
  type Shift = PerformanceEntry & {
    hadRecentInput: boolean
    sources?: readonly { node?: Node | null }[]
    value: number
  }
  type Measured = Window & {
    qmLargest: Element | null
    qmShifts: { lead: number; total: number }
  }
  await page.addInitScript(() => {
    const measured = window as unknown as Measured
    measured.qmLargest = null
    measured.qmShifts = { lead: 0, total: 0 }
    // Spec section 10: the wordmark, the cover title and the page's h1 never move.
    const lead = '.qm-wordmark, .qm-cover-title, main h1'
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as Shift[]) {
        if (entry.hadRecentInput) continue
        measured.qmShifts.total += entry.value
        const moved = entry.sources?.some(({ node }) => {
          const element = node instanceof Element ? node : (node?.parentElement ?? null)
          return element ? element.closest(lead) !== null : false
        })
        if (moved) measured.qmShifts.lead += entry.value
      }
    }).observe({ buffered: true, type: 'layout-shift' })
    new PerformanceObserver((list) => {
      const latest = list.getEntries().at(-1) as
        (PerformanceEntry & { element?: Element | null }) | undefined
      if (latest) measured.qmLargest = latest.element ?? null
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
            const { qmLargest: largest, qmShifts: shifts } = window as unknown as Measured
            const lead = document.querySelector<HTMLImageElement>('main img[fetchpriority="high"]')
            const heading =
              document.querySelector('.qm-cover-title') ?? document.querySelector('main h1')
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
              const painted =
                Math.max(0, Math.min(box.right, innerWidth) - Math.max(box.left, 0)) *
                Math.max(0, Math.min(box.bottom, innerHeight) - Math.max(box.top, 0))
              leadBitsPerPixel = painted ? (bytes * 8) / painted : null
            }
            return {
              hasLead: lead !== null,
              leadBitsPerPixel,
              largest:
                largest === null
                  ? null
                  : largest === lead
                    ? 'lead image'
                    : heading?.contains(largest)
                      ? 'heading'
                      : largest.matches('.qm-hang > li:nth-child(2) img')
                        ? 'first-row plate'
                        : [largest.tagName.toLowerCase(), ...largest.classList].join('.'),
              shifts,
            }
          })
          const name = `${visit} ${route} at ${width}px in ${colorScheme}`
          evidence.push({ name, ...measured })
          if (budgeted) {
            expect(measured.shifts.total, `${name}: CLS`).toBeLessThan(0.01)
            expect(measured.shifts.lead, `${name}: wordmark, cover title and h1`).toBe(0)
          }
          // Spec section 10's lead element: the page's lead image, or else its title. Below the
          // entropy threshold the browser cannot pick the image, so the evidence only records it.
          if (measured.hasLead && (measured.leadBitsPerPixel ?? 1) >= 0.05) {
            // Hang pictures stand on the bay's bottom edge, so at 1440px a square second plate can
            // paint more of the first viewport than a landscape first one; it loads eagerly.
            const leads =
              width >= 768 && [sectionPath, topicPath].includes(route)
                ? ['lead image', 'heading', 'first-row plate']
                : ['lead image', 'heading']
            expect(leads, `${name}: LCP element`).toContain(measured.largest)
          }
        }
      }
    }
  }
  await test.info().attach('layout-shift-and-lcp.json', {
    body: JSON.stringify(evidence),
    contentType: 'application/json',
  })
})

test('chooses every picture’s file from sizes that match its layout at 390, 768 and 1440px', async ({
  browser,
}) => {
  test.setTimeout(600_000)
  const audited = [
    ...new Set([
      '/',
      storyPath,
      ...portraitHeroes.map(({ id }) => storyRoute(id)),
      sectionPath,
      craftPath,
      authorPath,
      topicPath,
    ]),
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
        for (const image of images) {
          const name = `${image.slot} on ${route} at ${width}px`
          if (image.slot === 'nested' || (image.slot === 'gallery' && width >= 768)) {
            // Two-up gallery cells and figures inside other blocks take the figure's sizes: the
            // hook has one gallery value, so a larger file rather than a blurred one.
            expect(image.wanted, name).toBeGreaterThanOrEqual(image.laidOut - 1)
          } else {
            expect(Math.abs(image.wanted - image.laidOut), name).toBeLessThanOrEqual(1 + scrollbar)
          }
          expect(image.currentSrc, `${name}: the 1x file for its sizes`).toBe(image.candidate)
        }
      } finally {
        await context.close()
      }
    }
  }
  await test.info().attach('image-audit.json', {
    body: JSON.stringify(evidence),
    contentType: 'application/json',
  })
})

test('keeps the lead image and the first view’s images within the spec budgets at 1x and 2x', async ({
  browser,
}) => {
  test.setTimeout(300_000)
  const evidence: unknown[] = []
  for (const deviceScaleFactor of [1, 2]) {
    for (const viewport of [
      { width: 390, height: 844 },
      { width: 1440, height: 900 },
    ]) {
      for (const [route, budget] of [
        ['/', 200_000],
        [storyPath, 250_000],
        // Section and topic use the home budget; their second plate loads at once (spec 6).
        [sectionPath, 200_000],
        [topicPath, 200_000],
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
          // Home and the story lead with a picture in the sample; its transfer is the chosen candidate.
          if (route === '/' || route === storyPath) {
            expect(measured.lead, `${name}: lead image`).not.toBeNull()
          }
          if (measured.lead !== null) {
            expect(measured.lead, `${name}: lead image`).toBeLessThanOrEqual(150_000)
          }
          expect(measured.total, `${name}: images in the first view`).toBeLessThanOrEqual(budget)
        } finally {
          await context.close()
        }
      }
    }
  }
  await test.info().attach('image-bytes.json', {
    body: JSON.stringify(evidence),
    contentType: 'application/json',
  })
})

test('captures seeded review screenshots of the not-found page and of cold views in both themes', async ({
  page,
}) => {
  test.setTimeout(600_000)
  const destination = path.resolve('docs/worklog/blog-0044.42')
  await mkdir(destination, { recursive: true })
  // Cold views, without the capture gate: no web face arrives, so every family keeps its upright,
  // metric-adjusted fallback, as on a slow first visit. Emphasis is slanted; deks stay upright.
  const cold = await page.context().newPage()
  try {
    await cold.route(fontFiles, (route) => route.abort())
    for (const colorScheme of ['light', 'dark'] as const) {
      await cold.emulateMedia({ colorScheme })
      for (const [width, height] of [
        [390, 844],
        [1440, 1000],
      ] as const) {
        await cold.setViewportSize({ width, height })
        for (const [name, route] of [
          ['home', '/'],
          ['article', storyPath],
        ] as const) {
          await cold.goto(route)
          await cold.evaluate(async () => {
            await document.fonts.ready
          })
          await waitForThemeToSettle(cold)
          await cold.screenshot({
            animations: 'disabled',
            path: path.join(destination, `cold-${name}-${width}-${colorScheme}.png`),
          })
        }
        // Still on the article: the first paragraph with emphasis.
        await cold
          .locator(`${root} .qm-body p:has(em)`)
          .first()
          .screenshot({
            animations: 'disabled',
            path: path.join(destination, `cold-emphasis-${width}-${colorScheme}.png`),
          })
      }
    }
  } finally {
    await cold.close()
  }
  const captureFonts = await prepareFontCapture(page, root, {
    '--font-qm-display': 'Cormorant Garamond',
    '--font-qm-text': 'Jost',
  })
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme })
    for (const [width, height] of [
      [390, 844],
      [768, 1024],
      [1440, 1000],
    ] as const) {
      await page.setViewportSize({ width, height })
      // A fresh capture document at each width: a full-page shot can latch optional fallbacks.
      await captureFonts.goto(missingPath)
      await expect(
        page.locator(root).getByRole('heading', { level: 1, name: 'Page not found' }),
      ).toBeVisible()
      await waitForThemeToSettle(page)
      for (const fullPage of [false, true]) {
        await captureFonts.assertFonts()
        await page.screenshot({
          animations: 'disabled',
          fullPage,
          path: path.join(
            destination,
            `not-found-${width}-${colorScheme}-${fullPage ? 'full' : 'viewport'}.png`,
          ),
        })
      }
    }
  }
})
