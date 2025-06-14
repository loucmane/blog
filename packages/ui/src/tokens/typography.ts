// Typography tokens for the design system
// Optimized for readability and accessibility

export const typography = {
  // Font families
  fonts: {
    sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
    serif: ['Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
    mono: ['Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
  },
  
  // Font sizes with line heights
  sizes: {
    xs: { size: '0.75rem', lineHeight: '1rem' },      // 12px
    sm: { size: '0.875rem', lineHeight: '1.25rem' },  // 14px
    base: { size: '1rem', lineHeight: '1.5rem' },     // 16px
    lg: { size: '1.125rem', lineHeight: '1.75rem' },  // 18px
    xl: { size: '1.25rem', lineHeight: '1.75rem' },   // 20px
    '2xl': { size: '1.5rem', lineHeight: '2rem' },    // 24px
    '3xl': { size: '1.875rem', lineHeight: '2.25rem' }, // 30px
    '4xl': { size: '2.25rem', lineHeight: '2.5rem' },  // 36px
    '5xl': { size: '3rem', lineHeight: '1' },          // 48px
    '6xl': { size: '3.75rem', lineHeight: '1' },       // 60px
  },
  
  // Font weights
  weights: {
    thin: '100',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  
  // Letter spacing
  tracking: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

// Helper function to generate font style object
export const getFontStyle = (
  size: keyof typeof typography.sizes,
  weight?: keyof typeof typography.weights,
  tracking?: keyof typeof typography.tracking
) => {
  return {
    fontSize: typography.sizes[size].size,
    lineHeight: typography.sizes[size].lineHeight,
    fontWeight: weight ? typography.weights[weight] : typography.weights.normal,
    letterSpacing: tracking ? typography.tracking[tracking] : typography.tracking.normal,
  };
};