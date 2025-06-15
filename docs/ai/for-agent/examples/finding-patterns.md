# Example: Finding Performance Patterns with Agent

## Scenario
We need to audit our application's performance patterns before a major optimization push.

## Agent Prompt
```
Analyze performance patterns across our Next.js application:

Looking for:
1. Current lazy loading implementations
2. Image optimization strategies  
3. Code splitting boundaries
4. Bundle size optimizations
5. Caching strategies
6. Component memoization

Focus on:
- React components in packages/web
- Next.js config files
- Build configurations

Context: Preparing for performance optimization sprint
Need to understand what's already optimized vs opportunities
```

## Agent's Exploration Process

### Phase 1: Initial Discovery
```
Found performance-related patterns:

1. Image Optimization:
   - Using next/image in 12 components
   - Custom ResponsiveImage wrapper with blur placeholders
   - Missing: Some direct <img> tags in older components

2. Lazy Loading:
   - Route-based code splitting (Next.js default)
   - Lazy loading for heavy components (Modal, RichTextEditor)
   - Missing: Component-level lazy loading for below-fold content

3. Bundle Optimization:
   - Tree shaking enabled
   - Dynamic imports for large libraries
   - Concern: Large bundle from imported icon library
```

### Phase 2: Deep Dive
```
Investigating specific patterns:

1. Memoization Usage:
   - Found 8 uses of React.memo
   - 15 useMemo hooks
   - 5 useCallback hooks
   - Pattern: Mostly in list components

2. Data Fetching:
   - SWR for client-side caching
   - ISR for static pages (revalidate: 60)
   - Missing: Prefetching for predictable navigation

3. Performance Budgets:
   - No explicit budgets set
   - No lighthouse CI checks
   - Manual performance testing only
```

### Phase 3: Opportunities Identified
```
Performance improvement opportunities:

1. Quick Wins:
   - Convert remaining <img> to next/image
   - Implement component lazy loading
   - Add explicit width/height to prevent CLS

2. Medium Effort:
   - Extract icon library to dynamic imports
   - Implement route prefetching
   - Add performance budgets

3. Major Improvements:
   - Implement service worker
   - Add offline support
   - Create lite version for 2G
```

## What Agent Found

### File Locations
```typescript
// Performance configurations
next.config.js - Bundle analyzer, image domains
packages/web/src/lib/performance.ts - Custom hooks
packages/web/src/components/Image/ - Optimized components

// Problem areas
packages/web/src/components/Gallery/Gallery.tsx - Large, no lazy load
packages/web/src/lib/icons.ts - Imports entire library
packages/web/src/pages/api/search.ts - No caching headers
```

### Code Patterns

#### Good Pattern Found:
```typescript
// Proper memoization in AnimalList.tsx
const AnimalList = React.memo(({ animals, onSelect }) => {
  const sortedAnimals = useMemo(
    () => animals.sort((a, b) => b.urgency - a.urgency),
    [animals]
  );
  
  return sortedAnimals.map(animal => (
    <AnimalCard key={animal.id} {...animal} />
  ));
});
```

#### Problem Pattern Found:
```typescript
// IconLibrary.tsx - Imports everything
import * as Icons from '@heroicons/react/24/solid'; // 200KB!

export function Icon({ name, ...props }) {
  const IconComponent = Icons[name];
  return <IconComponent {...props} />;
}
```

## Integration with Other Tools

Based on Agent's findings:

### 1. Use Grep for Specifics
```bash
# Find all non-optimized images
grep -r "<img" --include="*.tsx" --include="*.jsx"

# Find large imports
grep -r "import \*" --include="*.ts" --include="*.tsx"
```

### 2. Use Claude Code Bridge for Fixes
```
Using Claude Code Bridge, refactor the icon library to use dynamic imports:

Current: Importing entire icon library (200KB)
Goal: Load only used icons dynamically
Reference: The pattern used in Modal.tsx for lazy loading

Create:
- lib/icons/index.ts with dynamic loader
- lib/icons/types.ts with icon names
- Update all Icon component usage
```

### 3. Update TaskMaster
```bash
mcp__taskmaster-ai__add_task \
  --title "Performance Optimization Sprint" \
  --prompt "Based on Agent findings:
  - Fix direct img tags (12 instances)
  - Implement icon library code splitting
  - Add component lazy loading
  - Set up performance budgets"
```

## Lessons Learned

### Agent Excels At:
1. **Pattern Recognition**: Found consistent patterns across codebase
2. **Connection Discovery**: Linked configs to implementations
3. **Holistic Analysis**: Saw the big picture of performance
4. **Opportunity Identification**: Suggested improvements

### Agent + Human = Best Results
- Agent finds patterns and connections
- Human decides what matters most
- Agent provides locations and examples
- Human implements fixes

### Follow-up Searches
After initial discovery, focused searches helped:
```
"Show me how Modal implements lazy loading"
"Find all components over 500 lines that might need splitting"
"Which API routes don't set cache headers?"
```

This example shows how Agent tool transforms a vague need ("audit performance") into actionable insights with specific file locations and code examples!