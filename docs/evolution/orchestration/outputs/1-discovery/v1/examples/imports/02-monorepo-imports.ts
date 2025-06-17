// 02-monorepo-imports.ts
// Demonstrates proper monorepo import patterns and package boundaries

// ❌ BAD: Importing from source directories
import { Button } from '@minniewinnie/ui/src/components/button'
import { colors } from '@minniewinnie/ui/src/tokens/colors'
import { formatDate } from '@minniewinnie/shared/src/utils/date'

// ❌ BAD: Relative imports across packages
import { ThemeProvider } from '../../../packages/ui/src/providers'
import { BaseButton } from '../../../../ui/components/base-button'

// ❌ BAD: Importing internal/private modules
import { internalHelper } from '@minniewinnie/ui/src/utils/_internal'
import { privateApi } from '@minniewinnie/shared/lib/private'

// ❌ BAD: Circular dependencies between packages
// In @minniewinnie/ui:
import { someType } from '@minniewinnie/web'  // UI shouldn't depend on web!

// ✅ GOOD: Import from package exports
import { ThemeProvider } from '@minniewinnie/ui/providers'
import { colors, spacing, typography } from '@minniewinnie/ui/tokens'
import { BaseButton, BaseCard } from '@minniewinnie/ui/components'
import { formatDate, formatCurrency } from '@minniewinnie/shared/utils'
import type { ContentItem, ApiResponse } from '@minniewinnie/shared/types'

// 📦 PACKAGE STRUCTURE & EXPORTS

// packages/ui/package.json
{
  "name": "@minniewinnie/ui",
  "version": "1.0.0",
  "exports": {
    "./package.json": "./package.json",
    "./providers": {
      "types": "./dist/providers/index.d.ts",
      "import": "./src/providers/index.ts",
      "default": "./dist/providers/index.js"
    },
    "./tokens": {
      "types": "./dist/tokens/index.d.ts", 
      "import": "./src/tokens/index.ts",
      "default": "./dist/tokens/index.js"
    },
    "./components": {
      "types": "./dist/components/index.d.ts",
      "import": "./src/components/index.ts", 
      "default": "./dist/components/index.js"
    },
    "./hooks/*": {
      "types": "./dist/hooks/*.d.ts",
      "import": "./src/hooks/*.ts",
      "default": "./dist/hooks/*.js"
    }
  },
  "typesVersions": {
    "*": {
      "providers": ["./dist/providers/index.d.ts"],
      "tokens": ["./dist/tokens/index.d.ts"],
      "components": ["./dist/components/index.d.ts"],
      "hooks/*": ["./dist/hooks/*.d.ts"]
    }
  }
}

// packages/ui/src/providers/index.ts
export { ThemeProvider } from './theme-provider'
export { TooltipProvider } from './tooltip-provider'
export { QueryProvider } from './query-provider'
export type { ThemeProviderProps, TooltipProviderProps } from './types'

// packages/ui/src/tokens/index.ts
export * from './colors'
export * from './spacing'
export * from './typography'
export * from './shadows'
export * from './breakpoints'
export * from './animation'

// 🎯 USAGE IN WEB PACKAGE

// packages/web/src/app/layout.tsx
import * as React from 'react'

import { ThemeProvider } from '@minniewinnie/ui/providers'
import { inter, spaceGrotesk } from '@minniewinnie/ui/tokens'

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

// packages/web/src/components/blog/blog-card.tsx
import * as React from 'react'

import { colors, spacing } from '@minniewinnie/ui/tokens'
import { BaseCard } from '@minniewinnie/ui/components'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

import type { BlogPost } from '@minniewinnie/shared/types'

// ✅ GOOD: Clear package boundaries
/*
Dependency flow:
┌─────────────┐
│     web     │ (app implementation)
└──────┬──────┘
       │ depends on
       ▼
┌─────────────┐     ┌─────────────┐
│     ui      │────▶│   shared    │
└─────────────┘     └─────────────┘
(design system)     (types & utils)

Never:
- web → ui → web (circular)
- ui → web (wrong direction)
- shared → ui or web (shared is foundation)
*/

// 📁 MONOREPO WORKSPACE SETUP

// pnpm-workspace.yaml
packages:
  - 'packages/*'

// packages/web/package.json
{
  "name": "@minniewinnie/web",
  "dependencies": {
    "@minniewinnie/ui": "workspace:*",
    "@minniewinnie/shared": "workspace:*",
    "next": "^14.0.0",
    "react": "^18.2.0"
  }
}

// packages/ui/package.json
{
  "name": "@minniewinnie/ui",
  "dependencies": {
    "@minniewinnie/shared": "workspace:*",
    "react": "^18.2.0"
  },
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  }
}

// packages/shared/package.json
{
  "name": "@minniewinnie/shared",
  "dependencies": {
    "zod": "^3.22.0"
  }
}

// 🚀 ADVANCED: Package-specific TypeScript configs

// packages/ui/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "composite": true,
    "declarationMap": true
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../shared" }
  ]
}

// packages/web/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@minniewinnie/ui/*": ["../ui/src/*"],
      "@minniewinnie/shared/*": ["../shared/src/*"]
    }
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../ui" },
    { "path": "../shared" }
  ]
}

// 🎨 IMPORT PATTERNS BY PACKAGE TYPE

// In UI package - can only import from shared
import { formatDate } from '@minniewinnie/shared/utils'
import type { BaseContent } from '@minniewinnie/shared/types'

// Cannot import from web!
// import { BlogCard } from '@minniewinnie/web/components' // ❌ BAD

// In Web package - can import from ui and shared  
import { ThemeProvider } from '@minniewinnie/ui/providers'
import { colors } from '@minniewinnie/ui/tokens'
import { validateEmail } from '@minniewinnie/shared/validators'
import type { BlogPost } from '@minniewinnie/shared/types'

// In Shared package - standalone, no imports from other packages
// Only external dependencies
import { z } from 'zod'

// 📋 MONOREPO IMPORT RULES:

// 1. Always import from package name, not paths
import { Button } from '@minniewinnie/ui/components' // ✅
import { Button } from '../ui/src/components/button' // ❌

// 2. Respect package boundaries
// web → ui ✅
// web → shared ✅
// ui → shared ✅
// ui → web ❌
// shared → ui ❌
// shared → web ❌

// 3. Use subpath exports
import { colors } from '@minniewinnie/ui/tokens' // ✅
import { colors } from '@minniewinnie/ui' // ❌ if not exported from root

// 4. Type imports work the same way
import type { ThemeConfig } from '@minniewinnie/ui/providers'
import type { ApiResponse } from '@minniewinnie/shared/types'

// 5. Configure build tools for monorepo
// next.config.js
module.exports = {
  transpilePackages: ['@minniewinnie/ui', '@minniewinnie/shared'],
}

// 📝 CHECKLIST:
// ✓ Import from package exports, not src
// ✓ No relative imports across packages
// ✓ Follow dependency direction
// ✓ Use workspace protocol in package.json
// ✓ Configure TypeScript references
// ✓ Set up build tool transpilation
// ✓ Export all public APIs properly
// ✓ Keep internal modules private