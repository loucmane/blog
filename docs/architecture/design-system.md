# Design System Architecture

## Overview

This document explains our monorepo design system architecture, the role of the UI package, and how shadcn/ui and Radix UI components fit into the structure.

## Package Structure

```
blog/
├── packages/
│   ├── ui/                    # Shared design system foundation
│   │   ├── src/
│   │   │   ├── tokens/        # Design tokens (colors, spacing, typography)
│   │   │   ├── themes/        # Theme configurations (light, dark, contrast, gentle)
│   │   │   ├── providers/     # ThemeProvider for theme management
│   │   │   ├── hooks/         # Shared hooks (useTheme, useMediaQuery)
│   │   │   ├── styles/        # Base CSS with custom properties
│   │   │   └── components/    # Only truly shared, custom components
│   │   └── tailwind.config.ts # Base Tailwind configuration
│   │
│   └── web/                   # Next.js application
│       ├── src/
│       │   ├── components/    # App-specific components
│       │   │   ├── ui/        # shadcn/ui components (copied here)
│       │   │   └── ...        # Other app components
│       │   └── app/           # Next.js app directory
│       └── tailwind.config.js # Extends UI package config
```

## UI Package - Design System Foundation

The UI package provides the **foundation layer** for our design system:

### What Goes in UI Package

1. **Design Tokens** (`src/tokens/`)
   - Colors: Brand scales (teal, yellow, orange, coral) and semantic colors
   - Typography: Font families, sizes, weights, line heights
   - Spacing: Consistent spacing scale based on 4px units
   - Breakpoints: Responsive design breakpoints
   - Animations: Reusable animation presets

2. **Theme System** (`src/themes/`)
   - Light theme (default)
   - Dark theme (deep teal background)
   - High contrast theme (accessibility)
   - Gentle theme (trauma-informed design)

3. **Core Providers & Hooks**
   - `ThemeProvider`: Manages theme state and system preferences
   - `useTheme`: Hook for accessing and changing themes
   - `useMediaQuery`: Responsive design utilities

4. **Base Styles** (`src/styles/base.css`)
   - CSS custom properties for all theme variations
   - Tailwind base directives

5. **Minimal Components**
   - Only components that are truly custom and shared
   - Not shadcn/ui components (those go in the web package)

### What Does NOT Go in UI Package

- shadcn/ui components
- App-specific components
- Business logic
- Page layouts
- API integrations

## Web Package - Application Layer

The web package is where the actual Next.js application lives:

### shadcn/ui Integration

```
web/src/components/
├── ui/                    # shadcn/ui components
│   ├── button.tsx        # Copied from shadcn/ui
│   ├── card.tsx          # Uses our design tokens
│   ├── dialog.tsx        # Built on Radix UI
│   └── ...               # Other shadcn components
└── ...                   # App-specific components
```

**Key Points:**
- shadcn/ui components are **copied** into your project, not installed
- They use Radix UI primitives for behavior
- They use Tailwind classes that reference our design tokens
- You customize them directly in your codebase

## How It All Works Together

### 1. Design Token Flow
```
UI Package tokens → Tailwind config → CSS classes → shadcn/ui components
```

### 2. Theme Integration
```typescript
// In web package
import { ThemeProvider } from '@legendary-test/ui'

// shadcn/ui components automatically use theme colors via Tailwind
<Button className="bg-primary text-primary-foreground" />
// 'primary' comes from our UI package tokens!
```

### 3. Import Examples

```typescript
// From UI package (foundation)
import { ThemeProvider, useTheme, colors } from '@legendary-test/ui'
import '@legendary-test/ui/styles' // Base CSS

// From web package (shadcn/ui components)
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
```

## Why This Architecture?

1. **Separation of Concerns**
   - UI package: Design system foundation (tokens, themes)
   - Web package: Application implementation (components, pages)

2. **shadcn/ui Philosophy**
   - Components are meant to be customized
   - You own the code, not hidden in node_modules
   - Perfect for project-specific tweaks

3. **Scalability**
   - Add more apps (admin, mobile) that share the same design tokens
   - Each app can have its own shadcn/ui customizations
   - Single source of truth for design decisions

4. **Developer Experience**
   - Type-safe design tokens
   - Consistent theming across all apps
   - Easy to customize shadcn/ui components

## Migration Status

### ✅ Completed
- [x] Phase 1: UI package infrastructure setup
- [x] Phase 2: Design tokens and theme system migrated
- [x] Fixed CommonJS/ESM compatibility (TypeScript Tailwind config)

### 🔄 Next Steps
- [ ] Phase 3: Update UI package exports
- [ ] Phase 4: Test imports in web package
- [ ] Phase 5: Remove duplicates from web package
- [ ] Install and configure shadcn/ui in web package

## Key Commands

```bash
# In UI package
pnpm build          # Build the UI package
pnpm dev           # Watch mode for development

# In web package
pnpm dev           # Run Next.js app
npx shadcn-ui add  # Add shadcn/ui components
```

## Best Practices

1. **Design Tokens First**: Always define new colors/spacing in UI package tokens
2. **Theme Consistency**: Use CSS custom properties for theme-aware values
3. **Component Ownership**: shadcn/ui components live in web package for customization
4. **Type Safety**: Leverage TypeScript for design tokens and theme types