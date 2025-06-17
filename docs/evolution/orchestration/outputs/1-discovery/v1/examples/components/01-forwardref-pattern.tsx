// 01-forwardref-pattern.tsx
// Demonstrates the correct forwardRef pattern vs common mistakes

// ❌ BAD: Component without forwardRef
export function BadButton({ children, className, ...props }) {
  return (
    <button className={className} {...props}>
      {children}
    </button>
  )
}

// ❌ BAD: Missing displayName
const AlsoBadButton = React.forwardRef((props, ref) => {
  return <button ref={ref} {...props} />
})

// ❌ BAD: Missing TypeScript types
const UntypedButton = React.forwardRef((props, ref) => {
  return <button ref={ref} {...props} />
})
UntypedButton.displayName = 'UntypedButton'

// ✅ GOOD: Complete forwardRef pattern with all requirements
import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className })
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }

// 🎯 MIGRATION EXAMPLE: Converting existing component
// Before:
function OldButton({ children, onClick, className }) {
  return (
    <button 
      className={`btn ${className}`} 
      onClick={onClick}
    >
      {children}
    </button>
  )
}

// After:
const NewButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <button
        className={cn('btn', className)}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  }
)
NewButton.displayName = 'Button'

// 🚀 ADVANCED: forwardRef with custom element
interface LinkButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: ButtonProps['variant']
  size?: ButtonProps['size']
}

const LinkButton = React.forwardRef<HTMLAnchorElement, LinkButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <a
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
LinkButton.displayName = 'LinkButton'

// 📝 CHECKLIST for forwardRef:
// ✓ Use React.forwardRef wrapper
// ✓ Add displayName property
// ✓ Extend appropriate HTML element props
// ✓ Type the ref parameter correctly
// ✓ Pass ref to the DOM element
// ✓ Spread remaining props
// ✓ Export as named export