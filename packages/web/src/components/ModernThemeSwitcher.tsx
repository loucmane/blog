'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useTheme, type Theme } from '@/context/ThemeContext'

const themes: { value: Theme; label: string; icon: string; description: string }[] = [
  { value: 'default', label: 'Light', icon: '☀️', description: 'Bright and welcoming' },
  { value: 'dark', label: 'Dark', icon: '🌙', description: 'Easy on the eyes' },
  { value: 'high-contrast', label: 'Contrast', icon: '⚫', description: 'Maximum clarity' },
  { value: 'trauma-sensitive', label: 'Gentle', icon: '🕊️', description: 'Soft and calming' },
]

export function ModernThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const [isExpanded, setIsExpanded] = useState(false)
  const [hoveredTheme, setHoveredTheme] = useState<Theme | null>(null)
  const [pillPosition, setPillPosition] = useState({ left: 0, width: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([])
  const pillRef = useRef<HTMLDivElement>(null)

  // Calculate pill position based on active theme
  useEffect(() => {
    const calculatePosition = () => {
      const activeIndex = themes.findIndex(t => t.value === theme)
      const activeButton = buttonsRef.current[activeIndex]
      
      if (activeButton && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect()
        const buttonRect = activeButton.getBoundingClientRect()
        
        // Check if we're in icon-only mode (text is hidden)
        const isIconOnly = window.innerWidth < 1024 // lg breakpoint
        
        if (isIconOnly) {
          // For icon-only mode, make pill smaller and centered on icon
          const pillWidth = 44 // Icon + padding size
          const buttonCenter = buttonRect.left - containerRect.left + (buttonRect.width / 2)
          setPillPosition({
            left: buttonCenter - (pillWidth / 2),
            width: pillWidth,
          })
        } else {
          // For full text mode, use full button width
          setPillPosition({
            left: buttonRect.left - containerRect.left,
            width: buttonRect.width,
          })
        }
      }
    }

    // Add small delay to ensure DOM is ready
    setTimeout(calculatePosition, 50)
    
    // Recalculate on window resize
    const handleResize = () => setTimeout(calculatePosition, 50)
    window.addEventListener('resize', handleResize)
    
    return () => window.removeEventListener('resize', handleResize)
  }, [theme, isExpanded])

  // Auto-collapse on mobile after selection
  const handleThemeSelect = (newTheme: Theme) => {
    console.log('Theme selected:', newTheme) // Debug log
    setTheme(newTheme)
    
    // Haptic feedback on mobile (if supported)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }
    
    // Auto-collapse on mobile
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      setTimeout(() => setIsExpanded(false), 300)
    }
  }

  // Keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    let newIndex = index
    
    switch (event.key) {
      case 'ArrowLeft':
        newIndex = index > 0 ? index - 1 : themes.length - 1
        break
      case 'ArrowRight':
        newIndex = index < themes.length - 1 ? index + 1 : 0
        break
      case 'Home':
        newIndex = 0
        break
      case 'End':
        newIndex = themes.length - 1
        break
      default:
        return
    }
    
    event.preventDefault()
    buttonsRef.current[newIndex]?.focus()
    const selectedTheme = themes[newIndex]
    if (selectedTheme) {
      handleThemeSelect(selectedTheme.value)
    }
  }

  // Get current theme
  const currentTheme = themes.find(t => t.value === theme) || themes[0]!

  return (
    <div className="relative">
      {/* Mobile: Collapsed state shows current theme */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          sm:hidden flex items-center gap-2 px-3 py-2
          bg-muted border border-border rounded-full
          transition-all duration-200
          ${isExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}
        `}
        aria-label="Expand theme switcher"
      >
        <span className="text-lg">{currentTheme.icon}</span>
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Theme Switcher Pill */}
      <div
        ref={containerRef}
        className={`
          relative flex items-center gap-1 p-1
          bg-muted border border-border rounded-full
          transition-all duration-300 ease-out
          ${isExpanded || 'sm:opacity-100'} 
          ${!isExpanded && 'opacity-0 pointer-events-none sm:opacity-100 sm:pointer-events-auto'}
        `}
        role="radiogroup"
        aria-label="Choose theme"
      >
        {/* Sliding background pill */}
        <div
          ref={pillRef}
          className="absolute h-[calc(100%-8px)] bg-background rounded-full shadow-sm transition-all duration-300 ease-out pointer-events-none"
          style={{
            left: `${pillPosition.left}px`,
            width: `${pillPosition.width}px`,
          }}
          aria-hidden="true"
        />

        {/* Theme buttons */}
        {themes.map((themeOption, index) => (
          <button
            key={themeOption.value}
            ref={el => { buttonsRef.current[index] = el }}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log('Button clicked:', themeOption.value)
              handleThemeSelect(themeOption.value)
            }}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onMouseEnter={() => setHoveredTheme(themeOption.value)}
            onMouseLeave={() => setHoveredTheme(null)}
            className={`
              relative z-10 flex items-center gap-2 px-3 py-2
              rounded-full transition-all duration-200 cursor-pointer
              focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1
              ${theme === themeOption.value 
                ? 'text-foreground' 
                : 'text-muted-foreground hover:text-foreground'
              }
            `}
            role="radio"
            aria-checked={theme === themeOption.value}
            aria-label={`${themeOption.label} theme: ${themeOption.description}`}
            title={themeOption.description}
          >
            <span 
              className={`
                text-lg transition-transform duration-200
                ${theme === themeOption.value ? 'scale-110' : ''}
                ${hoveredTheme === themeOption.value ? 'scale-105' : ''}
              `}
              aria-hidden="true"
            >
              {themeOption.icon}
            </span>
            <span className="text-sm font-medium hidden lg:inline">
              {themeOption.label}
            </span>
          </button>
        ))}
      </div>

      {/* Theme Preview Tooltip (desktop only) */}
      {hoveredTheme && hoveredTheme !== theme && (
        <div className="
          hidden lg:block absolute top-full mt-2 right-0 z-50
          p-3 bg-background border border-border rounded-lg shadow-lg
          animate-in fade-in slide-in-from-top-1 duration-200
        ">
          <p className="text-sm font-medium text-foreground mb-1">
            Preview: {themes.find(t => t.value === hoveredTheme)?.label}
          </p>
          <p className="text-xs text-muted-foreground">
            {themes.find(t => t.value === hoveredTheme)?.description}
          </p>
        </div>
      )}

      {/* Contextual hint for first-time users */}
      {typeof window !== 'undefined' && !localStorage.getItem('theme-hint-shown') && (
        <div className="
          absolute top-full mt-2 right-0 z-40
          p-3 bg-background border-2 border-primary text-foreground text-sm rounded-lg shadow-lg
          high-contrast:bg-background high-contrast:border-black high-contrast:text-foreground
          trauma-sensitive:bg-background trauma-sensitive:border-primary trauma-sensitive:text-foreground
          animate-in fade-in slide-in-from-top-1 duration-300
        ">
          <p className="font-medium mb-2">Try different themes for your comfort</p>
          <button
            onClick={() => {
              localStorage.setItem('theme-hint-shown', 'true')
              setIsExpanded(false)
            }}
            className="
              px-3 py-1 bg-primary text-primary-foreground rounded text-xs font-medium
              hover:bg-primary/90 transition-colors
              high-contrast:bg-black high-contrast:text-white high-contrast:hover:bg-black/90
              trauma-sensitive:bg-primary trauma-sensitive:text-white trauma-sensitive:hover:bg-primary/80
              focus:outline-none focus:ring-2 focus:ring-ring
            "
          >
            Got it
          </button>
        </div>
      )}
    </div>
  )
}