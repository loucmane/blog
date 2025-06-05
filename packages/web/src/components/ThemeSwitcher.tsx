'use client'

import React, { useState } from 'react'
import { useTheme, type Theme } from '@/context/ThemeContext'

const themes: { value: Theme; label: string; description: string; icon: string }[] = [
  {
    value: 'default',
    label: 'Default',
    description: 'Warm and natural colors',
    icon: '☀️',
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Easy on the eyes for low light',
    icon: '🌙',
  },
  {
    value: 'high-contrast',
    label: 'High Contrast',
    description: 'Maximum readability for accessibility',
    icon: '⚫',
  },
  {
    value: 'trauma-sensitive',
    label: 'Trauma Sensitive',
    description: 'Gentle, muted colors for sensitive content',
    icon: '🕊️',
  },
]

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  const currentTheme = themes.find(t => t.value === theme) || themes[0]!

  const handleThemeSelect = (newTheme: Theme) => {
    setTheme(newTheme)
    setIsOpen(false)
  }

  const handleKeyDown = (event: React.KeyboardEvent, themeValue: Theme) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleThemeSelect(themeValue)
    }
  }

  return (
    <div className="relative">
      {/* Theme Switcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setIsOpen(false)
          }
        }}
        className="
          flex items-center gap-2 px-3 py-2 
          bg-muted hover:bg-muted/80 
          dark:hover:bg-muted-foreground/20 
          high-contrast:hover:bg-black high-contrast:hover:text-white
          trauma-sensitive:hover:bg-muted/60
          border border-border rounded-lg
          text-foreground 
          transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-ring
        "
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`Current theme: ${currentTheme.label}. Click to change theme.`}
      >
        <span className="text-lg" aria-hidden="true">
          {currentTheme.icon}
        </span>
        <span className="hidden sm:inline-block font-medium">
          {currentTheme.label}
        </span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Theme Options Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 z-10 sm:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* Dropdown Menu */}
          <div
            className="
              absolute right-0 top-full mt-2 z-20
              w-80 sm:w-72
              bg-background border border-border rounded-lg shadow-lg
              py-2
            "
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="theme-switcher"
          >
            <div className="px-3 py-2 text-sm font-medium text-muted-foreground border-b border-border">
              Choose Theme
            </div>
            
            {themes.map((themeOption) => (
              <button
                key={themeOption.value}
                onClick={() => handleThemeSelect(themeOption.value)}
                onKeyDown={(e) => handleKeyDown(e, themeOption.value)}
                className={`
                  w-full px-3 py-3 text-left
                  flex items-start gap-3
                  hover:bg-muted 
                  high-contrast:hover:bg-black high-contrast:hover:text-white
                  trauma-sensitive:hover:bg-muted/70
                  transition-colors duration-150
                  focus:outline-none focus:bg-muted 
                  high-contrast:focus:bg-black high-contrast:focus:text-white
                  trauma-sensitive:focus:bg-muted/70
                  ${theme === themeOption.value ? 'bg-muted ring-2 ring-ring' : ''}
                `}
                role="menuitem"
                aria-current={theme === themeOption.value ? 'true' : undefined}
              >
                <span className="text-lg flex-shrink-0 mt-0.5" aria-hidden="true">
                  {themeOption.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">
                      {themeOption.label}
                    </span>
                    {theme === themeOption.value && (
                      <svg
                        className="w-4 h-4 text-primary flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {themeOption.description}
                  </p>
                </div>
              </button>
            ))}
            
            {/* Additional Options */}
            <div className="border-t border-border mt-2 pt-2 px-3 py-2">
              <p className="text-xs text-muted-foreground">
                Your preference is saved automatically and will be remembered on future visits.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Quick Toggle Button (for navigation bars)
export function QuickThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  
  const isDark = theme === 'dark'
  
  return (
    <button
      onClick={toggleTheme}
      className="
        p-2 rounded-lg
        bg-muted hover:bg-muted/80 
        dark:hover:bg-muted-foreground/20 
        high-contrast:hover:bg-black high-contrast:hover:text-white
        trauma-sensitive:hover:bg-muted/60
        text-foreground
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-ring
      "
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
    >
      {isDark ? (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      )}
    </button>
  )
}