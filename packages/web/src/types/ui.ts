// UI and component types

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  border: string;
  // Animal protection foundation specific colors
  emergency: string;
  success: string;
  warning: string;
  danger: string;
  // Trauma-informed colors (calming palette)
  calm: string;
  gentle: string;
  trust: string;
}

export interface BreakpointConfig {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

export interface ComponentVariants {
  variant: 'default' | 'emergency' | 'gentle' | 'trust' | 'success' | 'warning';
  size: 'sm' | 'md' | 'lg' | 'xl';
}

export interface NavigationItem {
  label: string;
  href: string;
  icon?: string;
  badge?: string;
  children?: NavigationItem[];
  requiresAuth?: boolean;
  emergencyOnly?: boolean;
}

export interface PageMetadata {
  title: string;
  description: string;
  keywords: string[];
  socialImage?: string;
  canonical?: string;
  noIndex?: boolean;
  breadcrumbs?: Breadcrumb[];
}

export interface Breadcrumb {
  label: string;
  href: string;
  isCurrentPage?: boolean;
}

export interface Toast {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'emergency';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface Modal {
  id: string;
  title: string;
  content: React.ReactNode;
  size: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  preventBodyScroll?: boolean;
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number; // 0-100
}

export interface ErrorState {
  hasError: boolean;
  message: string;
  code?: string;
  retry?: () => void;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'date' | 'number';
  placeholder?: string;
  required?: boolean;
  validation?: ValidationRule[];
  options?: Option[]; // For select, radio, checkbox
  helpText?: string;
  disabled?: boolean;
}

export interface ValidationRule {
  type: 'required' | 'email' | 'min' | 'max' | 'pattern' | 'custom';
  value?: string | number;
  message: string;
  validator?: (value: any) => boolean;
}

export interface Option {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  maxVisiblePages?: number;
}

export interface SearchProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  suggestions?: string[];
  isLoading?: boolean;
  autoFocus?: boolean;
}

export interface FilterOption {
  key: string;
  label: string;
  value: string | number | boolean;
  count?: number;
}

export interface FilterGroup {
  key: string;
  label: string;
  type: 'checkbox' | 'radio' | 'select' | 'range';
  options: FilterOption[];
  defaultValue?: any;
  multiple?: boolean;
}

export interface SortOption {
  key: string;
  label: string;
  direction: 'asc' | 'desc';
}

export interface AccessibilityConfig {
  screenReaderOnly: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  keyboardNavigation: boolean;
}

// React component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  'data-testid'?: string;
}

export interface InteractiveComponentProps extends BaseComponentProps {
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
}