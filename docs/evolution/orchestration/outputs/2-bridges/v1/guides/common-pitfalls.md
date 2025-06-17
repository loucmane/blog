# Common Migration Pitfalls & Solutions

## Overview
This guide documents frequently encountered issues during standards migration and their solutions.

## Accessibility Pitfalls

### 1. Missing Focus Management
**Problem**: Components lose focus during dynamic updates
```typescript
// ❌ Bad: Focus lost after update
const TodoList = () => {
  const [todos, setTodos] = useState([])
  
  const deleteTodo = (id) => {
    setTodos(todos.filter(t => t.id !== id))
    // Focus is lost after deletion
  }
}
```

**Solution**: Implement proper focus management
```typescript
// ✅ Good: Focus managed properly
const TodoList = () => {
  const [todos, setTodos] = useState([])
  const listRef = useRef()
  
  const deleteTodo = (id, index) => {
    setTodos(todos.filter(t => t.id !== id))
    
    // Move focus to next item or list container
    requestAnimationFrame(() => {
      const items = listRef.current.querySelectorAll('[role="listitem"]')
      const nextIndex = Math.min(index, items.length - 1)
      
      if (items[nextIndex]) {
        items[nextIndex].focus()
      } else {
        listRef.current.focus()
      }
    })
  }
}
```

### 2. Incorrect ARIA Usage
**Problem**: Misusing ARIA attributes
```typescript
// ❌ Bad: Redundant and incorrect ARIA
<button aria-label="Submit" aria-role="button" aria-pressed>
  Submit
</button>
```

**Solution**: Use ARIA correctly and sparingly
```typescript
// ✅ Good: Proper ARIA usage
<button 
  aria-pressed={isPressed}
  aria-describedby={hasError ? 'error-message' : undefined}
>
  Submit
</button>
```

### 3. Color Contrast Issues
**Problem**: Assuming theme colors meet contrast requirements
```css
/* ❌ Bad: May not meet WCAG standards */
.text-muted {
  color: var(--muted-foreground);
}
```

**Solution**: Validate and adjust contrast
```typescript
// ✅ Good: Ensure contrast compliance
import { ensureContrast } from '@/lib/accessibility'

export const TextMuted = ({ children, background = 'background' }) => {
  const color = ensureContrast(
    'var(--muted-foreground)',
    `var(--${background})`,
    4.5 // WCAG AA standard
  )
  
  return (
    <span style={{ color }} className="text-muted">
      {children}
    </span>
  )
}
```

## Performance Pitfalls

### 1. Unoptimized Images
**Problem**: Loading full-size images without optimization
```typescript
// ❌ Bad: No optimization
<img src="/hero-image.jpg" alt="Hero" />
```

**Solution**: Use Next.js Image with proper optimization
```typescript
// ✅ Good: Optimized image loading
import Image from 'next/image'

<Image
  src="/hero-image.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority={isAboveFold}
  placeholder="blur"
  blurDataURL={heroBlurData}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

### 2. Bundle Size Explosion
**Problem**: Importing entire libraries
```typescript
// ❌ Bad: Imports entire lodash
import _ from 'lodash'

const debounced = _.debounce(handler, 300)
```

**Solution**: Use specific imports and alternatives
```typescript
// ✅ Good: Import only what's needed
import debounce from 'lodash/debounce'

// Or better: use native/lighter alternatives
const debounce = (fn, delay) => {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}
```

### 3. Render Blocking Resources
**Problem**: Loading non-critical CSS/JS in head
```html
<!-- ❌ Bad: Blocks rendering -->
<link rel="stylesheet" href="/animations.css">
<script src="/analytics.js"></script>
```

**Solution**: Defer non-critical resources
```typescript
// ✅ Good: Load asynchronously
import { useEffect } from 'react'

export const useAnalytics = () => {
  useEffect(() => {
    // Load analytics after initial render
    import('/analytics.js').then(({ initAnalytics }) => {
      initAnalytics()
    })
  }, [])
}

// For CSS
<link 
  rel="preload" 
  href="/animations.css" 
  as="style" 
  onLoad="this.onload=null;this.rel='stylesheet'"
/>
```

## Content Sensitivity Pitfalls

### 1. Hardcoded Sensitivity Levels
**Problem**: Sensitivity levels embedded in components
```typescript
// ❌ Bad: Hardcoded sensitivity
const RescueStory = ({ story }) => {
  const isGraphic = story.title.includes('abuse') || 
                   story.title.includes('neglect')
  
  return (
    <div className={isGraphic ? 'blur' : ''}>
      {story.content}
    </div>
  )
}
```

**Solution**: Use centralized sensitivity system
```typescript
// ✅ Good: Systematic sensitivity handling
import { useSensitivity } from '@/hooks/use-sensitivity'

const RescueStory = ({ story }) => {
  const { level, shouldWarn, shouldBlur } = useSensitivity(story)
  
  return (
    <ContentSensitivityBoundary level={level}>
      {shouldWarn && <ContentWarning level={level} />}
      <article className={shouldBlur ? 'content-blurred' : ''}>
        {story.content}
      </article>
    </ContentSensitivityBoundary>
  )
}
```

### 2. Missing User Preferences
**Problem**: Not respecting user content preferences
```typescript
// ❌ Bad: Always shows sensitive content
const Gallery = ({ images }) => {
  return images.map(img => <img key={img.id} src={img.url} />)
}
```

**Solution**: Implement preference system
```typescript
// ✅ Good: Respects user preferences
const Gallery = ({ images }) => {
  const { canShow } = useContentPreferences()
  
  return images.map(img => (
    <SensitiveImage
      key={img.id}
      src={img.url}
      sensitivity={img.sensitivity}
      showWhen={canShow(img.sensitivity)}
      fallback={<ImagePlaceholder />}
    />
  ))
}
```

### 3. Inconsistent Warning UI
**Problem**: Different warning styles across components
```typescript
// ❌ Bad: Each component has its own warning
const StoryCard = () => (
  <div className="warning-box">Sensitive content</div>
)

const ImageGallery = () => (
  <span className="content-alert">⚠️ Graphic images</span>
)
```

**Solution**: Use standardized warning components
```typescript
// ✅ Good: Consistent warning system
import { ContentWarning } from '@/components/content-sensitivity'

const StoryCard = () => (
  <ContentWarning 
    level="high" 
    type="text"
    details="Contains descriptions of animal neglect"
  />
)

const ImageGallery = () => (
  <ContentWarning 
    level="high" 
    type="media"
    details="Graphic images of injuries"
  />
)
```

## Integration Pitfalls

### 1. State Management Conflicts
**Problem**: Multiple state sources causing conflicts
```typescript
// ❌ Bad: Conflicting state sources
const BlogPost = () => {
  const [theme] = useState('light')
  const { theme: globalTheme } = useTheme()
  // Which theme to use?
}
```

**Solution**: Single source of truth
```typescript
// ✅ Good: Clear state hierarchy
const BlogPost = () => {
  const { theme } = useTheme() // Global theme
  const [overrideTheme, setOverrideTheme] = useState(null)
  
  const activeTheme = overrideTheme || theme
}
```

### 2. Event Handler Memory Leaks
**Problem**: Not cleaning up event listeners
```typescript
// ❌ Bad: Leaks memory
useEffect(() => {
  window.addEventListener('resize', handleResize)
  // Missing cleanup!
})
```

**Solution**: Proper cleanup
```typescript
// ✅ Good: Cleans up properly
useEffect(() => {
  const handleResize = () => {
    // Handle resize
  }
  
  window.addEventListener('resize', handleResize)
  
  return () => {
    window.removeEventListener('resize', handleResize)
  }
}, [])
```

### 3. Premature Optimization
**Problem**: Over-optimizing before measuring
```typescript
// ❌ Bad: Unnecessary memoization
const SimpleComponent = () => {
  const value = useMemo(() => 1 + 1, [])
  const handler = useCallback(() => console.log('click'), [])
  
  return <button onClick={handler}>{value}</button>
}
```

**Solution**: Optimize based on measurements
```typescript
// ✅ Good: Optimize when needed
const ExpensiveComponent = ({ data }) => {
  // Only memoize expensive computations
  const processed = useMemo(() => 
    processLargeDataset(data), 
    [data]
  )
  
  // Only useCallback for props to memoized children
  const handler = useCallback((item) => {
    updateItem(item.id)
  }, [])
  
  return (
    <VirtualizedList 
      items={processed}
      onItemClick={handler}
    />
  )
}
```

## Testing Pitfalls

### 1. Testing Implementation Details
**Problem**: Tests break with refactoring
```typescript
// ❌ Bad: Tests internal state
test('increments counter', () => {
  const { result } = renderHook(() => useCounter())
  
  expect(result.current.state.count).toBe(0)
  act(() => result.current.increment())
  expect(result.current.state.count).toBe(1)
})
```

**Solution**: Test behavior, not implementation
```typescript
// ✅ Good: Tests public API
test('increments counter', () => {
  const { result } = renderHook(() => useCounter())
  
  expect(result.current.count).toBe(0)
  act(() => result.current.increment())
  expect(result.current.count).toBe(1)
})
```

### 2. Missing Accessibility Tests
**Problem**: Only testing visual output
```typescript
// ❌ Bad: No accessibility testing
test('renders button', () => {
  render(<Button>Click me</Button>)
  expect(screen.getByText('Click me')).toBeInTheDocument()
})
```

**Solution**: Include accessibility in tests
```typescript
// ✅ Good: Tests accessibility
test('renders accessible button', () => {
  const { container } = render(
    <Button aria-label="Save document">Click me</Button>
  )
  
  // Visual test
  expect(screen.getByText('Click me')).toBeInTheDocument()
  
  // Accessibility tests
  expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Save document')
  
  // Automated accessibility check
  expect(await axe(container)).toHaveNoViolations()
})
```

### 3. Flaky Async Tests
**Problem**: Race conditions in tests
```typescript
// ❌ Bad: Flaky timing
test('loads data', () => {
  render(<DataComponent />)
  
  setTimeout(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument()
  }, 1000)
})
```

**Solution**: Use proper async utilities
```typescript
// ✅ Good: Reliable async testing
test('loads data', async () => {
  render(<DataComponent />)
  
  // Wait for specific condition
  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument()
  })
  
  // Or use findBy queries
  expect(await screen.findByText('Data loaded')).toBeInTheDocument()
})
```

## Prevention Strategies

### 1. Automated Checks
```json
// .eslintrc.json
{
  "extends": [
    "plugin:jsx-a11y/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "jsx-a11y/alt-text": "error",
    "react-hooks/exhaustive-deps": "error"
  }
}
```

### 2. Pre-commit Hooks
```javascript
// .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run standards checks
pnpm lint:standards
pnpm test:accessibility
pnpm check:bundle-size
```

### 3. CI/CD Integration
```yaml
# .github/workflows/standards.yml
name: Standards Compliance
on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Standards Validation
        run: |
          pnpm install
          pnpm validate:all-standards
          pnpm lighthouse:ci
```

## Recovery Strategies

When issues are discovered post-migration:

1. **Immediate Mitigation**
   - Deploy hotfix for critical issues
   - Enable feature flags for gradual rollout
   - Implement fallback behaviors

2. **Root Cause Analysis**
   - Review migration logs
   - Analyze user impact metrics
   - Document lessons learned

3. **Systematic Resolution**
   - Create fix priority matrix
   - Implement fixes with tests
   - Update migration guides

4. **Prevention Updates**
   - Add new checks to CI/CD
   - Update team training
   - Enhance documentation