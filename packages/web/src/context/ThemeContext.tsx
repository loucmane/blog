'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'default' | 'dark' | 'high-contrast' | 'trauma-sensitive'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
}

export function ThemeProvider({ children, defaultTheme = 'default' }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const stored = localStorage.getItem('animal-foundation-theme') as Theme
    if (stored && ['default', 'dark', 'high-contrast', 'trauma-sensitive'].includes(stored)) {
      setThemeState(stored)
    } else {
      // Check system preference for dark mode
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches
      
      // Smart default based on user preferences
      if (prefersHighContrast) {
        setThemeState('high-contrast')
      } else if (prefersReducedMotion) {
        setThemeState('trauma-sensitive')
      } else if (prefersDark) {
        setThemeState('dark')
      } else {
        setThemeState('default')
      }
    }
  }, [])

  // Apply theme to document and save to localStorage
  const setTheme = (newTheme: Theme) => {
    console.log('ThemeContext: Setting theme to', newTheme) // Debug log
    setThemeState(newTheme)
    
    // Remove all theme classes
    document.documentElement.classList.remove('dark', 'high-contrast', 'trauma-sensitive')
    
    // Add new theme class (except for default)
    if (newTheme !== 'default') {
      document.documentElement.classList.add(newTheme)
    }
    
    console.log('ThemeContext: Document classes now:', document.documentElement.className) // Debug log
    
    // Save to localStorage
    localStorage.setItem('animal-foundation-theme', newTheme)
    
    // Announce theme change for screen readers
    const announcement = `Theme changed to ${newTheme.replace('-', ' ')} mode`
    const announcer = document.createElement('div')
    announcer.setAttribute('aria-live', 'polite')
    announcer.setAttribute('aria-atomic', 'true')
    announcer.className = 'sr-only'
    announcer.textContent = announcement
    document.body.appendChild(announcer)
    setTimeout(() => document.body.removeChild(announcer), 1000)
  }

  // Simple toggle between default and dark for quick switching
  const toggleTheme = () => {
    setTheme(theme === 'default' ? 'dark' : 'default')
  }

  // Apply theme class on mount and theme change
  useEffect(() => {
    // Remove all theme classes first
    document.documentElement.classList.remove('dark', 'high-contrast', 'trauma-sensitive')
    
    // Add current theme class (except for default)
    if (theme !== 'default') {
      document.documentElement.classList.add(theme)
    }
  }, [theme])

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't manually set a theme
      const hasManualTheme = localStorage.getItem('animal-foundation-theme')
      if (!hasManualTheme) {
        setTheme(e.matches ? 'dark' : 'default')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const value = {
    theme,
    setTheme,
    toggleTheme,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}