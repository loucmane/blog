import path from 'node:path'

import { defineConfig } from '@playwright/test'

import shared from '../../../../../playwright.config'

const webServers = Array.isArray(shared.webServer)
  ? shared.webServer
  : shared.webServer
    ? [shared.webServer]
    : []

// Keep the direction's browser tests in its lane. Uses the same production server and fixtures.
export default defineConfig({
  ...shared,
  reporter: [
    ['list'],
    [
      'json',
      {
        outputFile: path.resolve(
          __dirname,
          '../../../../../ci-artifacts/literary-longread-results.json',
        ),
      },
    ],
    [
      'html',
      {
        open: 'never',
        outputFolder: path.resolve(
          __dirname,
          '../../../../../ci-artifacts/literary-longread-report',
        ),
      },
    ],
  ],
  outputDir: path.resolve(__dirname, '../../../../../ci-artifacts/literary-longread-results'),
  testDir: '.',
  testMatch: '*.e2e.ts',
  projects: [{ name: 'literary-longread', use: { browserName: 'chromium' } }],
  webServer: webServers.map((server) => ({
    ...server,
    cwd: path.resolve(__dirname, '../../../../../'),
  })),
})
