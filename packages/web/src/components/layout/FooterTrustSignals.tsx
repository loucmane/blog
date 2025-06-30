import * as React from 'react'
import { Shield, Award, Heart, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motionSafe } from './utils/motionSafe'

interface TrustSignal {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  link?: string
}

const trustSignals: TrustSignal[] = [
  {
    icon: Shield,
    title: 'Verified Charity',
    description: 'GuideStar Gold Seal',
    link: 'https://www.guidestar.org'
  },
  {
    icon: Award,
    title: '4-Star Rating',
    description: 'Charity Navigator',
    link: 'https://www.charitynavigator.org'
  },
  {
    icon: Heart,
    title: '98% Goes to Animals',
    description: 'Low overhead costs',
  },
  {
    icon: CheckCircle,
    title: 'BBB Accredited',
    description: 'Meets all 20 standards',
    link: 'https://www.bbb.org'
  }
]

/**
 * Footer trust signals component
 * Shows charity accreditations and ratings
 */
const FooterTrustSignals: React.FC = () => {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null)

  return (
    <div className="text-center">
      <h3 className="text-sm font-semibold text-foreground mb-6">
        Your Trust Matters
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {trustSignals.map((signal, index) => {
          const Icon = signal.icon
          const isHovered = hoveredIndex === index

          const content = (
            <>
              <div 
                className={cn(
                  'flex flex-col items-center p-4 rounded-lg',
                  'bg-muted/50 hover:bg-muted',
                  motionSafe('transition-all duration-200'),
                  isHovered && 'scale-105'
                )}
              >
                <Icon 
                  className={cn(
                    'h-8 w-8 mb-2',
                    motionSafe('transition-colors duration-200'),
                    isHovered ? 'text-primary' : 'text-muted-foreground'
                  )} 
                  aria-hidden="true" 
                />
                <h4 className="text-sm font-medium text-foreground mb-1">
                  {signal.title}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {signal.description}
                </p>
              </div>
              
              {/* Tooltip on hover */}
              {isHovered && signal.link && (
                <div 
                  className={cn(
                    'absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2',
                    'px-3 py-1 bg-popover text-popover-foreground rounded-md shadow-lg',
                    'text-xs whitespace-nowrap',
                    motionSafe('animate-in fade-in-0 zoom-in-95 duration-200')
                  )}
                  role="tooltip"
                >
                  Click to verify
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                    <div className="border-4 border-transparent border-t-popover" />
                  </div>
                </div>
              )}
            </>
          )

          if (signal.link) {
            return (
              <a
                key={index}
                href={signal.link}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'relative focus:outline-none focus:ring-2 focus:ring-primary rounded-lg',
                  'min-h-[44px]' // Touch target
                )}
                aria-label={`${signal.title}: ${signal.description} (opens in new tab for verification)`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {content}
              </a>
            )
          }

          return (
            <div 
              key={index} 
              className="relative"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {content}
            </div>
          )
        })}
      </div>
      
      {/* Additional trust message */}
      <p className="mt-6 text-sm text-muted-foreground max-w-2xl mx-auto">
        We're committed to transparency and accountability. Every donation makes a real difference 
        in the lives of animals in need.
      </p>
    </div>
  )
}

export default FooterTrustSignals