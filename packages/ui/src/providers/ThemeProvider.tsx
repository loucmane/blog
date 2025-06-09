'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { ThemeMode, ThemeContextValue } from '../types/theme'

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: ThemeMode
  storageKey?: string
  enableSystem?: boolean
}

export function ThemeProvider({ 
  children, 
  defaultTheme = 'system',
  storageKey = 'ui-theme',
  enableSystem = true
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeMode>(defaultTheme)
  const [resolvedTheme, setResolvedTheme] = useState<Exclude<ThemeMode, 'system'>>('light')

  // Get system theme
  const getSystemTheme = (): Exclude<ThemeMode, 'system'> => {
    if (typeof window === 'undefined') return 'light'
    
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    
    // Smart defaults based on user preferences
    if (prefersHighContrast) return 'contrast'
    if (prefersReducedMotion) return 'gentle'
    if (prefersDark) return 'dark'
    return 'light'
  }

  // Initialize theme from localStorage or system
  useEffect(() => {
    const stored = localStorage.getItem(storageKey) as ThemeMode
    if (stored && ['light', 'dark', 'contrast', 'gentle', 'system'].includes(stored)) {
      setThemeState(stored)
    } else if (enableSystem) {
      setThemeState('system')
    }
  }, [storageKey, enableSystem])

  // Resolve the actual theme to use
  useEffect(() => {
    const actualTheme = theme === 'system' ? getSystemTheme() : theme
    setResolvedTheme(actualTheme)
  }, [theme])

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement
    
    // Remove all theme classes
    root.classList.remove('dark', 'high-contrast', 'gentle')
    
    // Add appropriate class based on resolved theme
    switch (resolvedTheme) {
      case 'dark':
        root.classList.add('dark')
        break
      case 'contrast':
        root.classList.add('high-contrast')
        break
      case 'gentle':
        root.classList.add('gentle')
        break
      // 'light' is the default, no class needed
    }
    
    // Update color-scheme for native elements
    root.style.colorScheme = resolvedTheme === 'dark' ? 'dark' : 'light'
  }, [resolvedTheme])

  // Save theme preference
  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme)
    localStorage.setItem(storageKey, newTheme)
    
    // Announce theme change for screen readers
    const themeName = newTheme === 'system' ? `system (${getSystemTheme()})` : newTheme
    const announcement = `Theme changed to ${themeName} mode`
    const announcer = document.createElement('div')
    announcer.setAttribute('aria-live', 'polite')
    announcer.setAttribute('aria-atomic', 'true')
    announcer.className = 'sr-only'
    announcer.textContent = announcement
    document.body.appendChild(announcer)
    setTimeout(() => document.body.removeChild(announcer), 1000)
  }

  // Listen for system theme changes
  useEffect(() => {
    if (!enableSystem || theme !== 'system') return

    const mediaQueries = [
      window.matchMedia('(prefers-color-scheme: dark)'),
      window.matchMedia('(prefers-contrast: high)'),
      window.matchMedia('(prefers-reduced-motion: reduce)')
    ]

    const handleChange = () => {
      if (theme === 'system') {
        const newSystemTheme = getSystemTheme()
        setResolvedTheme(newSystemTheme)
      }
    }

    mediaQueries.forEach(mq => mq.addEventListener('change', handleChange))
    return () => {
      mediaQueries.forEach(mq => mq.removeEventListener('change', handleChange))
    }
  }, [theme, enableSystem])

  const value: ThemeContextValue = {
    theme,
    setTheme,
    resolvedTheme,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}