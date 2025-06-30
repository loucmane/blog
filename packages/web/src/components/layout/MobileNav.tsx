import * as React from 'react'
import Link from 'next/link'
import { X, Heart } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useFocusTrap } from './hooks/useFocusTrap'
import { useViewTransition } from './hooks/useViewTransition'
import { useRipple } from './utils/ripple'
import type { NavItem } from './Header'

export interface MobileNavProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  navItems: NavItem[]
  currentPath: string
  className?: string
}

/**
 * Mobile navigation component using Sheet
 * Accessible with focus trap and smooth animations
 */
export const MobileNav: React.FC<MobileNavProps> = ({
  isOpen,
  onOpenChange,
  navItems,
  currentPath,
  className
}) => {
  const sheetRef = React.useRef<HTMLDivElement>(null)
  const navigate = useViewTransition()
  const { ripples, createRipple } = useRipple()
  
  // Trap focus when open
  useFocusTrap(isOpen, sheetRef)

  // Handle navigation
  const handleNavClick = React.useCallback((href: string, external?: boolean) => {
    if (!external) {
      navigate(href)
      onOpenChange(false)
    }
  }, [navigate, onOpenChange])

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onOpenChange(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onOpenChange])

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className={cn("w-[300px] sm:w-[400px]", className)}
        ref={sheetRef}
      >
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Heart className="h-5 w-5" aria-hidden="true" />
              <span>Navigation</span>
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              aria-label="Close navigation menu"
              className="min-h-[44px] min-w-[44px]"
            >
              <X className="h-5 w-5" />
            </Button>
          </SheetTitle>
        </SheetHeader>

        <nav className="mt-6" aria-label="Mobile navigation">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = currentPath === item.href
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'relative flex items-center px-4 py-3 rounded-lg transition-colors overflow-hidden',
                      'hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary',
                      'min-h-[44px]', // Ensure 44px touch target
                      isActive && 'bg-accent text-accent-foreground',
                      item.highlight && 'text-primary font-medium'
                    )}
                    target={item.external ? '_blank' : undefined}
                    rel={item.external ? 'noopener noreferrer' : undefined}
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={item.external ? `${item.label} (opens in new tab)` : undefined}
                    onClick={(e) => {
                      createRipple(e)
                      if (!item.external) {
                        e.preventDefault()
                        handleNavClick(item.href)
                      }
                    }}
                  >
                    {/* Ripple effect container */}
                    {ripples.map((ripple) => (
                      <span
                        key={ripple.id}
                        className="absolute bg-primary/20 rounded-full animate-ripple pointer-events-none"
                        style={{
                          left: ripple.x - 20,
                          top: ripple.y - 20,
                          width: 40,
                          height: 40,
                        }}
                      />
                    ))}
                    
                    {item.icon && <item.icon className="h-5 w-5 mr-3" aria-hidden="true" />}
                    <span className="relative z-10">{item.label}</span>
                    {item.external && <span className="ml-auto text-sm" aria-hidden="true">↗</span>}
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* Donate button at bottom */}
          <div className="mt-8 px-4">
            <Button 
              className="w-full min-h-[44px]" 
              size="lg"
              onClick={() => handleNavClick('/donate')}
            >
              <Heart className="h-5 w-5 mr-2" aria-hidden="true" />
              Donate Now
            </Button>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  )
}