# Import/Export Conventions

> **Confidence**: 89% | **Adoption**: High | **Priority**: Critical

## Overview

This guide documents import/export patterns that ensure clean, maintainable code. These conventions maintain an 89% confidence rate and are critical for monorepo success.

## Table of Contents

1. [Import Organization](#import-organization)
2. [Path Aliases](#path-aliases)
3. [Export Patterns](#export-patterns)
4. [Monorepo Imports](#monorepo-imports)
5. [Dynamic Imports](#dynamic-imports)
6. [Type Imports](#type-imports)

## Import Organization

### Standard Import Order (94% confidence)

Imports MUST follow this specific order with blank lines between groups:

```typescript
// 1. React and Next.js core imports
import * as React from 'react'
import { useEffect, useState } from 'react'
import { Metadata } from 'next'
import dynamic from 'next/dynamic'

// 2. External package imports
import { motion } from 'framer-motion'
import { z } from 'zod'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { ChevronRight, X, Menu } from 'lucide-react'

// 3. Internal package imports (monorepo packages)
import { ThemeProvider } from '@minniewinnie/ui/providers'
import { colors, spacing } from '@minniewinnie/ui/tokens'
import type { SharedTypes } from '@minniewinnie/shared'

// 4. Alias imports (local imports using @)
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

// 5. Relative imports (same directory only)
import { buttonVariants } from './button-variants'
import { CardContent } from './card-content'

// 6. Type imports (if separate)
import type { BlogPost, Author } from '@/types'
import type { ButtonProps } from './types'
```

### Why This Order?

1. **Predictability**: Developers know where to look
2. **Dependency clarity**: External deps clearly separated
3. **Git diffs**: Fewer conflicts when adding imports
4. **Readability**: Logical flow from external to internal

### Import Rules

```typescript
// ✅ GOOD: Named imports
import { Button, buttonVariants } from '@/components/ui/button'

// ❌ BAD: Default imports for internal code
import Button from '@/components/ui/button'

// ✅ GOOD: Namespace import for React
import * as React from 'react'

// ❌ BAD: Mixed import styles
import React, { useState } from 'react'  // Inconsistent

// ✅ GOOD: Grouped imports from same package
import { Home, User, Settings, ChevronRight } from 'lucide-react'

// ❌ BAD: Multiple imports from same package
import { Home } from 'lucide-react'
import { User } from 'lucide-react'
```

## Path Aliases

### The @ Alias Pattern (96% confidence)

The codebase uses `@/` as the standard alias for the `src` directory:

#### Configuration - tsconfig.json
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Path Alias Rules

1. **Use @/ for all src imports** - Consistency
2. **No relative imports across directories** - Use alias
3. **Relative imports only within same directory** - Clear scope
4. **Absolute imports for node_modules** - Standard
5. **Package imports for monorepo** - Clear boundaries

### ✅ Good Examples
```typescript
// Cross-directory imports use @
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import type { BlogPost } from '@/types'

// Same directory uses relative
import { CardHeader } from './card-header'
import { cardStyles } from './styles'

// Monorepo packages use package name
import { ThemeProvider } from '@minniewinnie/ui'
```

### ❌ Bad Examples
```typescript
// Don't use relative paths across directories
import { Button } from '../../../components/ui/button'

// Don't use absolute paths without alias
import { Button } from 'src/components/ui/button'

// Don't import from package src
import { colors } from '@minniewinnie/ui/src/tokens/colors'
```

## Export Patterns

### Named Exports Only (91% confidence)

The codebase strongly prefers named exports:

#### ✅ Good Examples
```typescript
// components/ui/button.tsx
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(...)
export const buttonVariants = cva(...)
export type { ButtonProps }

// Usage
import { Button, buttonVariants, type ButtonProps } from '@/components/ui/button'
```

#### ❌ Bad Examples
```typescript
// Avoid default exports
export default Button  // Bad

// Avoid mixing default and named
export default Button
export { buttonVariants }  // Confusing
```

### Component Export Pattern

```typescript
// 1. Define component
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    // Implementation
  }
)
Button.displayName = 'Button'

// 2. Export component and related items together
export { Button, buttonVariants }
export type { ButtonProps }
```

### Barrel Exports (91% confidence)

Use barrel exports for type collections, not components:

#### ✅ Good - types/index.ts
```typescript
// Aggregate type exports
export * from './content'
export * from './donor'
export * from './emergency'
export * from './analytics'

// Define utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
```

#### ❌ Bad - Don't barrel export components
```typescript
// components/ui/index.ts - AVOID THIS
export * from './button'
export * from './card'
export * from './dialog'
```

### Export Rules

1. **Named exports only** - No default exports
2. **Export component + variants** together
3. **Export types separately** with `export type`
4. **Barrel exports for types** only
5. **No barrel exports for components** - Direct imports

## Monorepo Imports

### Package Import Pattern (88% confidence)

Import from package names, not file paths:

#### ✅ Good Examples
```typescript
// Import from package exports
import { ThemeProvider } from '@minniewinnie/ui/providers'
import { colors, spacing } from '@minniewinnie/ui/tokens'
import type { BaseContent } from '@minniewinnie/shared/types'

// Package.json exports configuration
{
  "exports": {
    "./providers": "./src/providers/index.ts",
    "./tokens": "./src/tokens/index.ts",
    "./hooks/*": "./src/hooks/*.ts"
  }
}
```

#### ❌ Bad Examples
```typescript
// Never import from src directory
import { colors } from '@minniewinnie/ui/src/tokens/colors'

// Never use relative paths to other packages
import { ThemeProvider } from '../../../packages/ui/src/providers'

// Never reach into package internals
import { internalHelper } from '@minniewinnie/ui/src/utils/internal'
```

### Monorepo Import Rules

1. **Import from package name** - Clear boundaries
2. **Use subpath exports** - Organized imports
3. **Types from shared package** - Single source
4. **UI tokens from ui package** - Design system
5. **Never import from src** - Use exports only

## Dynamic Imports

### Code Splitting Pattern (84% confidence)

Use Next.js dynamic imports for optimization:

#### ✅ Good Examples
```typescript
// Heavy component with loading state
const DonorDashboard = dynamic(
  () => import('@/components/donor/dashboard'),
  {
    loading: () => <DashboardSkeleton />,
    ssr: false // Client-only component
  }
)

// Lazy load third-party libraries
const ReactQuill = dynamic(
  () => import('react-quill'),
  { ssr: false }
)

// Code splitting by route
const EmergencyAppealForm = dynamic(
  () => import('@/components/emergency/appeal-form')
)
```

### Dynamic Import Rules

1. **Use for heavy components** - Performance
2. **Provide loading states** - UX
3. **Disable SSR when needed** - Client-only
4. **Route-based splitting** - Automatic
5. **Preload critical imports** - Performance

## Type Imports

### Explicit Type Imports (87% confidence)

Use explicit type imports for clarity and tree-shaking:

#### ✅ Good Examples
```typescript
// Separate type import
import type { Metadata } from 'next'
import type { BlogPost, Author } from '@/types'

// Inline type import for mixed imports
import { cva, type VariantProps } from 'class-variance-authority'
import { Button, type ButtonProps } from '@/components/ui/button'

// Type-only file import
import type * as Types from '@/types'
```

#### Type Import Decision Tree

```typescript
// If importing ONLY types → use separate import type
import type { BlogPost } from '@/types'

// If importing values AND types → use inline type
import { Button, type ButtonProps } from '@/components/ui/button'

// If unsure → use separate imports
import { Button } from '@/components/ui/button'
import type { ButtonProps } from '@/components/ui/button'
```

### Type Import Rules

1. **Use `import type`** for type-only imports
2. **Inline type imports** for mixed imports
3. **Separate when clearer** - Readability first
4. **Helps tree-shaking** - Smaller bundles
5. **Consistent within file** - Pick a style

## Import/Export Quick Reference

### Import Checklist

- [ ] Imports ordered correctly? (React → External → Internal → Alias → Relative → Types)
- [ ] Blank lines between groups?
- [ ] Using @ alias for src imports?
- [ ] No relative imports across directories?
- [ ] Named imports used?
- [ ] Type imports explicit?
- [ ] Monorepo imports from package name?
- [ ] No circular dependencies?

### Export Checklist

- [ ] Named exports only?
- [ ] Component + variants exported together?
- [ ] Types exported with `export type`?
- [ ] Display name set for components?
- [ ] No default exports?
- [ ] Barrel exports only for types?

## Common Import/Export Mistakes

1. **Wrong import order** - Follow the 6-group pattern
2. **Missing blank lines** - Separate import groups
3. **Default exports** - Use named exports
4. **Relative path spaghetti** - Use @ alias
5. **Importing from package src** - Use exports
6. **Mixed import styles** - Be consistent
7. **Circular dependencies** - Restructure code
8. **Missing type imports** - Use `import type`

## ESLint Configuration

Configure ESLint to enforce these patterns:

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'import/order': ['error', {
      groups: [
        ['builtin', 'external'],
        'internal',
        'parent',
        'sibling',
        'index',
        'type'
      ],
      'newlines-between': 'always',
      pathGroups: [
        {
          pattern: 'react',
          group: 'builtin',
          position: 'before'
        },
        {
          pattern: '@minniewinnie/**',
          group: 'internal',
          position: 'before'
        },
        {
          pattern: '@/**',
          group: 'internal'
        }
      ]
    }],
    'import/no-default-export': 'error',
    '@typescript-eslint/consistent-type-imports': 'error'
  }
}
```

## Next Steps

- Review [Error Handling Conventions](./05-error-handling-conventions.md)
- Learn about [Testing Conventions](./06-testing-conventions.md)
- Understand [State Management Conventions](./07-state-management-conventions.md)