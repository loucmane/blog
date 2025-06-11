# Four Theme System

## Overview
The application supports four distinct themes to accommodate different user needs and preferences. Each theme maintains the warm minimalism philosophy while serving specific accessibility and comfort requirements.

## Theme Specifications

### 1. Light Theme (Default)
**Purpose**: Primary theme for general use
**Characteristics**:
- Warm cream background (#FDFCFA) - 94% lightness
- Soft black text for reduced eye strain
- Earth-tone accents
- Optimized for extended reading

**Use Cases**:
- Default experience
- Professional presentations
- Print-friendly viewing

### 2. Dark Theme
**Purpose**: Reduced eye strain in low-light environments
**Characteristics**:
- Warm dark background (not pure black)
- Soft white text (not pure white)
- Maintained warmth in color temperature
- Preserved visual hierarchy

**Use Cases**:
- Evening/night viewing
- Developer preferences
- OLED screen optimization

### 3. Contrast Theme
**Purpose**: Maximum accessibility for visual impairments
**Characteristics**:
- Pure black background (#000000)
- Pure white text (#FFFFFF)
- Maximum contrast ratios
- Bold visual indicators

**Use Cases**:
- Users with low vision
- Bright environment viewing
- Accessibility compliance testing

### 4. Gentle Theme
**Purpose**: Trauma-sensitive viewing experience
**Characteristics**:
- Soft sand background (#E5DFD1) - 88% lightness
- Muted imagery and colors
- Reduced visual stimulation
- Calming color palette

**Use Cases**:
- Sensitive content viewing
- Users experiencing stress/trauma
- Extended reading sessions
- Medical or therapy contexts

## Implementation Details

### Theme Switching
- Instant switching without page reload
- Preference persistence in localStorage
- System preference detection
- Keyboard shortcut support (Ctrl/Cmd + Shift + T)

### CSS Variable Structure
```css
[data-theme="light"] {
  --background: 27 20% 98%;
  --foreground: 27 5% 11%;
  /* ... other variables */
}

[data-theme="dark"] {
  --background: 27 10% 10%;
  --foreground: 27 5% 90%;
  /* ... other variables */
}

[data-theme="contrast"] {
  --background: 0 0% 0%;
  --foreground: 0 0% 100%;
  /* ... other variables */
}

[data-theme="gentle"] {
  --background: 39 31% 88%;
  --foreground: 39 5% 15%;
  /* ... other variables */
}
```

### Tailwind Integration
- Use theme-aware color classes
- Example: `bg-background text-foreground`
- Automatic theme inheritance
- Variant support: `dark:`, `contrast:`, `gentle:`

### Component Adaptations
Each theme may require specific component adjustments:
- **Shadows**: Reduced in gentle theme
- **Borders**: Enhanced in contrast theme
- **Images**: Opacity adjustments in gentle theme
- **Animations**: Reduced motion in gentle theme

## Testing Requirements
1. WCAG AA compliance in all themes
2. Color contrast validation
3. Component visibility verification
4. Animation preference respect
5. Theme persistence testing

## Content Considerations
- **Image Handling**: Consider theme when displaying sensitive images
- **Color Meaning**: Don't rely solely on color for information
- **Transitions**: Smooth theme switching without jarring changes
- **Defaults**: Respect system preferences when possible