# Performance Standards

## Core Requirements

### Lighthouse Scores
**Target**: 98+ across all categories
- **Performance**: 98+
- **Accessibility**: 98+
- **Best Practices**: 98+
- **SEO**: 98+

### Core Web Vitals
- **LCP (Largest Contentful Paint)**: <1.2s
- **FID (First Input Delay)**: <100ms
- **CLS (Cumulative Layout Shift)**: <0.1

### Bundle Budget
- **Initial JavaScript**: <100KB
- **Total JavaScript**: <300KB
- **CSS**: <50KB
- **Fonts**: <100KB (subset and optimized)

## Implementation Strategies

### Code Splitting
```javascript
// Dynamic imports for routes
const BlogPost = dynamic(() => import('./BlogPost'), {
  loading: () => <PostSkeleton />
});

// Component lazy loading
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

### Image Optimization
- Use Next.js Image component
- Implement responsive images
- Convert to WebP/AVIF formats
- Lazy load below-the-fold images
- Use blur placeholders

### Critical CSS
- Inline critical styles
- Defer non-critical CSS
- Remove unused styles
- Use CSS modules for scoping

### JavaScript Optimization
- Tree shaking enabled
- Dead code elimination
- Minification and compression
- Defer non-critical scripts

## Monitoring and Testing

### Automated Testing
```bash
# Lighthouse CI configuration
lighthouse:
  collect:
    url:
      - http://localhost:3000/
      - http://localhost:3000/blog
      - http://localhost:3000/mockup
  assert:
    preset: lighthouse:recommended
    assertions:
      performance: ["error", {"minScore": 0.98}]
      accessibility: ["error", {"minScore": 0.98}]
```

### Real User Monitoring
- Implement web-vitals tracking
- Monitor actual user metrics
- Set up performance budgets
- Alert on regressions

### Performance Checklist
- [ ] Images optimized and lazy loaded
- [ ] Fonts subset and preloaded
- [ ] Critical CSS inlined
- [ ] JavaScript bundle analyzed
- [ ] Third-party scripts audited
- [ ] Caching headers configured
- [ ] Service worker implemented
- [ ] Compression enabled

## Emergency Performance Fixes

### Quick Wins
1. Enable Gzip/Brotli compression
2. Implement browser caching
3. Optimize images
4. Remove unused dependencies
5. Defer third-party scripts

### Investigation Tools
- Chrome DevTools Performance tab
- Lighthouse reports
- WebPageTest.org
- Bundle analyzer
- Coverage reports

## Performance Culture

### Development Practices
- Performance budget in CI/CD
- Regular performance audits
- Team performance training
- Performance-first mindset

### Code Review Checklist
- [ ] No synchronous network requests
- [ ] Images use Next Image component
- [ ] No layout shifts from dynamic content
- [ ] Animations use transform/opacity
- [ ] Third-party impact assessed

## Global Audience Considerations
- Optimize for 3G connections
- Test with network throttling
- Implement offline support
- Use CDN for global distribution
- Minimize external dependencies