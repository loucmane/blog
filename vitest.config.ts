import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

const contentIntegration = process.env.TASK42_CONTENT_INTEGRATION === '1'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./packages/web/src', import.meta.url)),
    },
  },
  oxc: {
    jsx: {
      importSource: 'react',
      runtime: 'automatic',
    },
  },
  test: {
    clearMocks: true,
    environment: 'node',
    exclude: [
      '**/ci-artifacts/**',
      '**/dist/**',
      '**/node_modules/**',
      '**/.next/**',
      ...(contentIntegration ? [] : ['**/*.integration.test.ts']),
    ],
    include: contentIntegration
      ? ['packages/web/src/server/database/*.integration.test.ts']
      : ['packages/**/*.{test,spec}.{js,mjs,cjs,ts,tsx}'],
    passWithNoTests: false,
    restoreMocks: true,
    setupFiles: ['./tests/setup/vitest.ts'],
    coverage: {
      exclude: ['**/*.test.*', '**/*.spec.*', '**/index.*'],
      include: [
        'packages/web/src/components/theme-menu.tsx',
        'packages/web/src/lib/framework-content.ts',
        'packages/web/src/lib/request-security.ts',
        'packages/web/src/lib/site-url.ts',
        'packages/web/src/reader/blocks.ts',
        'packages/web/src/reader/media.ts',
        'packages/web/src/reader/read-model.ts',
        'packages/web/src/reader/slug.ts',
        'packages/web/src/reader-directions/contract.ts',
        'packages/web/src/reader-directions/contrast.ts',
        'packages/web/src/reader-lab/actions.ts',
        'packages/web/src/reader-lab/cookie.ts',
        'packages/web/src/reader-lab/presentation.ts',
        'packages/web/src/server/content/backup.ts',
        'packages/web/src/server/content/document.ts',
        'packages/web/src/server/content/errors.ts',
        'packages/web/src/server/content/in-memory-repository.ts',
        'packages/web/src/server/content/media.ts',
        'packages/web/src/server/content/portability.ts',
        'packages/web/src/server/content/reader.ts',
        'packages/web/src/server/content/runtime-selection.ts',
        'packages/web/src/server/content/sections.ts',
        'packages/web/src/server/content/service.ts',
        'packages/web/src/server/database/migrations.ts',
        'packages/web/src/server/database/postgres-search-projection.ts',
        'packages/web/src/server/lab/illustrations.ts',
        'packages/web/src/server/lab/seed.ts',
        'packages/web/src/utils/color-converter.ts',
      ],
      provider: 'v8',
      reporter: ['text', 'json-summary', 'lcov'],
      reportsDirectory: 'ci-artifacts/coverage',
      thresholds: {
        branches: 75,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
})
