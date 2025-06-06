// High contrast theme configuration for accessibility
export const contrastTheme = {
  name: 'contrast',
  className: 'high-contrast',
  colors: {
    // High contrast base colors
    background: '255 255 255',           // pure white
    foreground: '0 0 0',                 // pure black
    muted: '230 230 230',                // light gray for backgrounds
    'muted-foreground': '0 0 0',         // black text on muted
    border: '100 100 100',               // gray borders instead of pure black
    input: '255 255 255',                // white inputs
    ring: '0 0 0',                       // black focus rings
    
    // High contrast semantic colors
    primary: '0 0 0',                    // black
    'primary-foreground': '255 255 255', // white text on primary
    secondary: '0 0 0',                  // black
    donate: '184 53 0',                  // dark orange
    'donate-foreground': '255 255 255',  // white text
    emergency: '139 0 0',                // dark red
    'emergency-foreground': '255 255 255', // white text
    success: '0 100 0',                  // pure green
    'success-foreground': '255 255 255', // white text
    
    // Navigation high contrast
    'nav-bg': '0 0 0',                   // black nav
    'nav-text': '255 255 255',           // white text
    'nav-hover': '255 255 255',          // white hover
    
    // Animal Foundation Specific - high contrast versions
    'adoption-available': '0 100 0',     // pure green
    'adoption-pending': '184 53 0',      // dark orange
    'adoption-adopted': '0 0 0',         // black
    'urgent-care': '139 0 0',            // dark red
  },
} as const;