// 02-type-composition.ts
// Demonstrates advanced type composition patterns

// ❌ BAD: Repetitive types without composition
interface AdminUser {
  id: string
  email: string
  password: string
  role: 'admin'
  permissions: string[]
  createdAt: Date
  updatedAt: Date
  lastLogin: Date
}

interface RegularUser {
  id: string
  email: string
  password: string
  role: 'user'
  createdAt: Date
  updatedAt: Date
  lastLogin: Date
}

interface GuestUser {
  id: string
  sessionId: string
  createdAt: Date
}

// ❌ BAD: Using 'any' for flexibility
interface BadApiResponse {
  data: any
  error: any
  meta: any
}

// ❌ BAD: Not using discriminated unions
type BadContent = {
  type: string
  title: string
  // Can't type-narrow based on type
}

// ✅ GOOD: Interface extension for shared properties
// Base interfaces capture common patterns
export interface Timestamped {
  createdAt: Date
  updatedAt: Date
}

export interface Identifiable {
  id: string
}

export interface Sluggable {
  slug: string
}

// Compose interfaces for entities
export interface BaseUser extends Identifiable, Timestamped {
  email: string
  lastLogin?: Date
}

export interface AdminUser extends BaseUser {
  role: 'admin'
  permissions: Permission[]
}

export interface RegularUser extends BaseUser {
  role: 'user'
  profile: UserProfile
}

export interface GuestUser extends Identifiable {
  role: 'guest'
  sessionId: string
  createdAt: Date
}

// Discriminated union for all user types
export type User = AdminUser | RegularUser | GuestUser

// Type guards for narrowing
export function isAdmin(user: User): user is AdminUser {
  return user.role === 'admin'
}

export function isRegistered(user: User): user is AdminUser | RegularUser {
  return user.role === 'admin' || user.role === 'user'
}

// ✅ GOOD: Generic types for flexibility with type safety
export interface ApiResponse<T, E = ApiError> {
  success: boolean
  data?: T
  error?: E
  timestamp: string
}

export interface PaginatedData<T> {
  items: T[]
  pagination: {
    page: number
    pageSize: number
    totalPages: number
    totalItems: number
  }
}

// Composed response types
export type PostResponse = ApiResponse<BlogPost>
export type PostListResponse = ApiResponse<PaginatedData<BlogPost>>
export type ErrorResponse = ApiResponse<never, ApiError>

// ✅ GOOD: Intersection types for mixins
export interface Publishable {
  publishedAt?: Date
  status: PublishStatus
  scheduledFor?: Date
}

export interface Versionable {
  version: number
  previousVersions: string[]
  lastModifiedBy: string
}

export interface SEOOptimized {
  seo: {
    title?: string
    description?: string
    keywords?: string[]
    ogImage?: string
  }
}

// Compose capabilities
export interface BlogPost 
  extends Identifiable, 
          Timestamped, 
          Sluggable, 
          Publishable, 
          SEOOptimized,
          Versionable {
  title: string
  content: string
  excerpt: string
  author: Author
  categories: Category[]
  tags: string[]
}

// ✅ GOOD: Conditional types for advanced patterns
// Extract promise type
export type Awaited<T> = T extends Promise<infer U> ? U : T

// Make properties optional based on condition
export type ConditionalOptional<T, K extends keyof T, Condition extends boolean> = 
  Condition extends true 
    ? Omit<T, K> & Partial<Pick<T, K>>
    : T

// Deep readonly
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

// ✅ GOOD: Mapped types for transformations
// Make all properties nullable
export type Nullable<T> = {
  [P in keyof T]: T[P] | null
}

// Create a loading state type from any type
export type LoadingState<T> = {
  [P in keyof T]: T[P] | undefined
} & {
  isLoading: boolean
  error?: Error
}

// Create form data type from model
export type FormData<T> = {
  [P in keyof T]: T[P] extends Date ? string : T[P]
} & {
  errors?: Partial<Record<keyof T, string>>
}

// ✅ GOOD: Template literal types for API routes
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

export type ApiEndpoint = 
  | `/api/posts`
  | `/api/posts/${string}`
  | `/api/rescue-stories`
  | `/api/rescue-stories/${string}`
  | `/api/emergency-appeals`
  | `/api/emergency-appeals/${string}`

export interface ApiRoute {
  method: HttpMethod
  endpoint: ApiEndpoint
  authenticated: boolean
}

// 🎯 REAL-WORLD COMPOSITION EXAMPLES

// Content hierarchy with shared behaviors
export interface BaseContent extends Identifiable, Timestamped, Sluggable {
  title: string
  author: Author
  status: ContentStatus
}

export interface PublicContent extends BaseContent, Publishable, SEOOptimized {
  views: number
  likes: number
  shares: number
}

export interface SecureContent extends BaseContent {
  accessLevel: AccessLevel
  allowedRoles: Role[]
  encryptedFields: string[]
}

// Feature flags with type safety
export type FeatureFlag = 
  | 'new-editor'
  | 'advanced-analytics'
  | 'beta-api'
  | 'emergency-mode'

export type FeatureFlags = Partial<Record<FeatureFlag, boolean>>

export interface FeatureContext {
  user: User
  flags: FeatureFlags
  environment: 'development' | 'staging' | 'production'
}

// API client with typed endpoints
export interface ApiClient {
  get<T>(endpoint: `/api/${string}`): Promise<ApiResponse<T>>
  post<T, D>(endpoint: `/api/${string}`, data: D): Promise<ApiResponse<T>>
  put<T, D>(endpoint: `/api/${string}`, data: D): Promise<ApiResponse<T>>
  delete(endpoint: `/api/${string}`): Promise<ApiResponse<void>>
}

// State management types
export interface EntityState<T extends Identifiable> {
  byId: Record<string, T>
  allIds: string[]
  loading: boolean
  error: Error | null
}

export interface NormalizedData<T extends Identifiable> {
  entities: T[]
  result: string[]
}

// 🚀 ADVANCED: Builder pattern with types
export interface QueryBuilder<T> {
  where<K extends keyof T>(key: K, value: T[K]): this
  orderBy(key: keyof T, direction: 'asc' | 'desc'): this
  limit(count: number): this
  offset(count: number): this
  include(...relations: string[]): this
  build(): Query<T>
}

export interface Query<T> {
  filters: Partial<T>
  ordering?: {
    key: keyof T
    direction: 'asc' | 'desc'
  }
  pagination?: {
    limit: number
    offset: number
  }
  includes: string[]
}

// 📝 TYPE COMPOSITION CHECKLIST:
// ✓ Use interface extension for shared properties
// ✓ Create base interfaces for common patterns
// ✓ Use discriminated unions for variants
// ✓ Generic types for reusable patterns
// ✓ Intersection types for mixing behaviors
// ✓ Conditional types for advanced logic
// ✓ Mapped types for transformations
// ✓ Template literal types for string patterns
// ✓ Type guards for runtime safety