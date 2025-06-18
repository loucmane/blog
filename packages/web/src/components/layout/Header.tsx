'use client'

import * as React from 'react'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import { ThemeSwitcher } from '@minniewinnie/ui'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  sticky?: boolean
}

const Header = React.forwardRef<HTMLElement, HeaderProps>(
  ({ className, sticky = true, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)

    // Navigation items
    const navItems = [
      { href: '/', label: 'Home' },
      { href: '/stories', label: 'Rescue Stories' },
      { href: '/donate', label: 'Donate' },
      { href: '/about', label: 'About Us' },
      { href: '/contact', label: 'Contact' },
    ]

    return (
      <header
        ref={ref}
        className={cn(
          "border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
          sticky && "sticky top-0 z-50",
          className
        )}
        {...props}
      >
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and Branding */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex flex-col">
                <span className="text-xl font-bold text-primary">
                  Animal Protection Foundation
                </span>
                <span className="text-xs text-muted-foreground">
                  Protecting animals with compassion
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  {item.label}
                </Link>
              ))}
              <ThemeSwitcher />
            </nav>

            {/* Mobile Navigation */}
            <div className="flex md:hidden items-center space-x-2">
              <ThemeSwitcher />
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10"
                    aria-label="Open navigation menu"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px]">
                  <SheetHeader>
                    <SheetTitle>Navigation Menu</SheetTitle>
                  </SheetHeader>
                  <nav className="mt-6 flex flex-col space-y-4">
                    {navItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className="flex h-11 items-center rounded-md px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        {item.label}
                      </Link>
                    ))}
                    <div className="pt-4 border-t">
                      <Link
                        href="/donate"
                        onClick={() => setIsOpen(false)}
                        className="flex h-11 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        Donate Now
                      </Link>
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
    )
  }
)

Header.displayName = 'Header'

export { Header }