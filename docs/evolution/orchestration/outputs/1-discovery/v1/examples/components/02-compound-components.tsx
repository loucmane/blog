// 02-compound-components.tsx
// Demonstrates compound component patterns for flexible UI composition

// ❌ BAD: Monolithic component with props for everything
interface BadCardProps {
  title?: string
  description?: string
  content?: React.ReactNode
  footer?: React.ReactNode
  showHeader?: boolean
  headerClassName?: string
  contentClassName?: string
  footerClassName?: string
}

export function BadCard({ 
  title, 
  description, 
  content, 
  footer, 
  showHeader = true,
  headerClassName,
  contentClassName,
  footerClassName 
}: BadCardProps) {
  return (
    <div className="card">
      {showHeader && (title || description) && (
        <div className={headerClassName}>
          {title && <h3>{title}</h3>}
          {description && <p>{description}</p>}
        </div>
      )}
      {content && <div className={contentClassName}>{content}</div>}
      {footer && <div className={footerClassName}>{footer}</div>}
    </div>
  )
}

// ✅ GOOD: Compound components with flexibility
import * as React from 'react'
import { cn } from '@/lib/utils'

// Card Container
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        className
      )}
      {...props}
    />
  )
)
Card.displayName = "Card"

// Card Header
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  )
)
CardHeader.displayName = "CardHeader"

// Card Title
export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const CardTitle = React.forwardRef<HTMLParagraphElement, CardTitleProps>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        "text-2xl font-semibold leading-none tracking-tight",
        className
      )}
      {...props}
    />
  )
)
CardTitle.displayName = "CardTitle"

// Card Description
export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
)
CardDescription.displayName = "CardDescription"

// Card Content
export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
)
CardContent.displayName = "CardContent"

// Card Footer
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    />
  )
)
CardFooter.displayName = "CardFooter"

// Export all parts
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }

// 🎯 USAGE EXAMPLES

// Example 1: Basic card
export function BasicCardExample() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rescue Update</CardTitle>
        <CardDescription>Latest from the field</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Three puppies were rescued from a dangerous situation...</p>
      </CardContent>
    </Card>
  )
}

// Example 2: Card with custom styling
export function CustomStyledCard() {
  return (
    <Card className="w-[350px] shadow-lg">
      <CardHeader className="bg-primary/5">
        <CardTitle className="text-primary">Emergency Appeal</CardTitle>
        <CardDescription>Urgent help needed</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>We need immediate assistance for...</p>
        <div className="text-2xl font-bold">$5,000 goal</div>
      </CardContent>
      <CardFooter className="justify-between">
        <span className="text-sm text-muted-foreground">2 days left</span>
        <Button>Donate Now</Button>
      </CardFooter>
    </Card>
  )
}

// Example 3: Card without header
export function ContentOnlyCard() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-2">
          <p className="text-sm font-medium">Quick Stats</p>
          <div className="text-2xl font-bold">127 animals rescued</div>
          <p className="text-xs text-muted-foreground">This month</p>
        </div>
      </CardContent>
    </Card>
  )
}

// Example 4: Complex layout with compound components
export function RescueStoryCard() {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-video relative">
        <img 
          src="/rescue-photo.jpg" 
          alt="Rescue scene"
          className="object-cover w-full h-full"
        />
        <Badge className="absolute top-2 right-2">New</Badge>
      </div>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Mountain Rescue Success</CardTitle>
            <CardDescription>December 15, 2024</CardDescription>
          </div>
          <Badge variant="secondary">Completed</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm">
          Our team successfully rescued a family of cats trapped in...
        </p>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2">
        <div className="flex gap-2 w-full">
          <Button className="flex-1" variant="outline">Read More</Button>
          <Button className="flex-1">Share Story</Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Rescue team: Alpha Squad • Location: Northern Mountains
        </p>
      </CardFooter>
    </Card>
  )
}

// 🚀 ADVANCED: Creating your own compound component
// Example: Alert component family

const Alert = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative w-full rounded-lg border p-4",
        className
      )}
      {...props}
    />
  )
)
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn("mb-1 font-medium leading-none tracking-tight", className)}
      {...props}
    />
  )
)
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("text-sm [&_p]:leading-relaxed", className)}
      {...props}
    />
  )
)
AlertDescription.displayName = "AlertDescription"

// 📝 COMPOUND COMPONENT CHECKLIST:
// ✓ Each part is a separate component
// ✓ All parts use forwardRef
// ✓ All parts have displayName
// ✓ Parent doesn't control child rendering
// ✓ Flexible composition in usage
// ✓ Each part can be styled independently
// ✓ Export all parts individually