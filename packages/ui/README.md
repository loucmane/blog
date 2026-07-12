# @minniewinnie/ui

The foundational UI package for the Animal Protection Foundation blog. This package contains design tokens, theme configurations, and base components that ensure consistent styling across all applications.

## ✅ Current Status

**Fully Migrated and Operational**

All design system components have been successfully migrated from the web package:

- Design tokens (colors, typography, spacing, animations, breakpoints)
- Theme configurations (light, dark, contrast, gentle)
- ThemeProvider with useTheme hook
- ThemeSwitcher component
- Base CSS with CSS custom properties
- Tailwind configuration

## 📦 What's Included

### Design Tokens (`/tokens`)

- **colors.ts**: Teal, yellow, orange, coral color scales + semantic colors
- **typography.ts**: Font families, sizes, weights, line heights
- **spacing.ts**: Consistent spacing scale (0-96)
- **breakpoints.ts**: Responsive breakpoints for all screen sizes
- **animations.ts**: Keyframes and animation presets

### Themes (`/themes`)

- **light.ts**: Default bright theme
- **dark.ts**: Dark mode with deep teal background
- **contrast.ts**: High contrast for accessibility (pure black/white)
- **gentle.ts**: Trauma-sensitive with muted colors

### Providers (`/providers`)

- **ThemeProvider.tsx**: Context provider for theme management
  - Automatic theme detection
  - LocalStorage persistence
  - System preference respect

### Components (`/components`)

- **ThemeSwitcher**: Modern sliding pill UI for theme selection
- **Button**: Base button component (placeholder for future expansion)

### Hooks (`/hooks`)

- **useTheme**: Access current theme and toggle function
- **useMediaQuery**: Responsive design helper

## 🚀 Usage

```typescript
// Import design tokens
import { colors, typography, spacing } from '@minniewinnie/ui/tokens'

// Import themes
import { lightTheme, darkTheme } from '@minniewinnie/ui/themes'

// Import providers
import { ThemeProvider } from '@minniewinnie/ui/providers'

// Import components
import { ThemeSwitcher } from '@minniewinnie/ui/components'

// Import hooks
import { useTheme } from '@minniewinnie/ui/hooks'

// Import Tailwind config
import baseConfig from '@minniewinnie/ui/tailwind'
```

## 🎨 Theme System

The theme system supports four distinct themes:

1. **Light (default)**: Clean, bright interface
2. **Dark**: Deep teal background for reduced eye strain
3. **Contrast**: High contrast for accessibility needs
4. **Gentle**: Trauma-sensitive with muted colors for sensitive content

## 🛠️ Development

This package exports TypeScript source files directly, allowing the consuming applications to handle compilation. This ensures maximum flexibility and tree-shaking capabilities.

## 📝 Important Notes

- This package contains **foundation elements only**
- All shadcn/ui components should be added to the web package
- Design tokens are the single source of truth for the design system
- All themes support WCAG AA compliance for accessibility
