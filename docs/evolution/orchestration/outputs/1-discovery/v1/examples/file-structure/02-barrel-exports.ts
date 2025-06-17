// 02-barrel-exports.ts
// Demonstrates proper barrel export patterns

// ❌ BAD: Barrel exporting components (causes bundle size issues)
// components/ui/index.ts - NEVER DO THIS
export * from './button'
export * from './card'
export * from './dialog'
export * from './form'
export * from './input'
// Problem: Imports entire UI library even if you only need Button

// ❌ BAD: Default export in barrel
// types/index.ts
export default {
  BlogPost,
  Author,
  RescueStory
}
// Problem: Can't destructure imports, poor tree-shaking

// ❌ BAD: Mixed export styles
// lib/index.ts
export { formatDate } from './date-utils'
export default cn from './cn'
export * as validators from './validators'
// Problem: Inconsistent, confusing import patterns

// ✅ GOOD: Type barrel exports for clean imports
// types/index.ts
export * from './content'
export * from './donor'
export * from './emergency'
export * from './trauma-informed'
export * from './analytics'
export * from './ui'
export * from './api'

// Define shared utility types in the barrel
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>
export type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>
} : T

// Type guards can be exported from barrel
export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null
}

// ✅ GOOD: Individual type files with focused exports
// types/content.ts
export interface BaseContent {
  id: string
  title: string
  slug: string
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date
  status: ContentStatus
  author: Author
  seo: SEOMetadata
}

export interface BlogPost extends BaseContent {
  type: 'blog'
  excerpt: string
  content: string
  categories: Category[]
  tags: string[]
  readingTime: number
  featuredImage?: ImageAsset
}

export interface RescueStory extends BaseContent {
  type: 'rescue'
  location: Location
  rescueDate: Date
  animalType: AnimalType
  urgencyLevel: UrgencyLevel
  updates: RescueUpdate[]
  donationGoal?: DonationGoal
}

export interface EmergencyAppeal extends BaseContent {
  type: 'emergency'
  targetAmount: number
  currentAmount: number
  deadline: Date
  urgencyLevel: UrgencyLevel
  beneficiaries: Beneficiary[]
}

// Union type for type discrimination
export type ContentItem = BlogPost | RescueStory | EmergencyAppeal

// Type guards
export function isBlogPost(content: ContentItem): content is BlogPost {
  return content.type === 'blog'
}

export function isRescueStory(content: ContentItem): content is RescueStory {
  return content.type === 'rescue'
}

export function isEmergencyAppeal(content: ContentItem): content is EmergencyAppeal {
  return content.type === 'emergency'
}

// Related types
export interface Author {
  id: string
  name: string
  email: string
  bio?: string
  avatar?: ImageAsset
  role: AuthorRole
}

export enum AuthorRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  CONTRIBUTOR = 'contributor'
}

export enum ContentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

// 🎯 USAGE EXAMPLES

// Clean imports from barrel
import { 
  BlogPost, 
  RescueStory, 
  Author, 
  ContentStatus,
  isBlogPost,
  Optional,
  RequireFields 
} from '@/types'

// Instead of multiple imports
import { BlogPost } from '@/types/content'
import { Author } from '@/types/content'
import { ContentStatus } from '@/types/content'

// ✅ GOOD: Utilities barrel export (for non-React utilities)
// lib/index.ts
export { cn } from './utils'
export { formatDate, formatRelativeTime } from './date'
export { slugify, truncate } from './string'
export { debounce, throttle } from './performance'

// But still allow direct imports
export * from './errors'
export * from './validators'

// 🚀 ADVANCED: Conditional exports for different environments
// package.json for a package
{
  "name": "@minniewinnie/shared",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    },
    "./types": {
      "types": "./dist/types/index.d.ts",
      "import": "./dist/types/index.mjs",
      "require": "./dist/types/index.js"
    },
    "./utils": {
      "types": "./dist/utils/index.d.ts",
      "import": "./dist/utils/index.mjs",
      "require": "./dist/utils/index.js"
    }
  }
}

// This allows:
import { BlogPost } from '@minniewinnie/shared/types'
import { cn, formatDate } from '@minniewinnie/shared/utils'

// 📝 BARREL EXPORT RULES:

// ✓ DO barrel export:
// - Type definitions
// - Utility functions
// - Constants and enums
// - Type guards
// - Small, pure functions

// ✗ DON'T barrel export:
// - React components
// - Large modules
// - Side-effect code
// - Default exports
// - Kitchen sink exports

// 🎨 PATTERN: Organized constants export
// config/index.ts
export * from './site'
export * from './themes'
export * from './navigation'

// config/site.ts
export const siteConfig = {
  name: 'Animal Protection Foundation',
  description: 'Sharing rescue stories from the field',
  url: 'https://apf.org',
  ogImage: 'https://apf.org/og.jpg',
  links: {
    twitter: 'https://twitter.com/apf',
    github: 'https://github.com/apf'
  }
} as const

// config/themes.ts
export const themes = {
  light: 'light',
  dark: 'dark',
  highContrast: 'high-contrast',
  colorBlind: 'color-blind'
} as const

export type Theme = typeof themes[keyof typeof themes]