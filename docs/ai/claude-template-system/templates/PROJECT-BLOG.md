# Animal Protection Foundation Blog - Project Configuration

This document contains all project-specific configurations, requirements, and standards for the Animal Protection Foundation Blog.

## 🎯 Quick Navigation

- **[Core Mission](#core-mission)** - Project purpose and goals
- **[Tech Stack](#tech-stack)** - Current versions and dependencies
- **[Performance Standards](#performance-standards)** - Target metrics
- **[Architecture](#architecture)** - Monorepo structure and decisions
- **[Content Sensitivity](#content-sensitivity-framework)** - Three-tier system
- **[Theme Requirements](#theme-requirements)** - Four-theme system
- **[Package Structure](#package-structure)** - How packages work together
- **[Development Rules](#development-rules)** - Project-specific guidelines

## Core Mission

High-performance platform for sharing rescue stories and field updates from global animal welfare work.

### Key Goals
- Share rescue stories effectively
- Provide field updates in real-time
- Ensure global accessibility
- Maintain high performance in crisis regions
- Create emotional connection without exploitation

### Performance Target
**98+ Lighthouse scores** for global accessibility in crisis regions with limited connectivity.

## Tech Stack

```json
{
  "framework": "next@15.3.3",
  "ui": "react@19.1.0",
  "language": "typescript@5.8.3",
  "styling": "tailwindcss@3.4.17",
  "packageManager": "pnpm@9.15.2",
  "deployment": "vercel",
  "testing": "jest + react-testing-library",
  "e2e": "playwright"
}
```

### Key Technology Choices
- **Next.js 15**: App Router, Server Components, Server Actions
- **React 19**: Use hooks, concurrent features
- **TypeScript**: Strict mode enabled
- **Tailwind CSS**: Utility-first with custom design tokens
- **PNPM**: Workspace management for monorepo

## Performance Standards

### Target Metrics
```yaml
Lighthouse Scores:
  Performance: 98+
  Accessibility: 100
  Best Practices: 100
  SEO: 100

Core Web Vitals:
  LCP: < 2.5s (Largest Contentful Paint)
  FID: < 100ms (First Input Delay)
  CLS: < 0.1 (Cumulative Layout Shift)
  INP: < 200ms (Interaction to Next Paint)
```

### Bundle Size Limits
```yaml
JavaScript Budget:
  Initial: < 100KB
  Total: < 300KB
  Per Route: < 50KB

Asset Optimization:
  Images: WebP/AVIF with fallbacks
  Fonts: Variable fonts, subset
  CSS: < 50KB initial
```

### Performance Implementation
- Static Site Generation (SSG) by default
- Progressive enhancement
- Code splitting at route level
- Dynamic imports for heavy components
- Image optimization with next/image
- Font optimization with next/font

## Architecture

### Monorepo Structure
```
blog/
├── apps/
│   └── web/          # Next.js application
├── packages/
│   ├── ui/           # Design tokens only
│   ├── shared/       # Types, schemas, utils
│   └── backend/      # External integrations
└── [config files]
```

### Why Monorepo?
- **Code Sharing**: Design tokens and types shared across all packages
- **Clear Boundaries**: Each package has one responsibility
- **Independent Deployment**: Can deploy web without touching API
- **Type Safety**: Shared types ensure consistency

### Package Responsibilities

#### UI Package (Foundation Only)
- Design tokens (colors, typography, spacing)
- Theme configurations
- Base providers
- **NO components** (not even shadcn/ui)

#### Web Package (Implementation)
- All UI components (including shadcn/ui)
- All page routes
- App-specific logic
- Content management
- API routes (if needed)

#### Shared Package
- TypeScript types and interfaces
- Zod schemas
- Utility functions
- Constants
- Business logic helpers

#### Backend Package
- External API integrations
- Database connections (if added)
- Third-party service wrappers
- Keeps web package pure SSG

## Content Sensitivity Framework

### Three-Tier Classification System

#### Tier 1: Uplifting (Default)
- Success stories
- Happy outcomes
- Educational content
- Community achievements
- Recovery progress

#### Tier 2: Reality (Opt-in)
- Medical procedures
- Rescue operations
- Field challenges
- Before/after comparisons
- Fundraising needs

#### Tier 3: Awareness (Explicit Opt-in)
- Severe cases
- Abuse documentation
- Crisis situations
- Legal evidence
- Advocacy material

### Implementation
```typescript
// Content component with sensitivity
<StoryCard 
  tier={2}
  warning="Contains medical imagery"
  blurPreview={true}
>
  {/* Content */}
</StoryCard>

// User preference
interface UserPreferences {
  maxContentTier: 1 | 2 | 3  // Default: 1
  autoPlayVideos: boolean    // Default: false
  showWarnings: boolean      // Default: true
}
```

## Theme Requirements

### Four-Theme System

#### 1. Hope (Light Default)
```yaml
Primary: Warm green (#10B981)
Background: Soft cream (#FEFCE8)
Mood: Optimistic, growth, healing
Use: Success stories, adoptions
```

#### 2. Compassion (Light Alternative)
```yaml
Primary: Gentle blue (#3B82F6)
Background: Pure white (#FFFFFF)
Mood: Trust, care, support
Use: Medical updates, care guides
```

#### 3. Sanctuary (Dark Comfort)
```yaml
Primary: Soft amber (#F59E0B)
Background: Warm dark (#1F1F1F)
Mood: Safety, warmth, rest
Use: Evening reading, comfort mode
```

#### 4. Wild (Dark Nature)
```yaml
Primary: Forest green (#059669)
Background: Deep earth (#0A0A0A)
Mood: Natural, authentic, strong
Use: Field reports, wildlife stories
```

### Theme Implementation
- CSS custom properties for instant switching
- Persistent user preference
- Respect system preference
- Smooth transitions
- Full component support

## Package Structure

### Import Rules
```typescript
// ✅ CORRECT: Import from packages
import { colors } from '@repo/ui/tokens'
import { AnimalType } from '@repo/shared/types'
import { fetchRescueStories } from '@repo/backend/api'

// ❌ WRONG: Cross-package imports
import { Button } from '@repo/ui/components' // ui has no components!
import { api } from '../../../packages/backend' // Use package imports
```

### File Organization
```
apps/web/
├── app/                 # Next.js app directory
│   ├── (public)/       # Public routes
│   ├── (admin)/        # Admin routes  
│   └── api/            # API routes
├── components/         # All UI components
│   ├── ui/            # shadcn/ui components
│   └── features/      # Feature components
├── lib/               # Utilities
└── public/            # Static assets

packages/ui/
├── tokens/            # Design tokens
├── themes/            # Theme configurations
└── providers/         # Theme provider

packages/shared/
├── types/             # TypeScript types
├── schemas/           # Zod schemas
└── utils/             # Shared utilities
```

## Development Rules

### 1. Component Development
- All components in `apps/web/components`
- Track shadcn/ui in `/docs/development/shadcn-components.md`
- Follow 44px minimum touch target
- Always include keyboard navigation
- Test all four themes

### 2. Performance First
- Measure before optimizing
- Static generation default
- Dynamic only when necessary
- Lazy load below the fold
- Optimize images always

### 3. Content Guidelines
- Default to Tier 1 content
- Clear warnings for Tier 2+
- Respect user preferences
- Provide content alternatives
- Never autoplay sensitive content

### 4. Testing Requirements
```bash
# Before committing
pnpm test          # Unit tests
pnpm test:e2e      # E2E tests
pnpm lint          # ESLint
pnpm typecheck     # TypeScript
pnpm build         # Production build
```

### 5. Accessibility Mandate
- WCAG 2.1 AA minimum
- Screen reader testing
- Keyboard navigation complete
- Color contrast compliance
- Focus indicators visible

## Project-Specific Commands

### Development
```bash
pnpm dev           # Start dev server
pnpm build         # Production build
pnpm preview       # Preview production
pnpm analyze       # Bundle analysis
```

### Testing
```bash
# Unit & Integration Tests
pnpm test                  # Run all tests
pnpm test:unit            # Unit tests only
pnpm test:watch           # Watch mode for development
pnpm test:coverage        # Generate coverage report

# E2E Testing
pnpm test:e2e             # Run Playwright tests
pnpm test:e2e:ui          # Open Playwright UI
pnpm test:e2e:headed      # Run tests with browser visible

# Specialized Testing
pnpm test:a11y            # Accessibility audit
pnpm lighthouse           # Performance test (Lighthouse)
pnpm test:components      # Component tests only

# Quick Testing During Development
pnpm dev                  # Start dev server (http://localhost:3000)
pnpm build && pnpm start  # Test production build locally
pnpm type-check           # TypeScript validation
pnpm lint                 # ESLint check
pnpm lint:fix            # Auto-fix linting issues
```

### Testing Checkpoints Commands
When AI presents testing checkpoints, these are the typical commands:

```bash
# 1. Start the development server
pnpm dev

# 2. Run specific component tests
pnpm test Header         # Test specific component
pnpm test:watch Header   # Watch mode for iterative testing

# 3. Check accessibility
pnpm test:a11y components/Header.tsx

# 4. Verify mobile responsiveness
# Open http://localhost:3000 and use browser DevTools
# Or use responsive mode (Ctrl+Shift+M in Chrome/Firefox)

# 5. Test with screen readers
# Windows: NVDA (free) or JAWS
# Mac: VoiceOver (built-in, Cmd+F5)
# Linux: Orca

# 6. Performance check for new components
pnpm lighthouse --only-categories=performance
```

### Deployment
```bash
pnpm deploy:preview       # Preview deployment
pnpm deploy:production    # Production deployment
```

## Integration Points

### Analytics (Privacy-First)
- Plausible or Umami
- No cookies required
- GDPR compliant
- Performance impact < 1KB

### CMS Integration
- Markdown/MDX for content
- Git-based workflow
- Or headless CMS (Sanity/Contentful)
- Static regeneration for updates

### Donation Integration
- Stripe for payments
- Multiple currency support
- Recurring donations
- Transparent reporting

## Success Metrics

### Technical
- 98+ Lighthouse scores maintained
- < 3s page load globally
- Zero runtime errors
- 100% uptime

### User Experience
- Clear content warnings working
- Theme preference persistence
- Smooth navigation
- Fast interaction response

### Content
- Stories published regularly
- Engagement without exploitation
- Community growth
- Positive feedback

## Future Considerations

### Planned Features
- [ ] Multi-language support
- [ ] Offline reading mode
- [ ] Native app wrapper
- [ ] Advanced search
- [ ] Community features

### Technical Debt
- [ ] Migration to App Router (if using Pages)
- [ ] Component documentation
- [ ] Visual regression testing
- [ ] Performance monitoring
- [ ] Error tracking

## 📚 See Also

### Template System Files
- **[CLAUDE-NEW.md](CLAUDE-NEW.md)** - Quick navigation hub
- **[WORKFLOWS.md](WORKFLOWS.md)** - Universal workflow patterns
- **[TOOLS.md](TOOLS.md)** - Tool configurations
- **[CONVENTIONS.md](CONVENTIONS.md)** - Coding standards
- **[BUILDING-BETTER.md](BUILDING-BETTER.md)** - System evolution

### Project Documentation
- **[Performance Standards](/docs/ai/shared-context/standards/performance.md)** - Detailed metrics
- **[Content Sensitivity Framework](/docs/ai/shared-context/philosophies/content-sensitivity.md)** - Full framework
- **[Four Theme System](/docs/ai/shared-context/themes/four-themes.md)** - Complete theme specs
- **[Monorepo Structure](/docs/ai/shared-context/patterns/monorepo-structure.md)** - Architecture details

---

This project configuration is specifically tailored for the Animal Protection Foundation Blog. All decisions prioritize performance, accessibility, and ethical content presentation.