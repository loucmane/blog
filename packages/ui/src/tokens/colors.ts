// Color tokens extracted from the design system
// All colors are in RGB format to support opacity with Tailwind

export const colors = {
  // Brand Color Scales
  teal: {
    50: '240 253 250', // #f0fdf4
    100: '204 251 241', // #ccfbf1
    200: '153 246 228', // #99f6e4
    300: '94 234 212', // #5eead4
    400: '45 212 191', // #2dd4bf
    500: '42 157 143', // #2a9d8f - bright teal
    600: '38 70 83', // #264653 - deep teal (primary)
    700: '30 56 66', // #1e3842
    800: '24 45 53', // #182d35
    900: '20 37 44', // #14252c
  },

  // Golden Yellow Scale (Success/Hope)
  yellow: {
    50: '254 252 232', // #fefce8
    100: '254 249 195', // #fef9c3
    200: '254 240 138', // #fef08a
    300: '253 224 71', // #fde047
    400: '250 204 21', // #facc15
    500: '233 196 106', // #e9c46a - golden yellow
    600: '202 138 4', // #ca8a04
    700: '161 98 7', // #a16207
    800: '133 77 14', // #854d0e
    900: '113 63 18', // #713f12
  },

  // Orange Scale (Donate/CTAs)
  orange: {
    50: '255 247 237', // #fff7ed
    100: '255 237 213', // #ffedd5
    200: '254 215 170', // #fed7aa
    300: '253 186 116', // #fdba74
    400: '251 146 60', // #fb923c
    500: '244 162 97', // #f4a261 - warm orange
    600: '234 88 12', // #ea580c
    700: '194 65 12', // #c2410c
    800: '154 52 18', // #9a3412
    900: '124 45 18', // #7c2d12
  },

  // Coral Scale (Emergency/Urgent)
  coral: {
    50: '254 242 242', // #fef2f2
    100: '254 226 226', // #fee2e2
    200: '254 202 202', // #fecaca
    300: '252 165 165', // #fca5a5
    400: '248 113 113', // #f87171
    500: '231 111 81', // #e76f51 - coral
    600: '220 38 38', // #dc2626
    700: '185 28 28', // #b91c1c
    800: '153 27 27', // #991b1b
    900: '127 29 29', // #7f1d1d
  },

  // Semantic colors (default/light theme)
  semantic: {
    // Primary Brand
    primary: '38 70 83', // #264653 - deep teal
    'primary-foreground': '255 255 255', // white text on primary
    secondary: '42 157 143', // #2a9d8f - bright teal

    // Action Colors
    donate: '244 162 97', // #f4a261 - warm orange
    'donate-foreground': '255 255 255', // white text
    emergency: '231 111 81', // #e76f51 - coral
    'emergency-foreground': '255 255 255', // white text
    success: '233 196 106', // #e9c46a - golden yellow
    'success-foreground': '38 70 83', // deep teal text

    // Layout Colors
    background: '248 249 250', // #f8f9fa - nearly white
    foreground: '33 37 41', // #212529 - nearly black
    muted: '233 236 239', // #e9ecef - very light gray
    'muted-foreground': '108 117 125', // #6c757d - medium-dark gray

    // UI Element Colors
    border: '222 226 230', // #dee2e6 - light gray
    input: '255 255 255', // white
    ring: '42 157 143', // #2a9d8f - bright teal for focus

    // Navigation & Headers
    'nav-bg': '38 70 83', // #264653 - deep teal
    'nav-text': '255 255 255', // white
    'nav-hover': '233 196 106', // #e9c46a - golden yellow

    // Animal Foundation Specific
    'adoption-available': '233 196 106', // #e9c46a - golden yellow
    'adoption-pending': '244 162 97', // #f4a261 - warm orange
    'adoption-adopted': '42 157 143', // #2a9d8f - bright teal
    'urgent-care': '231 111 81', // #e76f51 - coral accent
  },
} as const

// Helper function to convert RGB string to hex
export const rgbToHex = (rgb: string): string => {
  const channels = rgb.trim().split(/\s+/).map(Number)
  if (channels.length !== 3 || channels.some((channel) => !Number.isFinite(channel))) {
    throw new TypeError(`Invalid RGB color: ${rgb}`)
  }
  const [r, g, b] = channels as [number, number, number]
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

// Helper function to get color with opacity
export const withOpacity = (color: string, opacity: number): string => {
  return `rgb(${color} / ${opacity})`
}
