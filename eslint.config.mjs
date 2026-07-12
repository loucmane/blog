import { fileURLToPath } from 'node:url'

import eslint from '@eslint/js'
import eslintReact from '@eslint-react/eslint-plugin'
import nextPlugin from '@next/eslint-plugin-next'
import prettier from 'eslint-config-prettier'
import jsxA11y from 'eslint-plugin-jsx-a11y-x'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const typeScriptFiles = ['**/*.{ts,tsx}']
const reactFiles = ['packages/{ui,web}/**/*.{jsx,tsx}']
const webRoot = fileURLToPath(new URL('./packages/web/', import.meta.url))
const reactRecommended = eslintReact.configs['recommended-typescript']

export default [
  {
    ignores: [
      '.aegis/**',
      '.agents/**',
      '.claude/**',
      '.codex/**',
      '.git/**',
      '.next/**',
      '.plan_state/**',
      '.serena/**',
      '.taskmaster/**',
      'ci-artifacts/**',
      'coverage/**',
      'dist/**',
      'docs/**',
      'node_modules/**',
      'packages/**/dist/**',
      'packages/**/.next/**',
      'packages/**/*.d.ts',
      'packages/ui/tailwind.config.ts',
      'packages/web/tailwind.config.js',
      'plans/**',
      'reports/**',
      'sessions/**',
    ],
  },
  eslint.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
    rules: {
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      globals: globals.node,
    },
  },
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: typeScriptFiles,
  })),
  {
    files: typeScriptFiles,
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'no-unused-vars': 'off',
    },
  },
  {
    files: [
      'packages/shared/src/types/index.ts',
      'packages/web/src/types/analytics.ts',
      'packages/web/src/types/index.ts',
      'packages/web/src/types/ui.ts',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    ...reactRecommended,
    files: reactFiles,
    languageOptions: {
      ...reactRecommended.languageOptions,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    settings: {
      ...reactRecommended.settings,
      'react-x': {
        importSource: 'react',
        version: 'detect',
      },
    },
    rules: {
      ...reactRecommended.rules,
      '@eslint-react/no-context-provider': 'off',
      '@eslint-react/no-forward-ref': 'off',
      '@eslint-react/no-missing-key': 'error',
      '@eslint-react/no-use-context': 'off',
      '@eslint-react/set-state-in-effect': 'off',
      '@eslint-react/use-state': 'off',
    },
  },
  {
    files: reactFiles,
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      'react-hooks/exhaustive-deps': 'error',
      'react-hooks/rules-of-hooks': 'error',
    },
  },
  {
    files: reactFiles,
    plugins: jsxA11y.configs.recommended.plugins,
    rules: jsxA11y.configs.recommended.rules,
  },
  {
    files: ['packages/web/src/components/ui/alert.tsx'],
    rules: {
      'jsx-a11y-x/heading-has-content': 'off',
    },
  },
  {
    files: ['packages/web/**/*.{js,jsx,ts,tsx}'],
    plugins: {
      '@next/next': nextPlugin,
    },
    settings: {
      next: {
        rootDir: webRoot,
      },
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },
  prettier,
]
