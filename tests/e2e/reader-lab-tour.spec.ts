import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import net from 'node:net'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

test('signs in locally, tours with the keyboard, replays, and dismisses the one-time bar help', async ({
  page,
  request,
}) => {
  const seeded = await request.post('/api/internal/lab-seed', {
    headers: { authorization: 'Bearer task44-lab-seed-token-with-more-than-32-bytes' },
  })
  expect(seeded.status()).toBe(200)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/owner/sign-in')
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Use a passkey' })).toBeVisible()
  await page.getByRole('button', { name: 'Sign in as the local owner' }).click()
  await expect(page).toHaveURL('/owner/reader-lab')

  const tour = page.getByRole('dialog', { name: 'Reader Lab tour' })
  await expect(tour).toBeVisible()
  const close = tour.getByRole('button', { name: 'Close tour' })
  await expect(close).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(tour.getByRole('button', { name: 'Next step' })).toBeFocused()
  const focus = await tour.getByRole('button', { name: 'Next step' }).evaluate((element) => {
    const style = getComputedStyle(element)
    return {
      outline: style.outlineStyle,
      width: Number.parseFloat(style.outlineWidth),
      height: element.getBoundingClientRect().height,
    }
  })
  expect(focus.outline).toBe('solid')
  expect(focus.width).toBeGreaterThanOrEqual(2)
  expect(focus.height).toBeGreaterThanOrEqual(44)
  await page.keyboard.press('Enter')
  await expect(tour).toContainText('Step 2 of 6')
  // Metadata can stream in after the dialog is interactive; axe needs the document title too.
  await expect(page).toHaveTitle(/\S/)
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.keyboard.press('Escape')
  await expect(tour).toBeHidden()
  const replay = page.getByRole('button', { name: 'Take the tour' })
  await expect(replay).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(tour).toContainText('Step 1 of 6')
  await page.mouse.click(4, 4)
  await expect(tour).toBeHidden()
  await replay.click()
  await expect(tour).toContainText('Step 1 of 6')
  for (let step = 1; step < 6; step++) await tour.getByRole('button', { name: 'Next step' }).click()
  await tour.getByRole('button', { name: 'Finish tour' }).click()
  await page.reload()
  await expect(replay).toBeVisible()
  await expect(tour).toBeHidden()

  await page
    .locator('[data-reader-direction-card="quiet-monograph"]')
    .getByRole('button', { name: /^View the site/ })
    .click()
  await expect(page).toHaveURL('/')
  const help = page.getByRole('dialog', { name: 'Compare directions here' })
  await expect(help).toBeVisible()
  await expect(help.getByRole('button', { name: 'Got it' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(help.getByRole('button', { name: 'Got it' })).toBeFocused()
  await expect(page).toHaveTitle(/\S/)
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  const direction = page.locator('[data-reader-direction="quiet-monograph"]')
  const bar = page.locator('[data-reader-lab-bar]')
  await page.evaluate(() => document.fonts.ready)
  const before = { direction: await direction.boundingBox(), bar: await bar.boundingBox() }
  await page.keyboard.press('Escape')
  await expect(help).toBeHidden()
  await expect(bar.getByRole('button', { name: /^Previous direction/ })).toBeFocused()
  expect(await direction.boundingBox()).toEqual(before.direction)
  expect(await bar.boundingBox()).toEqual(before.bar)
  await page.reload()
  await expect(bar).toBeVisible()
  await expect(help).toBeHidden()
  await bar.getByRole('button', { name: /^Next direction/ }).click()
  await expect(help).toBeHidden()
})

test('allows direction navigation while the first bar reminder is open', async ({
  page,
  context,
}) => {
  const session = await context.request.post('/api/owner/fixture-session', {
    headers: { authorization: 'Bearer task43-owner-test-token-with-more-than-thirty-two-bytes' },
  })
  expect(session.status()).toBe(200)
  await context.addCookies([
    { name: 'reader_lab_direction', value: 'quiet-monograph', url: 'http://localhost:3100' },
  ])
  await page.goto('/')
  const help = page.getByRole('dialog', { name: 'Compare directions here' })
  await expect(help).toBeVisible()
  // Outside controls are hidden from the accessibility tree while keyboard focus is trapped,
  // but remain pointer targets. A real click must both dismiss help and change direction.
  await page
    .locator('[data-reader-lab-bar] button')
    .filter({ hasText: /^Next direction/ })
    .click()
  await expect(help).toBeHidden()
  await expect(page.locator('[data-reader-direction="literary-longread"]')).toBeVisible()
  await page.reload()
  await expect(help).toBeHidden()
})

test('visitors never receive tour or bar help, even with a direction cookie', async ({
  page,
  context,
}) => {
  await context.addCookies([
    { name: 'reader_lab_direction', value: 'quiet-monograph', url: 'http://localhost:3100' },
  ])
  await page.goto('/')
  await expect(page.locator('[data-reader-direction="baseline"]')).toBeVisible()
  await expect(page.locator('[data-reader-lab-bar]')).toHaveCount(0)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Take the tour' })).toHaveCount(0)
  await page.goto('/owner/reader-lab')
  await expect(page).toHaveURL('/owner/sign-in')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('omits local sign-in outside fixture mode, including a production runtime with the test flag set', async ({
  page,
}) => {
  test.setTimeout(90_000)
  for (const environment of [
    { NODE_ENV: 'test', MAGAZINE_OWNER_TEST_MODE: '' },
    { NODE_ENV: 'production', MAGAZINE_OWNER_TEST_MODE: '1' },
  ] as const) {
    const portProbe = net.createServer()
    portProbe.listen(0, '127.0.0.1')
    await once(portProbe, 'listening')
    const address = portProbe.address()
    if (!address || typeof address === 'string')
      throw new Error('Could not allocate a local test port')
    const port = address.port
    await new Promise<void>((resolve, reject) =>
      portProbe.close((error) => (error ? reject(error) : resolve())),
    )
    const origin = `http://127.0.0.1:${port}`
    const root = path.resolve('packages/web')
    const child = spawn(
      process.execPath,
      [
        path.join(root, 'node_modules/next/dist/bin/next'),
        'start',
        '--hostname',
        '127.0.0.1',
        '--port',
        String(port),
      ],
      {
        cwd: root,
        env: {
          ...process.env,
          ...environment,
          MAGAZINE_RUNTIME_SITE_URL: origin,
          BETTER_AUTH_URL: origin,
          DATABASE_URL: '',
          MAGAZINE_OWNER_EMAIL: 'owner@example.test',
          MAGAZINE_OWNER_TEST_TOKEN: 'task43-owner-test-token-with-more-than-thirty-two-bytes',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    )
    let output = ''
    child.stdout.on('data', (chunk: Buffer) => {
      output = `${output}${chunk.toString()}`.slice(-6000)
    })
    child.stderr.on('data', (chunk: Buffer) => {
      output = `${output}${chunk.toString()}`.slice(-6000)
    })
    const ended = new Promise<void>((resolve) => {
      child.once('exit', () => resolve())
      child.once('error', () => resolve())
    })
    try {
      await expect
        .poll(
          async () => {
            if (child.exitCode !== null) throw new Error(output)
            return fetch(`${origin}/owner/sign-in`, { signal: AbortSignal.timeout(2000) })
              .then(async (response) => {
                await response.body?.cancel()
                return response.status
              })
              .catch(() => 0)
          },
          { timeout: 30_000 },
        )
        .toBe(200)
      await page.goto(`${origin}/owner/sign-in`)
      await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Sign in as the local owner' })).toHaveCount(0)
    } finally {
      child.kill('SIGTERM')
      await Promise.race([ended, delay(3000)])
      if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL')
      await ended
    }
  }
})
