import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

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
// Its first body paragraph sets "long table" in strong and "usually" in em.
const seededStoryPath = '/stories/the-long-table-a-field-guide-to-the-north-house-kitchen'
// Every direction's font requests. Matched by path: the contract versions font URLs with `?v=`,
// and a glob ending in `.woff2` would no longer match them.
const directionFontFiles = (url: URL) =>
  /^\/reader-directions\/[^/]+\/fonts\/[^/]+\.woff2$/.test(url.pathname)

/**
 * The text read on each cold view, by its data-cold-fonts value, with the emphasis it carries. Each
 * part is a leaf element, because CDP also counts the glyphs of an element's descendants.
 */
const parts = [
  ['plain', ''],
  ['strong', 'bold'],
  ['em', 'italic'],
  ['strong-em', 'bold italic'],
  ['story-strong', 'bold'],
  ['story-em', 'italic'],
] as const

type PartName = (typeof parts)[number][0]

interface DirectionCard {
  readonly id: string
  readonly name: string
}

/** One of a direction's CSS font faces, as `document.fonts` reports it. */
interface Face {
  readonly family: string
  readonly status: string
  readonly style: string
  readonly weight: string
}

/** A platform font that painted glyphs of a node, as CDP reports it. */
interface Painted {
  readonly family: string
  readonly postScript: string
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

async function openDirection(page: Page, direction: DirectionCard) {
  await page.goto('/owner/reader-lab')
  await page
    .locator(`[data-reader-direction-card="${direction.id}"]`)
    .getByRole('button', { name: /^View the site in this direction/ })
    .click()
  await expect(page).toHaveURL('/')
  await expect(page.locator(`[data-reader-direction="${direction.id}"]`)).toHaveCount(1)
  await expect(page.getByRole('region', { exact: true, name: 'Reader Lab' })).toContainText(
    direction.name,
  )
}

/** Bold fallback faces declare a weight range that starts above 400; the others declare none. */
function isBold(face: Face) {
  return Number.parseInt(face.weight, 10) > 400
}

/** The local face that CSS font matching picks for an emphasis, if the family has one. */
function localFace(faces: readonly Face[], emphasis: string) {
  const italic = emphasis.includes('italic')
  const bold = emphasis.includes('bold')
  const styled = faces.filter((face) => (face.style === 'italic') === italic)
  // Style matches before weight: without a bold italic face, as in Quiet Monograph, bold italic
  // text takes the italic face.
  return (
    styled.find((face) => isBold(face) === bold) ??
    (italic ? styled.find((face) => !isBold(face)) : undefined)
  )
}

/** Whether the element paints differently when set in the body text's weight and style. */
async function differsFromBody(
  element: Locator,
  body: { readonly fontStyle: string; readonly fontWeight: string },
) {
  const emphasised = await element.screenshot({ animations: 'disabled', caret: 'hide' })
  await element.evaluate((node: HTMLElement, { fontStyle, fontWeight }) => {
    node.style.fontStyle = fontStyle
    node.style.fontWeight = fontWeight
  }, body)
  const plain = await element.screenshot({ animations: 'disabled', caret: 'hide' })
  await element.evaluate((node: HTMLElement) => {
    node.style.removeProperty('font-style')
    node.style.removeProperty('font-weight')
  })
  return !emphasised.equals(plain)
}

/** Checks one direction's open article on a cold view, and returns the evidence it read. */
async function checkColdView(page: Page, id: string) {
  const root = `[data-reader-direction="${id}"]`
  // A probe paragraph sets plain text next to every combination of emphasis. It follows the
  // story's first paragraph, never the body's first child, which a drop cap may style.
  const computed = await page.locator(root).evaluate((element) => {
    const mark = (tag: string, text: string, part: string) => {
      const node = [...element.querySelectorAll(tag)].find(
        (candidate) => candidate.textContent === text,
      )
      if (!node) throw new Error(`The seeded story has no ${tag} "${text}"`)
      node.setAttribute('data-cold-fonts', part)
      return node
    }
    const paragraph = mark('strong', 'long table', 'story-strong').closest('p')
    mark('em', 'usually', 'story-em')
    if (!paragraph) throw new Error('The seeded strong text is outside a paragraph')
    const probe = document.createElement('p')
    probe.innerHTML =
      '<span data-cold-fonts="plain">Plain words</span> ' +
      '<strong data-cold-fonts="strong">Bold words</strong> ' +
      '<em data-cold-fonts="em">Italic words</em> ' +
      '<strong><em data-cold-fonts="strong-em">Bold italic words</em></strong>'
    paragraph.after(probe)
    return {
      family: getComputedStyle(probe).fontFamily,
      parts: Object.fromEntries(
        [...element.querySelectorAll('[data-cold-fonts]')].map((node) => {
          const { fontStyle, fontWeight } = getComputedStyle(node)
          return [node.getAttribute('data-cold-fonts') ?? '', { fontStyle, fontWeight }]
        }),
      ),
    }
  })

  // Asking a local face to load succeeds where the host has one of its names and fails where it
  // has none, which tells this host's capability apart from a fault in the generated faces.
  const faces: Face[] = await page.evaluate(async (prefix) => {
    const family = (face: FontFace) => face.family.replaceAll('"', '')
    const own = [...document.fonts].filter((face) => family(face).startsWith(prefix))
    await Promise.all(
      own
        .filter((face) => family(face).endsWith(' fallback'))
        .map((face) => face.load().catch(() => face)),
    )
    await document.fonts.ready
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    return own.map((face) => ({
      family: family(face),
      status: face.status,
      style: face.style,
      weight: face.weight,
    }))
  }, `reader-${id}__`)

  // No web face loaded, so the view really is cold.
  const web = faces.filter((face) => !face.family.endsWith(' fallback'))
  expect(web.length, `${id} web faces`).toBeGreaterThan(0)
  const warm = web.filter((face) => face.status === 'loaded')
  expect(warm, `${id} loaded web faces`).toEqual([])
  const fallback = computed.family
    .split(',')
    .map((name) => name.trim().replaceAll('"', ''))
    .find((name) => name.startsWith(`reader-${id}__`) && name.endsWith(' fallback'))
  expect(fallback, `${id} body font stack: ${computed.family}`).toBeTruthy()
  const local = faces.filter((face) => face.family === fallback)
  expect(local.length, `${id} local faces of ${fallback}`).toBeGreaterThan(0)

  const cdp = await page.context().newCDPSession(page)
  const painted: Partial<Record<PartName, Painted[]>> = {}
  try {
    await cdp.send('DOM.enable')
    await cdp.send('CSS.enable')
    const { root: documentNode } = await cdp.send('DOM.getDocument')
    for (const [name] of parts) {
      const { nodeId } = await cdp.send('DOM.querySelector', {
        nodeId: documentNode.nodeId,
        selector: `${root} [data-cold-fonts="${name}"]`,
      })
      expect(nodeId, `${id} ${name} node`).toBeGreaterThan(0)
      const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId })
      painted[name] = fonts
        .filter(({ glyphCount }) => glyphCount > 0)
        .map(({ familyName, postScriptName }) => ({
          family: familyName,
          postScript: postScriptName,
        }))
    }
  } finally {
    await cdp.detach()
  }

  const names = (name: PartName) =>
    (painted[name] ?? []).map(({ family, postScript }) => postScript || family)
  const families = (name: PartName) =>
    [...new Set((painted[name] ?? []).map(({ family }) => family))].sort()
  const regular = localFace(local, '')
  const checks: Partial<Record<PartName, string>> = {}
  // Plain text paints a regular face, whether or not the host has the local one.
  const styledPlain = names('plain').filter((name) => /bold|italic|oblique/i.test(name))
  expect.soft(styledPlain, `${id} plain painted ${names('plain').join(', ')}`).toEqual([])
  if (regular?.status === 'loaded') {
    expect.soft(names('plain'), `${id} plain`).not.toEqual([])
  }
  for (const [name, emphasis] of parts) {
    if (!emphasis) continue
    const face = localFace(local, emphasis)
    const label = `${id} ${name} (${emphasis}) painted ${names(name).join(', ') || 'nothing'}`
    if (face?.status === 'loaded') {
      // The local face of this weight and style paints it, from the plain text's local family.
      checks[name] = 'local face'
      const bold = names(name).some((font) => /bold/i.test(font))
      const italic = names(name).some((font) => /italic/i.test(font))
      expect.soft(bold, label).toBe(isBold(face))
      expect.soft(italic, label).toBe(face.style === 'italic')
      if (regular?.status === 'loaded') {
        expect.soft(families(name), label).toEqual(families('plain'))
      }
    } else {
      // The host lacks that local face, so the generic family paints the text: it must still look
      // different from body text.
      checks[name] = 'screenshot'
      const part = page.locator(`${root} [data-cold-fonts="${name}"]`)
      expect.soft(await differsFromBody(part, computed.parts.plain), label).toBe(true)
    }
  }

  return {
    direction: id,
    fallback,
    localFaces: local.map(({ status, style, weight }) => ({ status, style, weight })),
    webFaces: web.map(({ family, status, style, weight }) => ({ family, status, style, weight })),
    parts: Object.fromEntries(
      parts.map(([name]) => [
        name,
        { ...computed.parts[name], check: checks[name], painted: painted[name] },
      ]),
    ),
  }
}

test('keeps bold and italic on cold views in every direction, from local fallback faces where the host has them', async ({
  browser,
  context,
  page,
  request,
}, testInfo) => {
  test.setTimeout(180_000)
  // A cold first view: no web face arrives within its optional block period, so each family keeps
  // its metric-adjusted local fallback. Failing every direction's font requests from the first
  // navigation gives that state and keeps warm faces out of the memory cache.
  const fontRequests = new Set<string>()
  await context.route(directionFontFiles, (route) => {
    fontRequests.add(route.request().url())
    return route.abort()
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await seedReaderLab(request)
  await authenticate(context)
  const evidence: unknown[] = []
  try {
    let checked = 0
    for (const direction of await directionCards(page)) {
      await openDirection(page, direction)
      await page.goto(seededStoryPath)
      await page.evaluate(async () => {
        await document.fonts.ready
      })
      await expect(page.locator(`[data-reader-direction="${direction.id}"]`)).toHaveCount(1)
      // A direction without web fonts, such as baseline, has no fallback faces to check.
      const fontCss = page.locator(`style[data-reader-direction-fonts="${direction.id}"]`)
      if ((await fontCss.count()) === 0) {
        evidence.push({ direction: direction.id, fonts: 'none' })
        continue
      }
      checked += 1
      evidence.push(await checkColdView(page, direction.id))
    }
    expect(checked, 'directions with web fonts').toBeGreaterThan(0)
    // The aborts fired, and every face was requested at its content-versioned URL.
    expect(fontRequests.size, 'aborted direction font requests').toBeGreaterThan(0)
    for (const url of fontRequests) expect(new URL(url).search, url).toMatch(/^\?v=[a-f0-9]{16}$/)
  } finally {
    await testInfo.attach('cold-fonts.json', {
      body: JSON.stringify(
        {
          browser: browser.version(),
          project: testInfo.project.name,
          evidence,
          fontRequests: [...fontRequests],
        },
        null,
        2,
      ),
      contentType: 'application/json',
    })
  }
})

test('serves versioned direction fonts with a one-year immutable cache, and other requests as before', async ({
  request,
}) => {
  const publicFolder = path.resolve('packages/web/public')
  const fonts = readdirSync(path.join(publicFolder, 'reader-directions'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap(({ name: id }) =>
      readdirSync(path.join(publicFolder, 'reader-directions', id, 'fonts'))
        .filter((file) => file.endsWith('.woff2'))
        .map((file) => `/reader-directions/${id}/fonts/${file}`),
    )
  expect(fonts.length).toBeGreaterThan(0)
  for (const font of fonts) {
    const version = createHash('sha256')
      .update(readFileSync(path.join(publicFolder, font)))
      .digest('hex')
      .slice(0, 16)
    for (const [url, cacheControl] of [
      [`${font}?v=${version}`, 'public, max-age=31536000, immutable'],
      // Without a version of exactly 16 lowercase hex digits, Next's revalidating default stays.
      [font, 'public, max-age=0'],
      [`${font}?v=${version.slice(1)}`, 'public, max-age=0'],
      [`${font}?v=0123456789ABCDEF`, 'public, max-age=0'],
      // A well-formed but stale version (an old page after a font update) still gets today's
      // bytes with the long cache: the version busts caches, it does not validate content.
      [
        `${font}?v=${version[0] === '0' ? '1' : '0'}${version.slice(1)}`,
        'public, max-age=31536000, immutable',
      ],
    ] as const) {
      const response = await request.get(url)
      expect(response.status(), url).toBe(200)
      expect(response.headers()['cache-control'], url).toBe(cacheControl)
    }
  }
  // Only font files: the folder's documentation keeps the default even with a version.
  const readme = await request.get(
    '/reader-directions/quiet-monograph/fonts/README.md?v=0123456789abcdef',
  )
  expect(readme.status()).toBe(200)
  expect(readme.headers()['cache-control']).toBe('public, max-age=0')
})
