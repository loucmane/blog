import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import accessibilityBaseline from './accessibility-baseline.json'

test('serves the reader shell and enforces the accessibility baseline', async ({
  page,
}, testInfo) => {
  const response = await page.goto('/')

  expect(response?.status()).toBe(200)
  await expect(page.locator('main')).toBeVisible()
  await expect(page.locator('h1')).toBeVisible()

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
  const seriousViolations = results.violations.filter((violation) =>
    ['critical', 'serious'].includes(violation.impact ?? ''),
  )
  const criticalViolations = seriousViolations.filter(
    (violation) => violation.impact === 'critical',
  )
  const normalizedViolations = seriousViolations
    .flatMap((violation) =>
      violation.nodes.map((node) => ({
        id: violation.id,
        impact: violation.impact,
        target: node.target,
      })),
    )
    .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)))
  const expectedViolations =
    accessibilityBaseline.projects[
      testInfo.project.name as keyof typeof accessibilityBaseline.projects
    ]

  expect(criticalViolations).toEqual([])
  expect(expectedViolations).toBeDefined()
  expect(normalizedViolations).toEqual(expectedViolations)
})

test('keeps the theme chooser operable from the keyboard', async ({ page }) => {
  await page.goto('/')

  const lightTheme = page.getByRole('radio', { name: /light theme/i })
  const darkTheme = page.getByRole('radio', { name: /dark theme/i })

  await lightTheme.focus()
  await page.keyboard.press('ArrowRight')

  await expect(darkTheme).toBeFocused()
  await expect(darkTheme).toHaveAttribute('aria-checked', 'true')
})
