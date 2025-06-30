# Synthesis Recommendations for Task 7

## Executive Summary

Based on the evaluation of 10 implementations, this document provides specific recommendations for synthesizing the optimal core layout components. The synthesis should prioritize performance while selectively incorporating the best patterns from each specialist perspective.

## Recommended Base Implementation

### Start with Performance Team's perf-2
- **Rationale**: Smallest bundle (24.3KB), component splitting architecture
- **Key files**: Separate FooterSocialLinks.tsx and FooterTrustSignals.tsx
- **Critical patterns**: RAF debouncing, passive listeners, minimal MainLayout

## Layer-by-Layer Enhancement Strategy

### Layer 1: Core Performance Foundation (perf-2)
```typescript
// Start with these files from perf-2:
- Header.tsx (8.3KB) - with RAF scroll handling
- Footer.tsx (8.9KB) - split into sub-components
- MainLayout.tsx (2.6KB) - minimal wrapper
- MobileNav.tsx (4.5KB) - basic Sheet implementation
```

### Layer 2: Architecture Enhancements (from arch-2)
Add these patterns without breaking performance:

```typescript
// 1. Layout Provider (simplified version)
export const LayoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config] = useState({
    header: { sticky: true },
    footer: { showNewsletter: true }
  })
  
  return (
    <LayoutContext.Provider value={config}>
      {children}
    </LayoutContext.Provider>
  )
}

// 2. Event System (lightweight)
const layoutEvents = new EventTarget()
export const useLayoutEvent = (event: string, handler: EventListener) => {
  useEffect(() => {
    layoutEvents.addEventListener(event, handler)
    return () => layoutEvents.removeEventListener(event, handler)
  }, [event, handler])
}
```

### Layer 3: Essential UX Enhancements (from ux-2)
Selectively add micro-interactions:

```typescript
// 1. Motion-safe transitions
const motionSafe = (classes: string) => 
  `motion-safe:${classes} motion-reduce:transition-none`

// 2. Basic ripple effect (simplified)
const useRipple = () => {
  const [show, setShow] = useState(false)
  const trigger = () => {
    setShow(true)
    setTimeout(() => setShow(false), 600)
  }
  return { show, trigger }
}

// 3. Smooth scroll behavior
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
```

### Layer 4: Core Accessibility (from a11y-1)
Add essential accessibility without the complex voice control:

```typescript
// 1. Skip navigation (must have)
<a 
  href="#main-content" 
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4"
>
  Skip to main content
</a>

// 2. Live region announcements
const announce = (message: string) => {
  const el = document.createElement('div')
  el.setAttribute('role', 'status')
  el.setAttribute('aria-live', 'polite')
  el.className = 'sr-only'
  el.textContent = message
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 1000)
}

// 3. Focus trap for mobile menu
useFocusTrap(isMobileMenuOpen, mobileMenuRef)
```

### Layer 5: Progressive Innovation (from innov-1)
Add only if bundle budget allows:

```typescript
// 1. View Transitions API with fallback
const navigate = (href: string) => {
  if ('startViewTransition' in document) {
    // @ts-ignore
    document.startViewTransition(() => router.push(href))
  } else {
    router.push(href)
  }
}

// 2. Basic prefetching (not full AI prediction)
const prefetchTopPages = () => {
  ['/stories', '/about', '/contact'].forEach(href => {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = href
    document.head.appendChild(link)
  })
}
```

## Implementation Checklist

### Must Have (Target: <30KB total)
- [ ] Component splitting from perf-2
- [ ] RAF-debounced scroll handling
- [ ] Intersection Observer for sticky header
- [ ] Basic ARIA labels and roles
- [ ] Skip navigation link
- [ ] Mobile menu with Sheet component
- [ ] Theme persistence to localStorage
- [ ] Passive event listeners
- [ ] Error boundaries

### Should Have (Target: <35KB total)
- [ ] Simple layout provider pattern
- [ ] Motion-safe animations
- [ ] Focus trap for mobile menu
- [ ] Live region announcements
- [ ] Basic ripple effects
- [ ] Smooth scroll to top
- [ ] Prefetch critical pages

### Nice to Have (Only if <40KB total)
- [ ] View Transitions API
- [ ] Event bus for components
- [ ] Advanced animations
- [ ] Container queries
- [ ] Voice navigation hints

### Avoid (Too Heavy)
- ❌ Full voice control system (adds ~8KB)
- ❌ AI navigation prediction (adds ~5KB)
- ❌ Complex animation libraries (adds ~6KB)
- ❌ Extensive provider nesting (adds ~3KB)
- ❌ Web Components exploration (adds ~10KB)

## File Structure

```
packages/web/src/components/layout/
├── Header.tsx              (~9KB target)
├── Footer.tsx              (~6KB target)
├── FooterSocialLinks.tsx   (~3KB target)
├── FooterTrustSignals.tsx  (~3KB target)
├── MainLayout.tsx          (~3KB target)
├── MobileNav.tsx           (~5KB target)
├── hooks/
│   ├── useScrollDirection.ts
│   ├── useFocusTrap.ts
│   └── useReducedMotion.ts
├── utils/
│   ├── announce.ts
│   ├── motionSafe.ts
│   └── performance.ts
└── index.ts
```

## Performance Targets

### Bundle Size
- Initial JavaScript: <35KB (gzipped)
- Total with dependencies: <40KB (strict limit)
- CSS: <20KB (critical path)

### Core Web Vitals
- LCP: <1.5s (1.2s target)
- FID: <80ms (50ms target)
- CLS: <0.08 (0.05 target)

### Lighthouse Scores
- Performance: 98+
- Accessibility: 98+
- Best Practices: 98+
- SEO: 98+

## Testing Strategy

### Unit Tests
```typescript
// Example test structure
describe('Header', () => {
  it('renders with default props')
  it('handles sticky scroll behavior')
  it('toggles mobile menu')
  it('persists theme choice')
  it('announces navigation to screen readers')
})
```

### Integration Tests
- Navigation flow
- Theme switching persistence
- Mobile menu interactions
- Skip navigation functionality

### Performance Tests
- Bundle size analysis
- Lighthouse CI checks
- Real device testing
- Network throttling tests

## Migration Path

1. **Week 1**: Implement base components from perf-2
2. **Week 2**: Add architecture patterns and accessibility
3. **Week 3**: Enhance with UX improvements
4. **Week 4**: Testing and optimization
5. **Week 5**: Progressive enhancement features

## Monitoring and Iteration

### Key Metrics to Track
- Bundle size per deployment
- Core Web Vitals in production
- Error rates
- User engagement with features
- Accessibility audit results

### Iteration Strategy
1. Deploy MVP with core features
2. Monitor real-world performance
3. Gradually add enhancements
4. A/B test new features
5. Remove underused features

## Conclusion

This synthesis approach balances all specialist perspectives while maintaining strict performance constraints. By starting with the leanest implementation and carefully layering enhancements, we can achieve an optimal solution that serves all users effectively.

The key is to resist the temptation to include every innovative feature. Instead, focus on delivering a fast, accessible, and delightful experience within the 40KB budget. Future iterations can explore more advanced features as browser support improves and performance budgets allow.