# Quick Start: Convention Examples

## 🚀 Most Common Patterns

### Creating a New Component

```typescript
// ✅ CORRECT: components/ui/button.tsx
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
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

### Organizing Imports

```typescript
// ✅ CORRECT ORDER (with blank lines between groups)
// 1. React/Next
import * as React from 'react'
import { Metadata } from 'next'

// 2. External packages
import { motion } from 'framer-motion'
import { z } from 'zod'

// 3. Internal packages (monorepo)
import { ThemeProvider } from '@minniewinnie/ui/providers'

// 4. Alias imports
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

// 5. Relative imports (same dir only)
import { buttonVariants } from './button-variants'

// 6. Type imports
import type { BlogPost } from '@/types'
```

### Error Handling

```typescript
// ✅ CORRECT: app/blog/error.tsx
'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center">
      <h2 className="text-2xl font-semibold mb-4">Something went wrong!</h2>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
```

### Loading States

```typescript
// ✅ CORRECT: app/blog/loading.tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-8 w-[200px]" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  )
}
```

### Type Organization

```typescript
// ✅ CORRECT: types/content.ts
export interface BaseContent {
  id: string
  title: string
  slug: string
  createdAt: Date
  updatedAt: Date
}

export interface BlogPost extends BaseContent {
  type: 'blog'
  content: string
  excerpt: string
  tags: string[]
}

// types/index.ts - barrel export
export * from './content'
export * from './api'

// Usage
import { BlogPost } from '@/types'
```

## 📋 Quick Checklists

### New Component Checklist
- [ ] Use `React.forwardRef`
- [ ] Add `displayName`
- [ ] Extend HTML element props
- [ ] Use kebab-case filename
- [ ] Export as named export
- [ ] Include accessibility attrs
- [ ] Min 44px touch targets
- [ ] Visible focus states

### Import Order Checklist
1. [ ] React/Next imports
2. [ ] External packages
3. [ ] Internal packages (@minniewinnie/*)
4. [ ] Alias imports (@/*)
5. [ ] Relative imports (./)
6. [ ] Type imports

### Error Handling Checklist
- [ ] Create error.tsx files
- [ ] Use 'use client' directive
- [ ] Provide reset button
- [ ] User-friendly messages
- [ ] Log errors
- [ ] Create custom error classes
- [ ] Handle loading states

## 🔧 Common Fixes

### Convert to ForwardRef
```typescript
// Before
export function Button(props) {
  return <button {...props} />
}

// After - Just wrap it!
const Button = React.forwardRef((props, ref) => {
  return <button ref={ref} {...props} />
})
Button.displayName = 'Button'
export { Button }
```

### Fix Import Order
```bash
# Use ESLint to auto-fix
pnpm eslint --fix src/
```

### Add Loading State
```bash
# Create loading.tsx next to page.tsx
touch app/blog/loading.tsx
# Copy skeleton pattern from examples
```

## 🎯 Copy-Paste Templates

### Component Template
```typescript
import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ComponentNameProps extends React.HTMLAttributes<HTMLDivElement> {
  // Add props here
}

const ComponentName = React.forwardRef<HTMLDivElement, ComponentNameProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("", className)}
        {...props}
      />
    )
  }
)
ComponentName.displayName = "ComponentName"

export { ComponentName }
```

### Error Class Template
```typescript
export class CustomError extends AppError {
  constructor(message: string) {
    super(message, 'CUSTOM_ERROR', 400)
  }
}
```

### Type File Template
```typescript
// types/domain.ts
export interface BaseDomain {
  id: string
  createdAt: Date
  updatedAt: Date
}

export interface SpecificType extends BaseDomain {
  // Add fields
}

// Don't forget to export from index.ts!
```

## 📚 Full Examples

See the complete examples in:
- [Components](./components/)
- [File Structure](./file-structure/)
- [Types](./types/)
- [Imports](./imports/)
- [Error Handling](./error-handling/)