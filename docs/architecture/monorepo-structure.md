# Monorepo Structure Details

## Complete File Structure

```
blog/                           # Monorepo root
├── packages/
│   ├── web/                   # Main Next.js website
│   │   ├── src/
│   │   │   ├── app/           # Next.js App Router
│   │   │   ├── components/    # Web-specific components
│   │   │   │   └── ui/        # shadcn/ui components live here
│   │   │   ├── lib/           # Web utilities
│   │   │   ├── types/         # Web-specific types
│   │   │   ├── hooks/         # React hooks
│   │   │   ├── context/       # React context
│   │   │   ├── styles/        # Global styles
│   │   │   ├── utils/         # Pure utility functions
│   │   │   ├── config/        # Configuration files
│   │   │   ├── trauma-informed/ # Content handling logic
│   │   │   ├── donor/         # Donation flows
│   │   │   ├── emergency/     # Emergency appeals
│   │   │   └── analytics/     # Tracking
│   │   └── content/           # MDX blog content
│   │       ├── blog/          # Blog posts
│   │       ├── stories/       # Rescue stories
│   │       ├── appeals/       # Emergency appeals
│   │       └── authors/       # Author info
│   │
│   ├── ui/                    # Shared design system
│   │   └── src/
│   │       ├── components/    # Minimal shared components
│   │       │   ├── Button/    # Example component
│   │       │   └── ThemeSwitcher/ # Theme switcher
│   │       ├── providers/     # Theme provider
│   │       ├── types/         # UI types
│   │       ├── hooks/         # Shared hooks
│   │       ├── utils/         # UI utilities
│   │       ├── tokens/        # Design tokens
│   │       │   ├── colors.ts
│   │       │   ├── typography.ts
│   │       │   ├── spacing.ts
│   │       │   ├── breakpoints.ts
│   │       │   └── animations.ts
│   │       ├── themes/        # Theme configurations
│   │       │   ├── light.ts
│   │       │   ├── dark.ts
│   │       │   ├── contrast.ts
│   │       │   └── gentle.ts
│   │       └── styles/        # Base CSS
│   │
│   ├── backend/               # API services (Express.js)
│   │   └── src/
│   │       ├── routes/        # API endpoints
│   │       ├── middleware/    # Express middleware
│   │       ├── controllers/   # Business logic
│   │       ├── types/         # API types
│   │       └── utils/         # Server utilities
│   │
│   └── shared/                # Cross-package utilities
│       └── src/
│           ├── types/         # Global types
│           ├── constants/     # Shared constants
│           ├── schemas/       # Validation schemas
│           └── utils/         # Pure utility functions
│
├── docs/                      # Project documentation
│   ├── architecture/          # Technical architecture
│   ├── development/           # Development guides
│   ├── migration/            # Migration progress
│   └── troubleshooting/      # Common issues
│
├── scripts/                   # Build and utility scripts
│   └── prd.txt               # Product Requirements Document
│
├── package.json              # Root package.json
├── pnpm-workspace.yaml       # PNPM workspace config
├── pnpm-lock.yaml           # Lockfile
├── tsconfig.json            # Root TypeScript config
├── .eslintrc.js             # ESLint config
├── .gitignore               # Git ignore
├── README.md                # Project overview
└── CLAUDE.md                # Claude context (stays at root)
```

## Package Responsibilities

### Web Package
**Purpose**: The main Next.js application
- All user-facing pages and routes
- Application-specific components
- shadcn/ui components (copy-paste model)
- Content management (MDX)
- SEO and performance optimizations
- Integration with external services

### UI Package  
**Purpose**: Design system foundation
- Design tokens (colors, typography, spacing)
- Theme configurations (4 themes)
- Core providers (ThemeProvider)
- Minimal truly shared components
- Base styles and CSS custom properties
- **NOT**: shadcn/ui components

### Backend Package
**Purpose**: API services and integrations
- Express.js API endpoints
- Newsletter management
- Donation webhooks
- Analytics collection
- Content approval workflows
- External service integrations

### Shared Package
**Purpose**: Cross-package utilities
- TypeScript type definitions
- Validation schemas (Zod)
- Utility functions
- Constants and enums
- Business logic that spans packages

## Key Architectural Decisions

### Why This Structure?

1. **Clear Boundaries**: Each package has a specific purpose
2. **Dependency Direction**: UI and Shared can't depend on Web or Backend
3. **Reusability**: Design tokens available to all packages
4. **Scalability**: Easy to add new packages or features
5. **Type Safety**: Shared types ensure consistency

### shadcn/ui Placement
- Lives in `packages/web/src/components/ui/`
- NOT in the UI package
- Follows shadcn/ui's copy-paste philosophy
- Allows web-specific customization

### Design Token Strategy
- Centralized in UI package
- Imported by all other packages
- Single source of truth for design
- TypeScript for type safety