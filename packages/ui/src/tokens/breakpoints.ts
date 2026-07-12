// Responsive breakpoint tokens for the design system
// Optimized for animal foundation content and donation flows

export const breakpoints = {
  // Default Tailwind breakpoints
  xs: '475px', // Small phones, emergency appeal banners
  sm: '640px', // Mobile landscape, donation forms
  md: '768px', // Tablets, story cards grid
  lg: '1024px', // Laptops, full layout
  xl: '1280px', // Desktops, hero sections
  '2xl': '1536px', // Large desktops

  // Custom semantic breakpoints
  mobile: '480px', // Mobile-first optimized
  tablet: '768px', // Tablet portrait
  laptop: '1024px', // Laptop screens
  desktop: '1280px', // Desktop screens
  wide: '1440px', // Wide screens for immersive content
  ultra: '1920px', // Ultra-wide for photo galleries
} as const

// Helper function to get min-width media query
export const minWidth = (breakpoint: keyof typeof breakpoints): string => {
  return `(min-width: ${breakpoints[breakpoint]})`
}

// Helper function to get max-width media query
export const maxWidth = (breakpoint: keyof typeof breakpoints): string => {
  return `(max-width: ${breakpoints[breakpoint]})`
}

// Helper function for range queries
export const between = (min: keyof typeof breakpoints, max: keyof typeof breakpoints): string => {
  return `(min-width: ${breakpoints[min]}) and (max-width: ${breakpoints[max]})`
}
