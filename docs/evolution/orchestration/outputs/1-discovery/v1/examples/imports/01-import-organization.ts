// 01-import-organization.ts
// Demonstrates proper import organization and patterns

// ❌ BAD: Mixed import order, no organization
import Button from '../components/Button'
import React, { useState, useEffect } from 'react'
import { formatDate } from './utils'
import type { User } from '../types'
import { motion } from 'framer-motion'
import { Metadata } from 'next'
import * as z from 'zod'
import '../styles/global.css'
import { ChevronRight } from 'lucide-react'

// ❌ BAD: Multiple imports from same source
import { Home } from 'lucide-react'
import { User } from 'lucide-react'
import { Settings } from 'lucide-react'

// ❌ BAD: Relative import spaghetti
import { BlogPost } from '../../../types/content'
import { useAuth } from '../../../../hooks/auth'
import { Button } from '../../../../../components/ui/button'

// ❌ BAD: Mixed default and named imports inconsistently
import React from 'react'
import { useState } from 'react'
// Some files use one pattern, others use different

// ✅ GOOD: Properly organized imports following the standard order
// 1. React and Next.js core imports
import * as React from 'react'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { Metadata } from 'next'
import { headers } from 'next/headers'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'

// 2. External package imports (alphabetical)
import { motion, AnimatePresence } from 'framer-motion'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format, formatDistanceToNow } from 'date-fns'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { 
  ChevronRight, 
  Home, 
  User, 
  Settings, 
  Menu,
  X,
  AlertCircle 
} from 'lucide-react'

// 3. Internal package imports (monorepo packages)
import { ThemeProvider } from '@minniewinnie/ui/providers'
import { colors, spacing, breakpoints } from '@minniewinnie/ui/tokens'
import { BaseButton } from '@minniewinnie/ui/components'
import type { SharedConfig } from '@minniewinnie/shared/types'
import { validateEmail, validatePhone } from '@minniewinnie/shared/validators'

// 4. Alias imports (local imports using @)
import { cn } from '@/lib/utils'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { blogService } from '@/services/blog.service'
import { siteConfig } from '@/config/site'

// 5. Relative imports (same directory only)
import { buttonVariants } from './button-variants'
import { CardFooter } from './card-footer'
import { formatters } from './formatters'

// 6. Type imports (always last, explicit type imports)
import type { BlogPost, Author, Category } from '@/types'
import type { ButtonProps } from './types'
import type { ApiResponse, PaginatedResponse } from '@/types/api'

// 🎯 IMPORT PATTERNS BY USE CASE

// Pattern 1: Component file imports
// components/blog/blog-card.tsx
import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'

import { formatDistanceToNow } from 'date-fns'
import { Calendar, Clock, User } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import type { BlogPost } from '@/types'

// Pattern 2: Page component imports
// app/blog/[slug]/page.tsx
import * as React from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { MDXRemote } from 'next-mdx-remote/rsc'
import { Calendar, Clock, Share2 } from 'lucide-react'

import { getBlogPost, getRelatedPosts } from '@/services/blog.service'
import { BlogCard } from '@/components/blog/blog-card'
import { ShareButtons } from '@/components/shared/share-buttons'
import { ContentWarning } from '@/components/shared/content-warning'

import type { BlogPost } from '@/types'

// Pattern 3: Utility/Hook file imports
// hooks/use-intersection-observer.ts
import * as React from 'react'

// No external packages needed

// No internal packages

// No alias imports needed for a hook

// No relative imports

import type { RefObject } from 'react'

// Pattern 4: Service layer imports
// services/blog.service.ts
// No React imports (not a component)

import { z } from 'zod'

import { apiClient } from '@/lib/api-client'
import { blogPostSchema } from '@/lib/validators'

import type { BlogPost, CreatePostRequest, UpdatePostRequest } from '@/types'
import type { ApiResponse, PaginatedResponse } from '@/types/api'

// 🚀 ADVANCED: Dynamic imports for code splitting
// Lazy load heavy components
const RichTextEditor = dynamic(
  () => import('@/components/editor/rich-text-editor'),
  { 
    loading: () => <EditorSkeleton />,
    ssr: false // Client-only component
  }
)

// Conditional imports
const DashboardAnalytics = dynamic(
  () => import('@/components/dashboard/analytics').then(mod => mod.Analytics),
  {
    loading: () => <AnalyticsSkeleton />,
  }
)

// 📁 CONFIGURING PATH ALIASES

// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/types/*": ["./src/types/*"],
      "@/services/*": ["./src/services/*"],
      "@/config/*": ["./src/config/*"]
    }
  }
}

// For Next.js projects, no additional config needed
// For other tools, may need to configure separately:

// jest.config.js
module.exports = {
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  }
}

// 🎨 IMPORT STYLE EXAMPLES

// ✅ GOOD: Grouped imports from same package
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'

// ✅ GOOD: Type imports explicit
import { Button, type ButtonProps } from '@/components/ui/button'
import type { Metadata } from 'next'

// ✅ GOOD: Namespace import for React
import * as React from 'react'

// ❌ BAD: Avoid these patterns
import Button from '@/components/ui/button' // No default exports
import * as ButtonStuff from '@/components/ui/button' // Weird namespace
import '@/styles/global.css' // Side-effect imports go in root layout

// 📝 IMPORT CHECKLIST:
// ✓ Follow the 6-group order
// ✓ Blank line between each group
// ✓ Alphabetical within groups
// ✓ Group imports from same source
// ✓ Use @ alias for all src imports
// ✓ Relative imports only in same directory
// ✓ Explicit type imports
// ✓ No default exports (except pages)
// ✓ No side-effect imports in components