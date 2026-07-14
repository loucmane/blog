import { defineConfig, devices } from '@playwright/test'

const port = 3100
const baseURL = `http://localhost:${port}`

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: 'ci-artifacts/playwright-results',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['json', { outputFile: 'ci-artifacts/playwright-results.json' }],
    ['html', { open: 'never', outputFolder: 'ci-artifacts/playwright-report' }],
  ],
  use: {
    baseURL,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: {
    command: 'pnpm --filter web build && pnpm --filter web start',
    env: {
      HOSTNAME: '127.0.0.1',
      MAGAZINE_PREVIEW_SECRET: 'task40-preview-fixture',
      MAGAZINE_REVALIDATION_SECRET: 'task40-revalidation-fixture',
      NEXT_PUBLIC_SITE_URL: baseURL,
      PORT: String(port),
    },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: baseURL,
  },
})
