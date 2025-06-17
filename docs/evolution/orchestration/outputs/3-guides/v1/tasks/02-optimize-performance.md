# Guide: Optimize Performance

> **Time Estimate**: 3-5 hours
> **Complexity**: High
> **Prerequisites**: Understanding of Core Web Vitals, Next.js optimization features, and Chrome DevTools

## Overview

This guide helps you identify and fix performance issues to maintain 98+ Lighthouse scores. We'll cover common performance bottlenecks and optimization techniques specific to our blog platform.

## Pre-Flight Performance Audit

### Step 1: Baseline Measurement

```bash
# 1. Build production version
pnpm build

# 2. Start production server
pnpm start

# 3. Run Lighthouse audit
npx lighthouse http://localhost:3000 \
  --view \
  --preset=desktop \
  --output=json \
  --output-path=./lighthouse-baseline.json
```

### Step 2: Identify Problem Areas

Open Chrome DevTools and check:
- **Performance Tab**: Record page load
- **Network Tab**: Check resource sizes
- **Coverage Tab**: Find unused code
- **Rendering Tab**: Check for layout shifts

## Common Performance Issues and Solutions

### Issue 1: Large JavaScript Bundles

#### Diagnosis
```bash
# Analyze bundle composition
pnpm build
pnpm analyze
```

Look for:
- Large dependencies
- Duplicate code
- Unused exports

#### Solution: Code Splitting

```typescript
// ❌ Bad: Import everything upfront
import { HeavyComponent } from '@/components/HeavyComponent'

// ✅ Good: Dynamic import
const HeavyComponent = dynamic(
  () => import('@/components/HeavyComponent'),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false // if client-only
  }
)
```

#### Solution: Tree Shaking

```typescript
// ❌ Bad: Import entire library
import * as Icons from 'lucide-react'

// ✅ Good: Import specific icons
import { Heart, Share2, MessageCircle } from 'lucide-react'
```

### Issue 2: Unoptimized Images

#### Diagnosis
Check Network tab for:
- Large image files
- Non-WebP formats
- Missing dimensions

#### Solution: Next.js Image Component

```typescript
// ❌ Bad: Regular img tag
<img src="/hero.jpg" alt="Hero" />

// ✅ Good: Optimized Image component
import Image from 'next/image'

<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority // for above-the-fold
  placeholder="blur"
  blurDataURL={blurDataURL}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

#### Generate Blur Placeholders

```typescript
// utils/generateBlurPlaceholder.ts
import { getPlaiceholder } from 'plaiceholder'

export async function getBlurDataURL(src: string) {
  try {
    const { base64 } = await getPlaiceholder(src, { size: 10 })
    return base64
  } catch {
    return undefined
  }
}
```

### Issue 3: Render Blocking Resources

#### Diagnosis
Look for:
- Fonts loading slowly
- CSS blocking render
- Third-party scripts

#### Solution: Font Optimization

```typescript
// app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Prevent FOIT
  preload: true,
  fallback: ['system-ui', 'arial'],
  adjustFontFallback: true, // Reduce CLS
})
```

#### Solution: Critical CSS

```typescript
// For truly critical styles, inline them
export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Critical styles only */
            body { margin: 0; font-family: system-ui; }
            .container { max-width: 1200px; margin: 0 auto; }
          `
        }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

### Issue 4: Poor Caching Strategy

#### Solution: Implement Proper Caching

```typescript
// app/blog/[slug]/page.tsx
async function getPost(slug: string) {
  const res = await fetch(`${API_URL}/posts/${slug}`, {
    next: { 
      revalidate: 3600, // 1 hour cache
      tags: ['posts', `post:${slug}`]
    }
  })
  return res.json()
}

// API route for on-demand revalidation
// app/api/revalidate/route.ts
import { revalidateTag } from 'next/cache'

export async function POST(request: Request) {
  const { tag } = await request.json()
  revalidateTag(tag)
  return Response.json({ revalidated: true })
}
```

### Issue 5: Cumulative Layout Shift (CLS)

#### Diagnosis
- Use Chrome DevTools Performance tab
- Look for unexpected layout shifts
- Check for dynamic content without reserved space

#### Solution: Reserve Space

```typescript
// ❌ Bad: Dynamic content without space
{isLoading ? <Spinner /> : <Content />}

// ✅ Good: Reserved space with skeleton
<div className="min-h-[400px]">
  {isLoading ? <ContentSkeleton /> : <Content />}
</div>

// ✅ Good: Aspect ratio for images
<div className="relative aspect-video">
  <Image
    src={src}
    alt={alt}
    fill
    className="object-cover"
  />
</div>
```

### Issue 6: Slow Initial Load

#### Solution: Implement Progressive Enhancement

```typescript
// 1. Static shell loads instantly
export default async function BlogPage() {
  return (
    <div className="container">
      <h1>Blog</h1>
      <Suspense fallback={<BlogGridSkeleton />}>
        <BlogPosts />
      </Suspense>
    </div>
  )
}

// 2. Content streams in
async function BlogPosts() {
  const posts = await getPosts()
  return <BlogGrid posts={posts} />
}
```

## Advanced Optimization Techniques

### 1. Implement Service Worker

```typescript
// public/sw.js
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('v1').then((cache) => {
      return cache.addAll([
        '/',
        '/offline',
        '/manifest.json',
      ])
    })
  )
})

// app/layout.tsx
useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
  }
}, [])
```

### 2. Optimize Third-Party Scripts

```typescript
// Load non-critical scripts after page load
const loadScript = () => {
  const script = document.createElement('script')
  script.src = 'https://analytics.example.com/script.js'
  script.async = true
  document.body.appendChild(script)
}

useEffect(() => {
  // Load after interaction or delay
  if ('requestIdleCallback' in window) {
    requestIdleCallback(loadScript)
  } else {
    setTimeout(loadScript, 1)
  }
}, [])
```

### 3. Implement Resource Hints

```typescript
// app/layout.tsx
export default function RootLayout() {
  return (
    <html>
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://cdn.example.com" />
        
        {/* Preload critical resources */}
        <link 
          rel="preload" 
          href="/fonts/inter-var.woff2" 
          as="font" 
          type="font/woff2" 
          crossOrigin="anonymous" 
        />
      </head>
    </html>
  )
}
```

## Performance Monitoring Setup

### 1. Web Vitals Tracking

```typescript
// app/components/WebVitals.tsx
'use client'

import { useReportWebVitals } from 'next/web-vitals'

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Send to analytics
    console.log(metric)
    
    // Alert on poor metrics
    if (metric.name === 'CLS' && metric.value > 0.1) {
      console.warn('High CLS detected:', metric.value)
    }
  })
  
  return null
}
```

### 2. Custom Performance Marks

```typescript
// utils/performance.ts
export function measureComponent(name: string) {
  if (typeof window === 'undefined') return
  
  performance.mark(`${name}-start`)
  
  return () => {
    performance.mark(`${name}-end`)
    performance.measure(name, `${name}-start`, `${name}-end`)
    
    const measure = performance.getEntriesByName(name)[0]
    console.log(`${name} took ${measure.duration}ms`)
  }
}

// Usage in component
useEffect(() => {
  const endMeasure = measureComponent('HeavyComponent')
  // Component logic
  return endMeasure
}, [])
```

## Performance Checklist

### Before Every Deploy

```bash
# Automated checks
- [ ] pnpm build (check build size warnings)
- [ ] pnpm analyze (review bundle composition)
- [ ] Run Lighthouse CI
- [ ] Check Core Web Vitals

# Manual checks
- [ ] Test on 3G connection
- [ ] Test on low-end device
- [ ] Verify no layout shifts
- [ ] Check all images optimized
```

### Performance Budget

```javascript
// next.config.js
module.exports = {
  experimental: {
    webpackBuildWorker: true,
  },
  // Fail build if bundles exceed limits
  webpack: (config) => {
    config.performance = {
      maxAssetSize: 100000, // 100KB
      maxEntrypointSize: 300000, // 300KB
    }
    return config
  }
}
```

## Debugging Performance Issues

### 1. Chrome DevTools Workflow

```markdown
1. Open DevTools → Performance tab
2. Click record and reload page
3. Stop recording after page loads
4. Analyze:
   - Main thread activity
   - Network waterfall
   - Layout thrashing
   - Long tasks
```

### 2. React DevTools Profiler

```markdown
1. Install React DevTools extension
2. Open Profiler tab
3. Start profiling and interact with page
4. Look for:
   - Components rendering frequently
   - Slow render times
   - Unnecessary re-renders
```

### 3. Bundle Analysis

```bash
# Generate bundle analysis
ANALYZE=true pnpm build

# Review output for:
- Duplicate dependencies
- Large libraries
- Unused code
- Polyfills
```

## Common Pitfalls to Avoid

### ❌ Don't

```typescript
// Loading entire libraries
import _ from 'lodash'

// Inline large data
const HUGE_ARRAY = [...10000 items]

// Complex calculations in render
const filtered = items.filter(complexFilter)

// Multiple state updates
setLoading(true)
setError(null)
setData(null)
```

### ✅ Do

```typescript
// Import specific functions
import debounce from 'lodash/debounce'

// Load data asynchronously
const data = await import('./data.json')

// Memoize expensive operations
const filtered = useMemo(
  () => items.filter(complexFilter),
  [items]
)

// Batch state updates
setState(prev => ({
  ...prev,
  loading: true,
  error: null,
  data: null
}))
```

## Emergency Performance Fixes

If Lighthouse scores drop below 98:

### Quick Wins (15 minutes)
1. Enable text compression (gzip/brotli)
2. Set proper cache headers
3. Lazy load below-fold images
4. Remove unused CSS/JS

### Medium Fixes (1 hour)
1. Implement code splitting
2. Optimize images with next/image
3. Reduce JavaScript execution time
4. Fix cumulative layout shift

### Deep Fixes (2+ hours)
1. Refactor component architecture
2. Implement service worker
3. Server-side render critical content
4. Optimize database queries

## Testing Performance Changes

### A/B Testing Approach

```typescript
// utils/performanceTest.ts
export async function comparePerformance(
  testFn: () => Promise<void>,
  iterations = 5
) {
  const results = []
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    await testFn()
    const end = performance.now()
    results.push(end - start)
  }
  
  return {
    avg: results.reduce((a, b) => a + b) / results.length,
    min: Math.min(...results),
    max: Math.max(...results),
  }
}
```

## Resources

- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
- [Web.dev Performance Guide](https://web.dev/performance/)
- [Next.js Optimization](https://nextjs.org/docs/app/building-your-application/optimizing)
- Internal: `/docs/ai/shared-context/standards/performance.md`

## Next Steps

1. Set up performance monitoring dashboard
2. Create performance regression tests
3. Document performance wins
4. Share learnings with team