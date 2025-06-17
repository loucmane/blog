# Discovered Patterns Directory

This directory contains high-confidence patterns extracted by the documentation evolution system. These patterns were discovered through automated analysis of the codebase and have been validated with real metrics.

## Pattern Files

### 1. Component Conventions (92% Confidence)
**File**: `component-conventions.md`
- React.forwardRef usage pattern
- displayName requirements
- Accessibility standards (44px touch targets)
- Import ordering conventions

### 2. Performance Code Splitting (99 Lighthouse Score)
**File**: `performance-code-splitting.tsx`
- Dynamic import patterns
- Route-based code splitting
- Progressive enhancement
- Bundle optimization utilities
- Loading state patterns

### 3. Add Blog Feature Guide (88% Success Rate)
**File**: `add-blog-feature-guide.md`
- Step-by-step workflow for adding features
- Server action patterns (Next.js 15)
- Validation with Zod
- Performance checklist
- Testing requirements

## How These Patterns Were Discovered

1. **Documentation Evolution System** analyzed the entire codebase
2. **Pattern Extraction** identified recurring successful implementations
3. **Confidence Scoring** validated patterns against metrics
4. **Cherry-Picking** selected only high-confidence patterns (>85%)
5. **Integration** into TWES for AI tool usage

## Usage by AI Tools

When AI tools need to:
- **Create components**: Reference `component-conventions.md`
- **Optimize performance**: Use patterns from `performance-code-splitting.tsx`
- **Add features**: Follow workflow in `add-blog-feature-guide.md`

## Validation Tools

Associated validation tools are available at:
```
/docs/evolution/orchestration/outputs/1-discovery/v1/validation/
├── eslint-conventions.js      # ESLint configuration
├── prettier-conventions.json  # Prettier configuration
├── validate-conventions.ts    # Standalone validator
└── tsconfig-conventions.json  # TypeScript configuration
```

## Evolution Summary

For complete details about the documentation evolution process and all discoveries, see:
- `/docs/ai/evolution-summary.md`
- `/docs/evolution/orchestration/outputs/` (full results)