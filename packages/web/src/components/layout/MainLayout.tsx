import * as React from 'react'
import { cn } from '@/lib/utils'
import { Header, HeaderProps } from './Header'
import { Footer, FooterProps } from './Footer'
import { LayoutProvider } from './providers/LayoutProvider'
import { announce } from './utils/announce'
import { prefetchCriticalPages } from './utils/performance'

export interface MainLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  headerProps?: Partial<HeaderProps>
  footerProps?: Partial<FooterProps>
  skipToContentId?: string
}

/**
 * Main layout component that wraps all pages
 * Provides consistent header, footer, and layout structure
 * 
 * @example
 * <MainLayout>
 *   <main>Page content</main>
 * </MainLayout>
 * 
 * @accessibility
 * - Skip to content link via Header
 * - Proper landmark structure
 * - Announces page changes to screen readers
 */
export const MainLayout = React.forwardRef<HTMLDivElement, MainLayoutProps>(
  ({ 
    children, 
    className,
    headerProps,
    footerProps,
    skipToContentId = 'main-content',
    ...props 
  }, ref) => {
    // Prefetch critical pages on mount
    React.useEffect(() => {
      prefetchCriticalPages(['/stories', '/about', '/donate'])
    }, [])

    // Announce page changes for screen readers
    React.useEffect(() => {
      const title = document.title
      announce(`Navigated to ${title}`)
    }, [])

    return (
      <LayoutProvider>
        <div 
          ref={ref}
          className={cn('flex min-h-screen flex-col', className)}
          {...props}
        >
          <Header {...headerProps} />
          
          <main 
            id={skipToContentId}
            className="flex-1"
            role="main"
          >
            {children}
          </main>
          
          <Footer {...footerProps} />
        </div>
      </LayoutProvider>
    )
  }
)

MainLayout.displayName = 'MainLayout'