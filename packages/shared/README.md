# Shared Package - Cross-Package Utilities

## Overview

Common utilities, types, and business logic shared across all packages in the Animal Protection Foundation Blog monorepo.

## Structure

```
shared/
├── src/
│   ├── types/           # Shared TypeScript types
│   │   ├── content.ts   # Content models
│   │   ├── api.ts       # API contracts
│   │   ├── donation.ts  # Donation types
│   │   └── user.ts      # User/donor types
│   ├── schemas/         # Validation schemas
│   │   ├── content.schema.ts
│   │   ├── donation.schema.ts
│   │   └── user.schema.ts
│   ├── constants/       # Shared constants
│   │   ├── content.ts   # Content classifications
│   │   ├── routes.ts    # API routes
│   │   └── config.ts    # Configuration
│   ├── utils/           # Utility functions
│   │   ├── date.ts      # Date formatting
│   │   ├── string.ts    # String manipulation
│   │   ├── validation.ts # Validation helpers
│   │   └── crypto.ts    # Encryption utilities
│   └── index.ts         # Main export
├── tests/
└── package.json
```

## Shared Types

### Content Models
```typescript
// Content sensitivity levels
export enum ContentSensitivity {
  HOPE_PROGRESS = 1,    // 70% - Positive outcomes
  MEDICAL_RESCUE = 2,   // 25% - Active operations
  CRISIS_EMERGENCY = 3  // 5% - Urgent situations
}

// Base content interface
export interface Content {
  id: string;
  title: string;
  excerpt: string;
  sensitivity: ContentSensitivity;
  publishedAt: Date;
  author: Author;
  tags: string[];
}

// Rescue story type
export interface RescueStory extends Content {
  animalName: string;
  species: AnimalSpecies;
  location: Location;
  beforeImages: Image[];
  afterImages: Image[];
  medicalRecords?: MedicalRecord[];
  outcomeStatus: OutcomeStatus;
}
```

### API Contracts
```typescript
// Standard API response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

// Pagination
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}
```

### Donation Types
```typescript
export interface Donation {
  id: string;
  amount: number;
  currency: Currency;
  donorId: string;
  campaignId?: string;
  type: DonationType;
  status: DonationStatus;
  metadata: DonationMetadata;
}

export enum DonationType {
  ONE_TIME = 'one_time',
  MONTHLY = 'monthly',
  EMERGENCY = 'emergency',
  TRIBUTE = 'tribute'
}
```

## Validation Schemas

Using Zod for runtime validation:

```typescript
import { z } from 'zod';

export const ContentSchema = z.object({
  title: z.string().min(1).max(200),
  excerpt: z.string().max(500),
  sensitivity: z.nativeEnum(ContentSensitivity),
  tags: z.array(z.string()).max(10),
});

export const DonationSchema = z.object({
  amount: z.number().positive(),
  currency: z.enum(['USD', 'EUR', 'GBP']),
  type: z.nativeEnum(DonationType),
});
```

## Utility Functions

### Date Utilities
```typescript
// Format date for display
export function formatDate(date: Date, format: 'short' | 'long'): string;

// Calculate days since rescue
export function daysSinceRescue(rescueDate: Date): number;

// Get fiscal year for donations
export function getFiscalYear(date: Date): string;
```

### Content Utilities
```typescript
// Generate excerpt from content
export function generateExcerpt(content: string, maxLength: number): string;

// Sanitize user-generated content
export function sanitizeContent(content: string): string;

// Calculate reading time
export function calculateReadingTime(content: string): number;
```

### Validation Helpers
```typescript
// Validate content sensitivity rules
export function validateSensitivityLevel(
  content: Content,
  userAge?: number
): ValidationResult;

// Check donation limits
export function validateDonationAmount(
  amount: number,
  currency: Currency
): boolean;
```

## Constants

### Content Classification
```typescript
export const CONTENT_RULES = {
  LEVEL_1: {
    name: 'Hope/Progress',
    percentage: 70,
    requiresWarning: false,
    ageRestriction: null,
  },
  LEVEL_2: {
    name: 'Medical/Rescue',
    percentage: 25,
    requiresWarning: true,
    ageRestriction: null,
  },
  LEVEL_3: {
    name: 'Crisis/Emergency',
    percentage: 5,
    requiresWarning: true,
    ageRestriction: 18,
  },
};
```

### Configuration
```typescript
export const CONFIG = {
  MAX_UPLOAD_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_IMAGE_TYPES: ['jpg', 'jpeg', 'png', 'webp'],
  DONATION_CURRENCIES: ['USD', 'EUR', 'GBP'],
  EMERGENCY_REVIEW_SLA: 60, // minutes
};
```

## Usage

```typescript
// Import from any package
import { 
  ContentSensitivity,
  validateSensitivityLevel,
  formatDate,
  CONTENT_RULES 
} from '@monorepo/shared';

// Use in your code
const isValid = validateSensitivityLevel(content, userAge);
const formattedDate = formatDate(new Date(), 'long');
```

## Development

```bash
# Install dependencies
pnpm install

# Build package
pnpm build

# Run tests
pnpm test

# Type checking
pnpm type-check
```

## Testing

All utilities include comprehensive tests:
```bash
pnpm test         # Run all tests
pnpm test:watch   # Watch mode
pnpm test:coverage # Coverage report
```