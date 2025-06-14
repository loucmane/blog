# Animal Protection Foundation Blog - Architecture Overview

## Project Overview

The Animal Protection Foundation Blog is a high-performance, mission-driven platform for sharing rescue stories, field updates, and impact reports from global animal welfare work. Built as a monorepo with clear separation of concerns between design system, application, API, and shared utilities.

## Monorepo Structure

```
blog/
├── packages/
│   ├── ui/          # Design system foundation
│   ├── web/         # Next.js application
│   ├── backend/     # API services
│   └── shared/      # Cross-package utilities
├── scripts/         # Build and deployment scripts
├── docs/            # Project documentation
└── .taskmaster/     # Task management
```

## Package Architecture

### 1. UI Package - Design System Foundation
**Purpose:** Provides the foundational design system that all applications use

**Contains:**
- Design tokens (colors, typography, spacing, animations)
- Theme configurations (light, dark, contrast, gentle)
- Core providers (ThemeProvider)
- Shared hooks (useTheme, useMediaQuery)
- Base styles and Tailwind configuration
- Minimal truly shared components

**Does NOT contain:**
- shadcn/ui components (these go in web package)
- Business logic
- API integrations

### 2. Web Package - Next.js Application
**Purpose:** The main animal protection blog application

**Contains:**
- Next.js 15 App Router pages
- Content management (MDX blog posts, rescue stories)
- shadcn/ui components (copied and customized)
- Application-specific components
- Content sensitivity system (Level 1-3)
- SEO and performance optimizations
- Integration with donation platforms

**Key Features:**
- Static Site Generation for performance
- Content classification system for sensitive content
- Progressive disclosure for medical/rescue content
- Emergency appeal capabilities
- Trust & transparency dashboard

### 3. Backend Package - API Services
**Purpose:** Handles server-side operations and integrations

**Planned Features:**
- Newsletter subscription management
- Analytics data collection
- Donation processing webhooks
- CRM integration endpoints
- Content approval workflows
- Emergency appeal notifications

**Tech Stack:**
- Express.js
- TypeScript
- Serverless functions (Vercel)

### 4. Shared Package - Cross-Package Utilities
**Purpose:** Code shared between all packages

**Contains:**
- Type definitions (content models, API contracts)
- Validation schemas (Zod)
- Utility functions (date formatting, etc.)
- Constants (content classifications, etc.)
- Shared business logic

## Data Flow

```
Content Creation → Git Repository → Build Process → Static Site → CDN → Global Users
                                         ↓
                                    Backend API
                                         ↓
                              External Services (CRM, Email)
```

## Content Architecture

### Content Types
1. **Rescue Stories** - Before/after narratives with galleries
2. **Field Reports** - Team updates from various countries
3. **Impact Updates** - Quantified results and metrics
4. **Educational Articles** - Animal welfare education
5. **Emergency Appeals** - Urgent rescue situations
6. **Action Guides** - How supporters can help

### Content Sensitivity Levels
- **Level 1 (70%):** Hope/Progress - positive outcomes
- **Level 2 (25%):** Medical/Rescue - active operations
- **Level 3 (5%):** Crisis/Emergency - urgent situations

## Technology Stack

### Frontend
- Next.js 15 (App Router)
- React 19
- TypeScript 5.8
- Tailwind CSS
- shadcn/ui + Radix UI
- MDX for content

### Backend
- Node.js
- Express.js
- TypeScript
- Serverless Functions

### Infrastructure
- Vercel (hosting)
- GitHub (version control)
- pnpm (package management)
- Turborepo (monorepo tooling)

## Performance Targets
- 98+ Lighthouse scores
- Sub-second page loads
- Mobile-first design
- Global CDN distribution
- $0-10/year operating costs

## Integration Points

### External Services
- **Donation Platforms:** Stripe, PayPal
- **CRM:** Donor management system
- **Email Marketing:** ConvertKit/Mailchimp
- **Analytics:** Vercel Analytics, Google Analytics
- **Social Media:** Open Graph optimization

### Internal APIs
- Content API
- Search API
- Newsletter API
- Analytics API
- Approval Workflow API

## Security & Compliance
- WCAG 2.1 AA accessibility
- GDPR compliance for EU supporters
- PCI compliance for donations
- Content approval workflows
- Age-gating for Level 3 content

## Development Workflow

### Content Creation
1. Field team submits content with classification
2. Review team approves based on level
3. Content enhanced with metadata
4. Published through Git workflow
5. Automatic deployment via Vercel

### Code Development
1. Feature branch from main
2. Development in local environment
3. Preview deployment for testing
4. Code review and approval
5. Merge to main triggers production deploy

## Key Design Decisions

1. **Monorepo Structure:** Enables code sharing while maintaining clear boundaries
2. **Static Site Generation:** Maximum performance for global accessibility
3. **Git-based CMS:** Simple, version-controlled content management
4. **Progressive Disclosure:** Respectful handling of sensitive content
5. **Design System Separation:** UI package provides foundation, apps customize

## Future Considerations

1. **Mobile App:** React Native app using shared UI tokens
2. **Admin Dashboard:** Internal tool for content management
3. **Volunteer Portal:** Dedicated app for field volunteers
4. **Multi-language Support:** Internationalization for global reach
5. **Offline Support:** PWA capabilities for field teams