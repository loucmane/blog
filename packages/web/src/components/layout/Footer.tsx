import * as React from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useViewTransition } from './hooks/useViewTransition'
import { motionSafe } from './utils/motionSafe'

// Lazy load footer sections for better performance
const FooterSocialLinks = dynamic(() => import('./FooterSocialLinks'), {
  loading: () => <div className="h-12 animate-pulse bg-muted rounded" />,
  ssr: true
})

const FooterTrustSignals = dynamic(() => import('./FooterTrustSignals'), {
  loading: () => <div className="h-16 animate-pulse bg-muted rounded" />,
  ssr: false // Client-only for performance
})

// Types
export interface FooterLinkSection {
  title: string
  links: Array<{
    href: string
    label: string
    external?: boolean
  }>
}

export interface FooterProps extends React.HTMLAttributes<HTMLElement> {
  showSocialLinks?: boolean
  showTrustSignals?: boolean
  customLinks?: FooterLinkSection[]
}

// Default footer links
const defaultLinks: FooterLinkSection[] = [
  {
    title: 'About',
    links: [
      { href: '/about', label: 'Our Mission' },
      { href: '/team', label: 'Our Team' },
      { href: '/impact', label: 'Our Impact' },
      { href: '/transparency', label: 'Transparency' },
    ]
  },
  {
    title: 'Get Involved',
    links: [
      { href: '/donate', label: 'Donate' },
      { href: '/volunteer', label: 'Volunteer' },
      { href: '/foster', label: 'Foster' },
      { href: '/events', label: 'Events' },
    ]
  },
  {
    title: 'Resources',
    links: [
      { href: '/blog', label: 'Blog' },
      { href: '/resources', label: 'Animal Care' },
      { href: '/report', label: 'Report Abuse' },
      { href: '/contact', label: 'Contact Us' },
    ]
  },
  {
    title: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy Policy' },
      { href: '/terms', label: 'Terms of Use' },
      { href: '/cookies', label: 'Cookie Policy' },
      { href: '/sitemap', label: 'Sitemap' },
    ]
  }
]

/**
 * Footer component with lazy-loaded sections
 * Optimized for performance with code splitting
 * 
 * @accessibility
 * - Semantic HTML structure
 * - Proper heading hierarchy
 * - External links announced
 * - Social links have aria-labels
 */
export const Footer = React.forwardRef<HTMLElement, FooterProps>(
  ({ 
    className,
    showSocialLinks = true,
    showTrustSignals = true,
    customLinks = defaultLinks,
    ...props 
  }, ref) => {
    const navigate = useViewTransition()
    const currentYear = new Date().getFullYear()

    const handleLinkClick = React.useCallback((href: string, external?: boolean) => {
      if (!external) {
        navigate(href)
      }
    }, [navigate])

    return (
      <footer
        ref={ref}
        className={cn('bg-background border-t border-border', className)}
        role="contentinfo"
        {...props}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Main footer content */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {customLinks.map((section) => (
              <div key={section.title}>
                <h3 className="font-semibold text-foreground mb-4">
                  {section.title}
                </h3>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className={cn(
                          'text-sm text-muted-foreground hover:text-primary',
                          motionSafe('transition-colors duration-200'),
                          'focus:outline-none focus:ring-2 focus:ring-primary rounded px-1'
                        )}
                        target={link.external ? '_blank' : undefined}
                        rel={link.external ? 'noopener noreferrer' : undefined}
                        aria-label={link.external ? `${link.label} (opens in new tab)` : undefined}
                        onClick={(e) => {
                          if (!link.external) {
                            e.preventDefault()
                            handleLinkClick(link.href)
                          }
                        }}
                      >
                        {link.label}
                        {link.external && <span aria-hidden="true"> ↗</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Social links - lazy loaded */}
          {showSocialLinks && (
            <div className="border-t border-border pt-8 mb-8">
              <FooterSocialLinks />
            </div>
          )}

          {/* Trust signals - lazy loaded */}
          {showTrustSignals && (
            <div className="border-t border-border pt-8 mb-8">
              <FooterTrustSignals />
            </div>
          )}

          {/* Copyright and back to top */}
          <div className="border-t border-border pt-8 flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-4 sm:mb-0">
              <Heart className="h-4 w-4" aria-hidden="true" />
              <span>© {currentYear} Animal Protection Foundation. All rights reserved.</span>
            </div>
            
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className={cn(
                'text-sm text-muted-foreground hover:text-primary',
                motionSafe('transition-colors duration-200'),
                'focus:outline-none focus:ring-2 focus:ring-primary rounded px-3 py-2',
                'min-h-[44px]' // Ensure touch target
              )}
              aria-label="Back to top"
            >
              Back to top ↑
            </button>
          </div>
        </div>
      </footer>
    )
  }
)

Footer.displayName = 'Footer'