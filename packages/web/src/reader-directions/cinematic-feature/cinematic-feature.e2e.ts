import { mkdir } from 'node:fs/promises'
import path from 'node:path'

import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

import { dismissReaderLabIntroductions } from '../../../../../tests/e2e/support/reader-lab'
import { normalizeSlug } from '../../server/content/domain'
import { labAuthors, labStories, labTopics } from '../../server/lab/north-house'
import { prepareFontCapture } from '../capture-fonts'

const storyTitle = 'The long table: a field guide to the North House kitchen'
const storyPath = '/stories/the-long-table-a-field-guide-to-the-north-house-kitchen'
const sectionPath = '/sections/interiors'
const authorPath = `/authors/${labAuthors[0]!.slug}`
const topicPath = `/topics/${labTopics[0]!.slug}`
const pagePaths = ['/', storyPath, sectionPath, authorPath, topicPath]
const root = '[data-reader-direction="cinematic-feature"]'
const listStyles = {
  '1': 'decimal',
  a: 'lower-alpha',
  A: 'upper-alpha',
  i: 'lower-roman',
  I: 'upper-roman',
} as const

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
    .locator('[data-reader-direction-card="cinematic-feature"]')
    .getByRole('button', { name: /^View the site in this direction/ })
    .click()
  await expect(page).toHaveURL('/')
  await expect(page.locator(root)).toBeVisible()
})

test('opens Cinematic Feature from the lab and renders published titles on all five pages', async ({
  page,
}) => {
  await expect(
    page.locator(root).getByRole('heading', { name: storyTitle, exact: true }),
  ).toBeVisible()
  await page.goto(authorPath)
  await expect(page.locator(root).getByRole('heading', { level: 1 })).toHaveText(
    labAuthors[0]!.name,
  )
  await page.goto(topicPath)
  await expect(page.locator(root).getByRole('heading', { level: 1 })).toHaveText(labTopics[0]!.name)
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
  for (const width of [320, 360, 390, 768, 1024, 1280, 1440, 1536]) {
    await page.setViewportSize({ width, height: 900 })
    for (const path of pagePaths) {
      await page.goto(path)
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        `${path} at ${width}`,
      ).toBe(true)
      const sections = page.locator(root).getByRole('navigation', { name: 'Sections' })
      await expect(sections).toBeVisible()
      const masthead = await page.locator('.cf-masthead').boundingBox()
      const heading = await page
        .locator(`${root} main :is(.cf-title, .cf-collection-title)`)
        .first()
        .boundingBox()
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
      if (story.id === 'article-lab-chair')
        await expect(page.locator('.cf-hero-text')).toHaveCount(1)
    }
  }
})

test('keeps cover text on solid ground and its credit strip below the photograph', async ({
  page,
}) => {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await page.evaluate(async () => {
      await document.fonts.ready
    })
    const image = page.locator('.cf-cover-image img')
    const caption = page.locator('.cf-cover-image figcaption')
    const panel = page.locator('.cf-lead')
    const mastheadBox = (await page.locator('.cf-masthead').boundingBox())!
    const imageBox = (await image.boundingBox())!
    const captionBox = (await caption.boundingBox())!
    const panelBox = (await panel.boundingBox())!
    expect(imageBox.y).toBeGreaterThanOrEqual(mastheadBox.y + mastheadBox.height)
    expect(captionBox.y).toBeGreaterThanOrEqual(imageBox.y + imageBox.height - 1)
    expect(await caption.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe(
      'rgb(11, 12, 12)',
    )
    expect(await panel.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe(
      'rgb(11, 12, 12)',
    )
    if (width < 1024) {
      expect(panelBox.y).toBeGreaterThanOrEqual(captionBox.y + captionBox.height - 1)
      expect(imageBox.width / imageBox.height).toBeCloseTo(width < 768 ? 4 / 3 : 16 / 9, 2)
    } else {
      expect(panelBox.y + panelBox.height).toBeLessThanOrEqual(imageBox.y + imageBox.height)
      expect(panelBox.width).toBeLessThan((imageBox.width * 2) / 3)
    }
    // A full, unbroken title and user text spacing must grow the solid panel.
    await page.locator('.cf-lead h2 a').evaluate((element) => {
      element.textContent = 'Unbroken'.repeat(40)
      element.style.lineHeight = '1.5'
      element.style.letterSpacing = '0.12em'
      element.style.wordSpacing = '0.16em'
    })
    const grownPanel = (await panel.boundingBox())!
    const title = (await page.locator('.cf-lead h2').boundingBox())!
    expect(title.y).toBeGreaterThanOrEqual(grownPanel.y + 24)
    expect(title.y + title.height).toBeLessThanOrEqual(grownPanel.y + grownPanel.height - 24)
    const read = (await panel.locator('.cf-read').boundingBox())!
    expect(read.y + read.height).toBeLessThanOrEqual(grownPanel.y + grownPanel.height - 24)
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true)
    const afterImage = (await image.boundingBox())!
    const afterCaption = (await caption.boundingBox())!
    expect(afterCaption.y).toBeGreaterThanOrEqual(afterImage.y + afterImage.height - 1)
  }
})

test('matches section feature and card sizes to their actual grid slots', async ({ page }) => {
  for (const width of [390, 768, 1024, 1440, 1536, 1920]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(sectionPath)
    const interior = Math.min(width - (width >= 1024 ? 96 : width >= 768 ? 64 : 40), 1440)
    const gap = width >= 1024 ? 32 : 24
    const feature = (await page.locator('.cf-feature img').boundingBox())!
    expect(feature.width).toBeCloseTo(width >= 1024 ? ((interior - gap) * 7) / 12 : interior, 0)
    expect(feature.width / feature.height).toBeCloseTo(width < 768 ? 4 / 3 : 3 / 2, 2)
    for (const image of await page.locator('.cf-card:not(.cf-feature) img').all()) {
      const box = (await image.boundingBox())!
      expect(box.width).toBeCloseTo(width >= 768 ? (interior - gap) / 2 : interior, 0)
      expect(box.width / box.height).toBeCloseTo(3 / 2, 2)
    }
  }
})

test('keeps article heading, byline and credit order inside an opaque panel at every breakpoint', async ({
  page,
}) => {
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(storyPath)
    const panel = page.locator('.cf-article-panel')
    const hero = page.locator('.cf-hero img')
    expect(await panel.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe(
      'rgb(11, 12, 12)',
    )
    expect(
      await page
        .locator('.cf-article-hero')
        .evaluate((element) => element.firstElementChild?.className),
    ).toBe('cf-article-heading')
    // React also emits its own href-less preload hints for srcset images; D's helper owns the href one.
    expect(await page.locator('link[as="image"][href]').getAttribute('media')).toBe(
      '(min-width: 1024px)',
    )
    const panelBox = (await panel.boundingBox())!
    const heroBox = (await hero.boundingBox())!
    if (width < 1024) {
      expect(heroBox.y).toBeGreaterThanOrEqual(panelBox.y + panelBox.height - 1)
      expect(heroBox.width / heroBox.height).toBeCloseTo(width < 768 ? 4 / 3 : 16 / 9, 2)
    } else {
      expect(panelBox.y + panelBox.height).toBeLessThanOrEqual(heroBox.y + heroBox.height)
    }
    const caption = (await page.locator('.cf-hero figcaption').boundingBox())!
    expect(caption.y).toBeGreaterThanOrEqual(heroBox.y + heroBox.height - 1)
    const authors = page.locator('.cf-byline a')
    const story = labStories.find(({ id }) => id === 'article-lab-long-table')!
    await expect(authors).toHaveCount(story.authors.length)
    await authors.first().focus()
    for (let index = 1; index < story.authors.length; index++) {
      await page.keyboard.press('Tab')
      await expect(authors.nth(index)).toBeFocused()
    }
    for (const control of await authors.all()) {
      const box = (await control.boundingBox())!
      expect(box.width).toBeGreaterThanOrEqual(44)
      expect(box.height).toBeGreaterThanOrEqual(44)
    }
    await page.locator('.cf-article-heading h1').evaluate((element) => {
      element.textContent = 'Unbroken'.repeat(40)
      element.style.lineHeight = '1.5'
      element.style.letterSpacing = '0.12em'
      element.style.wordSpacing = '0.16em'
    })
    const grown = (await panel.boundingBox())!
    const credits = (await page.locator('.cf-credits').boundingBox())!
    expect(credits.y + credits.height).toBeLessThanOrEqual(grown.y + grown.height - 24)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
})

test('computes the full article heading scale, list numbering and editorial treatments after shared resets', async ({
  page,
}) => {
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(storyPath)
    // The server renderer's semantic output is covered by b2.test.tsx; these
    // inserted extremes exercise its selectors against the actual global cascade.
    await page.locator('.cf-body').evaluate((body, listStyles) => {
      const fixture = document.createElement('div')
      fixture.dataset.styleProbe = 'true'
      for (const level of [2, 3, 4, 5, 6]) {
        const heading = document.createElement(`h${level}`)
        heading.textContent = `Heading ${level}`
        fixture.append(heading)
      }
      for (const [type, style] of Object.entries(listStyles)) {
        const list = document.createElement('ol')
        list.type = type
        list.start = 3
        list.dataset.probe = `list-${type}`
        // Match ArticleBody: Tailwind resets bare typed lists to list-style:none.
        list.style.listStyleType = style
        const item = document.createElement('li')
        item.textContent = 'Numbered item'
        list.append(item)
        fixture.append(list)
      }
      for (const variant of ['key-points', 'methodology']) {
        const section = document.createElement('section')
        section.dataset.block = 'editorial'
        section.dataset.variant = variant
        section.textContent = 'Editorial treatment'
        fixture.append(section)
      }
      body.append(fixture)
    }, listStyles)
    const headingSizes =
      width < 768
        ? [30, 24, 22, 20, 18]
        : width < 1024
          ? [36, 28, 24, 22, 20]
          : [40, 30, 24, 22, 20]
    const headings = await page
      .locator('[data-style-probe] :is(h2,h3,h4,h5,h6)')
      .evaluateAll((elements) =>
        elements.map((element) => {
          const style = getComputedStyle(element)
          return {
            size: parseFloat(style.fontSize),
            leading: parseFloat(style.lineHeight),
            weight: style.fontWeight,
            stretch: style.fontStretch,
          }
        }),
      )
    headings.forEach((style, index) => {
      expect(style.size).toBe(headingSizes[index])
      expect(style.leading).toBeCloseTo(style.size * (index < 2 ? 1.2 : 1.35), 1)
      expect(style.weight).toBe(index < 2 ? '800' : '700')
      expect(style.stretch).toBe(index < 2 ? '85%' : '100%')
    })
    for (const [type, style] of Object.entries(listStyles)) {
      // data-* values preserve case; HTML type selectors do not.
      const probe = page.locator(`[data-probe="list-${type}"]`)
      await expect(probe).toHaveAttribute('type', type)
      await expect(probe).toHaveAttribute('start', '3')
      await expect(probe).toHaveCSS('list-style-type', style)
    }
    const authoredLists = await page
      .locator('.cf-body ol[type]:not([data-probe])')
      .evaluateAll((elements) =>
        elements.map((element) => ({
          type: element.getAttribute('type')!,
          style: getComputedStyle(element).listStyleType,
        })),
      )
    expect(authoredLists.length).toBeGreaterThan(0)
    for (const { type, style } of authoredLists) {
      expect(type in listStyles, `authored list type ${type}`).toBe(true)
      expect(style, `authored list type ${type}`).toBe(listStyles[type as keyof typeof listStyles])
    }
    expect(
      await page
        .locator('.cf-body pre code')
        .first()
        .evaluate((element) => getComputedStyle(element).fontSize),
    ).toBe('16px')
    expect(
      await page
        .locator('.cf-body [data-block="pull-quote"] blockquote')
        .first()
        .evaluate((element) => getComputedStyle(element).fontSize),
    ).toBe(width < 1024 ? '32px' : '40px')
    expect(
      await page
        .locator('.cf-body [data-block="editorial"][data-variant="key-points"]')
        .first()
        .evaluate((element) => getComputedStyle(element).borderLeftWidth),
    ).toBe('3px')
    expect(
      await page
        .locator('[data-style-probe] [data-block="editorial"][data-variant="methodology"]')
        .first()
        .evaluate((element) => getComputedStyle(element).borderLeftWidth),
    ).toBe('0px')
  }
})

test('paints genuine Archivo italics inside condensed headings and pull quotes', async ({
  page,
}) => {
  // This controls first layout to inspect faces; it is not cold-load evidence.
  const fontGate = await prepareFontCapture(page, root, {
    '--font-cf-sans': 'Archivo',
    '--font-cf-mono': 'Martian Mono',
  })
  await fontGate.goto(storyPath)
  await page.locator('.cf-body').evaluate((body) => {
    for (const tag of ['h2', 'h3', 'blockquote']) {
      const container = document.createElement(tag)
      container.dataset.probe = `condensed-${tag}`
      container.append('Condensed text with ')
      const emphasis = document.createElement('em')
      emphasis.textContent = 'genuine italic emphasis'
      container.append(emphasis)
      if (tag === 'blockquote') {
        const figure = document.createElement('figure')
        figure.dataset.block = 'pull-quote'
        figure.append(container)
        body.append(figure)
      } else {
        body.append(container)
      }
    }
  })
  await fontGate.assertFonts()
  const cdp = await page.context().newCDPSession(page)
  try {
    await cdp.send('DOM.enable')
    await cdp.send('CSS.enable')
    const { root: documentNode } = await cdp.send('DOM.getDocument')
    for (const tag of ['h2', 'h3', 'blockquote']) {
      const selector = `${root} [data-probe="condensed-${tag}"] em`
      await expect(page.locator(`[data-probe="condensed-${tag}"]`)).toHaveCSS('font-stretch', '85%')
      await expect(page.locator(selector)).toHaveCSS('font-stretch', '100%')
      await expect(page.locator(selector)).toHaveCSS('font-style', 'italic')
      const { nodeId } = await cdp.send('DOM.querySelector', {
        nodeId: documentNode.nodeId,
        selector,
      })
      const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId })
      const painted = fonts.filter(({ glyphCount }) => glyphCount > 0)
      expect(painted.length, `${selector}: ${JSON.stringify(fonts)}`).toBeGreaterThan(0)
      for (const font of painted) {
        expect(font.isCustomFont).toBe(true)
        // Measured from archivo-latin-700-italic.woff2, not the CSS family alias.
        expect(font.postScriptName).toBe('ArchivoSemiBold-BoldItalic')
      }
    }
  } finally {
    await cdp.detach()
  }
})

test('bounds body images, wide galleries and nested galleries to their declared slots', async ({
  page,
}) => {
  for (const width of [390, 768, 1024, 1440, 1536, 1920]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto(storyPath)
    const expectedSlot = width < 768 ? width : Math.min(672, width - (width < 1024 ? 64 : 96))
    for (const image of await page
      .locator('.cf-body > figure img, .cf-body > [data-block="gallery"] img')
      .all()) {
      expect((await image.boundingBox())!.width).toBeCloseTo(expectedSlot, 0)
      await expect(image).toHaveAttribute('sizes', '(min-width: 768px) 42rem, 100vw')
    }
    const gallery = page.locator('.cf-body > [data-block="gallery"]').first()
    expect((await gallery.boundingBox())!.width).toBeCloseTo(width >= 1536 ? 1368 : expectedSlot, 0)
    await gallery.evaluate((element) => {
      const nested = element.cloneNode(true) as HTMLElement
      nested.dataset.nestedProbe = 'true'
      const quote = document.createElement('blockquote')
      quote.append(nested)
      element.parentElement!.append(quote)
      const carousel = element.cloneNode(true) as HTMLElement
      carousel.dataset.layout = 'carousel'
      element.parentElement!.append(carousel)
    })
    expect(
      await page
        .locator('[data-nested-probe]')
        .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length),
    ).toBe(1)
    expect(
      await page
        .locator('.cf-body > [data-layout="carousel"]')
        .last()
        .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length),
    ).toBe(1)
  }
  // User font enlargement also raises the rem breakpoint; two columns must
  // never escape the available container.
  await page.setViewportSize({ width: 1536, height: 1000 })
  await page.goto(storyPath)
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '32px'
  })
  expect(
    await page
      .locator('.cf-body > [data-block="gallery"]')
      .first()
      .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length),
  ).toBe(1)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('computes readable paper metadata and fixed related slots in both themes', async ({
  page,
}) => {
  for (const width of [390, 768, 1440, 1536]) {
    await page.setViewportSize({ width, height: 900 })
    for (const dark of [false, true]) {
      await page.goto(storyPath)
      await page.evaluate((dark) => document.documentElement.classList.toggle('dark', dark), dark)
      await waitForThemeToSettle(page)
      const accent = dark ? 'rgb(230, 182, 92)' : 'rgb(117, 80, 23)'
      const secondary = dark ? 'rgb(207, 205, 197)' : 'rgb(79, 91, 102)'
      for (const selector of ['.cf-related .cf-story-meta a', '.cf-topics a', '.cf-body p a']) {
        expect(
          await page
            .locator(selector)
            .first()
            .evaluate((element) => getComputedStyle(element).color),
        ).toBe(accent)
      }
      expect(
        await page
          .locator('.cf-related .cf-story-meta > span')
          .first()
          .evaluate((element) => getComputedStyle(element).color),
      ).toBe(secondary)
      const interior = Math.min(width - (width >= 1024 ? 96 : width >= 768 ? 64 : 40), 1440)
      const columns = width >= 1024 ? 3 : width >= 768 ? 2 : 1
      const gap = width >= 1024 ? 32 : width >= 768 ? 24 : 16
      const card = page.locator('.cf-related .cf-card').first()
      expect((await card.boundingBox())!.width).toBeCloseTo(
        (interior - gap * (columns - 1)) / columns,
        0,
      )
      // Removing siblings must not stretch the remaining card.
      await page.locator('.cf-related-grid').evaluate((element) => {
        for (const child of [...element.children].slice(1)) child.remove()
      })
      expect((await card.boundingBox())!.width).toBeCloseTo(
        (interior - gap * (columns - 1)) / columns,
        0,
      )
      const topic = page.locator('.cf-topics a').first()
      await topic.focus()
      await page.keyboard.press('Shift+Tab')
      await page.keyboard.press('Tab')
      await expect(topic).toBeFocused()
      await expect(topic).toHaveCSS('outline-color', accent)
      await expect(topic).toHaveCSS('outline-style', 'solid')
      await expect(topic).toHaveCSS('outline-width', '3px')
      expect((await topic.boundingBox())!.height).toBeGreaterThanOrEqual(44)
      await page.goto(authorPath)
      await page.evaluate((dark) => document.documentElement.classList.toggle('dark', dark), dark)
      expect(
        await page.locator('.cf-author-bio').evaluate((element) => getComputedStyle(element).color),
      ).toBe(secondary)
    }
  }
})

test('renders fixture-derived author/topic collections and omits an absent biography', async ({
  page,
}) => {
  for (const [route, stories, label] of [
    [
      authorPath,
      labStories.filter((story) => story.authors.includes(labAuthors[0]!.slug)),
      `Stories by ${labAuthors[0]!.name}`,
    ],
    [
      topicPath,
      labStories.filter((story) => story.topics.includes(labTopics[0]!.slug)),
      `Stories about ${labTopics[0]!.name}`,
    ],
  ] as const) {
    await page.goto(route)
    const expected = [...stories].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    await expect(
      page.getByRole('region', { name: label }).getByRole('heading', { level: 3 }),
    ).toHaveText(expected.map(({ title }) => title))
    expect(
      await page
        .locator('.cf-collection-title')
        .evaluate((element) => getComputedStyle(element).lineHeight),
    ).not.toBe('normal')
  }
  const noBio = labAuthors.find(({ bio }) => !bio)!
  await page.goto(`/authors/${noBio.slug}`)
  await expect(page.locator('.cf-author-bio')).toHaveCount(0)
})

test('keeps all five comparison previews scoped and readable at mobile and desktop widths', async ({
  page,
}) => {
  test.setTimeout(180_000)
  for (const route of pagePaths) {
    await page.goto(`/owner/reader-lab/compare?page=${encodeURIComponent(route)}`)
    const frame = page.frameLocator('[data-compare-direction="cinematic-feature"] iframe')
    for (const width of [390, 1440]) {
      await page.getByRole('radio', { name: width === 390 ? /Mobile/ : /Desktop/ }).check()
      for (const dark of [false, true]) {
        await page.evaluate((dark) => document.documentElement.classList.toggle('dark', dark), dark)
        await expect(frame.locator(root)).toBeVisible()
        await expect(frame.locator(`${root} h1`)).toHaveCount(1)
        await expect(frame.locator(`${root} .cf-page`)).toBeVisible()
        expect(
          await frame
            .locator('body')
            .evaluate(
              (element) =>
                element.ownerDocument.documentElement.scrollWidth <=
                element.ownerDocument.defaultView!.innerWidth,
            ),
        ).toBe(true)
        expect(
          await frame
            .locator(root)
            .evaluate((element) => getComputedStyle(element).backgroundColor),
        ).toBe('rgb(11, 12, 12)')
        if (route === storyPath) {
          await expect
            .poll(() =>
              frame
                .locator('.cf-reading-surface')
                .evaluate((element) => getComputedStyle(element).backgroundColor),
            )
            .toBe(dark ? 'rgb(11, 12, 12)' : 'rgb(242, 241, 236)')
        }
      }
    }
  }
})

test('uses visible keyboard focus and a dark cinematic ground', async ({ page }) => {
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
  expect(Math.abs(metrics.width - Math.min(metrics.measure, 672))).toBeLessThan(1)
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
    for (const path of pagePaths) {
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

test('captures b2 all five page types and the wide gallery in both themes', async ({ page }) => {
  test.setTimeout(300_000)
  const captureFonts = await prepareFontCapture(page, root, {
    '--font-cf-sans': 'Archivo',
    '--font-cf-mono': 'Martian Mono',
  })
  const destination = path.resolve('docs/worklog/blog-0044.50')
  await mkdir(destination, { recursive: true })
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 })
    for (const [name, route] of [
      ['home', '/'],
      ['article', storyPath],
      ['section', sectionPath],
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
  await page.setViewportSize({ width: 1536, height: 1000 })
  await captureFonts.goto(storyPath)
  for (const theme of ['light', 'dark']) {
    await page.evaluate(
      (dark) => document.documentElement.classList.toggle('dark', dark),
      theme === 'dark',
    )
    await waitForThemeToSettle(page)
    const gallery = page.locator('.cf-body > [data-block="gallery"]').first()
    await gallery.scrollIntoViewIfNeeded()
    await page.evaluate(async () => {
      for (const image of document.images) image.loading = 'eager'
      await Promise.all(Array.from(document.images, (image) => image.decode().catch(() => {})))
    })
    await captureFonts.assertFonts()
    await gallery.screenshot({ path: path.join(destination, `gallery-1536-${theme}.png`) })
  }
})
