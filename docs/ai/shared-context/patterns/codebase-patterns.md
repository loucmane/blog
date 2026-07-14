# Codebase Patterns Guide

> **Superseded historical reference (Task 41, 2026-07-14).** Do not use the patterns below as current implementation authority. They describe removed `packages/ui`, stale product terminology, and pre-migration framework assumptions. Current boundaries are documented in `docs/architecture/overview.md`, `docs/architecture/monorepo-structure.md`, `docs/architecture/design-system.md`, and `docs/development/workflow.md`.

> **Last Updated**: 2025-06-13
> **Purpose**: Comprehensive patterns documentation for the Animal Protection Foundation blog codebase
> **Scope**: All code patterns from file naming to advanced Next.js 15 / React 19 patterns

## Table of Contents

1. [File and Naming Conventions](#file-and-naming-conventions)
2. [Component Structure Patterns](#component-structure-patterns)
3. [Import Organization](#import-organization)
4. [Styling Patterns](#styling-patterns)
5. [TypeScript Patterns](#typescript-patterns)
6. [State Management](#state-management)
7. [Error Handling](#error-handling)
8. [Data Fetching Patterns](#data-fetching-patterns)
9. [Form Patterns](#form-patterns)
10. [Loading States](#loading-states)
11. [Performance Patterns](#performance-patterns)
12. [Testing Patterns](#testing-patterns)
13. [Accessibility Patterns](#accessibility-patterns)
14. [Animation Patterns](#animation-patterns)
15. [SEO Patterns](#seo-patterns)

## File and Naming Conventions

### Directory Structure
```
packages/
├── web/                          # Main application
│   ├── src/
│   │   ├── app/                 # App Router pages
│   │   │   ├── page.tsx        # Root page
│   │   │   ├── layout.tsx      # Root layout
│   │   │   ├── error.tsx       # Error boundary
│   │   │   ├── loading.tsx     # Loading state
│   │   │   └── blog/
│   │   │       ├── page.tsx    # Blog listing
│   │   │       └── [slug]/
│   │   │           ├── page.tsx
│   │   │           ├── loading.tsx
│   │   │           └── error.tsx
│   │   ├── components/
│   │   │   ├── ui/             # shadcn/ui components
│   │   │   │   ├── button.tsx  # lowercase with hyphens
│   │   │   │   └── card.tsx
│   │   │   └── BlogPost.tsx    # PascalCase custom components
│   │   ├── lib/                # Utilities
│   │   │   ├── utils.ts        # General utilities
│   │   │   └── api.ts          # API helpers
│   │   └── types/              # TypeScript types
│   │       └── blog.ts         # Domain types
└── ui/                          # Design system
    └── src/
        ├── components/          # Shared components
        │   └── Button/
        │       ├── Button.tsx
        │       └── index.ts     # Barrel export
        ├── tokens/              # Design tokens
        │   ├── colors.ts
        │   └── spacing.ts
        └── hooks/               # Shared hooks
            └── useTheme.ts
```

### Naming Rules

| Type | Convention | Example |
|------|-----------|---------|
| **Components** | PascalCase | `BlogPost.tsx`, `ContentWarning.tsx` |
| **shadcn/ui** | lowercase-hyphen | `button.tsx`, `dropdown-menu.tsx` |
| **Pages** | kebab-case directory | `/blog/[slug]/page.tsx` |
| **Utilities** | camelCase | `formatDate.ts`, `calculateReadTime.ts` |
| **Hooks** | camelCase with 'use' | `useContentWarning.ts`, `useOptimisticLike.ts` |
| **Types/Interfaces** | PascalCase | `BlogPost`, `DonationFormData` |
| **Constants** | SCREAMING_SNAKE | `MAX_FILE_SIZE`, `API_ENDPOINTS` |
| **CSS Classes** | kebab-case | `blog-post-header`, `content-warning` |

## Component Structure Patterns

### shadcn/ui Component Pattern (with forwardRef)
```typescript
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

### Custom Component Pattern
```typescript
'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ContentSensitivity } from '@/types/content'

interface BlogPostProps {
  title: string
  content: string
  sensitivity: ContentSensitivity
  className?: string
}

export function BlogPost({ 
  title, 
  content, 
  sensitivity,
  className 
}: BlogPostProps) {
  // 1. Hooks at the top
  const [isRevealed, setIsRevealed] = useState(sensitivity.level === 1)
  const { theme } = useTheme()
  
  // 2. Effects after hooks
  useEffect(() => {
    if (sensitivity.level > 2) {
      trackEvent('high_sensitivity_content_viewed', { title })
    }
  }, [sensitivity.level, title])
  
  // 3. Handlers
  const handleReveal = () => {
    setIsRevealed(true)
    trackEvent('content_revealed', { 
      title, 
      sensitivityLevel: sensitivity.level 
    })
  }
  
  // 4. Early returns
  if (!content) {
    return <div>Loading...</div>
  }
  
  // 5. Main render
  return (
    <article className={cn('prose prose-lg', className)}>
      <h1>{title}</h1>
      {!isRevealed && sensitivity.level > 1 ? (
        <ContentWarning 
          level={sensitivity.level}
          onReveal={handleReveal}
        />
      ) : (
        <div className={cn(
          'transition-all duration-300',
          !isRevealed && 'blur-xl'
        )}>
          {content}
        </div>
      )}
    </article>
  )
}
```

## Import Organization

```typescript
// 1. React/Next.js imports
import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import dynamic from 'next/dynamic'

// 2. External packages
import { format } from 'date-fns'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'

// 3. Internal packages (monorepo)
import { ThemeProvider } from '@minniewinnie/ui'
import { BlogPost } from '@minniewinnie/shared'

// 4. Absolute imports (app code)
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { trackEvent } from '@/lib/analytics'

// 5. Relative imports (only when necessary)
import { LocalComponent } from './LocalComponent'

// 6. Type imports
import type { BlogPostProps } from '@/types/blog'
import type { Metadata } from 'next'

// 7. Style imports (if any)
import styles from './BlogPost.module.css'
```

## Styling Patterns

### Tailwind with cn() Utility
```typescript
// Base pattern for className merging
<div
  className={cn(
    // 1. Base classes (always applied)
    "rounded-lg border p-4",
    
    // 2. Conditional classes
    isActive && "border-primary bg-primary/10",
    isDisabled && "opacity-50 cursor-not-allowed",
    
    // 3. Theme-aware classes
    "bg-background text-foreground",
    "dark:bg-background dark:text-foreground",
    
    // 4. Responsive classes
    "md:p-6 lg:p-8",
    
    // 5. Animation/transition classes
    "transition-colors duration-200",
    
    // 6. Custom className prop (always last)
    className
  )}
/>
```

### CSS Variable System
```css
/* globals.css */
@layer base {
  :root {
    /* Colors in RGB format for opacity support */
    --background: 255 253 248; /* #FDFBF8 */
    --foreground: 67 46 38; /* #432E26 */
    --primary: 38 70 83; /* #264653 */
    --secondary: 42 157 143; /* #2A9D8F */
    
    /* Semantic colors */
    --donate: 244 162 97; /* #F4A261 */
    --emergency: 231 111 81; /* #E76F51 */
    --success: 42 157 143; /* #2A9D8F */
    
    /* Spacing (matches Tailwind scale) */
    --space-xs: 0.5rem;
    --space-sm: 1rem;
    --space-md: 1.5rem;
    --space-lg: 2rem;
    --space-xl: 3rem;
    
    /* Animation tokens */
    --animation-duration: 200ms;
    --animation-timing: cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .dark {
    --background: 27 26 25; /* Dark brown */
    --foreground: 255 253 248; /* Light cream */
    /* ... other dark theme values ... */
  }
  
  .contrast {
    --background: 0 0 0; /* Pure black */
    --foreground: 255 255 255; /* Pure white */
    /* ... high contrast values ... */
  }
  
  .gentle {
    --background: 250 248 243; /* Soft sand */
    --foreground: 92 79 70; /* Muted brown */
    /* ... gentle theme values ... */
  }
}
```

## TypeScript Patterns

### Interface Extension Pattern
```typescript
// Extend HTML element props
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

// Compose interfaces
interface BaseCardProps {
  title: string
  description?: string
}

interface InteractiveCardProps extends BaseCardProps {
  onClick: () => void
  href?: never
}

interface LinkCardProps extends BaseCardProps {
  href: string
  onClick?: never
}

// Union type for either interactive or link
export type CardProps = InteractiveCardProps | LinkCardProps
```

### Utility Types
```typescript
// Make specific fields optional
export type PartialBlogPost = Partial<BlogPost> & {
  id: string // id remains required
  title: string // title remains required
}

// Deep partial for nested objects
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// Extract prop types from components
export type ButtonVariant = VariantProps<typeof buttonVariants>['variant']

// Discriminated unions for content
export type Content =
  | { type: 'blog'; data: BlogPost }
  | { type: 'rescue'; data: RescueStory; sensitivityLevel: 1 | 2 | 3 }
  | { type: 'update'; data: StatusUpdate }
```

### Error Handling Types
```typescript
// Custom error class
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message)
    this.name = 'AppError'
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

// Result pattern for explicit error handling
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E }

// API response types
export interface ApiResponse<T = any> {
  data?: T
  error?: {
    message: string
    code: string
    details?: Record<string, any>
  }
  meta?: {
    timestamp: string
    version: string
  }
}
```

## State Management

### Context Pattern with Custom Hook
```typescript
// contexts/NotificationContext.tsx
'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  description?: string
  duration?: number
}

interface NotificationContextValue {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = crypto.randomUUID()
    const newNotification = { ...notification, id }
    
    setNotifications(prev => [...prev, newNotification])
    
    // Auto-remove after duration
    if (notification.duration !== 0) {
      setTimeout(() => {
        removeNotification(id)
      }, notification.duration ?? 5000)
    }
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
      <NotificationDisplay notifications={notifications} onDismiss={removeNotification} />
    </NotificationContext.Provider>
  )
}

// Custom hook with error handling
export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
```

### Reducer Pattern for Complex State
```typescript
// reducers/donationReducer.ts
export interface DonationState {
  amount: number
  frequency: 'once' | 'monthly' | 'yearly'
  isProcessing: boolean
  error: string | null
  receipt: Receipt | null
}

export type DonationAction =
  | { type: 'SET_AMOUNT'; amount: number }
  | { type: 'SET_FREQUENCY'; frequency: DonationState['frequency'] }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS'; receipt: Receipt }
  | { type: 'SUBMIT_ERROR'; error: string }
  | { type: 'RESET' }

export const initialDonationState: DonationState = {
  amount: 50,
  frequency: 'once',
  isProcessing: false,
  error: null,
  receipt: null,
}

export function donationReducer(
  state: DonationState,
  action: DonationAction
): DonationState {
  switch (action.type) {
    case 'SET_AMOUNT':
      return { ...state, amount: action.amount, error: null }
    
    case 'SET_FREQUENCY':
      return { ...state, frequency: action.frequency }
    
    case 'SUBMIT_START':
      return { ...state, isProcessing: true, error: null }
    
    case 'SUBMIT_SUCCESS':
      return { 
        ...state, 
        isProcessing: false, 
        receipt: action.receipt,
        error: null 
      }
    
    case 'SUBMIT_ERROR':
      return { 
        ...state, 
        isProcessing: false, 
        error: action.error 
      }
    
    case 'RESET':
      return initialDonationState
    
    default:
      return state
  }
}
```

## Error Handling

### Error Boundary Pattern (Next.js 15)
```typescript
// app/blog/[slug]/error.tsx
'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import { logError } from '@/lib/monitoring'

export default function BlogPostError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to monitoring service
    logError(error, {
      context: 'blog_post_page',
      digest: error.digest,
    })
  }, [error])

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
      <AlertCircle className="h-12 w-12 text-destructive mb-4" />
      <h2 className="text-2xl font-bold mb-2">Something went wrong!</h2>
      <p className="text-muted-foreground mb-6 text-center max-w-md">
        We couldn't load this blog post. This might be a temporary issue.
      </p>
      <div className="flex gap-4">
        <Button onClick={reset} variant="default">
          Try again
        </Button>
        <Button asChild variant="outline">
          <a href="/blog">Back to blog</a>
        </Button>
      </div>
    </div>
  )
}
```

### Global Error Boundary
```typescript
// app/global-error.tsx
'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">500</h1>
            <p className="text-xl mb-8">Something went wrong!</p>
            <button
              onClick={reset}
              className="px-4 py-2 bg-primary text-white rounded"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
```

## Data Fetching Patterns

### Static Generation with ISR
```typescript
// app/blog/[slug]/page.tsx
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getBlogPost, getAllBlogSlugs } from '@/lib/api/blog'
import { BlogPost } from '@/components/BlogPost'

// Generate static pages at build time
export async function generateStaticParams() {
  const slugs = await getAllBlogSlugs()
  return slugs.map((slug) => ({ slug }))
}

// Generate metadata for SEO
export async function generateMetadata({ 
  params 
}: { 
  params: { slug: string } 
}): Promise<Metadata> {
  const post = await getBlogPost(params.slug)
  
  if (!post) {
    return { title: 'Post Not Found' }
  }
  
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.featuredImage],
    },
  }
}

// Fetch data with ISR
async function getPost(slug: string) {
  const res = await fetch(`${process.env.API_URL}/posts/${slug}`, {
    next: { 
      revalidate: 3600, // Revalidate every hour
      tags: ['posts', `post:${slug}`] // For on-demand revalidation
    }
  })
  
  if (!res.ok) {
    return null
  }
  
  return res.json()
}

export default async function BlogPostPage({ 
  params 
}: { 
  params: { slug: string } 
}) {
  const post = await getPost(params.slug)
  
  if (!post) {
    notFound()
  }
  
  return <BlogPost post={post} />
}
```

### On-Demand Revalidation
```typescript
// app/api/revalidate/route.ts
import { revalidateTag, revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { secret, tag, path } = await request.json()
  
  // Validate webhook secret
  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json(
      { message: 'Invalid secret' }, 
      { status: 401 }
    )
  }
  
  try {
    if (tag) {
      // Revalidate by tag
      revalidateTag(tag)
    } else if (path) {
      // Revalidate by path
      revalidatePath(path)
    }
    
    return NextResponse.json({ revalidated: true })
  } catch (err) {
    return NextResponse.json(
      { message: 'Error revalidating' }, 
      { status: 500 }
    )
  }
}
```

## Form Patterns

### Server Actions with Progressive Enhancement
```typescript
// app/actions/comment.ts
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createComment } from '@/lib/api/comments'

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
  // Parse form data
  const validatedFields = commentSchema.safeParse({
    postId: formData.get('postId'),
    author: formData.get('author'),
    email: formData.get('email'),
    content: formData.get('content'),
  })
  
  // Return validation errors
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }
  
  try {
    // Save comment
    await createComment(validatedFields.data)
    
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

### Form Component with useFormState
```typescript
// components/CommentForm.tsx
'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { submitComment } from '@/app/actions/comment'
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

## Loading States

### Route-Level Loading
```typescript
// app/blog/loading.tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function BlogLoading() {
  return (
    <div className="container py-8">
      <Skeleton className="h-12 w-48 mb-8" />
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Component-Level Suspense
```typescript
// app/blog/[slug]/page.tsx
import { Suspense } from 'react'
import { BlogPost } from '@/components/BlogPost'
import { RelatedPosts } from '@/components/RelatedPosts'
import { RelatedPostsSkeleton } from '@/components/skeletons/RelatedPostsSkeleton'

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  return (
    <div className="container py-8">
      <BlogPost slug={params.slug} />
      
      {/* Granular suspense for non-critical content */}
      <Suspense fallback={<RelatedPostsSkeleton />}>
        <RelatedPosts slug={params.slug} />
      </Suspense>
    </div>
  )
}
```

### Optimistic Updates
```typescript
// components/LikeButton.tsx
'use client'

import { useOptimistic } from 'react'
import { Heart } from 'lucide-react'
import { likePost } from '@/app/actions/likes'
import { Button } from '@/components/ui/button'

export function LikeButton({ 
  postId, 
  initialLikes,
  initialLiked 
}: { 
  postId: string
  initialLikes: number
  initialLiked: boolean
}) {
  const [optimisticLikes, updateOptimisticLikes] = useOptimistic(
    { count: initialLikes, liked: initialLiked },
    (state, liked: boolean) => ({
      count: liked ? state.count + 1 : state.count - 1,
      liked: liked
    })
  )
  
  async function handleLike() {
    // Update UI optimistically
    updateOptimisticLikes(!optimisticLikes.liked)
    
    // Call server action
    await likePost(postId)
  }
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLike}
      className="gap-2"
    >
      <Heart 
        className={cn(
          "h-4 w-4",
          optimisticLikes.liked && "fill-current text-red-500"
        )}
      />
      <span>{optimisticLikes.count}</span>
    </Button>
  )
}
```

## Performance Patterns

### Dynamic Imports for Code Splitting
```typescript
// components/HeavyComponents.tsx
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

// Heavy map component loaded only when needed
export const InteractiveMap = dynamic(
  () => import('@/components/Map').then(mod => mod.Map),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false // Disable SSR for client-only components
  }
)

// Rich text editor loaded on demand
export const RichEditor = dynamic(
  () => import('@/components/Editor'),
  {
    loading: () => <div>Loading editor...</div>
  }
)
```

### Image Optimization
```typescript
// components/OptimizedImage.tsx
import Image from 'next/image'

export function OptimizedImage({ 
  src, 
  alt,
  priority = false 
}: {
  src: string
  alt: string
  priority?: boolean
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={800}
      height={600}
      priority={priority} // Use for above-the-fold images
      placeholder="blur" // Show blurred placeholder
      blurDataURL={generateBlurDataURL()} // Base64 blur
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      className="rounded-lg object-cover"
    />
  )
}
```

### Request Deduplication
```typescript
// lib/api/cached-fetch.ts
import { cache } from 'react'

// Deduplicate requests during a single render
export const getCachedPost = cache(async (slug: string) => {
  const res = await fetch(`${process.env.API_URL}/posts/${slug}`)
  if (!res.ok) throw new Error('Failed to fetch post')
  return res.json()
})

// Use in multiple components without duplicate requests
// components/BlogPost.tsx
const post = await getCachedPost(slug)

// components/BlogMetadata.tsx  
const post = await getCachedPost(slug) // Same request, cached result
```

## Testing Patterns

### Component Testing
```typescript
// __tests__/components/BlogPost.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BlogPost } from '@/components/BlogPost'
import { createMockPost } from '@/test/factories'

describe('BlogPost', () => {
  it('should show content warning for sensitive content', async () => {
    const user = userEvent.setup()
    const post = createMockPost({ 
      sensitivityLevel: 3,
      title: 'Rescue Story' 
    })
    
    render(<BlogPost post={post} />)
    
    // Content should be hidden initially
    expect(screen.getByText('Rescue Story')).toBeInTheDocument()
    expect(screen.getByText(/sensitive content/i)).toBeInTheDocument()
    expect(screen.queryByTestId('post-content')).not.toBeInTheDocument()
    
    // Click to reveal
    const revealButton = screen.getByRole('button', { 
      name: /show content/i 
    })
    await user.click(revealButton)
    
    // Content should now be visible
    expect(screen.getByTestId('post-content')).toBeInTheDocument()
  })
})
```

### Test Utilities
```typescript
// test/utils.tsx
import { render, RenderOptions } from '@testing-library/react'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { NotificationProvider } from '@/components/providers/NotificationProvider'

function AllTheProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="light" storageKey="test-theme">
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </ThemeProvider>
  )
}

export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllTheProviders, ...options })
}

// test/factories.ts
export function createMockPost(overrides?: Partial<BlogPost>): BlogPost {
  return {
    id: 'test-id',
    slug: 'test-slug',
    title: 'Test Post',
    content: 'Test content',
    excerpt: 'Test excerpt',
    author: 'Test Author',
    publishedAt: new Date('2024-01-01'),
    sensitivityLevel: 1,
    tags: ['test'],
    ...overrides,
  }
}
```

## Accessibility Patterns

### Focus Management
```typescript
// components/Modal.tsx
'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Modal({ 
  isOpen, 
  onClose,
  title,
  children 
}: {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  const previousFocus = useRef<HTMLElement | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  
  useEffect(() => {
    if (isOpen) {
      // Store current focus
      previousFocus.current = document.activeElement as HTMLElement
      
      // Focus close button
      closeButtonRef.current?.focus()
      
      // Trap focus
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose()
        }
        
        if (e.key === 'Tab') {
          const focusableElements = modalRef.current?.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
          
          if (focusableElements && focusableElements.length > 0) {
            const firstElement = focusableElements[0] as HTMLElement
            const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
            
            if (e.shiftKey && document.activeElement === firstElement) {
              e.preventDefault()
              lastElement.focus()
            } else if (!e.shiftKey && document.activeElement === lastElement) {
              e.preventDefault()
              firstElement.focus()
            }
          }
        }
      }
      
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    } else {
      // Restore focus
      previousFocus.current?.focus()
    }
  }, [isOpen, onClose])
  
  if (!isOpen) return null
  
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        ref={modalRef}
        className="relative bg-background rounded-lg shadow-lg max-w-md w-full p-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id="modal-title" className="text-xl font-bold">
            {title}
          </h2>
          <Button
            ref={closeButtonRef}
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  )
}
```

### Screen Reader Announcements
```typescript
// hooks/useAnnouncement.tsx
'use client'

import { useState, useCallback } from 'react'

export function useAnnouncement() {
  const [announcement, setAnnouncement] = useState('')
  const [priority, setPriority] = useState<'polite' | 'assertive'>('polite')
  
  const announce = useCallback((
    message: string, 
    announcementPriority: 'polite' | 'assertive' = 'polite'
  ) => {
    // Clear and re-set to ensure announcement is read
    setAnnouncement('')
    setPriority(announcementPriority)
    
    setTimeout(() => {
      setAnnouncement(message)
    }, 100)
  }, [])
  
  const Announcer = () => (
    <>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {priority === 'polite' && announcement}
      </div>
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {priority === 'assertive' && announcement}
      </div>
    </>
  )
  
  return { announce, Announcer }
}
```

## Animation Patterns

### Respecting User Preferences
```typescript
// components/AnimatedCard.tsx
'use client'

import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export function AnimatedCard({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = useReducedMotion()
  
  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        prefersReducedMotion 
          ? { duration: 0 } 
          : { duration: 0.3, ease: 'easeOut' }
      }
      className="rounded-lg border bg-card p-6"
    >
      {children}
    </motion.div>
  )
}

// hooks/useReducedMotion.ts
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)
    
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])
  
  return prefersReducedMotion
}
```

### Stagger Animation Pattern
```typescript
// components/BlogGrid.tsx
'use client'

import { motion } from 'framer-motion'
import { BlogCard } from './BlogCard'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export function BlogGrid({ posts }: { posts: BlogPost[] }) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
    >
      {posts.map((post) => (
        <motion.div key={post.id} variants={item}>
          <BlogCard post={post} />
        </motion.div>
      ))}
    </motion.div>
  )
}
```

## SEO Patterns

### Dynamic Metadata
```typescript
// app/blog/[slug]/page.tsx
import { Metadata } from 'next'
import { getBlogPost } from '@/lib/api/blog'

export async function generateMetadata({ 
  params 
}: { 
  params: { slug: string } 
}): Promise<Metadata> {
  const post = await getBlogPost(params.slug)
  
  const title = post?.title || 'Blog Post'
  const description = post?.excerpt || 'Read our latest blog post'
  const image = post?.featuredImage || '/default-og.jpg'
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: post?.publishedAt,
      authors: [post?.author],
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    alternates: {
      canonical: `/blog/${params.slug}`,
    },
  }
}
```

### JSON-LD Structured Data
```typescript
// components/BlogPostSchema.tsx
export function BlogPostSchema({ post }: { post: BlogPost }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.featuredImage,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: {
      '@type': 'Person',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Animal Protection Foundation',
      logo: {
        '@type': 'ImageObject',
        url: 'https://example.com/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://example.com/blog/${post.slug}`,
    },
  }
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
```

## Summary

These patterns establish a robust, scalable, and accessible codebase that aligns with our core requirements:

1. **Performance**: Static-first approach, code splitting, optimistic updates
2. **Accessibility**: Focus management, ARIA patterns, progressive enhancement
3. **Developer Experience**: Consistent patterns, type safety, clear organization
4. **User Experience**: Loading states, error boundaries, smooth animations
5. **Maintainability**: Clear conventions, testing patterns, documentation

Remember to:
- Always consider performance impact (98+ Lighthouse)
- Test with keyboard and screen readers
- Support all four themes
- Handle content sensitivity appropriately
- Write code that works on 2G networks
