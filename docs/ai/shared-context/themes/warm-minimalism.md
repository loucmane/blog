# Warm Minimalism Design Philosophy

## Core Principles

### 1. Emotional Warmth
- **Color Temperature**: Favor warm tones over cold grays
- **Backgrounds**: Cream (#FDFCFA) instead of pure white in light theme
- **Accents**: Earth tones and muted pastels
- **Typography**: Readable, approachable font choices

### 2. Visual Simplicity
- **Clean Layouts**: Generous whitespace, clear hierarchy
- **Minimal Ornamentation**: Function over decoration
- **Focus on Content**: Design should never overshadow the message
- **Progressive Disclosure**: Show only what's needed when it's needed

### 3. Accessibility First
- **WCAG AA Compliance**: Minimum standard for all components
- **Color Contrast**: Carefully tested for readability
- **Keyboard Navigation**: Full functionality without mouse
- **Screen Reader Support**: Semantic HTML and ARIA labels

### 4. Performance Excellence
- **Lighthouse Scores**: Target 98+ across all metrics
- **Bundle Size**: <100KB initial JavaScript
- **Core Web Vitals**: LCP <1.2s, FID <100ms, CLS <0.1
- **Global Accessibility**: Optimized for slow connections

## Implementation in Code

### Color System
```css
/* Light Theme */
--background: 27 20% 98%;      /* Warm cream */
--foreground: 27 5% 11%;       /* Soft black */

/* Dark Theme */
--background: 27 10% 10%;      /* Warm dark */
--foreground: 27 5% 90%;       /* Soft white */

/* Gentle Theme */
--background: 39 31% 88%;      /* Sand */
--foreground: 39 5% 15%;       /* Dark sand */

/* Contrast Theme */
--background: 0 0% 0%;         /* Pure black */
--foreground: 0 0% 100%;       /* Pure white */
```

### Typography Scale
- **Base**: 16px (1rem)
- **Scale**: 1.125 (Major Second)
- **Line Height**: 1.5-1.75 for body text
- **Max Width**: 65-75ch for readability

### Spacing System
- **Base Unit**: 4px
- **Scale**: 4, 8, 12, 16, 24, 32, 48, 64, 96
- **Consistent**: Same scale across all breakpoints

## Component Guidelines

### Buttons
- Subtle shadows instead of harsh borders
- Smooth transitions (200-300ms)
- Clear hover/focus states
- Adequate touch targets (min 44x44px)

### Cards
- Soft shadows for depth
- Rounded corners (4-8px)
- Clear content hierarchy
- Responsive padding

### Forms
- Clear labels and helpful placeholders
- Inline validation with gentle feedback
- Accessible error messages
- Logical tab order

## Animation Principles
- **Purpose**: Every animation should have meaning
- **Duration**: 200-400ms for most transitions
- **Easing**: Natural curves (ease-out for most cases)
- **Respect Preferences**: Honor prefers-reduced-motion

## Content Considerations
- **Trauma-Informed**: Gentle transitions, no sudden changes
- **Predictable**: Users should never be surprised
- **Forgiving**: Easy to recover from mistakes
- **Encouraging**: Positive feedback and clear next steps