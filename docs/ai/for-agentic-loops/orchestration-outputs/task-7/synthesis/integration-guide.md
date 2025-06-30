# Integration Guide for Task 7 Synthesized Components

## Overview

This guide provides step-by-step instructions for integrating the synthesized core layout components into your Next.js application. The implementation combines the best practices from all specialist perspectives while maintaining a strict 40KB bundle budget.

## Component Architecture

```
packages/web/src/components/layout/
├── Header.tsx              (~9KB) - Main navigation header
├── Footer.tsx              (~6KB) - Site footer with lazy-loaded sections
├── FooterSocialLinks.tsx   (~3KB) - Social media links (code-split)
├── FooterTrustSignals.tsx  (~3KB) - Trust badges (code-split)
├── MainLayout.tsx          (~3KB) - Layout wrapper component
├── MobileNav.tsx           (~5KB) - Mobile navigation sheet
├── hooks/                  - Reusable React hooks
├── utils/                  - Utility functions
├── providers/              - Context providers
└── index.ts               - Public exports
```

## Quick Start

### 1. Basic Usage

```tsx
// app/layout.tsx
import { MainLayout } from '@/components/layout'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <MainLayout>
          {children}
        </MainLayout>
      </body>
    </html>
  )
}
```

### 2. Custom Navigation Items

```tsx
// app/layout.tsx
import { MainLayout, NavItem } from '@/components/layout'

const customNavItems: NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/stories', label: 'Rescue Stories' },
  { href: '/donate', label: 'Donate', highlight: true },
  { href: 'https://twitter.com/us', label: 'Twitter', external: true }
]

<MainLayout 
  headerProps={{ 
    navItems: customNavItems,
    showDonateButton: true,
    emergencyBanner: <EmergencyAppeal />
  }}
/>
```

### 3. Footer Customization

```tsx
<MainLayout 
  footerProps={{
    showSocialLinks: true,
    showTrustSignals: true,
    customLinks: [
      {
        title: 'About Us',
        links: [
          { href: '/mission', label: 'Our Mission' },
          { href: '/team', label: 'Our Team' }
        ]
      }
    ]
  }}
/>
```

## Feature Integration

### Sticky Header Behavior

The header automatically hides on scroll down and shows on scroll up:

```tsx
// Already implemented by default
<Header sticky={true} />

// To disable sticky behavior
<Header sticky={false} />
```

### Mobile Navigation

Mobile navigation uses the Sheet component from shadcn/ui:

```tsx
// Mobile menu is automatically triggered on small screens
// Customize breakpoint in tailwind.config.js if needed
```

### Theme Persistence

Theme switching is handled by the `ThemeSwitcher` component from `@minniewinnie/ui`:

```tsx
// Theme persists to localStorage automatically
// Respects system preference by default
```

### View Transitions API

Navigation uses the View Transitions API with automatic fallback:

```tsx
// All internal links automatically use View Transitions
// External links open in new tabs with proper security
```

### Accessibility Features

All components include comprehensive accessibility features:

```tsx
// Skip navigation link (automatic)
// Focus trap in mobile menu (automatic)
// ARIA labels and roles (built-in)
// 44px touch targets (enforced)
```

## Performance Optimizations

### Code Splitting

Footer components are automatically code-split:

```tsx
// FooterSocialLinks and FooterTrustSignals load on demand
// No configuration needed
```

### Lazy Loading

Use dynamic imports for heavy page components:

```tsx
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>Loading...</div>,
  ssr: false // If not needed for SEO
})
```

### Prefetching

Critical pages are automatically prefetched:

```tsx
// These pages are prefetched by default:
// - /stories
// - /about  
// - /donate

// Add custom prefetch targets:
import { prefetchCriticalPages } from '@/components/layout'

prefetchCriticalPages(['/custom-page-1', '/custom-page-2'])
```

## Advanced Configuration

### Layout Provider

Access layout configuration throughout your app:

```tsx
import { useLayoutConfig } from '@/components/layout'

function MyComponent() {
  const { config, updateConfig } = useLayoutConfig()
  
  // Read config
  console.log(config.header.sticky)
  
  // Update config
  updateConfig({
    header: { sticky: false }
  })
}
```

### Custom Event System

Communicate between layout components:

```tsx
import { useLayoutEvent, emitLayoutEvent } from '@/components/layout'

// Listen for events
useLayoutEvent('navigation', (event) => {
  console.log('Navigation to:', event.detail)
})

// Emit events
emitLayoutEvent('navigation', { path: '/stories' })
```

### Motion Preferences

Respect user motion preferences:

```tsx
import { motionSafe, useReducedMotion } from '@/components/layout'

// CSS classes
<div className={motionSafe('transition-all duration-300')} />

// Hook
const prefersReducedMotion = useReducedMotion()
```

### Screen Reader Announcements

Announce dynamic content changes:

```tsx
import { announce } from '@/components/layout'

// Polite announcement
announce('Form submitted successfully')

// Assertive announcement
announce('Error: Invalid email', 'assertive')
```

## Testing

### Unit Testing

```tsx
import { render, screen } from '@testing-library/react'
import { Header } from '@/components/layout'

test('renders navigation links', () => {
  render(<Header />)
  expect(screen.getByText('Rescue Stories')).toBeInTheDocument()
})
```

### Accessibility Testing

```tsx
import { axe } from '@axe-core/react'

test('has no accessibility violations', async () => {
  const { container } = render(<MainLayout>Content</MainLayout>)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

### Performance Testing

```bash
# Run Lighthouse CI
npm run lighthouse

# Check bundle size
npm run analyze
```

## Migration from Existing Components

### From Old Header

```tsx
// Before
<OldHeader logo="/logo.png" links={links} />

// After
<Header navItems={links.map(link => ({
  href: link.url,
  label: link.text,
  external: link.isExternal
}))} />
```

### From Old Footer

```tsx
// Before
<OldFooter copyright="© 2024" socialLinks={social} />

// After
<Footer 
  showSocialLinks={true}
  showTrustSignals={false}
/>
```

## Troubleshooting

### Bundle Size Issues

If bundle size exceeds 40KB:

1. Check for duplicate dependencies
2. Ensure tree-shaking is working
3. Verify dynamic imports are used
4. Run bundle analyzer: `npm run analyze`

### Sticky Header Glitches

If header behavior is jumpy:

1. Ensure no CSS conflicts with `position: sticky`
2. Check z-index stacking
3. Verify scroll event throttling is working

### Mobile Menu Not Opening

1. Check Sheet component is installed
2. Verify button aria-expanded state
3. Ensure no JavaScript errors in console

### Theme Not Persisting

1. Check localStorage permissions
2. Verify ThemeSwitcher is properly imported
3. Clear localStorage and retry

## Best Practices

### Performance

- Use `React.memo` for components with stable props
- Implement `useCallback` for event handlers
- Lazy load below-the-fold content
- Monitor Core Web Vitals regularly

### Accessibility

- Test with keyboard navigation
- Use screen reader testing tools
- Maintain 4.5:1 color contrast ratios
- Ensure all images have alt text

### SEO

- Keep header content consistent
- Use semantic HTML structure
- Implement proper meta tags
- Ensure footer links are crawlable

### Maintenance

- Document any customizations
- Keep dependencies updated
- Monitor bundle size on each deploy
- Run accessibility audits monthly

## Support

For issues or questions:

1. Check the troubleshooting section
2. Review the synthesis decisions document
3. Consult the evaluation reports
4. File an issue with reproduction steps

## Future Enhancements

Planned improvements (pending bundle budget):

- [ ] Advanced animation system
- [ ] Voice control integration
- [ ] AI-powered navigation ordering
- [ ] Extended theme customization
- [ ] Plugin system for extensions

Remember: Performance and accessibility are not features—they're requirements.