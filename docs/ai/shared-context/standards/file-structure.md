# File Structure Standards

## Project Organization

### Root Structure
```
blog/
├── .taskmaster/        # TaskMaster configuration and tasks
├── docs/               # Project documentation
│   ├── ai/            # AI tool documentation (TWES)
│   ├── architecture/  # System architecture docs
│   ├── design/        # Design specifications
│   └── development/   # Development guides
├── packages/          # Monorepo packages
├── scripts/           # Build and utility scripts
├── .claude.json       # Claude MCP configuration
├── CLAUDE.md         # AI assistant instructions
├── SESSION.md        # Development session log
└── pnpm-workspace.yaml
```

### Package Structure Standards

#### Web Package (`packages/web`)
```
packages/web/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (routes)/          # Production routes
│   │   ├── api/               # API routes
│   │   ├── mockup/            # Design experiments
│   │   ├── test/              # Test pages
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Homepage
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── layout/           # Layout components
│   │   ├── features/         # Feature components
│   │   └── experimental/     # Experimental components
│   ├── lib/                   # Utilities and helpers
│   │   ├── utils.ts          # General utilities
│   │   ├── hooks/            # Custom React hooks
│   │   └── services/         # API services
│   ├── content/              # MDX content files
│   │   ├── blog/            # Blog posts
│   │   ├── pages/           # Static pages
│   │   └── data/            # JSON/YAML data
│   └── types/               # TypeScript types
├── public/                   # Static assets
│   ├── images/              # Image assets
│   ├── fonts/               # Font files
│   └── icons/               # Icon files
└── tests/                   # Test files
    ├── unit/               # Unit tests
    ├── integration/        # Integration tests
    └── e2e/                # End-to-end tests
```

## File Organization Principles

### Component Organization
Components should be organized by feature and complexity:

```
components/
├── ui/                    # shadcn/ui components (shared primitives)
├── layout/               # Layout components (Header, Footer, etc.)
├── features/             # Feature-specific components
└── experimental/         # Work-in-progress components
```

### Route Organization (App Router)
Routes should follow Next.js conventions with clear grouping:

```
app/
├── (marketing)/          # Public pages (grouped route)
├── (protected)/          # Auth-required pages
├── blog/                 # Blog feature
├── api/                  # API routes
└── mockup/              # Design experiments
```

### Feature-Based Structure
Each feature should be self-contained:

```
features/blog/
├── components/          # Feature components
├── hooks/              # Feature hooks
├── utils/              # Feature utilities
├── types/              # Feature types
└── api/                # Feature API calls
```

For detailed naming conventions and import patterns, see:
- **[File Naming Conventions](/docs/ai/shared-context/patterns/codebase-patterns.md#file-and-naming-conventions)**
- **[Import Organization](/docs/ai/shared-context/patterns/codebase-patterns.md#import-organization)**

## Path Configuration

### TypeScript Path Aliases
Configure path aliases in `tsconfig.json` for cleaner imports:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/types/*": ["./src/types/*"]
    }
  }
}
```

## Component Organization

### Single Component File
```typescript
// BlogPost.tsx
export function BlogPost({ title, content }: BlogPostProps) {
  // Component implementation
}

// Named export preferred for tree-shaking
export { BlogPost };
```

### Component with Subcomponents
```
Card/
├── Card.tsx           # Main component
├── CardHeader.tsx     # Subcomponent
├── CardBody.tsx       # Subcomponent
├── CardFooter.tsx     # Subcomponent
├── index.ts          # Barrel exports
└── Card.test.tsx     # Tests
```

Barrel export (`index.ts`):
```typescript
export { Card } from './Card';
export { CardHeader } from './CardHeader';
export { CardBody } from './CardBody';
export { CardFooter } from './CardFooter';

// Or as namespace
export * as Card from './Card';
```

## Special Directories

### Private Directories
Use parentheses for route groups that shouldn't affect URL:
```
app/
├── (marketing)/       # Marketing pages group
│   ├── about/
│   └── contact/
├── (app)/            # Application pages
│   ├── dashboard/
│   └── settings/
```

### API Routes
```
app/
├── api/
│   ├── auth/
│   │   ├── login/
│   │   │   └── route.ts    # POST /api/auth/login
│   │   └── logout/
│   │       └── route.ts    # POST /api/auth/logout
│   └── blog/
│       ├── route.ts        # GET /api/blog
│       └── [id]/
│           └── route.ts    # GET/PUT/DELETE /api/blog/[id]
```

### Static Assets
```
public/
├── images/
│   ├── hero/              # Homepage hero images
│   ├── blog/              # Blog post images
│   └── team/              # Team member photos
├── icons/
│   ├── social/            # Social media icons
│   └── ui/                # UI icons
└── documents/
    └── legal/             # Legal documents
```

## Content Organization

### MDX Content Structure
```
content/
├── blog/
│   ├── 2024/
│   │   ├── 01/
│   │   │   ├── rescue-update.mdx
│   │   │   └── volunteer-spotlight.mdx
│   │   └── 02/
│   │       └── emergency-appeal.mdx
│   └── _templates/
│       └── blog-post.mdx
├── pages/
│   ├── about.mdx
│   └── contact.mdx
└── data/
    ├── team.json
    └── impact-metrics.json
```

### Content Metadata
```markdown
---
title: "Rescue Mission Update"
date: "2024-01-15"
author: "Jane Doe"
classification: 2
tags: ["rescue", "update", "dogs"]
image: "/images/blog/rescue-update-hero.jpg"
excerpt: "Latest update from our rescue mission..."
---
```

## Environment Files

### Structure
```
.env                    # Default (committed, no secrets)
.env.local             # Local overrides (gitignored)
.env.development       # Development environment
.env.production        # Production environment
.env.test              # Test environment
```

### Naming Convention
```bash
# Public variables (exposed to browser)
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_GA_ID=UA-123456789

# Server-only variables
DATABASE_URL=postgresql://...
API_SECRET_KEY=secret123
```

## Documentation Files

### Component Documentation
```
Button/
├── Button.tsx
├── Button.test.tsx
├── Button.stories.tsx
└── README.md          # Component documentation
```

### Feature Documentation
```
features/blog/
├── README.md          # Feature overview
├── ARCHITECTURE.md    # Technical details
└── CHANGELOG.md       # Feature changes
```

## Build Artifacts

### Ignored Directories
```
# .gitignore
node_modules/
.next/
out/
build/
dist/
coverage/
.turbo/
*.log
.env.local
```

### Cache Directories
```
.next/cache/           # Next.js build cache
node_modules/.cache/   # Various tool caches
.turbo/                # Turborepo cache
```

## Best Practices

### Do's
- ✅ Keep related files close together
- ✅ Use index files for clean imports
- ✅ Follow consistent naming patterns
- ✅ Organize by feature, not file type
- ✅ Document non-obvious structures

### Don'ts
- ❌ Deep nesting (max 3-4 levels)
- ❌ Generic names (utils.ts, helpers.ts)
- ❌ Mixed naming conventions
- ❌ Circular dependencies
- ❌ Large, monolithic files

### File Size Guidelines
- Components: <300 lines
- Utilities: <100 lines per function
- Types: Separate file if >50 lines
- Split large components into subcomponents