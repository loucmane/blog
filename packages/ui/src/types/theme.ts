// Theme types for the design system
export type ThemeMode = 'light' | 'dark' | 'contrast' | 'gentle' | 'system';

export interface ThemeColors {
  // Primary Brand
  primary: string;
  'primary-foreground': string;
  secondary: string;
  
  // Action Colors
  donate: string;
  'donate-foreground': string;
  emergency: string;
  'emergency-foreground': string;
  success: string;
  'success-foreground': string;
  
  // Layout Colors
  background: string;
  foreground: string;
  muted: string;
  'muted-foreground': string;
  
  // UI Element Colors
  border: string;
  input: string;
  ring: string;
  
  // Navigation & Headers
  'nav-bg': string;
  'nav-text': string;
  'nav-hover': string;
  
  // Animal Foundation Specific
  'adoption-available': string;
  'adoption-pending': string;
  'adoption-adopted': string;
  'urgent-care': string;
}

export interface Theme {
  name: string;
  className: string;
  colors: ThemeColors;
}

export interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  resolvedTheme: Exclude<ThemeMode, 'system'>;
}