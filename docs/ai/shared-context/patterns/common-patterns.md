# Common Development Patterns - Quick Reference

> **Note**: This is a quick reference guide. For comprehensive implementation details and examples, see the [Codebase Patterns Guide](./codebase-patterns.md).

## Pattern Categories

### 🏗️ Component Patterns
- **Custom Hooks** → [See full implementation](./codebase-patterns.md#component-structure-patterns)
- **Compound Components** → [See examples](./codebase-patterns.md#component-structure-patterns)
- **Render Props** → [See pattern](./codebase-patterns.md#component-structure-patterns)
- **Higher-Order Components** → [See usage](./codebase-patterns.md#component-structure-patterns)

### 📊 State Management
- **Context Pattern** → [See implementation](./codebase-patterns.md#state-management)
- **Reducer Pattern** → [See examples](./codebase-patterns.md#state-management)
- **Optimistic Updates** → [See pattern](./codebase-patterns.md#loading-states)

### 🔄 Data Fetching
- **Static Generation (SSG)** → [See Next.js patterns](./codebase-patterns.md#data-fetching-patterns)
- **Incremental Static Regeneration (ISR)** → [See implementation](./codebase-patterns.md#data-fetching-patterns)
- **Server Actions** → [See examples](./codebase-patterns.md#form-patterns)
- **SWR/React Query Patterns** → [See usage](./codebase-patterns.md#data-fetching-patterns)

### ⚠️ Error Handling
- **Error Boundaries** → [See Next.js 15 pattern](./codebase-patterns.md#error-handling)
- **Result Pattern** → [See TypeScript implementation](./codebase-patterns.md#error-handling)
- **Graceful Degradation** → [See examples](./codebase-patterns.md#error-handling)

### 🚀 Performance
- **Code Splitting** → [See dynamic imports](./codebase-patterns.md#performance-patterns)
- **Memoization** → [See React patterns](./codebase-patterns.md#performance-patterns)
- **Debounce/Throttle** → [See implementations](./codebase-patterns.md#performance-patterns)
- **Virtual Lists** → [See pattern](./codebase-patterns.md#performance-patterns)
- **Image Optimization** → [See Next.js Image](./codebase-patterns.md#performance-patterns)

### 📝 Forms
- **Server Actions** → [See Next.js 15 patterns](./codebase-patterns.md#form-patterns)
- **Progressive Enhancement** → [See implementation](./codebase-patterns.md#form-patterns)
- **Validation with Zod** → [See examples](./codebase-patterns.md#form-patterns)
- **Optimistic UI** → [See pattern](./codebase-patterns.md#loading-states)

### ♿ Accessibility
- **Focus Management** → [See implementation](./codebase-patterns.md#accessibility-patterns)
- **Screen Reader Announcements** → [See pattern](./codebase-patterns.md#accessibility-patterns)
- **Keyboard Navigation** → [See examples](./codebase-patterns.md#accessibility-patterns)
- **ARIA Patterns** → [See usage](./codebase-patterns.md#accessibility-patterns)

### 🎨 Animation
- **Respecting User Preferences** → [See implementation](./codebase-patterns.md#animation-patterns)
- **Stagger Animations** → [See Framer Motion patterns](./codebase-patterns.md#animation-patterns)
- **Performance-Safe Animations** → [See guidelines](./codebase-patterns.md#animation-patterns)

### 🧪 Testing
- **Component Testing** → [See patterns](./codebase-patterns.md#testing-patterns)
- **Test Utilities** → [See custom renders](./codebase-patterns.md#testing-patterns)
- **Mock Factories** → [See implementations](./codebase-patterns.md#testing-patterns)

## Quick Decision Guide

### When to Use Context vs Props
- **Context**: Theme, user auth, notifications, locale
- **Props**: Component-specific data, callbacks, configuration

### When to Use SSG vs SSR vs ISR
- **SSG**: Marketing pages, documentation, blog posts
- **SSR**: User dashboards, real-time data
- **ISR**: Product pages, news articles, frequently updated content

### When to Memoize
- **useMemo**: Expensive calculations, complex filters
- **useCallback**: Functions passed to optimized child components
- **React.memo**: Pure components with expensive renders

## Project-Specific Patterns

### Content Sensitivity Handling
For our unique content classification needs:
- Level 1: Direct display
- Level 2: Blur + warning
- Level 3: Multi-step consent

See [Content Sensitivity Framework](/docs/ai/shared-context/philosophies/content-sensitivity.md) for details.

### Theme System Integration
Our four-theme system requires special handling:
- CSS variables for all colors
- Theme-aware components
- Gentle theme adaptations

See [Four Theme System](/docs/ai/shared-context/themes/four-themes.md) for implementation.

## Additional Resources

- **[Codebase Patterns Guide](./codebase-patterns.md)** - Complete implementation reference
- **[Coding Conventions](/docs/ai/shared-context/standards/coding-conventions.md)** - Style and standards
- **[Development Principles](/docs/ai/shared-context/philosophies/development-principles.md)** - Philosophy and approach
- **[Performance Standards](/docs/ai/shared-context/standards/performance.md)** - Metrics and budgets