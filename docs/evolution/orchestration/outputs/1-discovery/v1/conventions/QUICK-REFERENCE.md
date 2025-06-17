# Convention Quick Reference Card

## 🚀 Component Creation

```typescript
// ✅ ALWAYS use this pattern
import * as React from 'react'

export interface ComponentNameProps extends React.HTMLAttributes<HTMLDivElement> {
  // Props here
}

const ComponentName = React.forwardRef<HTMLDivElement, ComponentNameProps>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn('', className)} {...props} />
  }
)
ComponentName.displayName = 'ComponentName'

export { ComponentName }
```

## 📁 File Structure

```
src/
├── app/              # Next.js routes
├── components/
│   └── ui/          # shadcn/ui ONLY
├── types/           # Domain types
├── lib/             # Utilities
├── hooks/           # Custom hooks
└── config/          # App config
```

## 📦 Import Order (MUST follow)

```typescript
// 1. React/Next
import * as React from 'react'
import { Metadata } from 'next'

// 2. External packages
import { cva } from 'class-variance-authority'

// 3. Monorepo packages
import { ThemeProvider } from '@minniewinnie/ui'

// 4. Local with @ alias
import { cn } from '@/lib/utils'

// 5. Relative (same dir only)
import { buttonVariants } from './variants'

// 6. Types
import type { BlogPost } from '@/types'
```

## 🏷️ Naming Rules

| What | Rule | Example |
|------|------|---------|
| Files | kebab-case | `button.tsx`, `use-toast.ts` |
| Components | PascalCase | `Button`, `CardHeader` |
| Types | PascalCase | `BlogPost`, `ButtonProps` |
| Exports | Named only | `export { Button }` |

## 🎨 Styling Pattern

```typescript
const variants = cva(
  "base-classes",
  {
    variants: {
      variant: {
        default: "classes",
        outline: "classes"
      }
    }
  }
)
```

## 🔍 Type Patterns

```typescript
// Domain types in dedicated files
// types/content.ts
export interface BlogPost extends BaseContent {
  type: 'blog'
  // fields
}

// Props extend HTML attributes
export interface ButtonProps 
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline'
}

// API responses
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: ApiError
}
```

## ⚠️ Error Handling

```typescript
// Custom errors extend AppError
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400)
  }
}

// Error boundaries (app/error.tsx)
'use client' // Required!

export default function Error({ error, reset }) {
  // User-friendly UI
}
```

## ✅ Accessibility Musts

- **Min touch target**: `min-w-[44px] min-h-[44px]`
- **Focus states**: `focus-visible:ring-2 focus-visible:ring-ring`
- **Disabled**: `disabled:opacity-50 disabled:pointer-events-none`
- **Loading**: `<span className="sr-only">Loading...</span>`

## 🚫 Common Mistakes

```typescript
// ❌ BAD
export default Button  // No default exports
import Button from '../components/Button'  // Use @ alias
interface IButton {}  // No I prefix
const Component = () => {}  // Use forwardRef

// ✅ GOOD
export { Button }
import { Button } from '@/components/ui/button'
interface Button {}
const Button = React.forwardRef(...)
```

## 📝 Checklist for Every Component

- [ ] `React.forwardRef` used
- [ ] `displayName` set
- [ ] Props extend HTML attributes
- [ ] File name is kebab-case
- [ ] Named export (no default)
- [ ] Accessibility attributes included
- [ ] Imports ordered correctly
- [ ] Located in correct directory

## 🔗 Quick Links

- [Full Component Guide](./01-component-conventions.md)
- [File Structure Guide](./02-file-structure-conventions.md)
- [Type System Guide](./03-type-system-conventions.md)
- [Import/Export Guide](./04-import-export-conventions.md)
- [Error Handling Guide](./05-error-handling-conventions.md)

---

*Print this page and keep it handy while coding!*