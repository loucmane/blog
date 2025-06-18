# Layout Components Iteration Specification

## Purpose
Generate multiple iterations of layout components (Header, Footer, MainLayout) for the Animal Protection Foundation blog, each exploring different design approaches while adhering to our established patterns and requirements.

## CRITICAL: TWES Context Loading
Before generating any iteration, EVERY Sub Agent MUST:
1. Read `/home/loucmane/dev/javascript/MomsBlog/blog/CLAUDE.md`
2. Load discovered patterns from `/home/loucmane/dev/javascript/MomsBlog/blog/docs/ai/shared-context/discovered-patterns/`
3. Study the four theme system at `/home/loucmane/dev/javascript/MomsBlog/blog/docs/ai/shared-context/themes/four-themes.md`
4. Review performance standards at `/home/loucmane/dev/javascript/MomsBlog/blog/docs/ai/shared-context/standards/performance.md`
5. Check accessibility standards at `/home/loucmane/dev/javascript/MomsBlog/blog/docs/ai/shared-context/standards/accessibility.md`
6. **STUDY EXISTING COMPONENTS**: 
   - Review `/home/loucmane/dev/javascript/MomsBlog/blog/packages/web/src/app/mockup/page.tsx` for visual style
   - Check `/home/loucmane/dev/javascript/MomsBlog/blog/packages/web/src/app/test/page.tsx` for component usage
   - Examine `/home/loucmane/dev/javascript/MomsBlog/blog/packages/web/src/components/ui/` for shadcn components
   - Understand the warm minimalism design philosophy

## Core Requirements (All Iterations Must Include)

### Design System Consistency (MANDATORY)
All iterations MUST fit with our existing design language:

**Visual Style Guidelines**:
- **Warm Minimalism**: Clean, compassionate, not sterile
- **Spacing**: Use consistent padding (p-4, p-6, p-8) matching existing pages
- **Typography**: Follow existing font sizes (text-sm, text-base, text-lg, text-xl, etc.)
- **Border Radius**: Use rounded-md for cards, rounded-lg for larger elements
- **Shadows**: Subtle shadows only (shadow-sm, shadow-md on hover)
- **Transitions**: Smooth, not jarring (transition-colors, transition-shadow)

**Component Consistency**:
- Match existing Button variants (default, secondary, outline, ghost, destructive)
- Use Card components for content grouping (as seen in mockup)
- Follow existing hover patterns (scale-105 for cards, color changes for links)
- Maintain visual hierarchy established in mockup page

**Reference Existing Patterns**:
```typescript
// From mockup page - sticky header pattern
<header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">

// From test page - consistent spacing
<div className="container mx-auto px-4 py-8">

// From existing components - hover states
<Card className="overflow-hidden hover:shadow-lg transition-shadow">
```

### Theme System Compliance (MANDATORY)
ALL components MUST work perfectly with our four themes:
1. **Light Theme**: Clean, professional appearance
2. **Dark Theme**: Comfortable for low-light viewing
3. **High Contrast**: WCAG AAA compliance for visual impairments
4. **Gentle Theme**: Reduced eye strain with warm tones

Theme Requirements:
- Use ONLY CSS variables from our theme system
- NEVER hardcode colors - use `text-primary`, `bg-background`, `text-muted-foreground`, etc.
- Test contrast ratios in all themes (especially high contrast)
- Ensure ThemeSwitcher from @minniewinnie/ui works seamlessly
- Use theme-aware classes like `hover:bg-accent hover:text-accent-foreground`

### TWES Pattern Compliance
Follow discovered patterns (92% confidence):
```typescript
// REQUIRED component structure
const Component = React.forwardRef<HTMLElement, ComponentProps>(
  ({ className, ...props }, ref) => {
    return (
      <element
        ref={ref}
        className={cn("base-classes", className)}
        {...props}
      >
        {/* content */}
      </element>
    )
  }
)
Component.displayName = 'ComponentName'
```

Import Order (MUST follow):
```typescript
// 1. React imports
import * as React from 'react'
// 2. External libraries
import { Menu } from 'lucide-react'
// 3. Monorepo packages
import { ThemeSwitcher } from '@minniewinnie/ui'
// 4. Local components
import { Button } from '@/components/ui/button'
// 5. Utils and types
import { cn } from '@/lib/utils'
```

### Technical Standards
- React.forwardRef pattern with displayName (NO EXCEPTIONS)
- TypeScript interfaces for all props
- 44px minimum touch targets (use min-h-[44px] min-w-[44px] or h-11 w-11)
- Proper ARIA landmarks and labels
- Semantic HTML structure (<header>, <nav>, <main>, <footer>)
- Mobile-first responsive design
- Integration with existing UI packages (@minniewinnie/ui)
- Use of shadcn/ui components
- Performance budget: <100KB initial JS bundle

### Functional Requirements
- Header with navigation and theme switcher
- Mobile navigation using Sheet component
- Footer with trust signals and links
- MainLayout wrapper combining header/footer
- Skip to content link for accessibility
- Sticky header option
- Emergency appeal support

## Design Constraints (What NOT to Do)
To maintain consistency with our existing design:

### ❌ AVOID:
- Radical departures from warm minimalism (no brutalism, no maximalism)
- Excessive animations or parallax effects
- Dark patterns or aggressive CTAs
- Complex gradients or busy backgrounds
- Non-standard spacing units
- Custom colors outside our theme system
- Overly playful or unprofessional elements

### ✅ INSTEAD:
- Subtle variations within our design language
- Micro-interactions that enhance usability
- Clear, compassionate CTAs
- Simple, elegant backgrounds
- Consistent spacing from Tailwind defaults
- Only theme system colors
- Professional yet warm and approachable

## Innovation Dimensions (Each Iteration Should Explore)

### Iteration Variables
Each iteration should vary ONE OR MORE of these aspects while maintaining core requirements AND design consistency:

1. **Visual Style** (within warm minimalism bounds)
   - Minimal: Like current mockup header (single line, subtle blur)
   - Rich: Add subtle background patterns or textures (still clean)
   - Different header heights (h-16 current, could try h-14 or h-20)
   - Footer organizations (current 4-column, try 3 or 5 columns)

2. **Navigation Patterns** (matching existing components)
   - Simple links: Like mockup page navigation
   - Dropdown groups: Using DropdownMenu from shadcn/ui
   - Mobile animations: Sheet sliding from right/left/bottom
   - Menu triggers: Hamburger (current) vs. "Menu" text button

3. **Trust Signal Presentation** (professional approach)
   - Icon + text badges (current Shield + "SSL Secured")
   - Logo grid of certifications
   - Testimonial integration in footer
   - Donation CTAs: Button in nav vs. dedicated banner

4. **Animation & Micro-interactions**
   - Different hover states
   - Various transition effects
   - Alternative loading states
   - Different scroll behaviors

5. **Emergency Appeal Integration**
   - Banner vs. Modal approaches
   - Different urgency indicators
   - Various call-to-action styles
   - Alternative placement strategies

6. **Component Architecture**
   - Different prop interfaces
   - Various customization options
   - Alternative composition patterns
   - Different state management approaches

## File Structure
Each iteration should create:
```
iteration-{number}/
├── Header.tsx
├── Footer.tsx
├── MainLayout.tsx
├── index.ts
└── README.md (describing the unique aspects)
```

## Naming Convention
- Directory: `iteration-{number}` (e.g., iteration-1, iteration-2)
- Components maintain same names but with unique implementations

## Quality Standards

### Code Quality Checklist (EVERY iteration MUST pass)
- [ ] Uses React.forwardRef with displayName for ALL components
- [ ] Follows exact import order pattern
- [ ] All interactive elements have 44px minimum touch targets
- [ ] Works perfectly in all 4 themes without color bleeding
- [ ] No hardcoded colors - only theme CSS variables
- [ ] Passes WCAG AA (AAA for high contrast theme)
- [ ] Semantic HTML with proper ARIA landmarks
- [ ] TypeScript with no `any` types
- [ ] Production-ready, not just concepts

### Performance Requirements
- [ ] Lighthouse Performance score > 98
- [ ] First Contentful Paint < 1.2s
- [ ] Total Blocking Time < 100ms
- [ ] Cumulative Layout Shift < 0.1
- [ ] Bundle size contribution < 50KB

### Testing Requirements
Each iteration MUST include a test checklist:
```markdown
## Theme Testing
- [ ] Light theme: All text readable, proper contrast
- [ ] Dark theme: No light bleed, comfortable viewing
- [ ] High contrast: WCAG AAA compliance verified
- [ ] Gentle theme: Warm tones applied correctly

## Responsive Testing  
- [ ] Mobile (320px): Navigation accessible, touch targets work
- [ ] Tablet (768px): Layout adapts properly
- [ ] Desktop (1280px): Full experience optimized

## Accessibility Testing
- [ ] Keyboard navigation works completely
- [ ] Screen reader announces all elements
- [ ] Focus indicators visible in all themes
- [ ] Skip links functional
```

## Evolution Pattern
- Early iterations: Focus on single dimension changes
- Middle iterations: Combine 2-3 dimensions
- Later iterations: Revolutionary approaches while maintaining usability

## Example Progressions
- Iteration 1: Minimal design with standard navigation
- Iteration 2: Rich design with mega menu
- Iteration 3: Animated transitions with unique mobile nav
- Iteration 4: Emergency-focused with prominent CTAs
- Iteration 5: Hybrid approach combining best elements

## Output Requirements
Each iteration must be:
- Fully functional and tested
- Self-contained with all dependencies
- Documented with unique features highlighted
- Compatible with existing codebase
- Ready for immediate use

## Theme Compliance Example
Every component MUST use theme-aware classes:
```typescript
// ❌ WRONG - Never hardcode colors
<div className="bg-white text-black border-gray-200">

// ✅ CORRECT - Use theme variables
<div className="bg-background text-foreground border-border">

// ❌ WRONG - Hardcoded hover colors
<button className="hover:bg-gray-100">

// ✅ CORRECT - Theme-aware hover
<button className="hover:bg-accent hover:text-accent-foreground">

// Emergency colors (also theme-aware)
<div className="bg-emergency text-emergency-foreground">
```

## Pre-Generation Validation
Before generating, Sub Agents MUST verify they understand:
1. The four theme system and CSS variables
2. React.forwardRef pattern with displayName
3. 44px touch target requirements
4. Import order conventions
5. Performance budgets

## Example Command with Full Context
```bash
/infinite spec_file=/home/loucmane/dev/javascript/MomsBlog/blog/specs/layout-components-spec.md output_dir=/home/loucmane/dev/javascript/MomsBlog/blog/packages/web/src/components/layout-iterations count=5
```

This will generate 5 iterations, each:
- Following all TWES patterns
- Working with all 4 themes
- Meeting performance standards
- Passing accessibility requirements
- Ready for production use