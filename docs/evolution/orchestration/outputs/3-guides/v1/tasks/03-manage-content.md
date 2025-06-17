# Guide: Manage Content

> **Time Estimate**: 1-2 hours
> **Complexity**: Low to Medium
> **Prerequisites**: Understanding of Next.js data fetching, Content Sensitivity Framework, and markdown/MDX

## Overview

This guide covers content management workflows including creating blog posts, handling sensitive content, managing media assets, and implementing the three-tier content sensitivity system.

## Content Architecture

### File Structure
```
packages/web/
├── content/
│   ├── blog/           # Blog posts (MDX files)
│   ├── rescues/        # Rescue stories
│   ├── updates/        # Field updates
│   └── media/          # Images and videos
```

## Step 1: Create a Blog Post

### 1.1 Create MDX File

```markdown
<!-- packages/web/content/blog/2024-rescue-mission-update.mdx -->
---
title: "Mountain Rescue Mission: 47 Dogs Saved"
excerpt: "Our team successfully rescued 47 dogs from terrible conditions in the mountains."
author: "Sarah Chen"
publishedAt: "2024-12-18"
tags: ["rescue", "dogs", "field-update"]
featuredImage: "/media/rescue-mission-hero.jpg"
sensitivity: 2  # Level 2: Moderate sensitivity
sensitivityNotes: "Contains descriptions of poor living conditions"
---

import { ContentWarning } from '@/components/ContentWarning'
import { ImageGallery } from '@/components/ImageGallery'

<ContentWarning level={2}>
  This post contains descriptions of animal neglect that some readers may find distressing.
</ContentWarning>

## The Discovery

Last Tuesday, our field team received an urgent call about...

<!-- Continue with content -->
```

### 1.2 Define Content Metadata

```typescript
// types/content.ts
export interface BlogPostMeta {
  title: string
  excerpt: string
  author: string
  publishedAt: string
  updatedAt?: string
  tags: string[]
  featuredImage: string
  sensitivity: 1 | 2 | 3
  sensitivityNotes?: string
  readingTime?: number
}
```

## Step 2: Implement Content Sensitivity

### 2.1 Understanding the Three Tiers

Based on `/docs/ai/shared-context/philosophies/content-sensitivity.md`:

#### Level 1: General Audience
- Happy endings
- Educational content
- Success stories
- No content warnings needed

#### Level 2: Moderate Sensitivity
- Rescue stories with happy endings
- Medical procedures (non-graphic)
- Brief mentions of past trauma
- Shows warning, auto-reveals after acknowledgment

#### Level 3: High Sensitivity
- Detailed abuse cases
- Graphic medical content
- Ongoing crisis situations
- Requires explicit consent to view

### 2.2 Create Content Warning Component

```typescript
// components/ContentWarning.tsx
'use client'

import { useState } from 'react'
import { AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

interface ContentWarningProps {
  level: 1 | 2 | 3
  children: React.ReactNode
  customMessage?: string
}

const defaultMessages = {
  1: null, // No warning for level 1
  2: "This content discusses animal rescue situations that some may find upsetting.",
  3: "Warning: This content contains detailed descriptions of animal suffering and may be distressing."
}

export function ContentWarning({ 
  level, 
  children, 
  customMessage 
}: ContentWarningProps) {
  const [isRevealed, setIsRevealed] = useState(level === 1)
  const message = customMessage || defaultMessages[level]
  
  // Level 1 content shows immediately
  if (level === 1) {
    return <>{children}</>
  }
  
  return (
    <div className="my-8">
      {!isRevealed ? (
        <Alert className={cn(
          "border-2",
          level === 2 && "border-yellow-500/50 bg-yellow-50/10",
          level === 3 && "border-red-500/50 bg-red-50/10"
        )}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="space-y-4">
            <p className="font-medium">{message}</p>
            <div className="flex gap-4">
              <Button
                onClick={() => setIsRevealed(true)}
                variant={level === 3 ? "destructive" : "default"}
                size="sm"
              >
                <Eye className="h-4 w-4 mr-2" />
                {level === 3 ? "I understand, show content" : "Show content"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a href="/blog">Return to blog</a>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          <Button
            onClick={() => setIsRevealed(false)}
            variant="ghost"
            size="sm"
            className="mb-4"
          >
            <EyeOff className="h-4 w-4 mr-2" />
            Hide content
          </Button>
          <div className={cn(
            "transition-all duration-300",
            !isRevealed && "blur-xl pointer-events-none"
          )}>
            {children}
          </div>
        </div>
      )}
    </div>
  )
}
```

## Step 3: Optimize Media Assets

### 3.1 Image Processing Pipeline

```typescript
// utils/imageOptimization.ts
import sharp from 'sharp'
import { join } from 'path'

export async function optimizeImage(
  inputPath: string,
  outputDir: string,
  filename: string
) {
  const image = sharp(inputPath)
  const metadata = await image.metadata()
  
  // Generate multiple sizes
  const sizes = [
    { width: 640, suffix: 'sm' },
    { width: 1024, suffix: 'md' },
    { width: 1920, suffix: 'lg' },
  ]
  
  const outputs = await Promise.all(
    sizes.map(async ({ width, suffix }) => {
      const outputPath = join(
        outputDir, 
        `${filename}-${suffix}.webp`
      )
      
      await image
        .resize(width, null, { 
          withoutEnlargement: true,
          fit: 'inside'
        })
        .webp({ quality: 85 })
        .toFile(outputPath)
      
      return { width, path: outputPath }
    })
  )
  
  // Generate blur placeholder
  const placeholder = await image
    .resize(10)
    .blur()
    .webp({ quality: 50 })
    .toBuffer()
  
  return {
    outputs,
    placeholder: `data:image/webp;base64,${placeholder.toString('base64')}`,
    aspectRatio: metadata.width! / metadata.height!
  }
}
```

### 3.2 Responsive Image Component

```typescript
// components/ResponsiveImage.tsx
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface ResponsiveImageProps {
  src: string
  alt: string
  sensitivity?: 1 | 2 | 3
  priority?: boolean
  className?: string
  sizes?: string
}

export function ResponsiveImage({
  src,
  alt,
  sensitivity = 1,
  priority = false,
  className,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 75vw, 50vw"
}: ResponsiveImageProps) {
  // Apply gentle theme adjustments for sensitive content
  const imageClasses = cn(
    "rounded-lg",
    className,
    sensitivity > 1 && "gentle:opacity-90",
    sensitivity === 3 && "gentle:grayscale gentle:opacity-80"
  )
  
  return (
    <div className="relative">
      <Image
        src={src}
        alt={alt}
        width={1920}
        height={1080}
        priority={priority}
        sizes={sizes}
        className={imageClasses}
        placeholder="blur"
        blurDataURL={generateBlurDataURL(src)}
      />
      {sensitivity > 1 && (
        <div className="sr-only">
          Sensitivity level {sensitivity} image: {alt}
        </div>
      )}
    </div>
  )
}
```

## Step 4: Content Management System

### 4.1 Content List Page

```typescript
// app/blog/page.tsx
import { Suspense } from 'react'
import { BlogGrid } from '@/components/BlogGrid'
import { BlogFilters } from '@/components/BlogFilters'
import { getBlogPosts } from '@/lib/api/blog'

export default async function BlogPage({
  searchParams
}: {
  searchParams: { 
    tag?: string
    sensitivity?: string
    sort?: 'latest' | 'popular'
  }
}) {
  return (
    <div className="container py-8">
      <h1 className="text-4xl font-bold mb-8">Blog</h1>
      
      <BlogFilters 
        currentFilters={searchParams}
        className="mb-8"
      />
      
      <Suspense fallback={<BlogGridSkeleton />}>
        <BlogPostList filters={searchParams} />
      </Suspense>
    </div>
  )
}

async function BlogPostList({ filters }) {
  const posts = await getBlogPosts(filters)
  return <BlogGrid posts={posts} />
}
```

### 4.2 Content API

```typescript
// lib/api/blog.ts
import { cache } from 'react'
import matter from 'gray-matter'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'

export const getBlogPosts = cache(async (filters?: {
  tag?: string
  sensitivity?: string
  sort?: string
}) => {
  const postsDirectory = join(process.cwd(), 'content/blog')
  const filenames = await readdir(postsDirectory)
  
  const posts = await Promise.all(
    filenames
      .filter(fn => fn.endsWith('.mdx'))
      .map(async (filename) => {
        const filePath = join(postsDirectory, filename)
        const fileContents = await readFile(filePath, 'utf8')
        const { data, content } = matter(fileContents)
        
        return {
          slug: filename.replace('.mdx', ''),
          content,
          ...data,
          readingTime: calculateReadingTime(content)
        } as BlogPost
      })
  )
  
  // Apply filters
  let filtered = posts
  
  if (filters?.tag) {
    filtered = filtered.filter(post => 
      post.tags.includes(filters.tag!)
    )
  }
  
  if (filters?.sensitivity) {
    filtered = filtered.filter(post => 
      post.sensitivity === parseInt(filters.sensitivity!)
    )
  }
  
  // Sort
  if (filters?.sort === 'popular') {
    // Implement view count sorting
  } else {
    // Default to latest
    filtered.sort((a, b) => 
      new Date(b.publishedAt).getTime() - 
      new Date(a.publishedAt).getTime()
    )
  }
  
  return filtered
})
```

## Step 5: Content Preview & Draft System

### 5.1 Draft Mode

```typescript
// app/api/preview/route.ts
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  const slug = searchParams.get('slug')
  
  // Validate secret
  if (secret !== process.env.PREVIEW_SECRET) {
    return new Response('Invalid token', { status: 401 })
  }
  
  // Enable Draft Mode
  draftMode().enable()
  
  // Redirect to the path
  redirect(`/blog/${slug}`)
}
```

### 5.2 Preview Component

```typescript
// components/PreviewBanner.tsx
'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function PreviewBanner() {
  const router = useRouter()
  
  async function exitPreview() {
    await fetch('/api/exit-preview')
    router.refresh()
  }
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-black p-2">
      <div className="container flex items-center justify-between">
        <p className="font-medium">
          Preview Mode - This is a draft
        </p>
        <Button
          onClick={exitPreview}
          variant="secondary"
          size="sm"
        >
          Exit Preview
        </Button>
      </div>
    </div>
  )
}
```

## Step 6: Content Scheduling

### 6.1 Scheduled Publishing

```typescript
// utils/scheduler.ts
export async function getPublishedPosts() {
  const allPosts = await getAllPosts()
  const now = new Date()
  
  return allPosts.filter(post => {
    const publishDate = new Date(post.publishedAt)
    return publishDate <= now
  })
}

// Cron job or GitHub Action
// .github/workflows/publish-scheduled.yml
name: Publish Scheduled Posts
on:
  schedule:
    - cron: '0 * * * *' # Every hour
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Trigger rebuild
        run: |
          curl -X POST ${{ secrets.DEPLOY_HOOK_URL }}
```

## Step 7: Content Search

### 7.1 Implement Search

```typescript
// lib/search.ts
import { BlogPost } from '@/types/blog'
import Fuse from 'fuse.js'

export function searchContent(
  posts: BlogPost[],
  query: string
) {
  const fuse = new Fuse(posts, {
    keys: [
      { name: 'title', weight: 0.4 },
      { name: 'excerpt', weight: 0.3 },
      { name: 'content', weight: 0.2 },
      { name: 'tags', weight: 0.1 }
    ],
    threshold: 0.3,
    includeScore: true
  })
  
  return fuse.search(query).map(result => ({
    ...result.item,
    score: result.score
  }))
}
```

### 7.2 Search UI

```typescript
// components/SearchDialog.tsx
'use client'

import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { searchContent } from '@/lib/search'
import { useDebounce } from '@/hooks/useDebounce'

export function SearchDialog({ posts }: { posts: BlogPost[] }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 300)
  const [results, setResults] = useState<BlogPost[]>([])
  
  useEffect(() => {
    if (debouncedQuery) {
      const searchResults = searchContent(posts, debouncedQuery)
      setResults(searchResults)
    } else {
      setResults([])
    }
  }, [debouncedQuery, posts])
  
  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(true)
      }
    }
    
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])
  
  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className="gap-2"
      >
        <Search className="h-4 w-4" />
        Search
        <kbd className="ml-2 text-xs">⌘K</kbd>
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0">
          <div className="border-b p-4">
            <Input
              placeholder="Search blog posts..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-0 focus-visible:ring-0"
              autoFocus
            />
          </div>
          
          <div className="max-h-[400px] overflow-y-auto p-4">
            {results.length > 0 ? (
              <ul className="space-y-2">
                {results.map((post) => (
                  <li key={post.slug}>
                    <a
                      href={`/blog/${post.slug}`}
                      className="block p-3 rounded hover:bg-accent"
                      onClick={() => setOpen(false)}
                    >
                      <h3 className="font-medium">{post.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {post.excerpt}
                      </p>
                    </a>
                  </li>
                ))}
              </ul>
            ) : query ? (
              <p className="text-muted-foreground text-center py-8">
                No results found
              </p>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Start typing to search
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
```

## Content Management Best Practices

### 1. Always Include Alt Text
```typescript
// ❌ Bad
<Image src="/rescue.jpg" alt="" />

// ✅ Good
<Image 
  src="/rescue.jpg" 
  alt="Golden retriever being carried to safety by rescue team member"
/>
```

### 2. Use Semantic HTML
```markdown
<!-- ❌ Bad -->
<div class="title">Rescue Update</div>

<!-- ✅ Good -->
## Rescue Update
```

### 3. Optimize for SEO
```typescript
// Always include metadata
export const metadata: Metadata = {
  title: post.title,
  description: post.excerpt,
  openGraph: {
    images: [post.featuredImage],
  },
}
```

### 4. Test Content Sensitivity
- View in all four themes
- Test with screen readers
- Verify warnings display correctly
- Check image sensitivity filters

## Troubleshooting

### Issue: MDX not rendering
**Solution**: Check MDX configuration in next.config.js

### Issue: Images not optimizing
**Solution**: Ensure images are in public folder or use proper loader

### Issue: Content not updating
**Solution**: Clear Next.js cache or use revalidation

### Issue: Search not working
**Solution**: Rebuild search index, check Fuse.js configuration

## Resources

- [MDX Documentation](https://mdxjs.com/)
- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- Content Sensitivity: `/docs/ai/shared-context/philosophies/content-sensitivity.md`
- Project Standards: `/docs/ai/shared-context/standards/`