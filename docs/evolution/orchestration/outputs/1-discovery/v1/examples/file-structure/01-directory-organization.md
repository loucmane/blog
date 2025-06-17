# Directory Organization Examples

## ❌ BAD: Flat, unorganized structure

```
src/
├── Button.tsx
├── button.css
├── Card.tsx
├── card-styles.js
├── userApi.ts
├── postApi.js
├── Header.jsx
├── footer.tsx
├── helpers.ts
├── utils.js
├── types.ts
├── UserProfile.tsx
├── user-types.ts
└── index.js
```

**Problems:**
- Mixed file extensions (.ts, .js, .tsx, .jsx)
- No clear organization
- Styles mixed with components
- API calls scattered
- Inconsistent naming

## ❌ BAD: Over-nested structure

```
src/
└── components/
    └── ui/
        └── buttons/
            └── primary/
                └── large/
                    └── PrimaryLargeButton.tsx
        └── cards/
            └── content/
                └── blog/
                    └── BlogContentCard.tsx
```

**Problems:**
- Too many levels of nesting
- Hard to navigate
- Overly specific folders

## ✅ GOOD: Feature-based organization

```
packages/web/src/
├── app/                          # Next.js 13+ App Router
│   ├── (auth)/                  # Route group for auth pages
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── (marketing)/             # Route group for marketing
│   │   ├── layout.tsx          # Shared marketing layout
│   │   └── page.tsx            # Home page
│   ├── blog/
│   │   ├── [slug]/
│   │   │   ├── page.tsx        # Dynamic blog post page
│   │   │   └── loading.tsx     # Loading state
│   │   ├── page.tsx            # Blog listing
│   │   ├── layout.tsx          # Blog layout
│   │   └── error.tsx           # Error boundary
│   ├── rescue-stories/
│   │   ├── [id]/
│   │   │   └── page.tsx
│   │   └── page.tsx
│   ├── emergency/
│   │   ├── appeal/
│   │   │   └── page.tsx
│   │   └── page.tsx
│   ├── layout.tsx               # Root layout
│   ├── error.tsx                # Root error boundary
│   ├── not-found.tsx            # 404 page
│   └── globals.css              # Global styles
│
├── components/
│   ├── ui/                      # ONLY shadcn/ui components
│   │   ├── alert-dialog.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   ├── skeleton.tsx
│   │   ├── toast.tsx
│   │   ├── toaster.tsx
│   │   └── tooltip.tsx
│   │
│   ├── layout/                  # App layout components
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   ├── mobile-nav.tsx
│   │   └── nav-menu.tsx
│   │
│   ├── blog/                    # Blog-specific components
│   │   ├── blog-card.tsx
│   │   ├── blog-list.tsx
│   │   ├── blog-filters.tsx
│   │   └── author-bio.tsx
│   │
│   ├── rescue/                  # Rescue story components
│   │   ├── rescue-card.tsx
│   │   ├── rescue-gallery.tsx
│   │   ├── rescue-timeline.tsx
│   │   └── rescue-stats.tsx
│   │
│   ├── emergency/               # Emergency appeal components
│   │   ├── appeal-card.tsx
│   │   ├── donation-progress.tsx
│   │   ├── urgency-badge.tsx
│   │   └── share-buttons.tsx
│   │
│   └── shared/                  # Shared components
│       ├── content-warning.tsx
│       ├── image-gallery.tsx
│       ├── loading-spinner.tsx
│       └── error-message.tsx
│
├── hooks/                       # Custom React hooks
│   ├── use-toast.ts
│   ├── use-local-storage.ts
│   ├── use-media-query.ts
│   └── use-intersection-observer.ts
│
├── lib/                         # Utilities and helpers
│   ├── utils.ts                # General utilities
│   ├── api.ts                  # API client setup
│   ├── errors.ts               # Error classes
│   └── validators.ts           # Validation schemas
│
├── services/                    # API service layer
│   ├── blog.service.ts
│   ├── rescue.service.ts
│   ├── emergency.service.ts
│   └── analytics.service.ts
│
├── types/                       # TypeScript types
│   ├── index.ts                # Barrel export
│   ├── content.ts              # Content types
│   ├── donor.ts                # Donor types
│   ├── emergency.ts            # Emergency types
│   ├── trauma-informed.ts      # Sensitivity types
│   ├── analytics.ts            # Analytics types
│   └── ui.ts                   # UI prop types
│
├── config/                      # Configuration
│   ├── site.ts                 # Site metadata
│   ├── navigation.ts           # Nav structure
│   └── themes.ts               # Theme config
│
└── styles/                      # Additional styles
    └── animations.css          # Custom animations
```

## 🎯 MIGRATION GUIDE: From Bad to Good

### Step 1: Create the directory structure
```bash
# Create main directories
mkdir -p src/{app,components,hooks,lib,services,types,config,styles}

# Create component subdirectories
mkdir -p src/components/{ui,layout,blog,rescue,emergency,shared}

# Create app route directories
mkdir -p src/app/{blog,rescue-stories,emergency}
```

### Step 2: Move files to appropriate locations

```bash
# Before
src/Button.tsx → src/components/ui/button.tsx
src/BlogPost.tsx → src/components/blog/blog-card.tsx
src/userApi.ts → src/services/user.service.ts
src/helpers.ts → src/lib/utils.ts

# Rename to follow conventions
mv src/Header.jsx src/components/layout/header.tsx
mv src/footer.tsx src/components/layout/footer.tsx
```

### Step 3: Update imports

```typescript
// Before
import Button from '../../../Button'
import { fetchUser } from '../../userApi'
import { formatDate } from '../helpers'

// After
import { Button } from '@/components/ui/button'
import { userService } from '@/services/user.service'
import { formatDate } from '@/lib/utils'
```

## 📁 DIRECTORY PURPOSE GUIDE

### `/app` - Next.js Routes
- Page components (`page.tsx`)
- Layouts (`layout.tsx`)
- Loading states (`loading.tsx`)
- Error boundaries (`error.tsx`)
- Route-specific components

### `/components/ui` - shadcn/ui ONLY
- Copy-pasted shadcn/ui components
- No custom components here
- Follow shadcn/ui naming exactly

### `/components/[feature]` - Feature Components
- Domain-specific components
- Grouped by feature/domain
- Can import from ui/

### `/hooks` - Custom Hooks
- Reusable React hooks
- Start with `use-`
- Return values and functions

### `/lib` - Utilities
- Pure utility functions
- No React dependencies
- Shared helpers

### `/services` - API Layer
- API calls and data fetching
- Business logic
- External service integration

### `/types` - TypeScript Definitions
- Shared type definitions
- Domain models
- API response types

## 📝 FILE NAMING PATTERNS

```
✅ GOOD                          ❌ BAD
button.tsx                       Button.tsx
use-local-storage.ts            useLocalStorage.ts
blog-card.tsx                   BlogCard.tsx
rescue.service.ts               RescueService.ts
content.ts                      content-types.ts
```

## 🚀 QUICK REFERENCE COMMANDS

```bash
# Find misplaced files
find src -name "*.tsx" -o -name "*.ts" | grep -v -E "(app|components|hooks|lib|services|types|config|styles)/"

# List all UI components
ls src/components/ui/

# Find components outside proper directories
find src/components -name "*.tsx" -maxdepth 1

# Check for mixed file extensions
find src -name "*.js" -o -name "*.jsx"
```