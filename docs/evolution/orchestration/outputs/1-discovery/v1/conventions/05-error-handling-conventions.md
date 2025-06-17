# Error Handling Conventions

> **Confidence**: 87% | **Adoption**: High | **Priority**: Critical

## Overview

This guide documents error handling patterns that ensure resilient, user-friendly applications. These conventions maintain an 87% confidence rate and are essential for production reliability.

## Table of Contents

1. [Error Boundaries](#error-boundaries)
2. [Custom Error Classes](#custom-error-classes)
3. [Loading & Suspense](#loading--suspense)
4. [404 & Not Found](#404--not-found)
5. [API Error Responses](#api-error-responses)
6. [Form Validation](#form-validation)
7. [Async Error Handling](#async-error-handling)
8. [Error Recovery](#error-recovery)

## Error Boundaries

### Next.js Error Files (91% confidence)

Use Next.js error.tsx files for automatic error boundaries:

#### ✅ Good Example - app/error.tsx
```typescript
'use client' // Error boundaries must be Client Components

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to error reporting service
    console.error('Error boundary caught:', error)
  }, [error])

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-4">
      <AlertCircle className="h-12 w-12 text-destructive mb-4" />
      <h2 className="text-2xl font-semibold mb-2">Something went wrong!</h2>
      <p className="text-muted-foreground mb-6 text-center max-w-md">
        We're sorry for the inconvenience. Please try refreshing the page or contact support if the problem persists.
      </p>
      <div className="flex gap-4">
        <Button onClick={reset} variant="default">
          Try again
        </Button>
        <Button variant="outline" asChild>
          <a href="/">Go home</a>
        </Button>
      </div>
    </div>
  )
}
```

### Error Boundary Rules

1. **Must be 'use client'** components
2. **Provide reset functionality** - Let users retry
3. **Log errors** for monitoring
4. **User-friendly messages** - No technical jargon
5. **Offer alternatives** - Home link, support contact

### Nested Error Boundaries

```
app/
├── error.tsx              # Root error boundary
├── blog/
│   ├── error.tsx         # Blog section errors
│   └── [slug]/
│       └── error.tsx     # Individual post errors
└── emergency/
    └── error.tsx         # Emergency section errors
```

## Custom Error Classes

### Error Class Hierarchy (89% confidence)

Create structured error classes for different scenarios:

#### ✅ Good Example - lib/errors.ts
```typescript
// Base error class
export class AppError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly details?: Record<string, any>
  public readonly isOperational: boolean

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message)
    this.name = this.constructor.name
    this.code = code
    this.statusCode = statusCode
    this.isOperational = isOperational
    Error.captureStackTrace(this, this.constructor)
  }
}

// Validation errors (400)
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', 400)
    this.details = details
  }
}

// Not found errors (404)
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id 
      ? `${resource} with id ${id} not found`
      : `${resource} not found`
    super(message, 'NOT_FOUND', 404)
  }
}

// Authentication errors (401)
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access') {
    super(message, 'UNAUTHORIZED', 401)
  }
}

// Permission errors (403)
export class ForbiddenError extends AppError {
  constructor(action: string) {
    super(`You don't have permission to ${action}`, 'FORBIDDEN', 403)
  }
}

// Rate limit errors (429)
export class RateLimitError extends AppError {
  public readonly retryAfter: number

  constructor(retryAfter: number) {
    super('Too many requests', 'RATE_LIMIT', 429)
    this.retryAfter = retryAfter
  }
}
```

### Error Class Rules

1. **Extend AppError** base class
2. **Include error code** - Machine readable
3. **HTTP status codes** - For API responses
4. **isOperational flag** - Differentiate from bugs
5. **Meaningful messages** - User-friendly

## Loading & Suspense

### Loading States (88% confidence)

Use dedicated loading.tsx files for better UX:

#### ✅ Good Example - app/blog/loading.tsx
```typescript
import { Skeleton } from '@/components/ui/skeleton'

export default function BlogLoading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-4 w-[300px]" />
      </div>
      
      {/* Blog post skeletons */}
      {Array.from({ length: 3 }).map((_, i) => (
        <article key={i} className="space-y-3">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </article>
      ))}
    </div>
  )
}
```

### Loading State Rules

1. **Match layout** of loaded content
2. **Skeleton screens** over spinners
3. **Prevent layout shift** - Same dimensions
4. **Accessible announcements** - Screen readers
5. **Progressive loading** - Show what's ready

## 404 & Not Found

### Custom 404 Pages (90% confidence)

Helpful not-found pages guide users back:

#### ✅ Good Example - app/not-found.tsx
```typescript
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, Search, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4">
      <h1 className="text-6xl font-bold text-primary mb-2">404</h1>
      <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
      <p className="text-muted-foreground mb-8 text-center max-w-md">
        Sorry, we couldn't find the page you're looking for. 
        It might have been moved or deleted.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild>
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/search">
            <Search className="mr-2 h-4 w-4" />
            Search
          </Link>
        </Button>
        <Button variant="ghost" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
      
      <div className="mt-12 text-sm text-muted-foreground">
        <p>Popular pages:</p>
        <ul className="mt-2 space-y-1">
          <li><Link href="/blog" className="hover:underline">Blog</Link></li>
          <li><Link href="/rescue-stories" className="hover:underline">Rescue Stories</Link></li>
          <li><Link href="/donate" className="hover:underline">Donate</Link></li>
        </ul>
      </div>
    </div>
  )
}
```

### 404 Page Rules

1. **Clear messaging** - Explain what happened
2. **Navigation options** - Multiple paths forward
3. **Search functionality** - Help users find content
4. **Popular links** - Quick access to main pages
5. **Maintain branding** - Consistent design

## API Error Responses

### Standardized Format (86% confidence)

Consistent API error structure:

#### ✅ Good Example - API Error Handler
```typescript
// lib/api/error-handler.ts
export function handleApiError(error: unknown): Response {
  // Known operational errors
  if (error instanceof AppError) {
    return Response.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
        timestamp: new Date().toISOString(),
      },
      { status: error.statusCode }
    )
  }

  // Validation errors from libraries
  if (error instanceof z.ZodError) {
    return Response.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    )
  }

  // Unknown errors (bugs)
  console.error('Unhandled error:', error)
  return Response.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
      timestamp: new Date().toISOString(),
    },
    { status: 500 }
  )
}

// Usage in API route
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = createPostSchema.parse(body)
    const post = await createPost(validated)
    
    return Response.json({
      success: true,
      data: post,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return handleApiError(error)
  }
}
```

### API Error Rules

1. **Consistent structure** - success/error/timestamp
2. **Machine-readable codes** - For client handling
3. **Human messages** - For display
4. **Optional details** - For debugging
5. **Appropriate status codes** - HTTP standards

## Form Validation

### Client + Server Validation (84% confidence)

Validate on both sides for best UX:

#### ✅ Good Example - Form with Validation
```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from '@/hooks/use-toast'

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

type ContactForm = z.infer<typeof contactSchema>

export function ContactForm() {
  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      message: '',
    },
  })

  async function onSubmit(data: ContactForm) {
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to send message')
      }

      toast({
        title: 'Message sent!',
        description: "We'll get back to you soon.",
      })
      form.reset()
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <input
          {...form.register('name')}
          placeholder="Your name"
          className="w-full"
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive mt-1">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>
      {/* More fields... */}
    </form>
  )
}
```

### Form Validation Rules

1. **Client-side validation** - Immediate feedback
2. **Server validation** - Never trust client
3. **Field-specific errors** - Clear messages
4. **Prevent submission** - When invalid
5. **Graceful degradation** - Works without JS

## Async Error Handling

### Try-Catch Patterns (85% confidence)

Handle async errors consistently:

#### ✅ Good Example - Data Fetching
```typescript
// lib/data/posts.ts
export async function getPost(slug: string): Promise<BlogPost> {
  try {
    const response = await fetch(`${API_URL}/posts/${slug}`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new NotFoundError('Post', slug)
      }
      throw new AppError(
        'Failed to fetch post',
        'FETCH_ERROR',
        response.status
      )
    }

    const data = await response.json()
    return postSchema.parse(data) // Validate response
  } catch (error) {
    // Re-throw known errors
    if (error instanceof AppError) {
      throw error
    }
    
    // Log and wrap unknown errors
    console.error('Unexpected error fetching post:', error)
    throw new AppError(
      'Failed to load post',
      'UNKNOWN_ERROR',
      500
    )
  }
}

// Usage in component
export default async function PostPage({ params }) {
  try {
    const post = await getPost(params.slug)
    return <BlogPost post={post} />
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound() // Trigger 404 page
    }
    throw error // Trigger error boundary
  }
}
```

### Async Error Rules

1. **Wrap in try-catch** - Handle all paths
2. **Re-throw known errors** - Preserve type
3. **Log unknown errors** - For debugging
4. **User-friendly messages** - Hide technical details
5. **Loading states** - During async operations

## Error Recovery

### Graceful Degradation (82% confidence)

Provide recovery options and fallbacks:

#### ✅ Good Example - Retry Logic
```typescript
// hooks/use-retry.ts
export function useRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    delay?: number
    backoff?: boolean
  } = {}
) {
  const { maxRetries = 3, delay = 1000, backoff = true } = options
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  const execute = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    for (let i = 0; i <= maxRetries; i++) {
      try {
        const result = await fn()
        setRetryCount(0)
        setIsLoading(false)
        return result
      } catch (err) {
        setRetryCount(i)
        
        if (i === maxRetries) {
          setError(err as Error)
          setIsLoading(false)
          throw err
        }

        // Exponential backoff
        const waitTime = backoff ? delay * Math.pow(2, i) : delay
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }, [fn, maxRetries, delay, backoff])

  return {
    execute,
    error,
    isLoading,
    retryCount,
    canRetry: retryCount < maxRetries,
  }
}
```

### Recovery Strategies

1. **Retry buttons** - Manual retry option
2. **Automatic retries** - For transient failures
3. **Fallback content** - Show cached/default data
4. **Offline handling** - Detect and communicate
5. **Partial functionality** - Degrade gracefully

## Error Handling Checklist

### Component Development

- [ ] Error boundary at appropriate level?
- [ ] Loading states for async operations?
- [ ] Form validation on client and server?
- [ ] User-friendly error messages?
- [ ] Recovery options provided?

### API Development

- [ ] Consistent error response format?
- [ ] Appropriate HTTP status codes?
- [ ] Error codes for client handling?
- [ ] Validation errors detailed?
- [ ] Unknown errors logged?

### Production Readiness

- [ ] Error monitoring configured?
- [ ] 404 page helpful?
- [ ] Network errors handled?
- [ ] Rate limiting in place?
- [ ] Graceful degradation tested?

## Common Error Handling Mistakes

1. **Generic error messages** - Be specific and helpful
2. **No recovery options** - Always provide next steps
3. **Missing loading states** - Users need feedback
4. **Console.log in production** - Use proper logging
5. **Exposing stack traces** - Security risk
6. **No error boundaries** - Crashes whole app
7. **Trust client validation** - Always validate server-side
8. **Infinite retry loops** - Set max retries

## Next Steps

- Review [Testing Conventions](./06-testing-conventions.md)
- Learn about [State Management Conventions](./07-state-management-conventions.md)
- Understand [Performance Conventions](./08-performance-conventions.md)