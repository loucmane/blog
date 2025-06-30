// Layout Components
export { Header } from './Header'
export type { HeaderProps, NavItem } from './Header'

export { Footer } from './Footer'
export type { FooterProps, FooterLinkSection } from './Footer'

export { MainLayout } from './MainLayout'
export type { MainLayoutProps } from './MainLayout'

export { MobileNav } from './MobileNav'
export type { MobileNavProps } from './MobileNav'

// Providers
export { LayoutProvider, useLayoutConfig, useLayoutEvent, emitLayoutEvent } from './providers/LayoutProvider'
export type { LayoutProviderProps } from './providers/LayoutProvider'

// Hooks
export { useScrollDirection } from './hooks/useScrollDirection'
export { useViewTransition } from './hooks/useViewTransition'
export { useFocusTrap } from './hooks/useFocusTrap'
export { useReducedMotion } from './hooks/useReducedMotion'

// Utilities
export { announce } from './utils/announce'
export { motionSafe, getMotionDuration } from './utils/motionSafe'
export { measureComponentPerformance, rafDebounce, prefetchCriticalPages } from './utils/performance'
export { useRipple } from './utils/ripple'