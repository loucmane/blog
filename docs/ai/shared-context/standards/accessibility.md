# Accessibility Standards

## WCAG 2.1 AA Compliance

### Core Requirements
- **Level**: WCAG 2.1 AA minimum
- **Target Users**: Global audience including users with disabilities
- **Testing**: Automated + manual testing required
- **Documentation**: Accessibility statement required

## Key Principles

### 1. Perceivable
- **Text Alternatives**: All images, icons, and media have text alternatives
- **Color Contrast**: 
  - Normal text: 4.5:1 minimum
  - Large text: 3:1 minimum
  - Non-text: 3:1 minimum
- **Resize Text**: Up to 200% without horizontal scrolling
- **Images of Text**: Avoided except for logos

### 2. Operable
- **Keyboard Access**: All functionality via keyboard
- **No Keyboard Traps**: Users can navigate away
- **Skip Links**: Skip to main content available
- **Focus Indicators**: Visible and clear
- **Time Limits**: User control over time limits
- **Seizures**: No flashing content >3 times/second

### 3. Understandable
- **Language**: Page language declared
- **On Focus**: No unexpected context changes
- **On Input**: User informed of changes
- **Error Identification**: Clear error messages
- **Labels**: All form inputs labeled
- **Instructions**: Clear help text provided

### 4. Robust
- **Valid Code**: Well-formed, semantic HTML
- **Name, Role, Value**: Available for all UI components
- **Status Messages**: Announced to screen readers

## Implementation Guidelines

### Semantic HTML
```html
<!-- Good -->
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/about">About</a></li>
  </ul>
</nav>

<!-- Bad -->
<div class="navigation">
  <div class="nav-item" onclick="navigate('/')">Home</div>
</div>
```

### ARIA Usage
```html
<!-- Landmark roles -->
<header role="banner">
<main role="main">
<nav role="navigation">
<footer role="contentinfo">

<!-- Live regions -->
<div role="status" aria-live="polite">
<div role="alert" aria-live="assertive">

<!-- Descriptive labels -->
<button aria-label="Close dialog" aria-describedby="save-changes-note">
```

### Focus Management
```javascript
// Trap focus in modals
const trapFocus = (element) => {
  const focusableElements = element.querySelectorAll(
    'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
  );
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];
  
  element.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === firstFocusable) {
        lastFocusable.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === lastFocusable) {
        firstFocusable.focus();
        e.preventDefault();
      }
    }
  });
};
```

### Form Accessibility
```html
<!-- Accessible form example -->
<form>
  <div class="form-group">
    <label for="email">Email Address</label>
    <input 
      type="email" 
      id="email" 
      aria-describedby="email-help email-error"
      aria-invalid="false"
      required
    />
    <span id="email-help" class="help-text">
      We'll never share your email
    </span>
    <span id="email-error" class="error-text" role="alert" aria-live="polite">
      <!-- Error messages inserted here -->
    </span>
  </div>
</form>
```

## Component-Specific Guidelines

### Navigation
- Keyboard navigable
- Current page indicated
- Logical tab order
- Mobile menu accessible

### Modals/Dialogs
- Focus trapped while open
- ESC key closes
- Focus returns on close
- Screen reader announced

### Images
- Alt text for informative images
- Empty alt for decorative images
- Complex images have long descriptions
- Icon fonts have text alternatives

### Tables
- Proper headers with scope
- Caption describes table
- Summary for complex tables
- Responsive without losing meaning

### Forms
- Labels associated with inputs
- Required fields indicated
- Error messages clear
- Success feedback provided

## Testing Requirements

### Automated Testing
```javascript
// Example with react-axe
import axe from '@axe-core/react';

if (process.env.NODE_ENV !== 'production') {
  axe(React, ReactDOM, 1000);
}
```

### Manual Testing Checklist
- [ ] Keyboard navigation complete
- [ ] Screen reader testing (NVDA/JAWS/VoiceOver)
- [ ] Color contrast verified
- [ ] Zoom to 200% functional
- [ ] Motion preferences respected
- [ ] Focus indicators visible
- [ ] Error messages helpful
- [ ] Time limits adjustable

### Tools
- axe DevTools
- WAVE
- Lighthouse
- Screen readers
- Keyboard testing
- Color contrast analyzers

## Trauma-Informed Accessibility
- Predictable interactions
- Clear content warnings
- User control over content
- Gentle error handling
- No auto-playing media
- Respect user preferences