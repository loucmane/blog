'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useTheme } from '../../hooks/useTheme'
import { ThemeMode } from '../../types/theme'
import { clsx } from 'clsx'

interface ThemeOption {
  value: Exclude<ThemeMode, 'system'>;
  label: string;
  icon: string;
  description: string;
}

const defaultThemes: ThemeOption[] = [
  { value: 'light', label: 'Light', icon: '☀️', description: 'Bright and welcoming' },
  { value: 'dark', label: 'Dark', icon: '🌙', description: 'Easy on the eyes' },
  { value: 'contrast', label: 'Contrast', icon: '⚫', description: 'Maximum clarity' },
  { value: 'gentle', label: 'Gentle', icon: '🕊️', description: 'Soft and calming' },
]

export interface ThemeSwitcherProps {
  themes?: ThemeOption[];
  showSystem?: boolean;
  showLabels?: boolean;
  className?: string;
}

export function ThemeSwitcher({ 
  themes = defaultThemes,
  showSystem = true,
  showLabels = true,
  className
}: ThemeSwitcherProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [isExpanded, setIsExpanded] = useState(false)
  const [hoveredTheme, setHoveredTheme] = useState<ThemeMode | null>(null)
  const [pillPosition, setPillPosition] = useState({ left: 0, width: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([])

  // Add system option if enabled
  const allThemes: (ThemeOption | { value: 'system'; label: string; icon: string; description: string })[] = [
    ...themes,
    ...(showSystem ? [{ value: 'system' as const, label: 'System', icon: '💻', description: 'Follow system preference' }] : [])
  ]

  // Calculate pill position based on active theme
  useEffect(() => {
    const calculatePosition = () => {
      const activeValue = theme === 'system' ? 'system' : resolvedTheme
      const activeIndex = allThemes.findIndex(t => t.value === activeValue)
      const activeButton = buttonsRef.current[activeIndex]
      
      if (activeButton && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect()
        const buttonRect = activeButton.getBoundingClientRect()
        
        // Check if we're in icon-only mode
        const isIconOnly = !showLabels || window.innerWidth < 1024
        
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
  }, [theme, resolvedTheme, isExpanded, showLabels, allThemes])

  // Auto-collapse on mobile after selection
  const handleThemeSelect = (newTheme: ThemeMode) => {
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
        newIndex = index > 0 ? index - 1 : allThemes.length - 1
        break
      case 'ArrowRight':
        newIndex = index < allThemes.length - 1 ? index + 1 : 0
        break
      case 'Home':
        newIndex = 0
        break
      case 'End':
        newIndex = allThemes.length - 1
        break
      default:
        return
    }
    
    event.preventDefault()
    buttonsRef.current[newIndex]?.focus()
    const selectedTheme = allThemes[newIndex]
    if (selectedTheme) {
      handleThemeSelect(selectedTheme.value)
    }
  }

  // Get current theme for mobile display
  const currentTheme = theme === 'system' 
    ? { icon: '💻', label: 'System' }
    : themes.find(t => t.value === resolvedTheme) || themes[0]!

  return (
    <div className={clsx('relative', className)}>
      {/* Mobile: Collapsed state shows current theme */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={clsx(
          'sm:hidden flex items-center gap-2 px-3 py-2',
          'bg-muted border border-border rounded-full',
          'transition-all duration-200',
          isExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'
        )}
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
        className={clsx(
          'relative flex items-center gap-1 p-1',
          'bg-muted border border-border rounded-full',
          'transition-all duration-300 ease-out',
          isExpanded || 'sm:opacity-100',
          !isExpanded && 'opacity-0 pointer-events-none sm:opacity-100 sm:pointer-events-auto'
        )}
        role="radiogroup"
        aria-label="Choose theme"
      >
        {/* Sliding background pill */}
        <div
          className="absolute h-[calc(100%-8px)] bg-background rounded-full shadow-sm transition-all duration-300 ease-out pointer-events-none"
          style={{
            left: `${pillPosition.left}px`,
            width: `${pillPosition.width}px`,
          }}
          aria-hidden="true"
        />

        {/* Theme buttons */}
        {allThemes.map((themeOption, index) => {
          const isActive = theme === 'system' 
            ? themeOption.value === 'system'
            : themeOption.value === resolvedTheme
          
          return (
            <button
              key={themeOption.value}
              ref={el => { buttonsRef.current[index] = el }}
              onClick={() => handleThemeSelect(themeOption.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onMouseEnter={() => setHoveredTheme(themeOption.value)}
              onMouseLeave={() => setHoveredTheme(null)}
              className={clsx(
                'relative z-10 flex items-center gap-2 px-3 py-2',
                'rounded-full transition-all duration-200 cursor-pointer',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
                isActive 
                  ? 'text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
              role="radio"
              aria-checked={isActive}
              aria-label={`${themeOption.label} theme: ${themeOption.description}`}
              title={themeOption.description}
            >
              <span 
                className={clsx(
                  'text-lg transition-transform duration-200',
                  isActive && 'scale-110',
                  hoveredTheme === themeOption.value && 'scale-105'
                )}
                aria-hidden="true"
              >
                {themeOption.icon}
              </span>
              {showLabels && (
                <span className="text-sm font-medium hidden lg:inline">
                  {themeOption.label}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Theme Preview Tooltip (desktop only) */}
      {hoveredTheme && hoveredTheme !== theme && (
        <div className={clsx(
          'hidden lg:block absolute top-full mt-2 right-0 z-50',
          'p-3 bg-background border border-border rounded-lg shadow-lg',
          'animate-in fade-in slide-in-from-top-1 duration-200'
        )}>
          <p className="text-sm font-medium text-foreground mb-1">
            Preview: {allThemes.find(t => t.value === hoveredTheme)?.label}
          </p>
          <p className="text-xs text-muted-foreground">
            {allThemes.find(t => t.value === hoveredTheme)?.description}
          </p>
        </div>
      )}
    </div>
  )
}
