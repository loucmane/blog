# Example: Emergency Appeal Banner Implementation

## Scenario
We need an emergency appeal banner for urgent animal rescue situations that appears site-wide but respects user preferences.

## Claude Code Bridge Prompt

```
Using Claude Code Bridge, implement an emergency appeal banner system:

Create a banner component that:
1. Displays urgent appeals for emergency animal rescue situations
2. Appears at the top of all pages when active
3. Can be dismissed but reappears after 24 hours for critical appeals
4. Respects user's motion preferences
5. Works offline with service worker caching

Technical requirements:
- Server component for initial render (RSC)
- Client component for interactions
- Local storage for dismissal state
- API endpoint for active appeals
- Semantic HTML with ARIA live regions

Create these files:
- components/EmergencyBanner/EmergencyBanner.tsx
- components/EmergencyBanner/EmergencyBanner.test.tsx
- components/EmergencyBanner/EmergencyBanner.stories.tsx
- app/api/emergency-appeals/route.ts
- hooks/useEmergencyAppeal.ts
- types/emergency-appeal.ts

Follow patterns from:
- Content sensitivity framework for appropriate imagery
- Progressive enhancement for offline support
- Animation principles for subtle appearance

workFolder: /home/user/MomsBlog/blog/packages/web
```

## Expected Output Structure

```
packages/web/src/
├── components/
│   └── EmergencyBanner/
│       ├── index.ts
│       ├── EmergencyBanner.tsx
│       ├── EmergencyBanner.test.tsx
│       ├── EmergencyBanner.stories.tsx
│       └── EmergencyBanner.module.css
├── hooks/
│   └── useEmergencyAppeal.ts
├── types/
│   └── emergency-appeal.ts
└── app/
    └── api/
        └── emergency-appeals/
            └── route.ts
```

## Key Implementation Details

### Component Structure
```typescript
// EmergencyBanner.tsx
export function EmergencyBanner() {
  // Server-side data fetching
  const appeal = await getActiveAppeal()
  
  if (!appeal) return null
  
  return (
    <EmergencyBannerClient appeal={appeal} />
  )
}

function EmergencyBannerClient({ appeal }: { appeal: EmergencyAppeal }) {
  // Client-side interactivity
  const [isDismissed, setIsDismissed] = useLocalStorage(...)
  
  // Respect motion preferences
  const prefersReducedMotion = usePrefersReducedMotion()
  
  // ARIA live region for screen readers
  return (
    <div role="alert" aria-live="polite" aria-atomic="true">
      {/* Banner content */}
    </div>
  )
}
```

### Progressive Enhancement
- Works without JavaScript (server-rendered)
- Dismissal requires JavaScript (enhancement)
- Offline support via service worker

## Testing Approach
1. Unit tests for dismissal logic
2. Integration tests for API endpoint
3. Visual regression tests for all themes
4. Accessibility audit with screen readers
5. Performance testing on slow connections

## Lessons Learned
- Claude Code Bridge excels at creating the full feature stack
- Providing clear file structure helps organization
- Referencing existing patterns ensures consistency
- Breaking into server/client components follows Next.js best practices