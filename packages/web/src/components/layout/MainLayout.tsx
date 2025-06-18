import * as React from 'react'
import { Header } from './Header'
import { Footer } from './Footer'
import { cn } from '@/lib/utils'

interface MainLayoutProps {
  children: React.ReactNode
  className?: string
  headerProps?: React.ComponentPropsWithoutRef<typeof Header>
  footerProps?: React.ComponentPropsWithoutRef<typeof Footer>
  skipToContentId?: string
}

const MainLayout = React.forwardRef<HTMLDivElement, MainLayoutProps>(
  ({ 
    children, 
    className, 
    headerProps, 
    footerProps, 
    skipToContentId = 'main-content',
    ...props 
  }, ref) => {
    return (
      <div ref={ref} className={cn("min-h-screen flex flex-col", className)} {...props}>
        {/* Skip to main content link for accessibility */}
        <a
          href={`#${skipToContentId}`}
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
        >
          Skip to main content
        </a>

        {/* Header with ARIA landmark */}
        <Header {...headerProps} role="banner" />

        {/* Main content area with ARIA landmark */}
        <main 
          id={skipToContentId}
          className="flex-1"
          role="main"
          aria-label="Main content"
        >
          {children}
        </main>

        {/* Footer with ARIA landmark */}
        <Footer {...footerProps} role="contentinfo" />
      </div>
    )
  }
)

MainLayout.displayName = 'MainLayout'

export { MainLayout }