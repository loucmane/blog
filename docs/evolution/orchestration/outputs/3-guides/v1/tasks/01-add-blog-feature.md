# Guide: Add a Blog Feature

> **Time Estimate**: 2-4 hours
> **Complexity**: Medium
> **Prerequisites**: Understanding of Next.js App Router, TypeScript, and shadcn/ui

## Overview

This guide walks you through adding a new feature to the blog, such as a comment system, like button, or sharing functionality. We'll follow the established patterns and maintain 98+ Lighthouse scores.

## Pre-Flight Checklist

Before starting, ensure you have:

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

export interface CommentFormData {
  author: string
  email: string
  content: string
}
```

### 1.2 Plan Component Structure

Following the component patterns:
- UI components in `packages/web/src/components/ui/`
- Feature components in `packages/web/src/components/`
- Server actions in `packages/web/src/app/actions/`

## Step 2: Create Server Actions

### 2.1 Implement Data Logic

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

export type CommentFormState = {
  errors?: {
    author?: string[]
    email?: string[]
    content?: string[]
    _form?: string[]
  }
  success?: boolean
}

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
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }
  
  try {
    // Save comment (implementation depends on your backend)
    await saveComment(validatedFields.data)
    
    // Revalidate the blog post page
    revalidatePath(`/blog/${validatedFields.data.postId}`)
    
    return { success: true }
  } catch (error) {
    return {
      errors: {
        _form: ['Failed to submit comment. Please try again.'],
      },
    }
  }
}
```

## Step 3: Create UI Components

### 3.1 Add shadcn/ui Components if Needed

```bash
# Add any required shadcn/ui components
pnpm dlx shadcn@latest add textarea alert
```

Update tracking document:
```markdown
# packages/web/docs/development/shadcn-components.md
- textarea: Comment form input
- alert: Success/error messages
```

### 3.2 Create Feature Component

```typescript
// packages/web/src/components/CommentForm.tsx
'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { submitComment } from '@/app/actions/comments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'

function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Submitting...' : 'Post Comment'}
    </Button>
  )
}

export function CommentForm({ postId }: { postId: string }) {
  const [state, formAction] = useFormState(submitComment, {})
  
  if (state.success) {
    return (
      <Alert className="border-success">
        <AlertDescription>
          Your comment has been posted successfully!
        </AlertDescription>
      </Alert>
    )
  }
  
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="postId" value={postId} />
      
      <div>
        <Input
          name="author"
          placeholder="Your name"
          required
          aria-describedby="author-error"
        />
        {state.errors?.author && (
          <p id="author-error" className="text-sm text-destructive mt-1">
            {state.errors.author[0]}
          </p>
        )}
      </div>
      
      <div>
        <Input
          type="email"
          name="email"
          placeholder="Your email"
          required
          aria-describedby="email-error"
        />
        {state.errors?.email && (
          <p id="email-error" className="text-sm text-destructive mt-1">
            {state.errors.email[0]}
          </p>
        )}
      </div>
      
      <div>
        <Textarea
          name="content"
          placeholder="Your comment..."
          rows={4}
          required
          aria-describedby="content-error"
        />
        {state.errors?.content && (
          <p id="content-error" className="text-sm text-destructive mt-1">
            {state.errors.content[0]}
          </p>
        )}
      </div>
      
      {state.errors?._form && (
        <Alert variant="destructive">
          <AlertDescription>{state.errors._form[0]}</AlertDescription>
        </Alert>
      )}
      
      <SubmitButton />
    </form>
  )
}
```

## Step 4: Integrate with Page

### 4.1 Add to Blog Post Page

```typescript
// packages/web/src/app/blog/[slug]/page.tsx
import { Suspense } from 'react'
import { CommentForm } from '@/components/CommentForm'
import { CommentList } from '@/components/CommentList'
import { CommentListSkeleton } from '@/components/skeletons/CommentListSkeleton'

export default async function BlogPostPage({ 
  params 
}: { 
  params: { slug: string } 
}) {
  const post = await getPost(params.slug)
  
  return (
    <article>
      {/* Existing blog post content */}
      
      {/* Add comments section */}
      <section className="mt-16 space-y-8">
        <h2 className="text-2xl font-bold">Comments</h2>
        
        <Suspense fallback={<CommentListSkeleton />}>
          <CommentList postId={post.id} />
        </Suspense>
        
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Leave a Comment</h3>
          <CommentForm postId={post.id} />
        </div>
      </section>
    </article>
  )
}
```

## Step 5: Optimize Performance

### 5.1 Implement Loading States

```typescript
// packages/web/src/components/skeletons/CommentListSkeleton.tsx
import { Skeleton } from '@/components/ui/skeleton'

export function CommentListSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      ))}
    </div>
  )
}
```

### 5.2 Add Optimistic Updates (if applicable)

```typescript
// For features like likes, use optimistic updates
'use client'

import { useOptimistic } from 'react'
import { likePost } from '@/app/actions/likes'

export function LikeButton({ postId, initialLikes }: Props) {
  const [optimisticLikes, updateOptimisticLikes] = useOptimistic(
    initialLikes,
    (state, liked: boolean) => liked ? state + 1 : state - 1
  )
  
  async function handleLike() {
    updateOptimisticLikes(true)
    await likePost(postId)
  }
  
  return (
    <Button onClick={handleLike} variant="ghost" size="sm">
      ❤️ {optimisticLikes}
    </Button>
  )
}
```

## Step 6: Add Theme Support

### 6.1 Ensure Four Theme Compatibility

```typescript
// Use theme-aware classes
className={cn(
  "rounded-lg border p-4",
  "bg-background text-foreground",
  "transition-colors duration-200"
)}
```

### 6.2 Test All Themes

```bash
# Manual testing checklist
- [ ] Light theme: Readable and accessible
- [ ] Dark theme: Proper contrast
- [ ] Contrast theme: Maximum visibility
- [ ] Gentle theme: Soft appearance
```

## Step 7: Add Tests

### 7.1 Component Tests

```typescript
// packages/web/src/__tests__/components/CommentForm.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CommentForm } from '@/components/CommentForm'

describe('CommentForm', () => {
  it('should validate required fields', async () => {
    const user = userEvent.setup()
    render(<CommentForm postId="test-id" />)
    
    const submitButton = screen.getByRole('button', { 
      name: /post comment/i 
    })
    await user.click(submitButton)
    
    expect(screen.getByText(/name is required/i)).toBeInTheDocument()
    expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
  })
})
```

## Step 8: Performance Validation

### 8.1 Check Bundle Size

```bash
# Analyze bundle impact
pnpm build
pnpm analyze
```

### 8.2 Run Lighthouse

```bash
# Start production build
pnpm build && pnpm start

# In another terminal
npx lighthouse http://localhost:3000/blog/sample-post \
  --view \
  --preset=desktop
```

Target scores:
- Performance: 98+
- Accessibility: 98+
- Best Practices: 98+
- SEO: 98+

## Step 9: Documentation

### 9.1 Update Component Registry

```markdown
# packages/web/docs/development/component-registry.md

## Comment System
- `CommentForm`: Server action form with validation
- `CommentList`: Suspense-wrapped comment display
- `CommentItem`: Individual comment component
```

### 9.2 Document Feature

```markdown
# packages/web/docs/features/comments.md

## Comment System

### Architecture
- Server actions for form submission
- Optimistic UI for instant feedback
- Content moderation support

### Usage
Comments are automatically enabled on all blog posts...
```

## Step 10: Pre-Commit Checklist

Before committing:

```bash
# 1. Format code
pnpm format

# 2. Run linter
pnpm lint

# 3. Run tests
pnpm test

# 4. Type check
pnpm typecheck

# 5. Build check
pnpm build

# 6. Update SESSION.md
# Document your changes and decisions
```

## Common Issues and Solutions

### Issue: Form not submitting
**Solution**: Ensure server actions are properly exported and form has action attribute

### Issue: Revalidation not working
**Solution**: Check revalidatePath matches actual route

### Issue: Theme styling broken
**Solution**: Use CSS variables and theme-aware classes

### Issue: Performance regression
**Solution**: Check for:
- Unnecessary client components
- Missing loading states
- Large bundle imports
- Unoptimized images

## Next Steps

After implementing the feature:

1. Test with real users
2. Monitor performance metrics
3. Gather feedback
4. Iterate based on usage

## Resources

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Server Actions Guide](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions)
- [shadcn/ui Components](https://ui.shadcn.com)
- Project patterns: `/docs/ai/shared-context/patterns/codebase-patterns.md`