# shadcn/ui Components Registry

This document tracks all installed shadcn/ui components and their usage across the project.

## Installation Status

### Installed Components ✅

| Component | Install Date | Location | Used In | Test Status |
|-----------|--------------|----------|---------|-------------|
| Button | 2025-06-09 | `web/src/components/ui/button.tsx` | `/test` page | ⏳ Testing pending |
| Card | 2025-06-09 | `web/src/components/ui/card.tsx` | `/test` page | ⏳ Testing pending |
| Input | 2025-06-09 | `web/src/components/ui/input.tsx` | `/test` page | ⏳ Testing pending |
| Dialog | 2025-06-09 | `web/src/components/ui/dialog.tsx` | `/test` page | ⏳ Testing pending |
| Sheet | 2025-06-09 | `web/src/components/ui/sheet.tsx` | `/test` page | ⏳ Testing pending |

### Test Checklist

#### Button Component
- [ ] Default variant renders correctly
- [ ] Secondary variant works
- [ ] Destructive variant shows proper styling
- [ ] Outline variant displays correctly
- [ ] Ghost variant is subtle
- [ ] Link variant looks like a link
- [ ] Size variations (sm, default, lg) work
- [ ] Disabled state prevents interaction
- [ ] onClick handlers fire properly
- [ ] Theme switching updates colors

#### Card Component
- [ ] Basic card structure renders
- [ ] CardHeader displays properly
- [ ] CardTitle shows correctly
- [ ] CardDescription is styled appropriately
- [ ] CardContent has proper spacing
- [ ] CardFooter aligns correctly
- [ ] Nested cards work
- [ ] Theme switching updates colors

#### Input Component
- [ ] Text input accepts typing
- [ ] Email type validates properly
- [ ] Number type restricts to numbers
- [ ] Placeholder text shows
- [ ] Disabled state prevents input
- [ ] Focus states are visible
- [ ] Theme switching updates colors

#### Dialog Component
- [ ] Opens when trigger clicked
- [ ] Closes on backdrop click
- [ ] Close button works
- [ ] Content scrolls if needed
- [ ] Keyboard navigation (Esc to close)
- [ ] Focus trap works
- [ ] Theme switching updates colors

#### Sheet Component
- [ ] Opens from side when triggered
- [ ] Closes on backdrop click
- [ ] Close button works
- [ ] Content scrolls if needed
- [ ] Keyboard navigation works
- [ ] Focus trap works
- [ ] Theme switching updates colors

### Planned Components 📋

| Component | Priority | Purpose | Notes |
|-----------|----------|---------|-------|
| Select | High | Form dropdowns | For donation amounts, country selection |
| Textarea | High | Multi-line input | For messages, stories |
| Checkbox | High | Form controls | For consent, preferences |
| Radio Group | Medium | Form options | For donation frequency |
| Alert | High | Notifications | For emergency appeals, warnings |
| Badge | Medium | Status indicators | For content classification |
| Progress | Medium | Loading states | For donation goals |
| Skeleton | Low | Loading states | For content loading |
| Toast | High | User feedback | For form submissions |
| Tooltip | Low | Help text | For complex forms |
| Separator | Low | Visual dividers | For content sections |
| Avatar | Low | User profiles | For testimonials |
| Tabs | Medium | Content organization | For different content types |
| Accordion | Low | Collapsible content | For FAQs |

## Component Configuration

### Theme Integration
All components should work with our 4-theme system:
- Light theme - Warm cream background
- Dark theme - Dark mode colors
- High contrast theme - Black background, white text
- Gentle theme - Soft sand background

### CSS Variable Mapping
Components use these CSS variables from `globals.css`:
- `--background`, `--foreground`
- `--primary`, `--primary-foreground`
- `--secondary`, `--secondary-foreground`
- `--muted`, `--muted-foreground`
- `--accent`, `--accent-foreground`
- `--destructive`, `--destructive-foreground`
- `--border`, `--input`, `--ring`

### Accessibility Requirements
- Keyboard navigation must work
- ARIA labels must be present
- Focus indicators must be visible
- Screen reader compatibility required

## Usage Guidelines

### Import Pattern
```tsx
import { ComponentName } from '@/components/ui/component-name'
```

### Theme Provider Import
```tsx
import { useTheme } from '@minniewinnie/ui/providers/ThemeProvider'
```

### Component Customization
- Use `className` prop for additional styling
- Leverage variant props for different styles
- Apply size props where available
- Respect the design system tokens

## Maintenance Process

### Adding New Components
1. Navigate to `packages/web` directory
2. Run `pnpm dlx shadcn@latest add [component-name]`
3. Update this document with:
   - Installation date
   - Component location
   - Initial test checklist
4. Add component to `/test` page for testing
5. Test with all 4 themes
6. Update test status after verification

### Updating Components
1. Check shadcn/ui changelog for updates
2. Re-run installation command if needed
3. Test for breaking changes
4. Update documentation

### Version Information
- shadcn/ui CLI: latest (using canary for some features)
- Style: New York
- Base color: Neutral
- CSS variables: Enabled
- Tailwind config: Extended from UI package

## Testing Protocol

### Manual Testing Steps
1. Visit `/test` page in development
2. Test each component interaction
3. Switch between all 4 themes
4. Verify styles update correctly
5. Test keyboard navigation
6. Check responsive behavior
7. Test with screen reader (if available)

### Known Issues
- None yet (testing pending)

## Related Documentation
- [Design System Overview](/docs/architecture/design-system.md)
- [Monorepo Structure](/docs/architecture/monorepo-structure.md)
- [Component Test Page](/test)
- [shadcn/ui Documentation](https://ui.shadcn.com)