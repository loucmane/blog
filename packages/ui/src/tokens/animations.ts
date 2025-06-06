// Animation tokens for the design system
// Gentle, accessible animations for trauma-informed design

export const animations = {
  // Animation durations
  durations: {
    instant: '0s',
    fast: '0.2s',
    normal: '0.3s',
    slow: '0.5s',
    slower: '1s',
  },
  
  // Animation easings
  easings: {
    linear: 'linear',
    'ease-in': 'ease-in',
    'ease-out': 'ease-out',
    'ease-in-out': 'ease-in-out',
    // Custom spring-like easing
    spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  
  // Animation definitions
  keyframes: {
    'in': {
      '0%': { opacity: '0', transform: 'translateY(-0.25rem)' },
      '100%': { opacity: '1', transform: 'translateY(0)' },
    },
    'fade-in': {
      '0%': { opacity: '0' },
      '100%': { opacity: '1' },
    },
    'slide-in-from-top-1': {
      '0%': { transform: 'translateY(-0.25rem)' },
      '100%': { transform: 'translateY(0)' },
    },
  },
  
  // Prebuilt animations
  presets: {
    'in': 'in 0.2s ease-out',
    'fade-in': 'fade-in 0.2s ease-out',
    'slide-in-from-top-1': 'slide-in-from-top-1 0.2s ease-out',
  },
} as const;

// Helper to generate animation CSS
export const createAnimation = (
  name: keyof typeof animations.presets,
  duration?: keyof typeof animations.durations,
  easing?: keyof typeof animations.easings
): string => {
  const baseDuration = duration ? animations.durations[duration] : '0.2s';
  const baseEasing = easing ? animations.easings[easing] : 'ease-out';
  return `${name} ${baseDuration} ${baseEasing}`;
};