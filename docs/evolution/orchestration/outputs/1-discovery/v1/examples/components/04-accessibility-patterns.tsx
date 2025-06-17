// 04-accessibility-patterns.tsx
// Demonstrates accessibility patterns and requirements

// ❌ BAD: Inaccessible components
export function BadIconButton({ onClick }) {
  return (
    // Missing: aria-label, focus states, minimum size
    <button 
      onClick={onClick}
      className="p-1 hover:bg-gray-100"
    >
      <XIcon className="h-4 w-4" />
    </button>
  )
}

export function BadLoadingSpinner() {
  return (
    // Missing: role, aria-label for screen readers
    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900" />
  )
}

export function BadDialog({ isOpen, onClose, children }) {
  if (!isOpen) return null
  
  return (
    // Missing: focus trap, escape key, aria attributes
    <div className="fixed inset-0 bg-black/50">
      <div className="fixed inset-x-4 top-20 bg-white p-4 rounded">
        {children}
      </div>
    </div>
  )
}

// ✅ GOOD: Accessible components following all standards
import * as React from 'react'
import { cn } from '@/lib/utils'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

// Accessible Icon Button with proper ARIA
const IconButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    label: string // Required for accessibility
  }
>(({ className, label, children, ...props }, ref) => {
  return (
    <button
      ref={ref}
      aria-label={label}
      className={cn(
        // Minimum 44px touch target for mobile
        "min-w-[44px] min-h-[44px]",
        // Clear focus states for keyboard navigation
        "inline-flex items-center justify-center rounded-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        // Interactive states
        "hover:bg-accent hover:text-accent-foreground",
        "disabled:pointer-events-none disabled:opacity-50",
        // Smooth transitions
        "transition-all duration-300",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
})
IconButton.displayName = 'IconButton'

// Accessible Loading States
export function LoadingSpinner({ className, label = "Loading" }) {
  return (
    <>
      {/* Screen reader announcement */}
      <span className="sr-only" role="status" aria-live="polite">
        {label}
      </span>
      {/* Visual spinner */}
      <div
        className={cn(
          "animate-spin rounded-full border-b-2 border-current",
          "h-4 w-4",
          className
        )}
        aria-hidden="true"
      />
    </>
  )
}

// Accessible Form Field with proper labeling
interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  description?: string
}

export function FormField({ 
  label, 
  error, 
  required, 
  description,
  children 
}: FormFieldProps & { children: React.ReactElement }) {
  const id = React.useId()
  const descriptionId = `${id}-description`
  const errorId = `${id}-error`
  
  return (
    <div className="space-y-2">
      <label 
        htmlFor={id} 
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
        {required && (
          <span className="text-destructive ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
      
      {description && (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      
      {React.cloneElement(children, {
        id,
        'aria-invalid': !!error,
        'aria-describedby': [
          description && descriptionId,
          error && errorId
        ].filter(Boolean).join(' ') || undefined,
        'aria-required': required,
      })}
      
      {error && (
        <p id={errorId} className="text-sm font-medium text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

// Accessible Dialog with Radix UI
export function AccessibleDialog({ 
  trigger, 
  title, 
  description, 
  children 
}: {
  trigger: React.ReactNode
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger asChild>
        {trigger}
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay 
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        />
        <DialogPrimitive.Content 
          className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg"
        >
          <div className="flex flex-col space-y-1.5 text-center sm:text-left">
            <DialogPrimitive.Title className="text-lg font-semibold leading-none tracking-tight">
              {title}
            </DialogPrimitive.Title>
            {description && (
              <DialogPrimitive.Description className="text-sm text-muted-foreground">
                {description}
              </DialogPrimitive.Description>
            )}
          </div>
          {children}
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

// 🎯 REAL-WORLD EXAMPLES

// Skip Link for keyboard navigation
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:rounded-md focus:ring-2 focus:ring-ring"
    >
      Skip to main content
    </a>
  )
}

// Accessible Navigation with ARIA
export function AccessibleNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  
  return (
    <nav aria-label="Main navigation">
      {/* Mobile menu button */}
      <button
        aria-label="Open main menu"
        aria-expanded={mobileMenuOpen}
        aria-controls="mobile-menu"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="min-w-[44px] min-h-[44px] md:hidden"
      >
        <span className="sr-only">
          {mobileMenuOpen ? 'Close main menu' : 'Open main menu'}
        </span>
        <MenuIcon aria-hidden="true" />
      </button>
      
      {/* Navigation list */}
      <ul 
        id="mobile-menu"
        className={cn(
          "flex flex-col md:flex-row gap-4",
          mobileMenuOpen ? "block" : "hidden md:flex"
        )}
      >
        <li>
          <a 
            href="/blog" 
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-2 py-1"
          >
            Blog
          </a>
        </li>
        <li>
          <a 
            href="/rescue-stories" 
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-2 py-1"
            aria-current="page" // If this is current page
          >
            Rescue Stories
          </a>
        </li>
      </ul>
    </nav>
  )
}

// Accessible Table with proper structure
export function AccessibleTable({ data }) {
  return (
    <div className="relative w-full overflow-auto">
      <table className="w-full caption-bottom text-sm">
        <caption className="mt-4 text-sm text-muted-foreground">
          Recent rescue operations and their outcomes
        </caption>
        <thead className="[&_tr]:border-b">
          <tr className="border-b transition-colors hover:bg-muted/50">
            <th scope="col" className="h-12 px-4 text-left align-middle font-medium">
              Date
            </th>
            <th scope="col" className="h-12 px-4 text-left align-middle font-medium">
              Location
            </th>
            <th scope="col" className="h-12 px-4 text-left align-middle font-medium">
              Animals Rescued
            </th>
            <th scope="col" className="h-12 px-4 text-left align-middle font-medium">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {data.map((row, index) => (
            <tr key={index} className="border-b transition-colors hover:bg-muted/50">
              <td className="p-4 align-middle">{row.date}</td>
              <td className="p-4 align-middle">{row.location}</td>
              <td className="p-4 align-middle">{row.count}</td>
              <td className="p-4 align-middle">
                <IconButton label={`View details for rescue on ${row.date}`}>
                  <ChevronRight className="h-4 w-4" />
                </IconButton>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// 📝 ACCESSIBILITY CHECKLIST:
// ✓ Minimum 44px touch targets on mobile
// ✓ Visible focus states (ring-2)
// ✓ ARIA labels for icon buttons
// ✓ Screen reader only content (.sr-only)
// ✓ Proper heading hierarchy
// ✓ Form labels associated with inputs
// ✓ Error messages linked with aria-describedby
// ✓ Loading states announced to screen readers
// ✓ Keyboard navigation support
// ✓ Focus trapping in modals
// ✓ Skip links for navigation
// ✓ Semantic HTML where possible
// ✓ Color contrast ratios met (4.5:1 minimum)
// ✓ Motion respects prefers-reduced-motion