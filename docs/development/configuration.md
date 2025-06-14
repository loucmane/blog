# Configuration Examples

## TypeScript Configuration

### Monorepo Root tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "noEmit": true
  },
  "exclude": ["node_modules", "**/node_modules", "dist", "**/dist"]
}
```

## Tailwind Configuration (TypeScript)

### Why TypeScript for Tailwind Config?
- Resolves CommonJS/ESM compatibility issues
- Type safety for design tokens
- Better IDE support
- Modern 2025 best practice

### Example: packages/ui/tailwind.config.ts
```typescript
import type { Config } from 'tailwindcss'
import { colors } from './src/tokens/colors'
import { breakpoints } from './src/tokens/breakpoints'
import { animations } from './src/tokens/animations'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors,
      screens: breakpoints,
      animation: animations.animation,
      keyframes: animations.keyframes,
    },
  },
  plugins: [],
}

export default config
```

## Package.json Exports Configuration

### UI Package Example
```json
{
  "name": "@monorepo/ui",
  "exports": {
    ".": {
      "import": "./src/index.ts",
      "types": "./src/index.ts"
    },
    "./tokens/*": {
      "import": "./src/tokens/*.ts",
      "types": "./src/tokens/*.ts"
    },
    "./themes/*": {
      "import": "./src/themes/*.ts",
      "types": "./src/themes/*.ts"
    },
    "./styles/*": "./src/styles/*.css"
  }
}
```

## Import Path Mappings

### Web Package tsconfig.json
```json
{
  "compilerOptions": {
    "paths": {
      "@monorepo/ui": ["../../ui/src"],
      "@monorepo/ui/*": ["../../ui/src/*"],
      "@monorepo/shared": ["../../shared/src"],
      "@monorepo/shared/*": ["../../shared/src/*"]
    }
  }
}
```

## ESLint Configuration

### Root .eslintrc.js
```javascript
module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'next/core-web-vitals'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json'
  },
  rules: {
    // Project-specific rules
  }
}
```

## Environment Variables

### Example .env.local
```bash
# Analytics
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=

# Donations
STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=

# Newsletter
CONVERTKIT_API_KEY=
CONVERTKIT_FORM_ID=

# CRM
CRM_API_ENDPOINT=
CRM_API_KEY=
```