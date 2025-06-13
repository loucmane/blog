# shadcn/ui Components Registry

This document tracks all installed shadcn/ui components and their usage across the project.

## Installation Status

### Installed Components ✅

| Component | Install Date | Location | Used In | Test Status |
|-----------|--------------|----------|---------|-------------|
| Button | 2025-06-09 | `web/src/components/ui/button.tsx` | `/test` page | ⏳ Testing pending |
| Card | 2025-06-09 | `web/src/components/ui/card.tsx` | `/test` page, `/mockup` (bento grid) | ⏳ Testing pending |
| Input | 2025-06-09 | `web/src/components/ui/input.tsx` | `/test` page | ⏳ Testing pending |
| Dialog | 2025-06-09 | `web/src/components/ui/dialog.tsx` | `/test` page | ⏳ Testing pending |
| Sheet | 2025-06-09 | `web/src/components/ui/sheet.tsx` | `/test` page | ⏳ Testing pending |
| Badge | 2025-06-10 | `web/src/components/ui/badge.tsx` | `/mockup` (category tags) | ⏳ Testing pending |
| Avatar | 2025-06-10 | `web/src/components/ui/avatar.tsx` | `/mockup` (author profiles) | ⏳ Testing pending |
| Tabs | 2025-06-10 | `web/src/components/ui/tabs.tsx` | `/mockup` (content sections) | ⏳ Testing pending |
| Progress | 2025-06-10 | `web/src/components/ui/progress.tsx` | `/mockup` (reading progress) | ⏳ Testing pending |
| Skeleton | 2025-06-10 | `web/src/components/ui/skeleton.tsx` | `/mockup` (loading states) | ⏳ Testing pending |
| ScrollArea | 2025-06-10 | `web/src/components/ui/scroll-area.tsx` | `/mockup` (category pills) | ⏳ Testing pending |
| Separator | 2025-06-10 | `web/src/components/ui/separator.tsx` | `/mockup` (section dividers) | ⏳ Testing pending |
| DropdownMenu | 2025-06-10 | `web/src/components/ui/dropdown-menu.tsx` | `/mockup` (post actions) | ⏳ Testing pending |
| Popover | 2025-06-10 | `web/src/components/ui/popover.tsx` | `/mockup` (info tooltips) | ⏳ Testing pending |
| Command | 2025-06-10 | `web/src/components/ui/command.tsx` | `/mockup` (⌘K search) | ⏳ Testing pending |
| Switch | 2025-06-10 | `web/src/components/ui/switch.tsx` | `/mockup` (theme toggle) | ⏳ Testing pending |
| HoverCard | 2025-06-10 | `web/src/components/ui/hover-card.tsx` | `/mockup` (author previews) | ⏳ Testing pending |
| AspectRatio | 2025-06-10 | `web/src/components/ui/aspect-ratio.tsx` | `/mockup` (media sizing) | ⏳ Testing pending |
| Select | 2025-06-13 | `web/src/components/ui/select.tsx` | `/test` page (country selector) | ⏳ Testing pending |
| Textarea | 2025-06-13 | `web/src/components/ui/textarea.tsx` | `/test` page (multi-line input) | ⏳ Testing pending |
| Checkbox | 2025-06-13 | `web/src/components/ui/checkbox.tsx` | `/test` page (form controls) | ⏳ Testing pending |
| Alert | 2025-06-13 | `web/src/components/ui/alert.tsx` | `/test` page (notifications) | ⏳ Testing pending |
| Toast | 2025-06-13 | `web/src/components/ui/toast.tsx` | `/test` page (user feedback) | ⏳ Testing pending |
| Toaster | 2025-06-13 | `web/src/components/ui/toaster.tsx` | `/test` page (toast container) | ⏳ Testing pending |

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

### Modern Blog Mockup Component Usage Map 🎨

This section documents how each component will be used in the modern blog mockup page.

#### Badge
- **Purpose**: Category tags, content classification levels
- **Location**: Blog post cards, content warnings
- **Example**: "Technology" tag, "Level 2 Content" warning, "New" indicator

#### Avatar
- **Purpose**: Author profiles, user testimonials
- **Location**: Blog post bylines, comment sections, testimonial cards
- **Example**: Author avatar with fallback initials

#### Tabs
- **Purpose**: Content organization, view switching
- **Location**: Homepage sections (Latest/Popular/Categories)
- **Example**: Switch between different blog categories or content types

#### Progress
- **Purpose**: Reading progress indicator, donation goal tracking
- **Location**: Top of article pages, campaign progress bars
- **Example**: Thin bar showing current reading position (0-100%)

#### Skeleton
- **Purpose**: Loading states for content
- **Location**: Blog cards while loading, image placeholders
- **Example**: Animated placeholder shapes for text and images

#### ScrollArea
- **Purpose**: Horizontal scrolling for category pills
- **Location**: Category navigation section
- **Example**: Smooth horizontal scroll with scroll-snap-type

#### Separator
- **Purpose**: Visual content division
- **Location**: Between blog sections, footer sections, content breaks
- **Example**: Subtle line with proper spacing

#### DropdownMenu
- **Purpose**: User actions, post options
- **Location**: Three-dot menus on cards, navigation overflow
- **Example**: Share, Save, Report, Edit options

#### Popover
- **Purpose**: Additional info without navigation
- **Location**: Info icons, help tooltips, content warnings
- **Example**: Hover to see content sensitivity details

#### Command (⌘K)
- **Purpose**: Global search and navigation palette
- **Location**: Accessible from anywhere via Cmd+K or Ctrl+K
- **Example**: Search posts, jump to sections, execute actions

#### Switch
- **Purpose**: Theme toggle, preference switches
- **Location**: Header for theme switching, settings toggles
- **Example**: Dark/Light mode toggle with smooth transition

#### HoverCard
- **Purpose**: Rich previews on hover
- **Location**: Author names, related post links
- **Example**: Show author bio and recent posts on hover

#### AspectRatio
- **Purpose**: Consistent media dimensions
- **Location**: Blog post featured images, video embeds
- **Example**: 16:9 for videos, 3:2 for blog images, 1:1 for avatars

#### Select Component
- [ ] Opens dropdown when clicked
- [ ] Shows all options properly
- [ ] Allows selection of item
- [ ] Updates value when selected
- [ ] Placeholder text shows when empty
- [ ] Keyboard navigation works (arrow keys)
- [ ] Can be disabled
- [ ] Theme switching updates colors

#### Textarea Component
- [ ] Accepts multi-line text input
- [ ] Rows prop adjusts height
- [ ] Placeholder shows when empty
- [ ] Resizes properly (if enabled)
- [ ] Can be disabled
- [ ] Character limit works (if set)
- [ ] Focus states are visible
- [ ] Theme switching updates colors

#### Checkbox Component
- [ ] Can be checked/unchecked
- [ ] onCheckedChange fires properly
- [ ] Can be in indeterminate state
- [ ] Disabled state prevents interaction
- [ ] Label click toggles checkbox
- [ ] Keyboard navigation (space) works
- [ ] Focus states are visible
- [ ] Theme switching updates colors

#### Alert Component
- [ ] Default variant renders correctly
- [ ] Destructive variant shows proper styling
- [ ] Title and description display properly
- [ ] Custom styling works (warning/success)
- [ ] Icon support (if applicable)
- [ ] Theme switching updates colors

#### Toast Component
- [ ] Toast appears when triggered
- [ ] Auto-dismisses after timeout
- [ ] Can be manually dismissed
- [ ] Multiple toasts stack properly
- [ ] Different variants work
- [ ] Position is correct
- [ ] Animation is smooth
- [ ] Theme switching updates colors

### Planned Components 📋

| Component | Priority | Purpose | Notes |
|-----------|----------|---------|-------|
| Radio Group | Medium | Form options | For donation frequency |
| Tooltip | Low | Help text | For complex forms |
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