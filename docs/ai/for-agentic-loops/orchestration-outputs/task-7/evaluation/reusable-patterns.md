# Reusable Patterns from Task 7 Implementations

## Performance Patterns

### 1. Intersection Observer for Sticky Header (perf-1)
```typescript
// Efficient scroll detection without scroll event listeners
const sentinelRef = useRef<HTMLDivElement>(null)
const [isSticky, setIsSticky] = useState(false)

useEffect(() => {
  const observer = new IntersectionObserver(
    ([entry]) => setIsSticky(!entry.isIntersecting),
    { threshold: 0 }
  )
  
  if (sentinelRef.current) {
    observer.observe(sentinelRef.current)
  }
  
  return () => observer.disconnect()
}, [])
```

### 2. RAF-Debounced Scroll Handler (perf-1)
```typescript
const rafDebounce = (callback: Function, delay: number) => {
  let rafId: number | null = null
  let lastArgs: any[] = []
  
  return (...args: any[]) => {
    lastArgs = args
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        callback(...lastArgs)
        rafId = null
      })
    }
  }
}
```

### 3. Component Code Splitting (perf-2)
```typescript
// Separate files for better tree-shaking
// Footer.tsx imports these only when needed
const FooterSocialLinks = dynamic(() => import('./FooterSocialLinks'), {
  loading: () => <div className="h-12 animate-pulse" />
})

const FooterTrustSignals = dynamic(() => import('./FooterTrustSignals'), {
  ssr: false // Client-only for performance
})
```

## Architecture Patterns

### 4. Layout Provider Pattern (arch-2)
```typescript
// Centralized layout configuration
interface LayoutConfig {
  header: { sticky: boolean; height: number }
  footer: { showNewsletter: boolean }
  theme: { mode: 'light' | 'dark' | 'system' }
}

const LayoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<LayoutConfig>(defaultConfig)
  
  return (
    <LayoutContext.Provider value={{ config, setConfig }}>
      {children}
    </LayoutContext.Provider>
  )
}
```

### 5. Event Bus Pattern (arch-2)
```typescript
// Component communication without prop drilling
const useLayoutEventEmitter = () => {
  const events = useRef(new EventTarget())
  
  const emit = (event: string, detail?: any) => {
    events.current.dispatchEvent(new CustomEvent(event, { detail }))
  }
  
  const on = (event: string, handler: EventListener) => {
    events.current.addEventListener(event, handler)
    return () => events.current.removeEventListener(event, handler)
  }
  
  return { emit, on }
}
```

### 6. Extension System (arch-2)
```typescript
// Plugin-ready architecture
const withExtensions = (Component: React.FC<any>) => {
  return (props: any) => {
    const extensions = useExtensions()
    const enhancedProps = extensions.reduce(
      (acc, ext) => ext.enhance(acc),
      props
    )
    return <Component {...enhancedProps} />
  }
}
```

## UX/DX Patterns

### 7. Ripple Effect Hook (ux-2)
```typescript
const useRipple = () => {
  const [ripples, setRipples] = useState<Ripple[]>([])
  
  const createRipple = (event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const ripple = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      id: Date.now()
    }
    
    setRipples(prev => [...prev, ripple])
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== ripple.id))
    }, 600)
  }
  
  return { ripples, createRipple }
}
```

### 8. Motion-Safe Animations (ux-2)
```typescript
const motionSafe = (classes: string) => {
  return `motion-safe:${classes} motion-reduce:transition-none`
}

// Usage
className={motionSafe('transition-transform duration-300')}
```

### 9. Smart Default Props (ux-1)
```typescript
// Sensible defaults with override capability
const Header: React.FC<HeaderProps> = ({
  sticky = true,
  navItems = defaultNavItems,
  showDonateButton = true,
  emergencyBanner,
  ...props
}) => {
  // Implementation
}
```

## Accessibility Patterns

### 10. Live Region Hook (a11y-1)
```typescript
const useLiveRegion = (
  ref: RefObject<HTMLElement>,
  options: { atomic?: boolean; relevant?: string } = {}
) => {
  useEffect(() => {
    if (ref.current) {
      ref.current.setAttribute('role', 'status')
      ref.current.setAttribute('aria-live', 'polite')
      ref.current.setAttribute('aria-atomic', String(options.atomic ?? false))
      if (options.relevant) {
        ref.current.setAttribute('aria-relevant', options.relevant)
      }
    }
  }, [ref, options])
}
```

### 11. Voice Control Hook (a11y-2)
```typescript
const useVoiceControl = (commands: Record<string, () => void>) => {
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) return
    
    const recognition = new webkitSpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = false
    
    recognition.onresult = (event) => {
      const command = event.results[0][0].transcript.toLowerCase()
      if (commands[command]) {
        commands[command]()
      }
    }
    
    recognition.start()
    return () => recognition.stop()
  }, [commands])
}
```

### 12. Screen Reader Announcements (a11y-2)
```typescript
const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', priority)
  announcement.className = 'sr-only'
  announcement.textContent = message
  
  document.body.appendChild(announcement)
  setTimeout(() => document.body.removeChild(announcement), 1000)
}
```

## Innovation Patterns

### 13. View Transitions API (innov-1)
```typescript
const useViewTransition = () => {
  const router = useRouter()
  
  const navigate = useCallback((href: string) => {
    if ('startViewTransition' in document) {
      // @ts-ignore - Experimental API
      document.startViewTransition(() => {
        router.push(href)
      })
    } else {
      router.push(href)
    }
  }, [router])
  
  return navigate
}
```

### 14. Navigation Prediction (innov-1)
```typescript
const useNavigationPrediction = (navItems: NavItem[]) => {
  const [predictedItems, setPredictedItems] = useState(navItems)
  
  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('nav-history') || '[]')
    const frequency: Record<string, number> = {}
    
    history.forEach((path: string) => {
      frequency[path] = (frequency[path] || 0) + 1
    })
    
    const reordered = [...navItems].sort((a, b) => {
      return (frequency[b.href] || 0) - (frequency[a.href] || 0)
    })
    
    setPredictedItems(reordered)
    
    // Prefetch top 3 predicted pages
    reordered.slice(0, 3).forEach(item => {
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = item.href
      document.head.appendChild(link)
    })
  }, [navItems])
  
  return predictedItems
}
```

### 15. Speculation Rules API (innov-1)
```typescript
const useSpeculationRules = (urls: string[]) => {
  useEffect(() => {
    if (!('HTMLScriptElement' in window)) return
    // @ts-ignore - Experimental API
    if (!HTMLScriptElement.supports?.('speculationrules')) return
    
    const script = document.createElement('script')
    script.type = 'speculationrules'
    script.textContent = JSON.stringify({
      prefetch: [{ source: 'list', urls }]
    })
    
    document.body.appendChild(script)
    return () => document.body.removeChild(script)
  }, [urls])
}
```

## Common Utility Patterns

### 16. Scroll Direction Detection
```typescript
const useScrollDirection = () => {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up')
  const [isAtTop, setIsAtTop] = useState(true)
  const lastScrollY = useRef(0)
  
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setIsAtTop(currentScrollY < 10)
      
      if (currentScrollY > lastScrollY.current) {
        setScrollDirection('down')
      } else if (currentScrollY < lastScrollY.current) {
        setScrollDirection('up')
      }
      
      lastScrollY.current = currentScrollY
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  return { scrollDirection, isAtTop }
}
```

### 17. Focus Trap Management
```typescript
const useFocusTrap = (isActive: boolean, containerRef: RefObject<HTMLElement>) => {
  useEffect(() => {
    if (!isActive || !containerRef.current) return
    
    const focusableElements = containerRef.current.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
    )
    
    const firstFocusable = focusableElements[0] as HTMLElement
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      
      if (e.shiftKey && document.activeElement === firstFocusable) {
        e.preventDefault()
        lastFocusable.focus()
      } else if (!e.shiftKey && document.activeElement === lastFocusable) {
        e.preventDefault()
        firstFocusable.focus()
      }
    }
    
    containerRef.current.addEventListener('keydown', handleKeyDown)
    firstFocusable?.focus()
    
    return () => {
      containerRef.current?.removeEventListener('keydown', handleKeyDown)
    }
  }, [isActive, containerRef])
}
```

### 18. Reduced Motion Detection
```typescript
const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])
  
  return prefersReducedMotion
}
```

## Integration Patterns

### 19. Theme Persistence with System Preference
```typescript
const useThemePersistence = () => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  
  useEffect(() => {
    const stored = localStorage.getItem('theme') as typeof theme
    if (stored) {
      setTheme(stored)
    }
  }, [])
  
  const updateTheme = (newTheme: typeof theme) => {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    
    // Apply theme to document
    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      document.documentElement.classList.toggle('dark', systemTheme === 'dark')
    } else {
      document.documentElement.classList.toggle('dark', newTheme === 'dark')
    }
  }
  
  return { theme, updateTheme }
}
```

### 20. Performance Monitoring Wrapper
```typescript
const measureComponentPerformance = (componentName: string) => {
  return (WrappedComponent: React.ComponentType<any>) => {
    return (props: any) => {
      useEffect(() => {
        performance.mark(`${componentName}-start`)
        
        return () => {
          performance.mark(`${componentName}-end`)
          performance.measure(
            componentName,
            `${componentName}-start`,
            `${componentName}-end`
          )
          
          const measure = performance.getEntriesByName(componentName)[0]
          console.log(`${componentName} render time:`, measure.duration)
        }
      }, [])
      
      return <WrappedComponent {...props} />
    }
  }
}
```

## Usage Guidelines

1. **Performance Patterns**: Use for components that need optimization
2. **Architecture Patterns**: Apply when building scalable systems
3. **UX/DX Patterns**: Implement for better developer and user experience
4. **Accessibility Patterns**: Essential for inclusive design
5. **Innovation Patterns**: Use with progressive enhancement approach

These patterns can be mixed and matched based on specific requirements while keeping bundle size constraints in mind.