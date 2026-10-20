import { statSync } from 'node:fs'
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
const craftPath = '/sections/craft'
// An author with a biography, so the page shows one, and the first sample topic.
const author = labAuthors.find(({ bio }) => bio)!
const authorPath = `/authors/${author.slug}`
const topic = labTopics[0]!
const topicPath = `/topics/${topic.slug}`
const routes = ['/', storyPath, sectionPath, craftPath, authorPath, topicPath]
const root = '[data-reader-direction="quiet-monograph"]'
const widths = [320, 360, 390, 768, 1024, 1280, 1440]
const ink = 'rgb(28, 27, 25)'
const stoneInk = 'rgb(107, 102, 94)'
const stone = 'rgb(122, 118, 110)'
// The generated Cormorant family first; Chromium may serialize the name without quotes.
const displayFamily = /^"?reader-quiet-monograph__font-qm-display"?,/

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

  // Open the cover story from the front page by keyboard, then continue to the footer.
  const coverLink = direction.locator('.qm-cover-title a')
  const coverPath = await coverLink.getAttribute('href')
  await tabTo(page, coverLink, 40)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(coverPath ?? /\/stories\//)
  await expect(direction.getByRole('heading', { level: 1 })).toBeVisible()
  const backToTop = direction.getByRole('link', { name: 'Back to top' })
  await tabTo(page, backToTop, 60)
  await page.keyboard.press('Enter')
  // Smooth scrolling (globals.css) up a long article can take several seconds under load.
  await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 15_000 }).toBe(0)
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
        const result = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze()
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
  // italic. Sections and topics without a description have no italic text. Pages without a
  // budget of their own stay within home's.
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
  ] as const) {
    requested = new Set()
    await page.goto(route)
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

test('captures seeded review screenshots of two articles, an author and a topic in both themes', async ({
  page,
}) => {
  test.setTimeout(600_000)
  const captureFonts = await prepareFontCapture(page, root, {
    '--font-qm-display': 'Cormorant Garamond',
    '--font-qm-text': 'Jost',
  })
  const destination = path.resolve('docs/worklog/blog-0044.41')
  await mkdir(destination, { recursive: true })
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme })
    for (const [width, height] of [
      [390, 844],
      [768, 1024],
      [1440, 1000],
    ] as const) {
      await page.setViewportSize({ width, height })
      // The long table has a landscape (3:2) hero; the first portrait story a 4:5 one.
      for (const [name, route] of [
        ['article-landscape', storyPath],
        ['article-portrait', storyRoute(portraitHeroes[0]!.id)],
        ['author', authorPath],
        ['topic', topicPath],
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
