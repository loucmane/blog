// 03-cva-variants.tsx
// Demonstrates proper use of class-variance-authority (CVA) for component variants

// ❌ BAD: Conditional className strings
export function BadButton({ 
  variant = 'primary', 
  size = 'medium', 
  className = '' 
}) {
  // Messy conditional logic
  const getClassName = () => {
    let classes = 'btn'
    
    if (variant === 'primary') {
      classes += ' bg-blue-500 text-white hover:bg-blue-600'
    } else if (variant === 'secondary') {
      classes += ' bg-gray-500 text-white hover:bg-gray-600'
    } else if (variant === 'outline') {
      classes += ' border border-gray-300 hover:bg-gray-100'
    }
    
    if (size === 'small') {
      classes += ' px-2 py-1 text-sm'
    } else if (size === 'medium') {
      classes += ' px-4 py-2'
    } else if (size === 'large') {
      classes += ' px-6 py-3 text-lg'
    }
    
    return `${classes} ${className}`
  }
  
  return <button className={getClassName()}>Click me</button>
}

// ❌ BAD: Object lookup without type safety
const buttonStyles = {
  primary: 'bg-blue-500 text-white',
  secondary: 'bg-gray-500 text-white',
  outline: 'border border-gray-300'
}

export function AlsoBadButton({ variant = 'primary', className }) {
  return (
    <button className={`btn ${buttonStyles[variant]} ${className}`}>
      Click me
    </button>
  )
}

// ✅ GOOD: CVA with proper TypeScript support
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// Define the variant configuration
const buttonVariants = cva(
  // Base styles that apply to all variants
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-[0.98]",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
)

// Create the component with proper types
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

// 🎯 USAGE EXAMPLES

// Example 1: Basic usage
export function ButtonExamples() {
  return (
    <div className="space-x-4">
      <Button>Default</Button>
      <Button variant="destructive">Delete</Button>
      <Button variant="outline">Cancel</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  )
}

// Example 2: Size variations
export function ButtonSizes() {
  return (
    <div className="space-x-4 flex items-center">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

// Example 3: Custom styling with variants
export function CustomStyledButtons() {
  return (
    <div className="space-y-4">
      {/* Additional classes merge properly */}
      <Button className="w-full">Full Width Button</Button>
      
      {/* Combining variants */}
      <Button variant="destructive" size="lg" className="shadow-lg">
        Important Action
      </Button>
      
      {/* Using buttonVariants directly for custom elements */}
      <a href="/donate" className={cn(buttonVariants({ variant: "default" }))}>
        Donate Now
      </a>
    </div>
  )
}

// 🚀 ADVANCED: Complex component with multiple variant types
const alertVariants = cva(
  "relative w-full rounded-lg border p-4",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
        warning: "border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-900/50 dark:bg-orange-900/10 dark:text-orange-100",
        success: "border-green-200 bg-green-50 text-green-900 dark:border-green-900/50 dark:bg-green-900/10 dark:text-green-100",
      },
      size: {
        default: "text-sm",
        sm: "text-xs p-3",
        lg: "text-base p-6",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
)

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, size, ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant, size }), className)}
      {...props}
    />
  )
)
Alert.displayName = "Alert"

// 🎨 PATTERN: Badge with compound variants
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
        success: "border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
        warning: "border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.25 text-[10px]",
        lg: "px-3 py-1 text-sm",
      }
    },
    // Compound variants - apply styles based on multiple variant values
    compoundVariants: [
      {
        variant: "destructive",
        size: "lg",
        className: "font-bold uppercase tracking-wider"
      },
      {
        variant: ["success", "warning"],
        size: "sm",
        className: "font-normal"
      }
    ],
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
)

// 📝 CVA BEST PRACTICES CHECKLIST:
// ✓ Define base styles for all variants
// ✓ Use semantic variant names
// ✓ Include all interactive states (hover, focus, active, disabled)
// ✓ Set sensible defaultVariants
// ✓ Export both component and variants
// ✓ Use VariantProps type for props interface
// ✓ Merge className with cn() utility
// ✓ Consider compound variants for complex interactions