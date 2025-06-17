# Type System Conventions

> **Confidence**: 91% | **Adoption**: High | **Priority**: Critical

## Overview

This guide documents TypeScript type patterns that ensure type safety and developer experience. These conventions maintain a 91% confidence rate across the codebase.

## Table of Contents

1. [Type Organization](#type-organization)
2. [Naming Conventions](#naming-conventions)
3. [Type Composition](#type-composition)
4. [Error Types](#error-types)
5. [API Response Types](#api-response-types)
6. [Utility Types](#utility-types)

## Type Organization

### Domain-Driven Type Files (95% confidence)

Types are organized by domain with a central barrel export:

```
src/types/
├── index.ts           # Barrel export + utility types
├── content.ts         # Content-related types
├── donor.ts           # Donation and supporter types
├── emergency.ts       # Emergency appeal types
├── trauma-informed.ts # Content sensitivity types
├── analytics.ts       # Tracking and metrics types
├── ui.ts             # UI component prop types
└── api.ts            # API request/response types
```

### ✅ Good Example - types/content.ts
```typescript
// Base interface for shared properties
export interface BaseContent {
  id: string
  title: string
  slug: string
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date
  status: ContentStatus
  author: Author
  seo: SEOMetadata
}

// Specific content types extend base
export interface BlogPost extends BaseContent {
  type: 'blog'
  excerpt: string
  content: string
  categories: Category[]
  tags: string[]
  readingTime: number
  featuredImage?: ImageAsset
}

export interface RescueStory extends BaseContent {
  type: 'rescue'
  location: Location
  rescueDate: Date
  animalType: AnimalType
  urgencyLevel: UrgencyLevel
  updates: RescueUpdate[]
  donationGoal?: DonationGoal
}

// Union type for all content
export type ContentItem = BlogPost | RescueStory | EmergencyAppeal
```

### Type Organization Rules

1. **One file per domain** - Logical grouping
2. **Index.ts exports all** - Clean imports
3. **Utility types in index** - Shared transformations
4. **Interface for objects** - Better for extension
5. **Type for unions** - Aliases and primitives

## Naming Conventions

### Consistent Type Names (93% confidence)

| Type Category | Convention | Example |
|--------------|------------|---------|
| Interfaces | PascalCase, no prefix | `Author`, `BlogPost` |
| Type aliases | PascalCase | `ContentType`, `Optional<T>` |
| Generics | Single uppercase letter | `T`, `K`, `P` |
| Props | Component + Props | `ButtonProps`, `CardProps` |
| API responses | Entity + Response | `PostResponse`, `UserResponse` |
| Enums | PascalCase | `Role`, `Status`, `UrgencyLevel` |

### ✅ Good Examples
```typescript
// Interfaces - descriptive names
export interface Author {
  id: string
  name: string
  email: string
  avatar?: string
}

// Props - clear component association
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline'
  size?: 'default' | 'sm' | 'lg'
  isLoading?: boolean
}

// API types - clear purpose
export interface PostResponse {
  post: BlogPost
  relatedPosts: BlogPost[]
  author: Author
}

// Enums - domain-specific values
export enum UrgencyLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}
```

### ❌ Bad Examples
```typescript
// Don't use I prefix
interface IAuthor { }  // Bad

// Don't use Type suffix unnecessarily  
type AuthorType = { }  // Bad

// Don't use abbreviations
interface BtnProps { }  // Bad

// Don't use generic names
interface Data { }      // Bad
interface Response { }  // Bad
```

## Type Composition

### Interface Extension Pattern (90% confidence)

Use interface extension for shared properties:

#### ✅ Good Example - Inheritance
```typescript
// Base interface for common fields
export interface BaseContent {
  id: string
  title: string
  slug: string
  createdAt: Date
  updatedAt: Date
}

// Extend for specific types
export interface BlogPost extends BaseContent {
  type: 'blog'
  content: string
  excerpt: string
  tags: string[]
}

export interface RescueStory extends BaseContent {
  type: 'rescue'
  location: Location
  animalType: AnimalType
  rescueDate: Date
}
```

### Discriminated Unions (88% confidence)

Use discriminated unions for type-safe variants:

#### ✅ Good Example - Union Types
```typescript
// Discriminated union with 'type' field
export type ContentItem = 
  | { type: 'blog'; data: BlogPost }
  | { type: 'rescue'; data: RescueStory }
  | { type: 'appeal'; data: EmergencyAppeal }

// Type-safe handling
function renderContent(item: ContentItem) {
  switch (item.type) {
    case 'blog':
      return renderBlogPost(item.data) // TypeScript knows this is BlogPost
    case 'rescue':
      return renderRescueStory(item.data) // TypeScript knows this is RescueStory
    case 'appeal':
      return renderEmergencyAppeal(item.data)
  }
}
```

### Composition Rules

1. **Interface extension** for shared properties
2. **Union types** for variants
3. **Discriminated unions** with type field
4. **Generic constraints** for reusability
5. **Intersection types** sparingly

## Error Types

### Custom Error Hierarchy (88% confidence)

Structured error handling with custom classes:

#### ✅ Good Example - types/errors.ts
```typescript
// Base error class
export class AppError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly details?: Record<string, any>

  constructor(message: string, code: string, statusCode: number = 500) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.statusCode = statusCode
    Error.captureStackTrace(this, this.constructor)
  }
}

// Specific error types
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', 400)
    this.name = 'ValidationError'
    this.details = details
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404)
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access') {
    super(message, 'UNAUTHORIZED', 401)
    this.name = 'UnauthorizedError'
  }
}
```

### Error Type Rules

1. **Extend AppError base** class
2. **Include error code** for identification
3. **HTTP status codes** for API errors
4. **Optional details** for context
5. **Meaningful messages** for debugging

## API Response Types

### Standardized Wrappers (92% confidence)

Consistent API response structure:

#### ✅ Good Example - types/api.ts
```typescript
// Generic API response wrapper
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: ApiError
  timestamp: string
}

// Error structure
export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
}

// Paginated response
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    pageSize: number
    totalPages: number
    totalItems: number
    hasNext: boolean
    hasPrevious: boolean
  }
}

// Usage examples
export type PostResponse = ApiResponse<BlogPost>
export type PostListResponse = PaginatedResponse<BlogPost>

// Type-safe API calls
async function fetchPost(id: string): Promise<PostResponse> {
  const response = await fetch(`/api/posts/${id}`)
  return response.json()
}
```

### API Type Rules

1. **Generic wrappers** for consistency
2. **Success/error structure** always present
3. **Pagination metadata** for lists
4. **Type-safe errors** with codes
5. **Optional fields** marked explicitly

## Utility Types

### Custom Type Transformations (86% confidence)

Reusable utility types for common patterns:

#### ✅ Good Example - types/index.ts
```typescript
// Make specific fields optional
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// Make specific fields required
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>

// Deep partial for nested objects
export type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>
} : T

// Extract non-nullable types
export type NonNullableFields<T> = {
  [K in keyof T]-?: NonNullable<T[K]>
}

// Usage examples
type DraftPost = Optional<BlogPost, 'publishedAt' | 'slug'>
type PublishedPost = RequireFields<BlogPost, 'publishedAt'>
type PostUpdate = DeepPartial<BlogPost>
```

### Utility Type Rules

1. **Define in index.ts** for reuse
2. **Use TypeScript built-ins** when available
3. **Document complex types** with examples
4. **Prefer readability** over cleverness
5. **Test with examples** in comments

## Type Safety Best Practices

### Strict Type Checking

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

### Type Guards

```typescript
// Type guard functions
export function isBlogPost(content: ContentItem): content is BlogPost {
  return content.type === 'blog'
}

export function isRescueStory(content: ContentItem): content is RescueStory {
  return content.type === 'rescue'
}

// Usage
if (isBlogPost(content)) {
  // TypeScript knows content is BlogPost here
  console.log(content.excerpt)
}
```

## Quick Reference

### Creating New Types

1. **Choose the right construct**:
   - Object shape? → Interface
   - Union/intersection? → Type alias
   - Set of values? → Enum or union
   - Error class? → Extend AppError

2. **Place in correct file**:
   - UI props? → `types/ui.ts`
   - API types? → `types/api.ts`
   - Domain types? → `types/[domain].ts`

3. **Export from index**:
   ```typescript
   // types/index.ts
   export * from './new-domain'
   ```

### Type Checklist

- [ ] Using interface for object shapes?
- [ ] Props extend HTML attributes?
- [ ] Error types extend AppError?
- [ ] API responses use standard wrapper?
- [ ] Discriminated unions have type field?
- [ ] Utility types documented?
- [ ] No any types?
- [ ] Exported from index.ts?

## Common Type Mistakes

1. **Using `any`** - Always specify types
2. **Missing generics** - Use for reusable types
3. **String literals** instead of enums
4. **No error types** - Define error classes
5. **Inline complex types** - Extract to named types
6. **No type guards** - Add for runtime safety
7. **Weak typing** - Enable strict mode
8. **Type duplication** - Use utility types

## Advanced Patterns

### Branded Types
```typescript
// Prevent mixing different ID types
export type UserId = string & { readonly brand: unique symbol }
export type PostId = string & { readonly brand: unique symbol }

// Helper functions
export const UserId = (id: string): UserId => id as UserId
export const PostId = (id: string): PostId => id as PostId
```

### Template Literal Types
```typescript
// Enforce specific string patterns
export type HexColor = `#${string}`
export type DateString = `${number}-${number}-${number}`
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'
export type ApiEndpoint = `/api/${string}`
```

## Next Steps

- Review [Import/Export Conventions](./04-import-export-conventions.md)
- Learn about [Error Handling Conventions](./05-error-handling-conventions.md)
- Understand [Testing Conventions](./06-testing-conventions.md)