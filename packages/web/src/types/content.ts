// Core content types for Animal Protection Foundation

export interface Author {
  id: string
  name: string
  email: string
  bio: string
  avatar?: string
  role: 'Staff' | 'Volunteer' | 'Veterinarian' | 'Guest'
  socialLinks?: {
    twitter?: string
    linkedin?: string
    website?: string
  }
}

export interface SEOMetadata {
  title: string
  description: string
  keywords: string[]
  socialImage?: string
  canonical?: string
  noIndex?: boolean
}

export interface BaseContent {
  id: string
  title: string
  excerpt: string
  content: string // MDX content
  publishedAt: Date
  updatedAt: Date
  tags: string[]
  category: string
  featured: boolean
  author: Author
  seo: SEOMetadata
  socialImage?: string
  slug: string
  readingTime: number
}

export interface BlogPost extends BaseContent {
  type: 'blog'
  relatedPosts?: string[] // Array of post IDs
}

export interface RescueStory extends BaseContent {
  type: 'story'
  animalInfo: {
    name: string
    species: string
    breed?: string
    age?: string
    rescueDate: Date
    currentStatus: 'Rescued' | 'In Care' | 'Adopted' | 'Sanctuary'
  }
  beforeAfterImages?: {
    before: string[]
    after: string[]
  }
  outcomeUpdate?: string
}

export interface EmergencyAppeal extends BaseContent {
  type: 'appeal'
  urgencyLevel: 'Critical' | 'High' | 'Medium'
  fundraisingGoal: number
  currentAmount: number
  deadline?: Date
  isActive: boolean
  donationLink: string
  impactMetrics?: {
    animalsAffected: number
    estimatedCost: number
    timeframe: string
  }
}

export type ContentType = BlogPost | RescueStory | EmergencyAppeal

export interface ContentFilter {
  category?: string
  tags?: string[]
  author?: string
  type?: ContentType['type']
  featured?: boolean
  dateRange?: {
    start: Date
    end: Date
  }
}

export interface ContentSearchResult {
  item: ContentType
  score: number
  matches: string[]
}
