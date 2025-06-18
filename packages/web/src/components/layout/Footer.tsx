import * as React from 'react'
import Link from 'next/link'
import { Heart, Shield, Award, Facebook, Twitter, Instagram, Youtube } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FooterProps extends React.HTMLAttributes<HTMLElement> {}

const Footer = React.forwardRef<HTMLElement, FooterProps>(
  ({ className, ...props }, ref) => {
    const currentYear = new Date().getFullYear()

    const footerLinks = {
      about: [
        { href: '/about', label: 'Our Mission' },
        { href: '/team', label: 'Our Team' },
        { href: '/impact', label: 'Impact Report' },
        { href: '/transparency', label: 'Transparency' },
      ],
      help: [
        { href: '/donate', label: 'Donate' },
        { href: '/volunteer', label: 'Volunteer' },
        { href: '/foster', label: 'Foster' },
        { href: '/adopt', label: 'Adopt' },
      ],
      resources: [
        { href: '/stories', label: 'Rescue Stories' },
        { href: '/education', label: 'Education' },
        { href: '/emergency', label: 'Emergency Help' },
        { href: '/faq', label: 'FAQ' },
      ],
      legal: [
        { href: '/privacy', label: 'Privacy Policy' },
        { href: '/terms', label: 'Terms of Service' },
        { href: '/cookies', label: 'Cookie Policy' },
        { href: '/contact', label: 'Contact Us' },
      ],
    }

    const socialLinks = [
      { icon: Facebook, href: 'https://facebook.com', label: 'Facebook' },
      { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
      { icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
      { icon: Youtube, href: 'https://youtube.com', label: 'YouTube' },
    ]

    return (
      <footer
        ref={ref}
        className={cn("bg-muted/50 border-t", className)}
        {...props}
      >
        <div className="container mx-auto px-4 py-12">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
            {/* Organization Info */}
            <div className="lg:col-span-1">
              <h3 className="font-bold text-primary mb-4">
                Animal Protection Foundation
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Dedicated to rescuing and protecting animals worldwide since 2010.
              </p>
              {/* Social Links */}
              <div className="flex space-x-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="h-10 w-10 flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <social.icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Footer Links */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:col-span-4">
              <div>
                <h4 className="font-semibold mb-3">About</h4>
                <ul className="space-y-2">
                  {footerLinks.about.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Get Involved</h4>
                <ul className="space-y-2">
                  {footerLinks.help.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Resources</h4>
                <ul className="space-y-2">
                  {footerLinks.resources.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Legal</h4>
                <ul className="space-y-2">
                  {footerLinks.legal.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Trust Signals */}
          <div className="border-t border-border pt-8 mb-8">
            <div className="flex flex-wrap items-center justify-center gap-8">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Shield className="h-5 w-5" />
                <span>SSL Secured</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Award className="h-5 w-5" />
                <span>Charity Navigator 4-Star</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Heart className="h-5 w-5" />
                <span>501(c)(3) Nonprofit</span>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center text-sm text-muted-foreground">
            <p>© {currentYear} Animal Protection Foundation. All rights reserved.</p>
            <p className="mt-2">
              Your donations are tax-deductible. EIN: 12-3456789
            </p>
          </div>
        </div>
      </footer>
    )
  }
)

Footer.displayName = 'Footer'

export { Footer }