// Light theme configuration
export const lightTheme = {
  name: 'light',
  className: '', // Root theme, no class needed
  colors: {
    // Primary Brand
    primary: '38 70 83',                 // #264653 - deep teal
    'primary-foreground': '255 255 255', // white text on primary
    secondary: '42 157 143',             // #2a9d8f - bright teal
    
    // Action Colors
    donate: '244 162 97',                // #f4a261 - warm orange
    'donate-foreground': '255 255 255',  // white text
    emergency: '231 111 81',             // #e76f51 - coral
    'emergency-foreground': '255 255 255', // white text
    success: '233 196 106',              // #e9c46a - golden yellow
    'success-foreground': '38 70 83',    // deep teal text
    
    // Layout Colors
    background: '248 249 250',           // #f8f9fa - nearly white
    foreground: '33 37 41',              // #212529 - nearly black
    muted: '233 236 239',                // #e9ecef - very light gray
    'muted-foreground': '108 117 125',   // #6c757d - medium-dark gray
    
    // UI Element Colors
    border: '222 226 230',               // #dee2e6 - light gray
    input: '255 255 255',                // white
    ring: '42 157 143',                  // #2a9d8f - bright teal for focus
    
    // Navigation & Headers
    'nav-bg': '38 70 83',                // #264653 - deep teal
    'nav-text': '255 255 255',           // white
    'nav-hover': '233 196 106',          // #e9c46a - golden yellow
    
    // Animal Foundation Specific
    'adoption-available': '233 196 106', // #e9c46a - golden yellow
    'adoption-pending': '244 162 97',    // #f4a261 - warm orange
    'adoption-adopted': '42 157 143',    // #2a9d8f - bright teal
    'urgent-care': '231 111 81',         // #e76f51 - coral accent
  },
} as const;