// 02-custom-error-classes.ts
// Demonstrates proper custom error class hierarchy and usage

// ❌ BAD: Generic error handling
function badErrorHandling() {
  try {
    doSomething()
  } catch (error) {
    // No type information, can't handle specific cases
    console.log('Error:', error)
    throw new Error('Something went wrong')
  }
}

// ❌ BAD: String-based errors
function throwStringError() {
  if (!data) {
    throw 'Data not found' // No stack trace, hard to debug
  }
}

// ❌ BAD: Inconsistent error objects
function inconsistentErrors() {
  if (!user) {
    throw { message: 'User not found', code: 404 }
  }
  if (!permission) {
    throw { error: 'Forbidden', status: 403 } // Different structure!
  }
}

// ✅ GOOD: Well-structured error class hierarchy
// lib/errors.ts

// Base application error class
export class AppError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly details?: Record<string, any>
  public readonly timestamp: Date

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: Record<string, any>
  ) {
    super(message)
    
    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor)
    
    this.name = this.constructor.name
    this.code = code
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.details = details
    this.timestamp = new Date()
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack }),
    }
  }
}

// Validation errors (400)
export class ValidationError extends AppError {
  public readonly errors: ValidationErrorDetail[]

  constructor(message: string, errors: ValidationErrorDetail[]) {
    super(message, 'VALIDATION_ERROR', 400)
    this.errors = errors
  }

  static fromZodError(zodError: any): ValidationError {
    const errors: ValidationErrorDetail[] = zodError.errors.map((err: any) => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    }))

    return new ValidationError('Validation failed', errors)
  }
}

export interface ValidationErrorDetail {
  field: string
  message: string
  code?: string
  value?: any
}

// Not found errors (404)
export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string | number) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`
    
    super(message, 'NOT_FOUND', 404)
  }
}

// Authentication errors (401)
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'UNAUTHORIZED', 401)
  }

  static invalidCredentials(): UnauthorizedError {
    return new UnauthorizedError('Invalid email or password')
  }

  static tokenExpired(): UnauthorizedError {
    return new UnauthorizedError('Authentication token has expired')
  }

  static tokenInvalid(): UnauthorizedError {
    return new UnauthorizedError('Invalid authentication token')
  }
}

// Permission errors (403)
export class ForbiddenError extends AppError {
  public readonly requiredRole?: string
  public readonly requiredPermission?: string

  constructor(
    action: string,
    options?: {
      requiredRole?: string
      requiredPermission?: string
    }
  ) {
    const message = `You don't have permission to ${action}`
    super(message, 'FORBIDDEN', 403)
    
    this.requiredRole = options?.requiredRole
    this.requiredPermission = options?.requiredPermission
  }
}

// Rate limit errors (429)
export class RateLimitError extends AppError {
  public readonly retryAfter: number
  public readonly limit: number
  public readonly windowMs: number

  constructor(retryAfter: number, limit: number, windowMs: number) {
    const minutes = Math.ceil(windowMs / 60000)
    const message = `Too many requests. You have exceeded the limit of ${limit} requests per ${minutes} minute(s)`
    
    super(message, 'RATE_LIMIT', 429)
    this.retryAfter = retryAfter
    this.limit = limit
    this.windowMs = windowMs
  }
}

// External service errors (502)
export class ExternalServiceError extends AppError {
  public readonly service: string
  public readonly originalError?: Error

  constructor(service: string, originalError?: Error) {
    const message = `External service '${service}' is unavailable`
    super(message, 'EXTERNAL_SERVICE_ERROR', 502, true, {
      service,
      originalMessage: originalError?.message,
    })
    
    this.service = service
    this.originalError = originalError
  }
}

// Business logic errors
export class BusinessLogicError extends AppError {
  constructor(message: string, code: string, details?: Record<string, any>) {
    super(message, code, 400, true, details)
  }

  static insufficientFunds(required: number, available: number): BusinessLogicError {
    return new BusinessLogicError(
      'Insufficient funds for this operation',
      'INSUFFICIENT_FUNDS',
      { required, available }
    )
  }

  static quotaExceeded(resource: string, limit: number): BusinessLogicError {
    return new BusinessLogicError(
      `${resource} quota exceeded`,
      'QUOTA_EXCEEDED',
      { resource, limit }
    )
  }
}

// 🎯 USAGE EXAMPLES

// Service layer with proper error handling
export class BlogService {
  async getPost(id: string): Promise<BlogPost> {
    try {
      const response = await fetch(`/api/posts/${id}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new NotFoundError('Blog post', id)
        }
        throw new ExternalServiceError('Blog API')
      }

      const data = await response.json()
      
      // Validate response
      try {
        return blogPostSchema.parse(data)
      } catch (zodError) {
        throw ValidationError.fromZodError(zodError)
      }
    } catch (error) {
      // Re-throw known errors
      if (error instanceof AppError) {
        throw error
      }
      
      // Wrap unknown errors
      throw new ExternalServiceError('Blog API', error as Error)
    }
  }

  async createPost(data: CreatePostRequest, userId: string): Promise<BlogPost> {
    // Check permissions
    const user = await getUser(userId)
    if (!user.roles.includes('author')) {
      throw new ForbiddenError('create blog posts', {
        requiredRole: 'author'
      })
    }

    // Validate input
    try {
      const validated = createPostSchema.parse(data)
    } catch (zodError) {
      throw ValidationError.fromZodError(zodError)
    }

    // Business logic checks
    const monthlyPosts = await getUserMonthlyPosts(userId)
    if (monthlyPosts >= 10) {
      throw BusinessLogicError.quotaExceeded('Monthly posts', 10)
    }

    // Create post...
  }
}

// API route error handling
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = await blogService.createPost(body, getUserId())
    
    return Response.json({
      success: true,
      data: result,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// Centralized error handler
export function handleApiError(error: unknown): Response {
  // Known operational errors
  if (error instanceof AppError) {
    return Response.json(
      {
        success: false,
        error: error.toJSON(),
      },
      { 
        status: error.statusCode,
        headers: error instanceof RateLimitError
          ? { 'Retry-After': error.retryAfter.toString() }
          : undefined
      }
    )
  }

  // Unexpected errors (bugs)
  console.error('Unhandled error:', error)
  
  // Don't leak internal details in production
  const message = process.env.NODE_ENV === 'production'
    ? 'An unexpected error occurred'
    : (error as Error).message

  return Response.json(
    {
      success: false,
      error: {
        message,
        code: 'INTERNAL_ERROR',
        statusCode: 500,
      },
    },
    { status: 500 }
  )
}

// Type guards for error handling
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

export function isOperationalError(error: unknown): boolean {
  return error instanceof AppError && error.isOperational
}

// 📝 ERROR CLASS CHECKLIST:
// ✓ Extend base AppError class
// ✓ Include error code for machines
// ✓ Include status code for HTTP
// ✓ Mark operational vs programming errors
// ✓ Capture stack trace properly
// ✓ Provide toJSON for serialization
// ✓ Create specific error types
// ✓ Include relevant context/details
// ✓ Use type guards for checking