import AxeBuilder from '@axe-core/playwright'
import {
  expect,
  test,
  type APIRequestContext,
  type BrowserContext,
  type Locator,
  type Page,
} from '@playwright/test'

import { dismissReaderLabIntroductions } from './support/reader-lab'

const labSeedToken = 'task44-lab-seed-token-with-more-than-32-bytes'
const ownerTestToken = 'task43-owner-test-token-with-more-than-thirty-two-bytes'
const labCookie = 'reader_lab_direction'
const seededStoryPath = '/stories/the-long-table-a-field-guide-to-the-north-house-kitchen'
const seededSectionPath = '/sections/interiors'
const viewports = [
  { height: 844, width: 390 },
  { height: 900, width: 1440 },
]

interface DirectionCard {
  readonly id: string
  readonly name: string
}

async function seedReaderLab(request: APIRequestContext) {
  const response = await request.post('/api/internal/lab-seed', {
    headers: { authorization: `Bearer ${labSeedToken}` },
  })
  expect(response.status()).toBe(200)
}

async function authenticate(context: BrowserContext) {
  await dismissReaderLabIntroductions(context)
  const response = await context.request.post('/api/owner/fixture-session', {
    headers: { authorization: `Bearer ${ownerTestToken}` },
  })
  expect(response.status()).toBe(200)
}

async function wcagViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
  return results.violations.map(({ id, impact, nodes }) => ({
    id,
    impact,
    targets: nodes.map(({ target }) => target),
  }))
}

async function directionCards(page: Page): Promise<DirectionCard[]> {
  await page.goto('/owner/reader-lab')
  const cards = page.locator('[data-reader-direction-card]')
  await expect(cards.first()).toBeVisible()
  const directions: DirectionCard[] = []
  for (const card of await cards.all()) {
    directions.push({
      id: (await card.getAttribute('data-reader-direction-card')) ?? '',
      name: (await card.getByRole('heading', { level: 2 }).textContent())?.trim() ?? '',
    })
  }
  return directions
}

function labBar(page: Page) {
  return page.getByRole('region', { exact: true, name: 'Reader Lab' })
}

/** Where an open Theme menu sits in its own document: inside the viewport, next to its trigger. */
function themeMenuPlacement(menu: Locator) {
  return menu.evaluate((element) => {
    const viewport = element.ownerDocument.documentElement
    const box = element.getBoundingClientRect()
    const anchor = element.ownerDocument
      .querySelector('[data-slot="theme-menu-trigger"][aria-expanded="true"]')
      ?.getBoundingClientRect()
    return {
      insideViewport:
        box.left >= 0 &&
        box.top >= 0 &&
        box.right <= viewport.clientWidth &&
        box.bottom <= viewport.clientHeight,
      nextToTrigger:
        anchor !== undefined &&
        box.left < anchor.right &&
        box.right > anchor.left &&
        (box.top >= anchor.bottom || box.bottom <= anchor.top),
    }
  })
}

/** Clicks a lab bar control and waits for its Server Action, which posts to the current page. */
async function submitInPlace(page: Page, control: Locator) {
  const currentPath = new URL(page.url()).pathname
  const action = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' && new URL(response.url()).pathname === currentPath,
  )
  await control.click()
  expect((await action).status()).toBe(200)
}

async function openDirection(page: Page, direction: DirectionCard) {
  await page.goto('/owner/reader-lab')
  await page
    .locator(`[data-reader-direction-card="${direction.id}"]`)
    .getByRole('button', { name: /^View the site in this direction/ })
    .click()
  await expect(page).toHaveURL('/')
  await expect(page.locator(`[data-reader-direction="${direction.id}"]`)).toHaveCount(1)
  await expect(labBar(page)).toContainText(direction.name)
}

test('lets the owner open the site in a direction, switch in place, and exit the lab', async ({
  context,
  page,
  request,
}) => {
  test.setTimeout(90_000)
  await seedReaderLab(request)
  await authenticate(context)

  const directions = await directionCards(page)
  expect(directions.map(({ id }) => id)).toContain('baseline')
  await expect(page.getByRole('link', { name: 'Write a new post' })).toHaveAttribute(
    'href',
    '/owner/stories/new',
  )
  await expect(page.getByRole('link', { name: 'Back to my stories' })).toHaveAttribute(
    'href',
    '/owner',
  )

  const [first] = directions
  if (!first) throw new Error('The Reader Lab lists no directions.')
  await openDirection(page, first)

  const overrideResponse = await page.reload()
  expect(overrideResponse?.headers()['cache-control']).toBe('private, no-store')
  expect(overrideResponse?.headers()['x-robots-tag']).toContain('noindex')

  await page.goto('/owner/reader-lab')
  await page
    .locator(`[data-reader-direction-card="${first.id}"]`)
    .getByRole('button', { name: /^Open latest story/ })
    .click()
  await expect(page).toHaveURL(/\/stories\/[a-z0-9-]+$/)
  await expect(labBar(page)).toContainText(first.name)

  await page.goto(seededStoryPath)
  await expect(labBar(page)).toContainText(first.name)
  const last = directions.at(-1)!
  const second = directions[1 % directions.length]!
  const expectDirection = async (direction: DirectionCard) => {
    await expect(labBar(page)).toContainText(direction.name)
    await expect(page.locator(`[data-reader-direction="${direction.id}"]`)).toHaveCount(1)
    await expect(page).toHaveURL(seededStoryPath)
  }

  const previousButton = labBar(page).getByRole('button', { name: /^Previous direction/ })
  const nextButton = labBar(page).getByRole('button', { name: /^Next direction/ })

  await submitInPlace(page, previousButton)
  await expectDirection(last)
  await submitInPlace(page, nextButton)
  await expectDirection(first)
  await submitInPlace(page, nextButton)
  await expectDirection(second)
  await submitInPlace(page, previousButton)
  await expectDirection(first)

  await submitInPlace(page, labBar(page).getByRole('button', { name: 'Exit lab' }))
  await expect(labBar(page)).toHaveCount(0)
  await expect(page.locator('[data-reader-direction="baseline"]')).toHaveCount(1)
  await expect(page).toHaveURL(seededStoryPath)
  const defaultResponse = await page.reload()
  expect(defaultResponse?.headers()['cache-control']).toContain('no-store')
  expect(defaultResponse?.headers()['x-robots-tag']).toBeUndefined()
  expect((await context.cookies()).map(({ name }) => name)).not.toContain(labCookie)
})

test('never shows an override or the lab bar without an owner session', async ({
  browser,
  request,
}) => {
  await seedReaderLab(request)
  const visitor = await browser.newContext()
  try {
    const page = await visitor.newPage()
    for (const value of ['baseline', 'unknown-direction', '../owner']) {
      await visitor.addCookies([{ name: labCookie, url: 'http://localhost:3100', value }])
      for (const path of ['/', seededStoryPath, seededSectionPath]) {
        const label = `${path} with ${labCookie}=${value}`
        const response = await page.goto(path)

        expect(response?.status(), label).toBe(200)
        await expect(page.locator('[data-reader-direction="baseline"]'), label).toHaveCount(1)
        await expect(page.locator('[data-reader-lab-bar]'), label).toHaveCount(0)
        await expect(page.getByText('Reader Lab'), label).toHaveCount(0)
        await expect(page.getByRole('dialog')).toHaveCount(0)
        expect(response?.headers()['cache-control'], label).toBe('private, no-store')
        expect(response?.headers()['x-robots-tag'], label).toContain('noindex')
      }
    }
    const labPage = await page.goto('/owner/reader-lab')
    await expect(page).toHaveURL('/owner/sign-in')
    expect(labPage?.status()).toBe(200)
  } finally {
    await visitor.close()
  }
})

test('keeps the Reader Lab and every direction with the lab bar free of axe violations at 390 and 1440 pixels', async ({
  context,
  page,
  request,
}) => {
  test.setTimeout(180_000)
  await seedReaderLab(request)
  await authenticate(context)
  const directions = await directionCards(page)

  for (const viewport of viewports) {
    await page.setViewportSize(viewport)
    await page.goto('/owner/reader-lab')
    expect(await wcagViolations(page), `/owner/reader-lab at ${viewport.width}px`).toEqual([])

    for (const direction of directions) {
      await openDirection(page, direction)
      for (const path of ['/', seededStoryPath, seededSectionPath]) {
        const label = `${direction.id} ${path} at ${viewport.width}px`
        await page.goto(path)
        await expect(labBar(page), label).toBeVisible()
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
          ),
          label,
        ).toBe(true)
        expect(await wcagViolations(page), label).toEqual([])
      }
    }
  }
})

test('reaches the lab bar from the keyboard with a visible focus, and hides it in print', async ({
  context,
  page,
  request,
}) => {
  await seedReaderLab(request)
  await authenticate(context)
  const [first] = await directionCards(page)
  if (!first) throw new Error('The Reader Lab lists no directions.')
  await openDirection(page, first)
  await page.goto('/')

  await page.keyboard.press('Tab')
  const previous = labBar(page).getByRole('button', { name: /^Previous direction/ })
  await expect(previous).toBeFocused()
  const focus = await previous.evaluate((element) => {
    const style = window.getComputedStyle(element)
    return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth }
  })
  expect(focus.outlineStyle).toBe('solid')
  expect(Number.parseFloat(focus.outlineWidth)).toBeGreaterThanOrEqual(2)
  await page.keyboard.press('Tab')
  await expect(labBar(page).getByRole('button', { name: /^Next direction/ })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(labBar(page).getByRole('link', { name: 'All directions' })).toBeFocused()
  await page.keyboard.press('Tab')
  const exit = labBar(page).getByRole('button', { name: 'Exit lab' })
  await expect(exit).toBeFocused()

  await page.emulateMedia({ media: 'print' })
  await expect(labBar(page)).toBeHidden()
  await page.emulateMedia({ media: 'screen' })
  await expect(labBar(page)).toBeVisible()

  await page.keyboard.press('Enter')
  await expect(labBar(page)).toHaveCount(0)
})

test('opens each preview Theme menu inside its own frame and viewport on the compare page', async ({
  context,
  page,
  request,
}) => {
  test.setTimeout(120_000)
  await seedReaderLab(request)
  await authenticate(context)
  await page.goto('/owner/reader-lab/compare')
  const previews = page.locator('[data-compare-direction]')
  await expect(previews.first()).toBeVisible()
  const ids = await previews.evaluateAll((items) =>
    items.map((item) => item.getAttribute('data-compare-direction') ?? ''),
  )
  const preview = (id: string) => page.frameLocator(`[data-compare-direction="${id}"] iframe`)

  const checked: string[] = []
  for (const preset of ['Mobile · 390 px', 'Desktop · 1440 px']) {
    await page.getByRole('radio', { name: preset }).check()
    for (const id of ids) {
      const label = `${id} at ${preset}`
      const frame = preview(id)
      await expect(frame.locator(`[data-reader-direction="${id}"]`), label).toHaveCount(1)
      const trigger = frame.getByRole('button', { name: 'Choose color theme' })
      // Some directions have no Theme menu.
      if ((await trigger.count()) === 0) continue
      await trigger.click()
      const menu = frame.getByRole('menu')
      await expect(menu, label).toBeVisible()
      await expect(page.locator('[data-slot="theme-menu-content"]'), label).toHaveCount(0)
      await expect
        .poll(() => themeMenuPlacement(menu), { message: label })
        .toEqual({ insideViewport: true, nextToTrigger: true })
      await page.keyboard.press('Escape')
      await expect(menu, label).toBeHidden()
      await expect(trigger, label).toBeFocused()
      checked.push(label)
    }
  }
  expect(checked).toEqual(
    expect.arrayContaining(['baseline at Mobile · 390 px', 'baseline at Desktop · 1440 px']),
  )

  // A theme chosen inside a preview still applies to the workspace and every preview.
  await preview('baseline').getByRole('button', { name: 'Choose color theme' }).click()
  await preview('baseline').getByRole('menuitemradio', { name: 'Dark theme' }).click()
  await expect(page.locator('html')).toHaveClass(/(^|\s)dark(\s|$)/)
  for (const id of ids) {
    await expect(preview(id).locator('html'), id).toHaveClass(/(^|\s)dark(\s|$)/)
  }
})

test('loads no font files on default reader pages, because direction fonts load only when used', async ({
  page,
  request,
}) => {
  await seedReaderLab(request)
  const fontRequests: string[] = []
  page.on('request', (fontRequest) => {
    if (fontRequest.resourceType() === 'font') fontRequests.push(fontRequest.url())
  })

  for (const path of ['/', seededStoryPath, seededSectionPath]) {
    await page.goto(path)
    await page.evaluate(async () => {
      await document.fonts.ready
    })
  }

  expect(fontRequests).toEqual([])
  expect(await page.locator('link[rel="preload"][as="font"]').count()).toBe(0)
})
