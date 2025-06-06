// Gentle theme configuration - trauma-informed design with softer colors
export const gentleTheme = {
  name: 'gentle',
  className: 'trauma-sensitive',
  colors: {
    // Softer, desaturated versions of main colors
    primary: '95 134 142',               // muted teal
    'primary-foreground': '255 255 255', // white text on primary
    secondary: '133 179 172',            // softer teal
    donate: '222 183 149',               // muted orange
    'donate-foreground': '255 255 255',  // white text
    emergency: '251 146 60',             // warm orange instead of harsh coral
    'emergency-foreground': '255 255 255', // white text
    success: '217 192 135',              // muted golden
    'success-foreground': '95 134 142',  // muted teal text
    
    // Softer UI elements
    background: '255 255 255',           // white background
    foreground: '64 64 64',              // soft dark gray
    border: '208 213 221',               // lighter borders
    muted: '245 247 250',                // light blue-gray background
    'muted-foreground': '95 134 142',    // muted teal text
    ring: '133 179 172',                 // soft teal focus
    input: '255 255 255',                // white inputs
    
    // Gentle navigation
    'nav-bg': '95 134 142',              // muted teal nav
    'nav-text': '255 255 255',           // white text
    'nav-hover': '217 192 135',          // muted golden hover
    
    // Animal Foundation Specific - gentler versions
    'adoption-available': '217 192 135', // muted golden
    'adoption-pending': '222 183 149',   // muted orange
    'adoption-adopted': '133 179 172',   // softer teal
    'urgent-care': '251 146 60',         // warm orange
  },
} as const;