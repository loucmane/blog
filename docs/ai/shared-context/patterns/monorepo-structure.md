# Monorepo Structure Pattern

## Overview
This project uses a monorepo structure with pnpm workspaces to maintain clear separation of concerns while enabling code sharing and coordinated deployments.

## Package Organization

### Current Structure
```
blog/
├── packages/
│   ├── ui/          # Design tokens and theme system ONLY
│   ├── web/         # Next.js application + ALL components
│   ├── shared/      # Shared types, utilities, schemas
│   └── backend/     # API and external integrations
```

### Package Responsibilities

#### UI Package (`@minniewinnie/ui`)
**Purpose**: Design system foundation
**Contains**:
- CSS variables and design tokens
- Theme configuration
- Color palettes
- Typography scales
- Spacing systems
- Base providers (ThemeProvider)

**Does NOT Contain**:
- shadcn/ui components
- Implementation components
- Business logic
- Page layouts

#### Web Package (`@minniewinnie/web`)
**Purpose**: Main application implementation
**Contains**:
- All shadcn/ui components
- All custom components
- Page routes and layouts
- Content management
- Application logic
- API route handlers

**Key Directories**:
```
web/src/
├── app/           # Next.js app router
├── components/    # All components (including ui/)
├── lib/          # Utilities and helpers
├── styles/       # Global styles
└── content/      # MDX content files
```

#### Shared Package (`@minniewinnie/shared`)
**Purpose**: Cross-cutting concerns
**Contains**:
- TypeScript types/interfaces
- Validation schemas (Zod)
- Utility functions
- Constants
- Shared business logic

#### Backend Package (`@minniewinnie/backend`)
**Purpose**: External integrations
**Contains**:
- Third-party API integrations
- Database connections
- Authentication logic
- Background jobs
- External services

## Experimentation and Mockup Guidelines

### Dedicated Test Routes
All experimental work should be contained in dedicated routes to keep production code clean:

```
web/src/app/
├── (production)/     # Production routes
│   ├── page.tsx     # Homepage
│   ├── blog/        # Blog section
│   └── about/       # About page
├── test/            # Test pages (excluded from production)
│   └── page.tsx     # Test homepage variations
├── mockup/          # Design mockups and experiments
│   ├── page.tsx     # Main mockup page
│   ├── homepage-v2/ # Alternative homepage design
│   └── blog-card/   # Component experiments
└── experiments/     # Feature experiments
    ├── new-nav/     # Navigation redesign
    └── ai-chat/     # New feature testing
```

### Experimentation Best Practices

#### 1. Route Naming Convention
- `/test/*` - For testing existing features with modifications
- `/mockup/*` - For design explorations and visual experiments
- `/experiments/*` - For new feature development
- `/playground/*` - For component testing in isolation

#### 2. Environment Exclusion
```javascript
// next.config.js
module.exports = {
  // Exclude experimental routes from production builds
  async rewrites() {
    if (process.env.NODE_ENV === 'production') {
      return {
        beforeFiles: [
          {
            source: '/test/:path*',
            destination: '/404',
          },
          {
            source: '/mockup/:path*',
            destination: '/404',
          },
          {
            source: '/experiments/:path*',
            destination: '/404',
          },
        ],
      };
    }
    return [];
  },
};
```

#### 3. Component Organization for Experiments
```
web/src/
├── components/
│   ├── ui/              # Production shadcn/ui components
│   ├── layout/          # Production layout components
│   └── experimental/    # Experimental components
│       ├── NewHero.tsx
│       └── BentoGrid.tsx
```

#### 4. Documentation Requirements
Each experimental route should have a README:
```markdown
# Homepage Mockup V2

## Purpose
Testing new bento grid layout with extreme typography

## Status
In Development - Not for production

## Key Changes
- Bento grid layout system
- Variable font implementation
- Micro-interactions

## Performance Impact
- Bundle size: +15KB
- LCP: 1.1s (within target)
```

### Migration Path
When experiments are ready for production:

1. **Review Performance**: Ensure Lighthouse scores meet targets
2. **Code Review**: Full team review of experimental code
3. **Component Extraction**: Move reusable components to production directories
4. **Route Migration**: Move from `/mockup/feature` to production route
5. **Cleanup**: Remove experimental route and components
6. **Documentation**: Update component documentation

### Example Workflow
```bash
# 1. Create new mockup
cd packages/web/src/app
mkdir -p mockup/modern-blog
touch mockup/modern-blog/page.tsx
touch mockup/modern-blog/README.md

# 2. Develop and iterate
pnpm dev
# Visit http://localhost:3000/mockup/modern-blog

# 3. When ready for production
# Move components to production locations
# Update imports
# Remove mockup directory
```

## Workspace Configuration

### pnpm-workspace.yaml
```yaml
packages:
  - 'packages/*'
```

### Package Dependencies
```json
// packages/web/package.json
{
  "dependencies": {
    "@minniewinnie/ui": "workspace:*",
    "@minniewinnie/shared": "workspace:*"
  }
}
```

## Development Patterns

### 1. Import Hierarchy
```typescript
// ✅ Correct imports in web package
import { Button } from '@/components/ui/button'      // shadcn component
import { theme } from '@minniewinnie/ui'            // theme from ui package
import { ContentType } from '@minniewinnie/shared'  // types from shared

// ❌ Wrong imports
import { Button } from '@minniewinnie/ui'  // No components in ui package!
```

### 2. Component Organization
All components live in the web package:
```
web/src/components/
├── ui/               # shadcn/ui components (copy-pasted)
│   ├── button.tsx
│   ├── card.tsx
│   └── dialog.tsx
├── layout/          # Layout components
│   ├── header.tsx
│   └── footer.tsx
├── features/        # Feature-specific components
│   ├── donation/
│   └── blog/
└── experimental/    # Experimental components (not in production)
    └── mockup/
```

### 3. Style Management
```typescript
// packages/ui/src/styles/tokens.css
:root {
  --color-primary: ...;
  --spacing-unit: ...;
}

// packages/web/src/app/globals.css
@import '@minniewinnie/ui/styles/tokens.css';
/* Application-specific styles */
```

### 4. Type Sharing
```typescript
// packages/shared/src/types/content.ts
export interface BlogPost {
  id: string;
  title: string;
  classification: 1 | 2 | 3;
}

// packages/web/src/app/blog/[slug]/page.tsx
import { BlogPost } from '@minniewinnie/shared';
```

## Commands and Workflows

### Installation
```bash
# Install all dependencies
pnpm install

# Add package to specific workspace
pnpm add react --filter @minniewinnie/web

# Add workspace dependency
pnpm add @minniewinnie/ui --workspace --filter @minniewinnie/web
```

### Development
```bash
# Run all packages
pnpm dev

# Run specific package
pnpm --filter @minniewinnie/web dev

# Build all packages
pnpm build

# Type check all
pnpm typecheck
```

### Adding shadcn/ui Components
```bash
# ALWAYS run from web package directory
cd packages/web
pnpm dlx shadcn@latest add button card

# Components go to packages/web/src/components/ui/
```

## Best Practices

### 1. Clear Boundaries
- Each package has ONE clear responsibility
- No circular dependencies
- Minimal cross-package imports

### 2. Deployment Independence
- Web package can deploy without backend
- UI package changes don't require app redeploy
- Shared package is compile-time only

### 3. Version Management
- Use workspace protocol for internal packages
- Keep external dependencies aligned
- Regular dependency updates

### 4. Testing Strategy
- Unit tests in each package
- Integration tests in web package
- E2E tests cover full flow

## Common Pitfalls

### ❌ Don't: Mix Responsibilities
```typescript
// Bad: Component in UI package
// packages/ui/src/Button.tsx
export const Button = () => { ... }
```

### ❌ Don't: Create Circular Dependencies
```typescript
// Bad: UI imports from Web
// packages/ui/src/theme.ts
import { config } from '@minniewinnie/web'
```

### ❌ Don't: Share Node Modules
```bash
# Bad: Installing at root
npm install react  # Should use pnpm workspace commands
```

### ❌ Don't: Put Experiments in Production Routes
```typescript
// Bad: Experimental code in main page
// packages/web/src/app/page.tsx
import { ExperimentalHero } from '@/components/experimental/Hero'
```

### ✅ Do: Maintain Clear Imports
```typescript
// Good: Clear package boundaries
import { theme } from '@minniewinnie/ui'
import { Button } from '@/components/ui/button'
import { validateContent } from '@minniewinnie/shared'
```

### ✅ Do: Keep Experiments Isolated
```typescript
// Good: Experimental work in dedicated route
// packages/web/src/app/mockup/new-design/page.tsx
import { ExperimentalHero } from '@/components/experimental/Hero'
```

## Migration Guidelines

When refactoring or adding features:
1. Identify the correct package
2. Check for existing patterns
3. Maintain consistent structure
4. Update imports across packages
5. Test all affected packages
6. Update documentation