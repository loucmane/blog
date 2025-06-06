# Web Package - Animal Protection Foundation Blog

## Overview

The main Next.js application for the Animal Protection Foundation Blog. This package contains the user-facing website with rescue stories, field reports, and donation capabilities.

## Architecture

```
web/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── (routes)/     # Page routes
│   │   ├── api/          # API routes
│   │   └── layout.tsx    # Root layout
│   ├── components/       # React components
│   │   ├── ui/          # shadcn/ui components
│   │   ├── content/     # Content-specific components
│   │   └── layout/      # Layout components
│   ├── lib/             # Utilities and helpers
│   ├── hooks/           # Custom React hooks
│   └── types/           # TypeScript types
├── content/             # MDX content files
│   ├── blog/           # Blog posts
│   ├── stories/        # Rescue stories
│   ├── reports/        # Field reports
│   └── appeals/        # Emergency appeals
└── public/             # Static assets
```

## Key Features

### Content Management
- MDX-based content with React components
- Git-based workflow for version control
- Content sensitivity classification (Level 1-3)
- Automatic metadata generation

### Performance Optimizations
- Static Site Generation (SSG)
- Automatic image optimization
- Code splitting and tree shaking
- Edge caching via Vercel

### User Experience
- Mobile-first responsive design
- Progressive disclosure for sensitive content
- Accessibility (WCAG 2.1 AA)
- Dark mode support

### Integrations
- Donation platforms (Stripe, PayPal)
- Newsletter subscriptions
- Analytics tracking
- Social media sharing

## Content Sensitivity System

### Level 1 - Hope/Progress (70%)
- Positive outcomes and success stories
- No content warnings needed
- Full social sharing enabled

### Level 2 - Medical/Rescue (25%)
- Active rescue operations
- Content warnings displayed
- Educational context required

### Level 3 - Crisis/Emergency (5%)
- Urgent situations
- Age-gating (18+)
- Limited sharing options

## Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Run production build
pnpm start

# Type checking
pnpm type-check

# Linting
pnpm lint
```

## Content Creation

### Creating a Blog Post

1. Create new MDX file in `content/blog/`
2. Add frontmatter:
```mdx
---
title: "Rescue Story Title"
date: "2024-01-15"
excerpt: "Brief description"
category: "rescue"
tags: ["dogs", "medical", "success"]
author: "field-team"
sensitivity: 1  # 1, 2, or 3
featured: true
---
```

3. Write content using Markdown and React components
4. Commit and push to trigger deployment

## Environment Variables

```env
# Analytics
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=

# Donations
STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=

# Newsletter
CONVERTKIT_API_KEY=
CONVERTKIT_FORM_ID=

# CRM
CRM_API_ENDPOINT=
CRM_API_KEY=
```

## Deployment

Automatic deployment via Vercel:
- Production: Merges to `main` branch
- Preview: All other branches
- Instant rollback capabilities

## Performance Targets

- Lighthouse Performance: 98+
- First Contentful Paint: <1s
- Time to Interactive: <2s
- Cumulative Layout Shift: <0.1