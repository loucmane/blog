import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

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
    exclude: ['**/ci-artifacts/**', '**/dist/**', '**/node_modules/**', '**/.next/**'],
    include: ['packages/**/*.{test,spec}.{js,mjs,cjs,ts,tsx}'],
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
