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

## Design Philosophy in Practice

### Visual Harmony
- **Balance**: Every element has purpose and breathing room
- **Rhythm**: Consistent spacing creates visual flow
- **Contrast**: Subtle differences guide the eye
- **Unity**: All elements feel part of the same system

### Emotional Design
- **Comfort**: Familiar patterns reduce cognitive load
- **Trust**: Consistent behavior builds confidence
- **Joy**: Small delights without overwhelming
- **Calm**: Predictable interactions reduce anxiety

### Functional Beauty
- **Clarity**: Information hierarchy is immediately apparent
- **Efficiency**: Common tasks require minimal effort
- **Flexibility**: Adapts gracefully to different contexts
- **Durability**: Timeless design that ages well

> **Implementation Note**: For technical specifications including color values, typography scales, and spacing systems, see the [Four Theme System](/docs/ai/shared-context/themes/four-themes.md) documentation.

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