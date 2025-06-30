import * as React from 'react'

// Layout configuration interface
interface LayoutConfig {
  header: {
    sticky: boolean
    height: number
  }
  footer: {
    showNewsletter: boolean
  }
  theme: {
    mode: 'light' | 'dark' | 'system'
  }
}

// Default configuration
const defaultConfig: LayoutConfig = {
  header: {
    sticky: true,
    height: 64 // 4rem
  },
  footer: {
    showNewsletter: true
  },
  theme: {
    mode: 'system'
  }
}

// Context
interface LayoutContextValue {
  config: LayoutConfig
  updateConfig: (updates: Partial<LayoutConfig>) => void
}

const LayoutContext = React.createContext<LayoutContextValue | undefined>(undefined)

// Provider component
export interface LayoutProviderProps {
  children: React.ReactNode
  initialConfig?: Partial<LayoutConfig>
}

/**
 * Layout Provider for centralized configuration
 * Simplified implementation for performance
 */
export function LayoutProvider({ 
  children, 
  initialConfig 
}: LayoutProviderProps) {
  const [config, setConfig] = React.useState<LayoutConfig>({
    ...defaultConfig,
    ...initialConfig
  })

  const updateConfig = React.useCallback((updates: Partial<LayoutConfig>) => {
    setConfig(prev => ({
      ...prev,
      ...updates
    }))
  }, [])

  const value = React.useMemo(() => ({
    config,
    updateConfig
  }), [config, updateConfig])

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  )
}

// Hook to use layout configuration
export function useLayoutConfig() {
  const context = React.useContext(LayoutContext)
  
  if (!context) {
    throw new Error('useLayoutConfig must be used within LayoutProvider')
  }
  
  return context
}

// Hook for layout events (lightweight event system)
const layoutEvents = new EventTarget()

export function useLayoutEvent(
  event: string, 
  handler: EventListener
) {
  React.useEffect(() => {
    layoutEvents.addEventListener(event, handler)
    return () => layoutEvents.removeEventListener(event, handler)
  }, [event, handler])
}

export function emitLayoutEvent(event: string, detail?: any) {
  layoutEvents.dispatchEvent(new CustomEvent(event, { detail }))
}