# Coding Conventions

## General Principles

### Code Philosophy
- **Readability First**: Code is read more than written
- **Explicit Over Implicit**: Clear intent over clever tricks
- **Consistency**: Follow existing patterns in the codebase
- **Performance Conscious**: But not premature optimization

## TypeScript Standards

### Type Safety
```typescript
// ✅ Good: Explicit types
interface UserProps {
  name: string;
  age: number;
  email?: string; // Optional clearly marked
}

// ❌ Bad: Using any
const processData = (data: any) => { ... }

// ✅ Good: Proper typing
const processData = (data: UserData) => { ... }
```

### Interface vs Type
- Use `interface` for object shapes (extendable)
- Use `type` for unions, primitives, and utilities

```typescript
// Interface for objects
interface BlogPost {
  id: string;
  title: string;
  content: string;
}

// Type for unions
type ContentLevel = 1 | 2 | 3;
type Status = 'draft' | 'published' | 'archived';
```

### Null Handling
```typescript
// Use optional chaining
const userName = user?.profile?.name ?? 'Anonymous';

// Use nullish coalescing
const count = userCount ?? 0; // Not || to preserve 0

// Explicit null checks
if (data !== null && data !== undefined) {
  // Process data
}
```

## React/Next.js Patterns

### Component Structure
```typescript
// 1. Imports (grouped and ordered)
import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// 2. Types/Interfaces
interface ComponentProps {
  title: string;
  children: React.ReactNode;
}

// 3. Component definition
export function Component({ title, children }: ComponentProps) {
  // 4. Hooks at the top
  const router = useRouter();
  const [state, setState] = useState(false);

  // 5. Effects after hooks
  useEffect(() => {
    // Effect logic
  }, [dependency]);

  // 6. Handlers/functions
  const handleClick = () => {
    // Handler logic
  };

  // 7. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### File Naming
- Components: PascalCase (`BlogPost.tsx`)
- Utilities: camelCase (`formatDate.ts`)
- Types: PascalCase (`BlogPost.types.ts`)
- Hooks: camelCase with 'use' prefix (`useTheme.ts`)

### Import Organization
```typescript
// 1. React/Next
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. External packages
import { format } from 'date-fns';
import { z } from 'zod';

// 3. Internal packages
import { theme } from '@minniewinnie/ui';
import { BlogPost } from '@minniewinnie/shared';

// 4. Relative imports
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

// 5. Types
import type { BlogPostProps } from './types';
```

## CSS/Tailwind Guidelines

### Class Organization
```tsx
// Use cn() for conditional classes
<div
  className={cn(
    // Base classes
    "rounded-lg border p-4",
    // Conditional classes
    isActive && "border-primary bg-primary/10",
    // Responsive classes
    "md:p-6 lg:p-8",
    // Custom className prop
    className
  )}
/>
```

### Tailwind Best Practices
- Group related utilities
- Order: positioning → box model → typography → visual → misc
- Use design system values (`bg-background` not `bg-white`)

```tsx
// Good class organization
<div className="
  relative z-10
  mx-auto max-w-7xl px-4
  text-lg font-medium
  bg-background text-foreground
  transition-colors duration-200
"/>
```

## State Management

### Component State
```typescript
// Simple state for UI
const [isOpen, setIsOpen] = useState(false);

// Complex state with reducer
const [state, dispatch] = useReducer(reducer, initialState);

// Form state with react-hook-form
const form = useForm<FormData>({
  resolver: zodResolver(formSchema),
  defaultValues: initialValues,
});
```

### Global State
- Use Context for theme, user preferences
- Consider Zustand for complex client state
- Server state with React Query/SWR

## Error Handling

### Try-Catch Patterns
```typescript
// Async error handling
try {
  const data = await fetchData();
  return { success: true, data };
} catch (error) {
  console.error('Failed to fetch data:', error);
  return { 
    success: false, 
    error: error instanceof Error ? error.message : 'Unknown error' 
  };
}
```

### Error Boundaries
```typescript
// Component-level error handling
<ErrorBoundary fallback={<ErrorFallback />}>
  <RiskyComponent />
</ErrorBoundary>
```

## Performance Patterns

### Memoization
```typescript
// Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return calculateExpensiveValue(data);
}, [data]);

// Memoize callbacks
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);

// Memoize components
const MemoizedComponent = memo(Component);
```

### Code Splitting
```typescript
// Dynamic imports
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false,
});

// Lazy loading
const LazyComponent = lazy(() => import('./LazyComponent'));
```

## Comments and Documentation

### When to Comment
```typescript
// ✅ Good: Explains WHY
// We need to delay the API call to prevent rate limiting
setTimeout(() => fetchData(), 1000);

// ❌ Bad: Explains WHAT (obvious from code)
// Set timeout to 1000ms
setTimeout(() => fetchData(), 1000);
```

### JSDoc for Complex Functions
```typescript
/**
 * Calculates the reading time for a blog post
 * @param content - The blog post content in markdown
 * @param wordsPerMinute - Reading speed (default: 200)
 * @returns Estimated reading time in minutes
 */
function calculateReadingTime(
  content: string, 
  wordsPerMinute = 200
): number {
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}
```

## Git Commit Conventions

### Commit Message Format
```
type(scope): subject

body (optional)

footer (optional)
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc)
- `refactor`: Code refactoring
- `test`: Test additions or modifications
- `chore`: Build process or auxiliary tool changes

### Examples
```bash
feat(blog): add content classification system
fix(theme): correct contrast theme text visibility
docs(api): update authentication documentation
refactor(components): extract shared button logic
```

## Testing Standards

### Test File Naming
- Unit tests: `Component.test.tsx`
- Integration tests: `feature.integration.test.ts`
- E2E tests: `flow.e2e.test.ts`

### Test Structure
```typescript
describe('Component', () => {
  // Setup
  beforeEach(() => {
    // Common setup
  });

  // Group related tests
  describe('when authenticated', () => {
    it('should display user name', () => {
      // Arrange
      const user = { name: 'John' };
      
      // Act
      render(<Component user={user} />);
      
      // Assert
      expect(screen.getByText('John')).toBeInTheDocument();
    });
  });
});
```

## Security Practices

### Never Commit
- API keys or secrets
- Personal information
- Debug code with sensitive data
- Commented out code with credentials

### Input Validation
```typescript
// Always validate user input
const schema = z.object({
  email: z.string().email(),
  age: z.number().min(0).max(150),
});

const result = schema.safeParse(userInput);
if (!result.success) {
  // Handle validation errors
}
```

## Accessibility in Code

### ARIA Labels
```tsx
<button
  aria-label="Close dialog"
  aria-describedby="save-warning"
  onClick={handleClose}
>
  <XIcon aria-hidden="true" />
</button>
```

### Semantic HTML
```tsx
// ✅ Good
<nav aria-label="Main">
  <ul>
    <li><a href="/">Home</a></li>
  </ul>
</nav>

// ❌ Bad
<div class="nav">
  <div onclick="navigate('/')">Home</div>
</div>
```