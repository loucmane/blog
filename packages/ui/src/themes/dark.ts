// Dark theme configuration
export const darkTheme = {
  name: 'dark',
  className: 'dark',
  colors: {
    // Layout Colors - Deep teal background
    background: '38 70 83',              // #264653 - deep teal background
    foreground: '229 229 229',           // #e5e5e5 - light gray text
    muted: '20 33 61',                   // #14213d - deep navy for cards
    'muted-foreground': '173 181 189',   // #adb5bd - medium gray
    border: '30 56 66',                  // darker teal for borders
    input: '20 33 61',                   // #14213d - deep navy inputs
    ring: '42 157 143',                  // #2a9d8f - bright teal focus
    
    // Adjusted semantic colors for dark mode
    primary: '42 157 143',               // brighter teal for dark
    'primary-foreground': '255 255 255', // white text on primary
    secondary: '94 234 212',             // even brighter teal
    donate: '244 162 97',                // keep warm orange - pops on dark
    'donate-foreground': '255 255 255',  // white text
    emergency: '231 111 81',             // keep coral - stands out
    'emergency-foreground': '255 255 255', // white text
    success: '233 196 106',              // keep golden yellow - visible
    'success-foreground': '38 70 83',    // deep teal text
    
    // Navigation adjustments
    'nav-bg': '20 33 61',                // #14213d - deep navy nav
    'nav-text': '255 255 255',           // white text
    'nav-hover': '233 196 106',          // golden yellow hover
    
    // Animal Foundation Specific - same as light for consistency
    'adoption-available': '233 196 106', // golden yellow
    'adoption-pending': '244 162 97',    // warm orange
    'adoption-adopted': '42 157 143',    // bright teal
    'urgent-care': '231 111 81',         // coral accent
  },
} as const;