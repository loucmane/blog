# Convention Examples Catalog

This directory contains practical code examples demonstrating the adoption of discovered conventions. Each example includes:

- ❌ **Bad Examples**: Anti-patterns to avoid
- ✅ **Good Examples**: Correct implementation following conventions
- 🎯 **Migration Examples**: How to convert from bad to good
- 🚀 **Advanced Patterns**: Complex real-world scenarios
- 📝 **Checklists**: Quick reference for implementation

## Directory Structure

```
examples/
├── components/           # React component patterns
├── file-structure/      # Project organization
├── types/              # TypeScript patterns
├── imports/            # Import/export conventions
└── error-handling/     # Error management patterns
```

## Quick Navigation

### 🧩 Component Examples

1. **[ForwardRef Pattern](./components/01-forwardref-pattern.tsx)**
   - Proper ref forwarding for all components
   - TypeScript typing for refs
   - Display name requirements

2. **[Compound Components](./components/02-compound-components.tsx)**
   - Card, Alert, and other compound patterns
   - Flexible composition over prop drilling
   - Individual part exports

3. **[CVA Variants](./components/03-cva-variants.tsx)**
   - Class Variance Authority for styling
   - Type-safe variant props
   - Compound variants for complex states

4. **[Accessibility Patterns](./components/04-accessibility-patterns.tsx)**
   - 44px minimum touch targets
   - ARIA compliance patterns
   - Screen reader support
   - Focus management

### 📁 File Structure Examples

1. **[Directory Organization](./file-structure/01-directory-organization.md)**
   - Feature-based structure
   - Proper file placement
   - Migration from flat to organized

2. **[Barrel Exports](./file-structure/02-barrel-exports.ts)**
   - When to use barrel exports (types only)
   - When NOT to use them (components)
   - Clean import patterns

### 🔤 Type System Examples

1. **[Type Organization](./types/01-type-organization.ts)**
   - Domain-driven type files
   - Interface vs type usage
   - Proper naming conventions

2. **[Type Composition](./types/02-type-composition.ts)**
   - Interface extension patterns
   - Discriminated unions
   - Generic types for reusability
   - Advanced type transformations

### 📦 Import Examples

1. **[Import Organization](./imports/01-import-organization.ts)**
   - The 6-group import order
   - Path alias usage (@/)
   - Type import patterns

2. **[Monorepo Imports](./imports/02-monorepo-imports.ts)**
   - Package boundary enforcement
   - Workspace configuration
   - Export configuration

### 🚨 Error Handling Examples

1. **[Error Boundaries](./error-handling/01-error-boundaries.tsx)**
   - Next.js error.tsx files
   - Custom error boundary components
   - User-friendly error messages

2. **[Custom Error Classes](./error-handling/02-custom-error-classes.ts)**
   - Error class hierarchy
   - Operational vs programming errors
   - API error responses

3. **[Loading & Suspense](./error-handling/03-loading-and-suspense.tsx)**
   - Skeleton screens
   - Suspense boundaries
   - Progressive loading

## Common Migration Patterns

### From Class Components to Functional with ForwardRef

```typescript
// Before
class Button extends React.Component {
  render() {
    return <button>{this.props.children}</button>
  }
}

// After
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, ...props }, ref) => {
    return <button ref={ref} {...props}>{children}</button>
  }
)
Button.displayName = 'Button'
```

### From Prop Drilling to Compound Components

```typescript
// Before
<Card 
  title="Title" 
  description="Description" 
  content={<p>Content</p>}
  footer={<Button>Action</Button>}
/>

// After
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Content</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### From Any Types to Proper Types

```typescript
// Before
function processData(data: any): any {
  return data.items
}

// After
function processData<T extends Identifiable>(
  data: ApiResponse<T[]>
): T[] {
  return data.data || []
}
```

## Quick Wins

1. **Add ForwardRef**: Start with UI components - immediate compatibility improvement
2. **Fix Imports**: Run ESLint fix for import order - instant consistency
3. **Add Loading States**: Replace spinners with skeletons - better UX
4. **Type Your Errors**: Create AppError base class - better debugging
5. **Use Path Aliases**: Configure @/ alias - cleaner imports

## Complex Scenarios

### Multi-Step Form with Error Handling

See complete example combining:
- Compound form components
- Validation with Zod
- Custom error classes
- Loading states
- Accessibility

### Data Table with Sorting and Filtering

Demonstrates:
- Skeleton loading
- Error boundaries
- Type-safe sorting
- Accessible table markup

### Emergency Appeal Dashboard

Shows:
- Complex type composition
- Real-time updates with Suspense
- Error recovery patterns
- Progressive enhancement

## Testing the Conventions

Each example can be tested:

```bash
# Type checking
pnpm tsc --noEmit

# Linting
pnpm eslint examples/

# Accessibility audit
pnpm test:a11y
```

## Contributing New Examples

When adding examples:

1. Include both bad and good versions
2. Add migration steps
3. Explain the "why"
4. Include real-world usage
5. Add to this README

## Resources

- [Main Conventions Docs](../)
- [Quick Reference Guide](../conventions/QUICK-REFERENCE.md)
- [Adoption Tracker](../conventions/adoption-tracker.md)