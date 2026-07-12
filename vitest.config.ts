import { defineConfig } from 'vitest/config'

export default defineConfig({
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
        'packages/backend/src/controllers/featureController.js',
        'packages/ui/src/components/Button/Button.tsx',
        'packages/ui/src/tokens/breakpoints.ts',
        'packages/ui/src/tokens/colors.ts',
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
