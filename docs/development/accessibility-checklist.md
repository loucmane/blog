# Accessibility Checklist

> **Superseded historical checklist (Task 41, 2026-07-14).** This WCAG 2.1/four-theme/component-demo checklist is retained for historical context, not current acceptance. The project target is WCAG 2.2 AA; use `docs/development/accessibility-test-results.md`, `docs/architecture/design-system.md`, the supported Playwright/axe capability, and task-specific acceptance criteria.

This document provides comprehensive accessibility testing guidelines for all components in the Animal Protection Foundation blog.

## Core Accessibility Requirements

### WCAG 2.1 AA Compliance
- [ ] All components meet WCAG 2.1 Level AA standards
- [ ] Color contrast ratios: 4.5:1 for normal text, 3:1 for large text
- [ ] Focus indicators are clearly visible (2px minimum)
- [ ] Interactive elements have minimum 44x44px touch targets

## Component-Specific Testing

### 1. Keyboard Navigation
All interactive components must be fully keyboard accessible:

#### General Requirements
- [ ] Tab order follows logical reading order
- [ ] All interactive elements are reachable via keyboard
- [ ] Focus trap works correctly in modals (Dialog, Sheet)
- [ ] Escape key closes modals and dropdowns
- [ ] No keyboard traps (user can tab out of any component)

#### Component-Specific Keys
- **Button**: Space/Enter to activate
- **Checkbox**: Space to toggle
- **Select**: Arrow keys to navigate options, Enter to select
- **Dialog/Sheet**: Escape to close, Tab cycles through content
- **Toast**: Escape to dismiss (if dismissible)

### 2. Screen Reader Support

#### ARIA Labels and Roles
- [ ] All form inputs have associated labels
- [ ] Images have appropriate alt text
- [ ] Decorative images use `alt=""` or `role="presentation"`
- [ ] Complex components have proper ARIA labels
- [ ] Dynamic content updates are announced

#### Component Announcements
- [ ] Toasts are announced when they appear
- [ ] Alert content is read immediately (role="alert")
- [ ] Form validation errors are announced
- [ ] Loading states are communicated
- [ ] Theme changes are announced

### 3. Visual Accessibility

#### Color and Contrast
- [ ] Text meets contrast requirements in all themes
- [ ] Focus indicators have sufficient contrast
- [ ] Error states don't rely solely on color
- [ ] Success states include icons or text, not just color

#### Motion and Animation
- [ ] Respect `prefers-reduced-motion` setting
- [ ] Animations can be paused/stopped
- [ ] No content flashes more than 3 times per second
- [ ] Auto-playing content has pause controls

### 4. Form Accessibility

#### Input Components
- [ ] All inputs have visible labels
- [ ] Required fields are marked with text, not just color
- [ ] Error messages are associated with inputs
- [ ] Help text is programmatically associated
- [ ] Placeholder text is not used as the only label

#### Form Validation
- [ ] Errors are clearly identified
- [ ] Error messages provide helpful guidance
- [ ] Success messages confirm actions
- [ ] Form submission errors focus the first error

### 5. Content Accessibility

#### Text Content
- [ ] Heading hierarchy is logical (h1 → h2 → h3)
- [ ] Links have descriptive text (not "click here")
- [ ] Language changes are marked with lang attribute
- [ ] Text can be resized to 200% without loss of functionality

#### Multimedia
- [ ] Videos have captions
- [ ] Audio content has transcripts
- [ ] Images conveying information have text alternatives
- [ ] Complex graphics have long descriptions

## Theme-Specific Considerations

### Light Theme
- [ ] Sufficient contrast for all text
- [ ] Focus indicators visible on light backgrounds
- [ ] No pure white backgrounds (use warm cream)

### Dark Theme
- [ ] Sufficient contrast for all text
- [ ] Focus indicators visible on dark backgrounds
- [ ] No pure black backgrounds (use deep teal)

### High Contrast Theme
- [ ] Maximum contrast ratios achieved
- [ ] All UI elements clearly distinguishable
- [ ] No reliance on subtle color differences

### Gentle Theme
- [ ] Optimized for photosensitivity
- [ ] Reduced contrast still meets minimums
- [ ] Calm color palette reduces eye strain

## Testing Tools and Methods

### Automated Testing
1. **axe DevTools**: Browser extension for accessibility audits
2. **WAVE**: Web Accessibility Evaluation Tool
3. **Lighthouse**: Built into Chrome DevTools
4. **Jest-axe**: Automated testing in unit tests

### Manual Testing
1. **Keyboard-only navigation**: Unplug mouse and navigate entire site
2. **Screen readers**: Test with NVDA (Windows), JAWS, or VoiceOver (Mac)
3. **Browser zoom**: Test at 200% and 400% zoom levels
4. **Color blindness simulators**: Test all color combinations

### Testing Checklist Template

```markdown
Component: [Component Name]
Date Tested: [Date]
Tested By: [Name]
Theme Tested: [light/dark/contrast/gentle]

Keyboard Navigation:
- [ ] Tab order logical
- [ ] All functions keyboard accessible
- [ ] Focus indicators visible
- [ ] Escape/Enter keys work as expected

Screen Reader:
- [ ] Component announced correctly
- [ ] State changes announced
- [ ] Instructions clear
- [ ] No redundant announcements

Visual:
- [ ] Contrast ratios pass
- [ ] Focus indicators visible
- [ ] Errors not color-only
- [ ] Animations respect preferences

Issues Found:
1. [Issue description]
2. [Issue description]

Recommendations:
1. [Fix recommendation]
2. [Fix recommendation]
```

## Accessibility Statement Template

```markdown
# Accessibility Statement

The Animal Protection Foundation is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.

## Conformance Status
The Web Content Accessibility Guidelines (WCAG) defines requirements for designers and developers to improve accessibility for people with disabilities. It defines three levels of conformance: Level A, Level AA, and Level AAA. Our website is partially conformant with WCAG 2.1 level AA. Partially conformant means that some parts of the content do not fully conform to the accessibility standard.

## Feedback
We welcome your feedback on the accessibility of our website. Please let us know if you encounter accessibility barriers:
- Email: accessibility@animalprotection.org
- Phone: [Phone number]
- Address: [Mailing address]

## Compatibility
Our website is designed to be compatible with the following assistive technologies:
- Screen readers (NVDA, JAWS, VoiceOver)
- Keyboard navigation
- Voice recognition software
- Screen magnification software

This statement was created on [Date] and last updated on [Date].
```

## Quick Reference

### Essential Keyboard Shortcuts
- **Tab**: Move to next interactive element
- **Shift+Tab**: Move to previous interactive element
- **Enter**: Activate buttons, links, select options
- **Space**: Toggle checkboxes, activate buttons
- **Arrow keys**: Navigate within components
- **Escape**: Close modals, cancel operations

### ARIA Attributes Quick Guide
- `role="button"`: Make non-button elements behave as buttons
- `aria-label`: Provide accessible name
- `aria-describedby`: Associate descriptions
- `aria-live`: Announce dynamic changes
- `aria-expanded`: Indicate expanded/collapsed state
- `aria-selected`: Indicate selection state
- `aria-disabled`: Indicate disabled state

### Testing Priority
1. **Critical**: Navigation, forms, donations
2. **High**: Content, images, alerts
3. **Medium**: Animations, tooltips, advanced interactions
4. **Low**: Decorative elements, marketing features

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/resources/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
