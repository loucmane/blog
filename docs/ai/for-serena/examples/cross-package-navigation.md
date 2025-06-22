# Example: Cross-Package Navigation in Monorepo

## Overview
This example shows how Serena excels at navigating the MomsBlog monorepo structure, tracing dependencies across package boundaries.

## The Challenge
Need to understand how the `Animal` type flows from definition in `shared` package through `backend` API to `web` UI components.

## Serena Navigation Process

### Step 1: Find Type Definition
```bash
# Search for Animal type
mcp__serena__find_symbol --name_path "Animal" --substring_matching true

# Get the definition
mcp__serena__find_symbol --name_path "Animal" --relative_path "packages/shared/types/models.ts" --include_body true
```

**Found**:
```typescript
// packages/shared/types/models.ts
export interface Animal {
  id: string
  name: string
  species: string
  rescueDate: Date
  status: 'rescued' | 'adopted' | 'in-care'
  story?: string
  images: string[]
}
```

### Step 2: Trace Package Imports
```bash
# Find all imports of Animal type
mcp__serena__search_for_pattern --pattern "import.*Animal.*from.*@apf/shared"

# Find type usage across packages
mcp__serena__find_referencing_symbols --name_path "Animal" --relative_path "packages/shared/types/models.ts"
```

**Discovered Cross-Package Usage**:
- `packages/backend/services/AnimalService.ts` - API endpoints
- `packages/web/components/AnimalCard.tsx` - UI component
- `packages/web/app/animals/page.tsx` - Page component
- `packages/backend/validators/animal.ts` - Validation schema

### Step 3: Backend Implementation
```bash
# Explore backend service
mcp__serena__find_symbol --name_path "AnimalService" --include_body true --depth 1

# Find API endpoints
mcp__serena__find_symbol --name_path "getAnimals|createAnimal|updateAnimal" --relative_path "packages/backend"
```

**Backend Flow**:
```typescript
// packages/backend/services/AnimalService.ts
import { Animal } from '@apf/shared/types'

class AnimalService {
  async getAnimals(): Promise<Animal[]> {
    // Fetches from Contentful
  }
  
  async createAnimal(data: Animal): Promise<Animal> {
    // Validates and saves
  }
}
```

### Step 4: Frontend Consumption
```bash
# Find where backend is called
mcp__serena__search_for_pattern --pattern "AnimalService|api.*animal" --relative_path "packages/web"

# Trace data flow to components
mcp__serena__find_symbol --name_path "AnimalCard" --include_body true
```

**Frontend Usage**:
```typescript
// packages/web/lib/api/animals.ts
import { Animal } from '@apf/shared/types'
import { AnimalService } from '@apf/backend'

export async function fetchAnimals(): Promise<Animal[]> {
  const service = new AnimalService()
  return service.getAnimals()
}

// packages/web/components/AnimalCard.tsx
import { Animal } from '@apf/shared/types'

interface AnimalCardProps {
  animal: Animal
}
```

### Step 5: Validation Consistency
```bash
# Find validation schemas
mcp__serena__search_for_pattern --pattern "z\\.object.*[Aa]nimal|animalSchema" 

# Check for consistency
mcp__serena__find_symbol --name_path "animalSchema" --include_body true
```

**Found Validation**:
```typescript
// packages/shared/schemas/animal.ts
import { z } from 'zod'
import { Animal } from '../types'

export const animalSchema = z.object({
  id: z.string(),
  name: z.string(),
  species: z.string(),
  // ... matches Animal interface
}) satisfies z.ZodType<Animal>
```

### Step 6: Document Flow
```bash
# Create memory of cross-package flow
mcp__serena__write_memory --memory_name "animal_type_cross_package_flow" --content "
# Animal Type Cross-Package Flow

## Type Definition
- Source: packages/shared/types/models.ts
- Exported as: @apf/shared/types

## Package Usage

### Backend (packages/backend/)
- AnimalService.ts - CRUD operations
- validators/animal.ts - Input validation
- Returns Animal[] to API consumers

### Web (packages/web/)
- lib/api/animals.ts - API client
- components/AnimalCard.tsx - Display component
- app/animals/page.tsx - List page

### Shared (packages/shared/)
- types/models.ts - Type definition
- schemas/animal.ts - Zod validation

## Import Pattern
All packages import as: '@apf/shared/types'

## Data Flow
1. Type defined in shared
2. Backend implements service
3. Web calls backend API
4. Components render typed data
"
```

## Key Insights

### Package Boundaries Respected
- Types only in `shared`
- Services only in `backend`  
- Components only in `web`
- No circular dependencies

### Import Consistency
- All use `@apf/` aliases
- Clean import paths
- Type-safe across boundaries

### Serena Advantages
1. **Found type usage across all packages** without knowing structure
2. **Traced import chains** automatically
3. **Verified consistency** across boundaries
4. **No manual file hunting** needed

## Applied Learning

### Pattern Established
```bash
# For any shared type:
1. Define in packages/shared/types
2. Export from packages/shared/index
3. Import as @apf/shared/types
4. Validate with matching schema
```

### Team Benefits
- Clear understanding of data flow
- Consistent patterns documented
- Easy to add new types
- Type safety maintained

## Time Saved
- **Traditional approach**: 20-30 minutes of grep/find
- **With Serena**: 5 minutes to complete picture

## Summary
Serena's semantic understanding made cross-package navigation trivial. Instead of manually tracing imports across directories, we asked about meaning and Serena revealed the complete flow, ensuring our monorepo maintains clean boundaries while sharing types effectively.