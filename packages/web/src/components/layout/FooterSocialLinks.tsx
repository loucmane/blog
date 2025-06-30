import * as React from 'react'
import Link from 'next/link'
import { Facebook, Twitter, Instagram, Youtube, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motionSafe } from './utils/motionSafe'
import { useRipple } from './utils/ripple'

interface SocialLink {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const socialLinks: SocialLink[] = [
  {
    href: 'https://facebook.com/animalprotection',
    label: 'Facebook',
    icon: Facebook
  },
  {
    href: 'https://twitter.com/animalprotect',
    label: 'Twitter',
    icon: Twitter
  },
  {
    href: 'https://instagram.com/animalprotection',
    label: 'Instagram',
    icon: Instagram
  },
  {
    href: 'https://youtube.com/animalprotection',
    label: 'YouTube',
    icon: Youtube
  },
  {
    href: 'mailto:contact@animalprotection.org',
    label: 'Email',
    icon: Mail
  }
]

/**
 * Footer social media links component
 * Lazy loaded for performance optimization
 */
const FooterSocialLinks: React.FC = () => {
  const { ripples, createRipple } = useRipple()

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-sm font-semibold text-foreground mb-4">
        Connect With Us
      </h3>
      <div className="flex space-x-4">
        {socialLinks.map((link) => {
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'relative p-3 rounded-full bg-muted hover:bg-accent',
                motionSafe('transition-all duration-200 hover:scale-110'),
                'focus:outline-none focus:ring-2 focus:ring-primary',
                'min-h-[44px] min-w-[44px] flex items-center justify-center',
                'overflow-hidden'
              )}
              aria-label={`Follow us on ${link.label} (opens in new tab)`}
              onClick={createRipple}
            >
              {/* Ripple effect */}
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
              
              <Icon className="h-5 w-5 relative z-10" aria-hidden="true" />
            </Link>
          )
        })}
      </div>
      
      {/* Newsletter signup */}
      <div className="mt-8 w-full max-w-md">
        <h4 className="text-sm font-semibold text-foreground mb-2 text-center">
          Stay Updated
        </h4>
        <form 
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            // Newsletter submission would be handled here
            console.log('Newsletter signup')
          }}
        >
          <input
            type="email"
            placeholder="Enter your email"
            className={cn(
              'flex-1 px-4 py-2 rounded-md border border-input bg-background',
              'focus:outline-none focus:ring-2 focus:ring-primary',
              'min-h-[44px]'
            )}
            required
            aria-label="Email address for newsletter"
          />
          <button
            type="submit"
            className={cn(
              'px-6 py-2 bg-primary text-primary-foreground rounded-md',
              'hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary',
              motionSafe('transition-colors duration-200'),
              'min-h-[44px] min-w-[44px]'
            )}
          >
            Subscribe
          </button>
        </form>
      </div>
    </div>
  )
}

export default FooterSocialLinks