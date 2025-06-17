# Guide: Add a Blog Feature

> **Time Estimate**: 2-4 hours
> **Complexity**: Medium
> **Prerequisites**: Understanding of Next.js App Router, TypeScript, and shadcn/ui
> **Source**: Documentation Evolution Task Guides Phase 3

## Overview

This guide walks you through adding a new feature to the blog, such as a comment system, like button, or sharing functionality. We'll follow the established patterns and maintain 98+ Lighthouse scores.

## Pre-Flight Checklist

```bash
# 1. Check current branch
git branch --show-current

# 2. Create feature branch
git checkout -b feat/{task-id}-{feature-name}

# 3. Update dependencies
pnpm install

# 4. Start development server
pnpm dev
```

## Step 1: Plan the Feature Architecture

### 1.1 Define Types

Create type definitions in `packages/web/src/types/`:

```typescript
// packages/web/src/types/comments.ts
export interface Comment {
  id: string
  postId: string
  author: string
  email: string
  content: string
  createdAt: Date
  approved: boolean
}
```

### 1.2 Plan Component Structure

Following the component patterns:
- UI components in `packages/web/src/components/ui/`
- Feature components in `packages/web/src/components/`
- Server actions in `packages/web/src/app/actions/`

## Step 2: Create Server Actions

Using Next.js 15 server actions with proper validation:

```typescript
// packages/web/src/app/actions/comments.ts
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const commentSchema = z.object({
  postId: z.string(),
  author: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  content: z.string().min(10, 'Comment must be at least 10 characters'),
})

export async function submitComment(
  prevState: CommentFormState,
  formData: FormData
): Promise<CommentFormState> {
  const validatedFields = commentSchema.safeParse({
    postId: formData.get('postId'),
    author: formData.get('author'),
    email: formData.get('email'),
    content: formData.get('content'),
  })
  
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors
    }
  }

  // Process comment...
  
  revalidatePath(`/blog/${validatedFields.data.postId}`)
  return { success: true }
}
```

## Step 3: Build Components

### Follow the forwardRef Pattern

```typescript
import * as React from 'react'

const CommentForm = React.forwardRef<HTMLFormElement, CommentFormProps>(
  ({ className, ...props }, ref) => {
    // Implementation
  }
)
CommentForm.displayName = 'CommentForm'
```

## Step 4: Performance Optimization

### Code Split Heavy Features

```typescript
import dynamic from 'next/dynamic'

const CommentSection = dynamic(
  () => import('./components/CommentSection'),
  {
    loading: () => <CommentsSkeleton />,
    ssr: true // Keep for SEO
  }
)
```

## Step 5: Testing & Validation

### Performance Checklist
- [ ] Lighthouse score remains 98+
- [ ] Bundle size increase < 20KB
- [ ] Feature loads below the fold
- [ ] Progressive enhancement works

### Accessibility Checklist
- [ ] All interactive elements have 44px touch targets
- [ ] Focus states are visible
- [ ] Screen reader announcements work
- [ ] Keyboard navigation functions

## Common Patterns

1. **Server Actions** for data mutations
2. **Dynamic imports** for heavy components
3. **Progressive enhancement** for non-critical features
4. **Content sensitivity** considerations for user-generated content
5. **Validation** on both client and server