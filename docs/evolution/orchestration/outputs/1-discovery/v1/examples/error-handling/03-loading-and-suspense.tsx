// 03-loading-and-suspense.tsx
// Demonstrates proper loading states and Suspense patterns in Next.js 13+

// ❌ BAD: No loading states
export function BadComponent() {
  const data = fetchData() // Blocks rendering
  return <div>{data.title}</div>
}

// ❌ BAD: Generic spinner for everything
export function GenericLoading() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
    </div>
  )
}

// ❌ BAD: Loading state causes layout shift
export function LayoutShiftComponent({ isLoading, data }) {
  if (isLoading) {
    return <div>Loading...</div> // Different height than content
  }
  return (
    <div className="p-8 border rounded-lg">
      <h2 className="text-2xl">{data.title}</h2>
      <p>{data.content}</p>
    </div>
  )
}

// ✅ GOOD: Skeleton loading screens that match content layout
// components/ui/skeleton.tsx
import { cn } from '@/lib/utils'

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        className
      )}
      {...props}
    />
  )
}

// ✅ GOOD: Page-specific loading state
// app/blog/loading.tsx
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function BlogLoading() {
  return (
    <div className="container py-10">
      {/* Page header skeleton */}
      <div className="mb-10 space-y-2">
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-4 w-[300px]" />
      </div>

      {/* Blog posts skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            {/* Image skeleton */}
            <Skeleton className="aspect-video w-full" />
            
            <CardHeader className="space-y-2">
              {/* Category badge */}
              <Skeleton className="h-5 w-20" />
              {/* Title */}
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            
            <CardContent className="space-y-2">
              {/* Excerpt */}
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              
              {/* Author and date */}
              <div className="flex items-center gap-2 pt-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ✅ GOOD: Component-level loading with Suspense
// components/blog/blog-list.tsx
import { Suspense } from 'react'
import { BlogCard } from './blog-card'
import { BlogListSkeleton } from './blog-list-skeleton'

export function BlogList() {
  return (
    <Suspense fallback={<BlogListSkeleton />}>
      <BlogListContent />
    </Suspense>
  )
}

async function BlogListContent() {
  const posts = await fetchBlogPosts()
  
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <BlogCard key={post.id} post={post} />
      ))}
    </div>
  )
}

// ✅ GOOD: Streaming with loading UI
// app/rescue-stories/[id]/page.tsx
export default async function RescueStoryPage({ params }) {
  return (
    <div className="container py-10">
      {/* Critical content loads immediately */}
      <Suspense fallback={<HeaderSkeleton />}>
        <RescueStoryHeader id={params.id} />
      </Suspense>

      {/* Gallery can load later */}
      <Suspense fallback={<GallerySkeleton />}>
        <RescueGallery id={params.id} />
      </Suspense>

      {/* Updates section streams in */}
      <Suspense fallback={<UpdatesSkeleton />}>
        <RescueUpdates id={params.id} />
      </Suspense>

      {/* Related stories load last */}
      <Suspense fallback={<RelatedSkeleton />}>
        <RelatedStories id={params.id} />
      </Suspense>
    </div>
  )
}

// ✅ GOOD: Table loading skeleton
export function TableSkeleton() {
  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Skeleton className="h-10 w-[250px]" />
        <Skeleton className="ml-auto h-10 w-[100px]" />
      </div>
      <div className="rounded-md border">
        <div className="p-4 space-y-3">
          {/* Table header */}
          <div className="flex gap-4">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[150px]" />
            <Skeleton className="h-4 w-[100px]" />
          </div>
          {/* Table rows */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 pt-3">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
              <Skeleton className="h-4 w-[100px]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ✅ GOOD: Custom loading component with context
export function ContentLoadingState({ 
  type = 'default',
  message = 'Loading...' 
}: {
  type?: 'default' | 'minimal' | 'fullscreen'
  message?: string
}) {
  if (type === 'minimal') {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <LoadingSpinner size="sm" />
        <span className="text-sm">{message}</span>
      </div>
    )
  }

  if (type === 'fullscreen') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">{message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-10 space-y-4">
      <LoadingSpinner />
      <p className="text-muted-foreground">{message}</p>
    </div>
  )
}

// Loading spinner component
function LoadingSpinner({ 
  size = 'default',
  className 
}: {
  size?: 'sm' | 'default' | 'lg'
  className?: string
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  return (
    <div className="relative">
      <div
        className={cn(
          "animate-spin rounded-full border-b-2 border-current",
          sizeClasses[size],
          className
        )}
        aria-hidden="true"
      />
      <span className="sr-only">Loading</span>
    </div>
  )
}

// ✅ GOOD: Progressive enhancement with loading states
export function SearchWithLoading() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)

  const search = useDebouncedCallback(async (q: string) => {
    if (!q) {
      setResults([])
      return
    }

    setIsSearching(true)
    try {
      const data = await searchPosts(q)
      setResults(data)
    } finally {
      setIsSearching(false)
    }
  }, 300)

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="search"
          placeholder="Search posts..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            search(e.target.value)
          }}
          className="w-full pr-10"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <LoadingSpinner size="sm" />
          </div>
        )}
      </div>

      {/* Results with loading state */}
      <div className="space-y-2">
        {isSearching && query && (
          <p className="text-sm text-muted-foreground">
            Searching for "{query}"...
          </p>
        )}
        {!isSearching && results.length === 0 && query && (
          <p className="text-sm text-muted-foreground">
            No results found for "{query}"
          </p>
        )}
        {results.map((result) => (
          <SearchResult key={result.id} {...result} />
        ))}
      </div>
    </div>
  )
}

// 📝 LOADING STATE CHECKLIST:
// ✓ Use skeletons that match content layout
// ✓ Prevent layout shift with consistent heights
// ✓ Show loading for each async section
// ✓ Use Suspense for streaming
// ✓ Provide context in loading messages
// ✓ Include screen reader announcements
// ✓ Progressive loading for better UX
// ✓ Match loading to actual content structure
// ✓ Avoid generic spinners for main content