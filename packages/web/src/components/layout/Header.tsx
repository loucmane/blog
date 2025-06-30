import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, Heart } from 'lucide-react'
import { ThemeSwitcher } from '@minniewinnie/ui'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useScrollDirection } from './hooks/useScrollDirection'
import { useViewTransition } from './hooks/useViewTransition'
import { MobileNav } from './MobileNav'

// Types
export interface NavItem {
  href: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  external?: boolean
  highlight?: boolean
  mobileOnly?: boolean
  desktopOnly?: boolean
}

export interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  sticky?: boolean
  navItems?: NavItem[]
  showDonateButton?: boolean
  emergencyBanner?: React.ReactNode
}

// Default navigation items
const defaultNavItems: NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/stories', label: 'Rescue Stories' },
  { href: '/updates', label: 'Field Updates' },
  { href: '/about', label: 'About Us' },
  { href: '/donate', label: 'Donate', highlight: true, mobileOnly: true },
]

/**
 * Header component for main site navigation
 * Performance-optimized with sticky behavior and mobile responsiveness
 * 
 * @example
 * <Header sticky={false} showDonateButton />
 * 
 * @accessibility
 * - Skip link for keyboard navigation
 * - ARIA landmarks for screen readers
 * - Mobile menu traps focus when open
 */
export const Header = React.forwardRef<HTMLElement, HeaderProps>(
  ({ 
    className, 
    sticky = true, 
    navItems = defaultNavItems,
    showDonateButton = true,
    emergencyBanner,
    ...props 
  }, ref) => {
    const router = useRouter()
    const navigate = useViewTransition()
    const { scrollDirection, isAtTop } = useScrollDirection()
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
    
    // Determine header visibility
    const isVisible = sticky ? (scrollDirection === 'up' || isAtTop) : true

    // Close mobile menu on route change
    React.useEffect(() => {
      setMobileMenuOpen(false)
    }, [router])

    // Prevent body scroll when mobile menu is open
    React.useEffect(() => {
      if (mobileMenuOpen) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = ''
      }
      return () => {
        document.body.style.overflow = ''
      }
    }, [mobileMenuOpen])

    const handleNavClick = React.useCallback((href: string, external?: boolean) => {
      if (!external) {
        navigate(href)
      }
    }, [navigate])

    return (
      <>
        {emergencyBanner && (
          <div className="bg-destructive text-destructive-foreground px-4 py-2 text-center">
            {emergencyBanner}
          </div>
        )}
        
        <header
          ref={ref}
          className={cn(
            'bg-background border-b border-border transition-transform duration-300 will-change-transform',
            sticky && 'sticky top-0 z-50',
            isVisible ? 'translate-y-0' : '-translate-y-full',
            className
          )}
          role="banner"
          {...props}
        >
          {/* Skip to main content link */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
                     bg-background px-4 py-2 rounded-md focus:outline-none focus:ring-2 
                     focus:ring-primary z-50"
          >
            Skip to main content
          </a>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center justify-between h-16" aria-label="Main navigation">
              {/* Logo */}
              <Link 
                href="/" 
                className="flex items-center space-x-2 text-foreground hover:text-primary 
                         transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded-md px-2 py-1"
                onClick={(e) => {
                  e.preventDefault()
                  handleNavClick('/')
                }}
              >
                <Heart className="h-6 w-6" aria-hidden="true" />
                <span className="font-semibold text-lg">Animal Protection</span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-6">
                {navItems
                  .filter(item => !item.mobileOnly)
                  .map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'text-sm font-medium transition-colors hover:text-primary',
                        'focus:outline-none focus:ring-2 focus:ring-primary rounded-md px-2 py-1',
                        item.highlight 
                          ? 'text-primary hover:text-primary/80' 
                          : 'text-muted-foreground'
                      )}
                      target={item.external ? '_blank' : undefined}
                      rel={item.external ? 'noopener noreferrer' : undefined}
                      aria-label={item.external ? `${item.label} (opens in new tab)` : undefined}
                      onClick={(e) => {
                        if (!item.external) {
                          e.preventDefault()
                          handleNavClick(item.href)
                        }
                      }}
                    >
                      {item.label}
                      {item.external && <span aria-hidden="true"> ↗</span>}
                    </Link>
                  ))}
                <ThemeSwitcher />
                {showDonateButton && (
                  <Button 
                    size="sm" 
                    onClick={() => handleNavClick('/donate')}
                    className="min-h-[44px] min-w-[44px]"
                  >
                    <Heart className="h-4 w-4 mr-2" aria-hidden="true" />
                    Donate
                  </Button>
                )}
              </div>

              {/* Mobile Navigation Controls */}
              <div className="flex md:hidden items-center space-x-2">
                <ThemeSwitcher />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(true)}
                  aria-label="Open navigation menu"
                  aria-expanded={mobileMenuOpen}
                  className="min-h-[44px] min-w-[44px]"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </div>
            </nav>
          </div>
        </header>

        {/* Mobile Navigation */}
        <MobileNav
          isOpen={mobileMenuOpen}
          onOpenChange={setMobileMenuOpen}
          navItems={navItems}
          currentPath={router.pathname || '/'}
        />
      </>
    )
  }
)

Header.displayName = 'Header'