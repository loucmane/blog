# shadcn/ui Component Usage Patterns

This guide provides practical patterns for using shadcn/ui components in the Animal Protection Foundation blog, complementing our [Codebase Patterns](./codebase-patterns.md) guide.

## Core Principles

All shadcn/ui components follow these patterns:
- **Theme-aware**: Automatically adapt to our four-theme system
- **Accessible**: WCAG 2.1 AA compliant with proper ARIA labels
- **Composable**: Can be combined to create complex interfaces
- **Customizable**: Use `className` prop with `cn()` utility

## Button Patterns

### Basic Usage
```tsx
import { Button } from "@/components/ui/button"

// Primary action (default)
<Button>Donate Now</Button>

// Secondary action
<Button variant="secondary">Learn More</Button>

// Destructive action (use sparingly)
<Button variant="destructive">Delete</Button>

// Subtle action
<Button variant="ghost">Share</Button>

// Link style
<Button variant="link">View All Stories</Button>
```

### Loading States
```tsx
// With spinner icon
<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Processing...
</Button>

// Optimistic update pattern
function DonateButton() {
  const [isPending, startTransition] = useTransition()
  
  return (
    <Button 
      disabled={isPending}
      onClick={() => startTransition(async () => {
        await processDonation()
      })}
    >
      {isPending ? "Processing..." : "Donate"}
    </Button>
  )
}
```

### Icon Buttons
```tsx
// With text (preferred for accessibility)
<Button>
  <Heart className="mr-2 h-4 w-4" />
  Support Our Cause
</Button>

// Icon only (requires aria-label)
<Button size="icon" aria-label="Share this story">
  <Share2 className="h-4 w-4" />
</Button>
```

## Dialog Patterns

### Basic Modal
```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Donation Form</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Make a Donation</DialogTitle>
      <DialogDescription>
        Your support helps us save more animals in need.
      </DialogDescription>
    </DialogHeader>
    {/* Content */}
  </DialogContent>
</Dialog>
```

### Confirmation Dialog Pattern
```tsx
function ConfirmationDialog({ 
  title, 
  description, 
  onConfirm,
  children 
}) {
  const [open, setOpen] = useState(false)
  
  const handleConfirm = async () => {
    await onConfirm()
    setOpen(false)
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex gap-4 justify-end mt-4">
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

## Form Patterns

### Form with Validation
```tsx
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

function ContactForm() {
  const [errors, setErrors] = useState({})
  
  return (
    <form className="space-y-4" action={formAction}>
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          name="email"
          required
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-destructive">
            {errors.email}
          </p>
        )}
      </div>
      
      <Button type="submit">Submit</Button>
    </form>
  )
}
```

### Select with Label
```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

<div className="space-y-2">
  <Label htmlFor="country">Country</Label>
  <Select name="country">
    <SelectTrigger id="country">
      <SelectValue placeholder="Select your country" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="us">United States</SelectItem>
      <SelectItem value="uk">United Kingdom</SelectItem>
      <SelectItem value="ca">Canada</SelectItem>
    </SelectContent>
  </Select>
</div>
```

### Checkbox Group Pattern
```tsx
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

function InterestsForm() {
  const [interests, setInterests] = useState([])
  
  const handleCheckedChange = (value, checked) => {
    setInterests(prev => 
      checked 
        ? [...prev, value]
        : prev.filter(v => v !== value)
    )
  }
  
  return (
    <fieldset>
      <legend className="text-sm font-medium mb-3">
        Areas of Interest
      </legend>
      <div className="space-y-3">
        {['wildlife', 'farm-animals', 'pets'].map(interest => (
          <div key={interest} className="flex items-center space-x-2">
            <Checkbox
              id={interest}
              checked={interests.includes(interest)}
              onCheckedChange={(checked) => 
                handleCheckedChange(interest, checked)
              }
            />
            <Label 
              htmlFor={interest}
              className="text-sm cursor-pointer"
            >
              {interest.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Label>
          </div>
        ))}
      </div>
    </fieldset>
  )
}
```

## Card Patterns

### Content Card
```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Rescue Story</CardTitle>
    <CardDescription>
      How we saved Luna from a difficult situation
    </CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-sm text-muted-foreground">
      Luna was found abandoned in a remote area...
    </p>
  </CardContent>
  <CardFooter className="flex justify-between">
    <Button variant="outline" size="sm">Share</Button>
    <Button size="sm">Read More</Button>
  </CardFooter>
</Card>
```

### Metric Card Pattern
```tsx
function MetricCard({ title, value, description, icon: Icon }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
```

## Toast Patterns

### Success/Error Notifications
```tsx
import { useToast } from "@/hooks/use-toast"

function DonationForm() {
  const { toast } = useToast()
  
  const handleSubmit = async (data) => {
    try {
      await processDonation(data)
      toast({
        title: "Thank you!",
        description: "Your donation has been received.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: error.message,
      })
    }
  }
  
  return <form onSubmit={handleSubmit}>...</form>
}
```

### Action with Undo
```tsx
function DeleteButton({ item, onDelete }) {
  const { toast } = useToast()
  
  const handleDelete = () => {
    // Optimistically remove
    onDelete(item.id)
    
    toast({
      title: "Item deleted",
      description: "The item has been removed.",
      action: (
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            // Restore item
            restoreItem(item)
          }}
        >
          Undo
        </Button>
      ),
    })
  }
  
  return (
    <Button variant="destructive" onClick={handleDelete}>
      Delete
    </Button>
  )
}
```

## Alert Patterns

### Inline Validation Alert
```tsx
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

// Error state
{formError && (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>{formError}</AlertDescription>
  </Alert>
)}

// Success state
{success && (
  <Alert className="border-green-200 bg-green-50 text-green-900">
    <AlertDescription>
      Your changes have been saved successfully.
    </AlertDescription>
  </Alert>
)}
```

### Content Warning Pattern
```tsx
function ContentWarning({ level, children }) {
  const [accepted, setAccepted] = useState(false)
  
  if (level === 1 || accepted) {
    return children
  }
  
  return (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Content Warning</AlertTitle>
      <AlertDescription>
        This content contains {level === 2 ? 'sensitive' : 'graphic'} material
        related to animal welfare.
      </AlertDescription>
      <Button 
        size="sm" 
        className="mt-2"
        onClick={() => setAccepted(true)}
      >
        Continue Reading
      </Button>
    </Alert>
  )
}
```

## Sheet (Side Panel) Patterns

### Mobile Navigation
```tsx
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Menu } from "lucide-react"

function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col space-y-4 mt-4">
          <Link href="/stories">Rescue Stories</Link>
          <Link href="/donate">Donate</Link>
          <Link href="/about">About Us</Link>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
```

## Loading Patterns

### Skeleton Loading
```tsx
import { Skeleton } from "@/components/ui/skeleton"

function BlogCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-20 w-full" />
      </CardContent>
    </Card>
  )
}

// Usage in list
{isLoading ? (
  Array.from({ length: 3 }).map((_, i) => (
    <BlogCardSkeleton key={i} />
  ))
) : (
  posts.map(post => <BlogCard key={post.id} {...post} />)
)}
```

## Accessibility Patterns

### Focus Management
```tsx
// Auto-focus first input in dialog
import { useEffect, useRef } from 'react'

function DonationDialog() {
  const firstInputRef = useRef(null)
  
  useEffect(() => {
    firstInputRef.current?.focus()
  }, [])
  
  return (
    <DialogContent>
      <form>
        <Input ref={firstInputRef} placeholder="Amount" />
        {/* More fields */}
      </form>
    </DialogContent>
  )
}
```

### Announcements for Screen Readers
```tsx
// Announce dynamic updates
function DonationProgress({ current, goal }) {
  const percentage = (current / goal) * 100
  
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Donation progress: ${percentage.toFixed(0)}% of goal reached`}
    >
      <Progress value={percentage} />
      <p className="text-sm text-muted-foreground mt-2">
        ${current.toLocaleString()} of ${goal.toLocaleString()} goal
      </p>
    </div>
  )
}
```

## Theme Integration Patterns

### Theme-Aware Components
```tsx
// Components automatically use CSS variables
<Card className="bg-background text-foreground">
  {/* Content adapts to current theme */}
</Card>

// Custom theme-aware styling
<div className={cn(
  "rounded-lg p-4",
  "bg-primary/10 text-primary-foreground",
  "dark:bg-primary/20",
  "high-contrast:border-2 high-contrast:border-primary"
)}>
  Theme-aware content
</div>
```

## Performance Patterns

### Lazy Loading Heavy Components
```tsx
import dynamic from 'next/dynamic'

const HeavyChart = dynamic(
  () => import('@/components/ImpactChart'),
  { 
    loading: () => <Skeleton className="h-64 w-full" />,
    ssr: false 
  }
)
```

### Optimistic Updates
```tsx
function LikeButton({ postId, initialLiked }) {
  const [liked, setLiked] = useState(initialLiked)
  
  const handleLike = () => {
    // Optimistic update
    setLiked(!liked)
    
    // Server action
    startTransition(async () => {
      try {
        await toggleLike(postId)
      } catch {
        // Revert on error
        setLiked(liked)
        toast({
          variant: "destructive",
          title: "Failed to update",
        })
      }
    })
  }
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLike}
      aria-pressed={liked}
    >
      <Heart className={cn(
        "h-4 w-4",
        liked && "fill-current text-red-500"
      )} />
    </Button>
  )
}
```

## Common Composition Patterns

### Modal with Form
```tsx
function DonationModal() {
  const [open, setOpen] = useState(false)
  
  const handleSuccess = () => {
    setOpen(false)
    toast({
      title: "Thank you!",
      description: "Your donation has been processed.",
    })
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Donate Now</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Make a Donation</DialogTitle>
        </DialogHeader>
        <DonationForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  )
}
```

### Tabs with Dynamic Content
```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

function ContentTabs({ stories, updates }) {
  return (
    <Tabs defaultValue="stories" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="stories">
          Rescue Stories ({stories.length})
        </TabsTrigger>
        <TabsTrigger value="updates">
          Field Updates ({updates.length})
        </TabsTrigger>
      </TabsList>
      <TabsContent value="stories" className="space-y-4">
        {stories.map(story => (
          <StoryCard key={story.id} {...story} />
        ))}
      </TabsContent>
      <TabsContent value="updates" className="space-y-4">
        {updates.map(update => (
          <UpdateCard key={update.id} {...update} />
        ))}
      </TabsContent>
    </Tabs>
  )
}
```

## Error Handling Patterns

### Form Error Display
```tsx
function FormWithErrors() {
  const [errors, setErrors] = useState({})
  
  return (
    <form className="space-y-4">
      {errors.general && (
        <Alert variant="destructive">
          <AlertDescription>{errors.general}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-destructive">
            {errors.email}
          </p>
        )}
      </div>
    </form>
  )
}
```

## See Also

- [Codebase Patterns](./codebase-patterns.md) - General code structure patterns
- [Common Patterns](./common-patterns.md) - Quick pattern reference
- [Accessibility Standards](/docs/ai/shared-context/standards/accessibility.md) - WCAG compliance
- [Four Theme System](/docs/ai/shared-context/themes/four-themes.md) - Theme implementation