# Conflict Resolution Strategies

This document provides detailed strategies for resolving each identified conflict in the codebase conventions.

## 🎯 Resolution Framework

### Decision Criteria
When resolving conflicts, we consider:
1. **Impact on Developer Experience** - Which approach is easier to use?
2. **Type Safety** - Which provides better TypeScript support?
3. **Performance** - Which has better runtime/build performance?
4. **Ecosystem Alignment** - Which aligns with Next.js/React best practices?
5. **Migration Effort** - How difficult is it to standardize?

## 📋 Detailed Resolution Strategies

### 1. Test File Organization Resolution

**Chosen Pattern**: Hybrid approach based on test type

```typescript
// Decision implementation
export function getTestLocation(testType: TestType, componentPath?: string): string {
  switch (testType) {
    case 'unit':
      // Co-located with component
      return componentPath.replace('.tsx', '.test.tsx')
    
    case 'integration':
      // Centralized integration tests
      return `tests/integration/${getTestName(componentPath)}.test.tsx`
    
    case 'e2e':
      // Centralized E2E tests
      return `tests/e2e/${getFeatureName(componentPath)}.test.ts`
    
    default:
      throw new Error(`Unknown test type: ${testType}`)
  }
}
```

**Migration Script**:
```bash
#!/bin/bash
# migrate-tests.sh

# Move __tests__ to co-located tests
find . -path "*/__tests__/*.test.tsx" -type f | while read -r file; do
  component_dir=$(dirname $(dirname "$file"))
  component_name=$(basename "$file" .test.tsx)
  mv "$file" "$component_dir/$component_name.test.tsx"
done

# Clean up empty __tests__ directories
find . -type d -name "__tests__" -empty -delete
```

### 2. Configuration File Format Resolution

**Chosen Pattern**: TypeScript for type-safe configs

**Migration Map**:
```typescript
const configMigrations = {
  'next.config.js': {
    target: 'next.config.ts',
    template: `
import type { NextConfig } from 'next'

const config: NextConfig = {
  // existing config
}

export default config
    `
  },
  'tailwind.config.js': {
    target: 'tailwind.config.ts',
    template: `
import type { Config } from 'tailwindcss'

const config: Config = {
  // existing config
}

export default config
    `
  },
  'prettier.config.js': {
    target: 'prettier.config.ts',
    keepJs: true, // Some tools work better with .js
  }
}
```

### 3. Import Style Resolution

**Chosen Pattern**: Namespace import for React

**ESLint Rule**:
```javascript
module.exports = {
  rules: {
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: 'react',
            importNames: ['default'],
            message: 'Use namespace import: import * as React from "react"'
          }
        ]
      }
    ]
  }
}
```

**Codemod**:
```typescript
// transform-react-imports.ts
import { transform } from 'jscodeshift'

export default function transformer(fileInfo, api) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  // Transform default imports to namespace imports
  root.find(j.ImportDeclaration, {
    source: { value: 'react' }
  }).forEach(path => {
    const defaultSpecifier = path.node.specifiers.find(
      spec => spec.type === 'ImportDefaultSpecifier'
    )
    
    if (defaultSpecifier) {
      path.node.specifiers = [
        j.importNamespaceSpecifier(j.identifier('React'))
      ]
    }
  })

  return root.toSource()
}
```

### 4. Styling Pattern Resolution

**Chosen Hierarchy**:
```typescript
// Style Decision Tree
export function getStyleStrategy(
  component: ComponentType
): StyleStrategy {
  if (component.hasVariants) {
    return 'cva' // Use CVA for variant management
  }
  
  if (component.hasComplexStates) {
    return 'cva' // CVA for state combinations
  }
  
  if (component.hasDynamicStyles) {
    return 'inline' // Inline for runtime values
  }
  
  return 'tailwind' // Default to Tailwind utilities
}

// CVA Pattern Example
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border border-input bg-background hover:bg-accent"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
)
```

### 5. Error Handling Resolution

**Error Hierarchy Implementation**:
```typescript
// Base error class
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

// Specific error types
export class ValidationError extends AppError {
  constructor(message: string, public fields?: Record<string, string>) {
    super(message, 'VALIDATION_ERROR', 400)
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTH_ERROR', 401)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404)
  }
}

// Error boundary implementation
export function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  const errorType = error instanceof AppError ? error.code : 'UNKNOWN_ERROR'
  
  return (
    <div className="error-boundary" data-error={errorType}>
      {/* Error UI based on error type */}
    </div>
  )
}
```

### 6. Type Definition Location Resolution

**Type Organization Rules**:
```typescript
// Rule implementation
export function determineTypeLocation(typeInfo: TypeInfo): string {
  // Component-specific types stay with component
  if (typeInfo.usage === 'component-props') {
    return typeInfo.componentFile
  }
  
  // Domain types go to dedicated files
  if (typeInfo.usage === 'domain-model') {
    return `src/types/${typeInfo.domain}.ts`
  }
  
  // Shared types go to shared package
  if (typeInfo.usageCount > 1 && typeInfo.acrossPackages) {
    return '@minniewinnie/shared/types'
  }
  
  // Package-level shared types
  if (typeInfo.usageCount > 1) {
    return `src/types/${typeInfo.category}.ts`
  }
  
  // Default: keep with first usage
  return typeInfo.firstUsageFile
}
```

## 🛠️ Implementation Tools

### Automated Migration Tools

1. **Import Codemod**
   ```bash
   npx jscodeshift -t ./codemods/react-imports.ts src/**/*.tsx
   ```

2. **Test Migration Script**
   ```bash
   ./scripts/migrate-tests.sh
   ```

3. **Config Converter**
   ```bash
   npx tsx ./scripts/convert-configs.ts
   ```

### Validation Integration

```json
// package.json
{
  "scripts": {
    "validate:conventions": "tsx ./validation/validate-conventions.ts",
    "fix:imports": "eslint --fix src/**/*.tsx",
    "migrate:tests": "./scripts/migrate-tests.sh",
    "check:conflicts": "tsx ./validation/check-conflicts.ts"
  }
}
```

## 📊 Success Metrics

Track resolution progress:

```typescript
interface ResolutionMetrics {
  conflict: string
  totalInstances: number
  resolved: number
  percentComplete: number
  estimatedEffort: 'hours' | 'days' | 'weeks'
  blockers: string[]
}

const metrics: ResolutionMetrics[] = [
  {
    conflict: 'Test Organization',
    totalInstances: 127,
    resolved: 0,
    percentComplete: 0,
    estimatedEffort: 'days',
    blockers: ['Need to update CI configuration']
  },
  // ... more metrics
]
```

## 🚀 Next Steps

1. **Prioritize** conflicts based on impact and effort
2. **Create** migration branches for each conflict
3. **Run** automated migrations where available
4. **Validate** changes with the validation suite
5. **Document** any new patterns that emerge
6. **Update** team on resolution progress