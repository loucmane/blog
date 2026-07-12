// Shared types across all packages

export interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
  createdBy?: string
  updatedBy?: string
}

export interface TimestampedEntity {
  createdAt: Date
  updatedAt: Date
}

export interface AuditableEntity extends TimestampedEntity {
  createdBy: string
  updatedBy: string
  version: number
}

// Common enums
export enum UserRole {
  ADMIN = 'admin',
  STAFF = 'staff',
  VOLUNTEER = 'volunteer',
  DONOR = 'donor',
  PUBLIC = 'public',
}

export enum AnimalStatus {
  RESCUE_NEEDED = 'rescue_needed',
  IN_CARE = 'in_care',
  RECOVERING = 'recovering',
  AVAILABLE_FOR_ADOPTION = 'available_for_adoption',
  ADOPTED = 'adopted',
  SANCTUARY = 'sanctuary',
  DECEASED = 'deceased',
}

export enum AnimalSpecies {
  DOG = 'dog',
  CAT = 'cat',
  RABBIT = 'rabbit',
  BIRD = 'bird',
  HORSE = 'horse',
  FARM_ANIMAL = 'farm_animal',
  WILDLIFE = 'wildlife',
  EXOTIC = 'exotic',
  OTHER = 'other',
}

// Shared validation schemas (using Zod-like structure)
export interface ValidationSchema {
  email: RegExp
  phone: RegExp
  postalCode: RegExp
  strongPassword: RegExp
}

export const VALIDATION_PATTERNS: ValidationSchema = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s()-]+$/,
  postalCode: /^[\d\-\s]+$/,
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
}

// Common response types
export interface SuccessResponse<T = any> {
  success: true
  data: T
  message?: string
}

export interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, any>
  }
}

export type ApiResult<T = any> = SuccessResponse<T> | ErrorResponse

// File upload types
export interface FileUpload {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  thumbnailUrl?: string
  uploadedAt: Date
  uploadedBy: string
  metadata?: Record<string, any>
}

// Geographic types
export interface Coordinates {
  latitude: number
  longitude: number
}

export interface Address {
  street?: string
  city: string
  state: string
  postalCode: string
  country: string
  coordinates?: Coordinates
}

// Notification types
export interface Notification {
  id: string
  recipientId: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error' | 'emergency'
  channel: 'email' | 'sms' | 'push' | 'in_app'
  priority: 'low' | 'medium' | 'high' | 'critical'
  sentAt?: Date
  readAt?: Date
  actionUrl?: string
  metadata?: Record<string, any>
}
