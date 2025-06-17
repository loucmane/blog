// 01-type-organization.ts
// Demonstrates proper TypeScript type organization and patterns

// ❌ BAD: Everything in one file with poor naming
// types.ts
interface Data {
  id: string
  name: string
  data: any
}

type PostType = {
  title: string
  content: string
  author: any
}

interface IUser {  // Don't use I prefix
  name: string
  email: string
}

type StringOrNumber = string | number  // Too generic

// ❌ BAD: Inline types everywhere
function processPost(post: {
  id: string
  title: string
  content: string
  author: {
    name: string
    email: string
  }
  tags: string[]
  publishedAt?: Date
}) {
  // Hard to reuse this type
}

// ❌ BAD: Mixed concerns in one file
// types/index.ts
export interface BlogPost { }
export class ApiError extends Error { }
export const USER_ROLES = { }
export function validateEmail() { }

// ✅ GOOD: Domain-driven type organization
// types/content.ts - Content domain types
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

export enum ContentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  SCHEDULED = 'scheduled',
  ARCHIVED = 'archived'
}

export interface SEOMetadata {
  title?: string
  description?: string
  keywords?: string[]
  ogImage?: string
  noIndex?: boolean
}

// Specific content types extend base
export interface BlogPost extends BaseContent {
  type: 'blog'
  excerpt: string
  content: string
  categories: Category[]
  tags: string[]
  readingTime: number
  featuredImage?: ImageAsset
  relatedPosts?: string[]  // IDs of related posts
}

export interface RescueStory extends BaseContent {
  type: 'rescue'
  location: Location
  rescueDate: Date
  animalType: AnimalType
  animalCount: number
  rescueTeam: TeamMember[]
  urgencyLevel: UrgencyLevel
  updates: RescueUpdate[]
  beforeImages: ImageAsset[]
  afterImages: ImageAsset[]
  donationGoal?: DonationGoal
  successMetrics: SuccessMetrics
}

export interface EmergencyAppeal extends BaseContent {
  type: 'emergency'
  cause: EmergencyCause
  targetAmount: number
  currentAmount: number
  currency: Currency
  deadline: Date
  urgencyLevel: UrgencyLevel
  beneficiaries: Beneficiary[]
  updates: AppealUpdate[]
  transparencyReport?: TransparencyReport
}

// Supporting types
export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  parentId?: string
}

export interface Location {
  country: string
  region?: string
  city?: string
  coordinates?: {
    latitude: number
    longitude: number
  }
}

export interface ImageAsset {
  id: string
  url: string
  alt: string
  width: number
  height: number
  caption?: string
  credit?: string
  sensitivityLevel?: SensitivityLevel
}

// Enums for fixed values
export enum UrgencyLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum AnimalType {
  DOG = 'dog',
  CAT = 'cat',
  BIRD = 'bird',
  WILDLIFE = 'wildlife',
  FARM = 'farm',
  EXOTIC = 'exotic',
  MULTIPLE = 'multiple'
}

export enum SensitivityLevel {
  SAFE = 'safe',
  MODERATE = 'moderate',
  SENSITIVE = 'sensitive'
}

// ✅ GOOD: Separate file for API types
// types/api.ts
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: ApiError
  metadata?: ResponseMetadata
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
  timestamp: string
}

export interface ResponseMetadata {
  timestamp: string
  version: string
  requestId: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationInfo
}

export interface PaginationInfo {
  page: number
  pageSize: number
  totalPages: number
  totalItems: number
  hasNext: boolean
  hasPrevious: boolean
}

// Request types
export interface CreatePostRequest {
  title: string
  content: string
  excerpt?: string
  categoryIds: string[]
  tags: string[]
  status: ContentStatus
  publishAt?: Date
}

export interface UpdatePostRequest extends Partial<CreatePostRequest> {
  id: string
}

// ✅ GOOD: Error types in separate file
// types/errors.ts
export class AppError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly isOperational: boolean

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message)
    this.name = this.constructor.name
    this.code = code
    this.statusCode = statusCode
    this.isOperational = isOperational
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  public readonly errors: ValidationErrorDetail[]

  constructor(message: string, errors: ValidationErrorDetail[]) {
    super(message, 'VALIDATION_ERROR', 400)
    this.errors = errors
  }
}

export interface ValidationErrorDetail {
  field: string
  message: string
  code?: string
}

// ✅ GOOD: UI component prop types
// types/ui.ts
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
  id?: string
  testId?: string
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, BaseComponentProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  asChild?: boolean
  isLoading?: boolean
}

export interface CardProps extends React.HTMLAttributes<HTMLDivElement>, BaseComponentProps {
  variant?: 'default' | 'bordered' | 'elevated'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

// ✅ GOOD: Utility types in index barrel
// types/index.ts
export * from './content'
export * from './api'
export * from './errors'
export * from './ui'

// Shared utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>
export type Nullable<T> = T | null
export type Maybe<T> = T | null | undefined

// Branded types for type safety
export type UserId = string & { readonly brand: unique symbol }
export type PostId = string & { readonly brand: unique symbol }
export type Timestamp = number & { readonly brand: unique symbol }

// Helper functions for branded types
export const UserId = (id: string): UserId => id as UserId
export const PostId = (id: string): PostId => id as PostId
export const Timestamp = (ts: number): Timestamp => ts as Timestamp

// 🎯 ADVANCED PATTERNS

// Discriminated unions for type safety
export type ContentItem = BlogPost | RescueStory | EmergencyAppeal

export function getContentType(content: ContentItem): string {
  switch (content.type) {
    case 'blog':
      return 'Blog Post'
    case 'rescue':
      return 'Rescue Story'
    case 'emergency':
      return 'Emergency Appeal'
    // TypeScript ensures all cases are handled
  }
}

// Template literal types for string patterns
export type HexColor = `#${string}`
export type DateString = `${number}-${number}-${number}`
export type EmailString = `${string}@${string}.${string}`

// Conditional types
export type AsyncState<T> = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error }

// Mapped types
export type Readonly<T> = {
  readonly [P in keyof T]: T[P]
}

export type PartialRecord<K extends keyof any, V> = {
  [P in K]?: V
}

// 📝 TYPE ORGANIZATION CHECKLIST:
// ✓ One file per domain (content.ts, api.ts, etc.)
// ✓ Interfaces for objects, types for unions/aliases
// ✓ Enums for fixed value sets
// ✓ Extend base interfaces for shared properties
// ✓ Export from index.ts barrel
// ✓ Separate UI prop types
// ✓ Branded types for IDs
// ✓ No 'any' types
// ✓ Descriptive names (not IUser or Data)