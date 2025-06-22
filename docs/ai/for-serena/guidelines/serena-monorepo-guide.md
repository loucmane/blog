# Serena MCP - Monorepo Guide for MomsBlog

## Overview

This guide shows how to leverage Serena's semantic navigation capabilities specifically for the MomsBlog monorepo structure. Learn patterns that work across packages, maintain consistency, and navigate complex dependencies.

## MomsBlog Monorepo Structure

```
MomsBlog/
├── packages/
│   ├── ui/          # Design tokens only
│   ├── web/         # Next.js app + shadcn/ui
│   ├── shared/      # Types, schemas, utils
│   └── backend/     # API integrations
└── blog/            # Main workspace root
```

## Package-Specific Workflows

### 🎨 UI Package Navigation

Since UI contains only design tokens:

```bash
# Find theme token definitions
"Find all exported constants in packages/ui"
"Show me the color token definitions"
"Find spacing scale configuration"

# Check token usage
"Find all imports from @apf/ui across packages"
"Show me components using theme tokens"
```

### 🌐 Web Package Exploration

The web package contains all components and pages:

```bash
# Component discovery
"Find all React components in packages/web"
"Show me shadcn/ui components in web package"
"Find page components in web/app directory"

# Pattern analysis
"Find all client components (with 'use client')"
"Show me Server Components in web package"
"Find components using forwardRef pattern"
```

### 🔧 Shared Package Utilities

Finding cross-cutting concerns:

```bash
# Type definitions
"Find all TypeScript interfaces in packages/shared"
"Show me the Animal type definition"
"Find validation schemas in shared"

# Utility functions
"Find utility functions exported from shared"
"Show me date formatting utilities"
"Find shared API types"
```

### 🔌 Backend Package Integration

Locating external integrations:

```bash
# API clients
"Find API client implementations in backend"
"Show me Contentful integration code"
"Find all API endpoint definitions"

# Service patterns
"Find service classes in backend package"
"Show me error handling patterns in backend"
```

## Cross-Package Workflows

### 🔄 Dependency Tracking

```bash
# Find cross-package imports
"Find all files importing from @apf/shared"
"Show me components using @apf/ui tokens"
"Find where backend services are consumed"

# Trace type usage
"Find all references to Animal type across packages"
"Show me where shared schemas are used"
"Find components using shared validation"
```

### 🏗️ Feature Implementation Across Packages

#### Step 1: Plan the Feature
```bash
# Understand current patterns
"Find similar features across all packages"
"Show me how data flows from backend to web"
```

#### Step 2: Implement Types (Shared)
```bash
# Add to shared package
"Insert new interface after existing types in shared/types"
"Add validation schema in shared/schemas"
```

#### Step 3: Add Backend Logic
```bash
# Create service
"Find where to add new service in backend"
"Insert new API method in appropriate service"
```

#### Step 4: Build UI (Web)
```bash
# Create component
"Find similar component pattern in web package"
"Insert new component following existing structure"
```

### 🎯 Consistency Enforcement

```bash
# Find inconsistencies
"Find components not using theme tokens from @apf/ui"
"Search for hardcoded colors instead of tokens"
"Find imports not using package aliases"

# Pattern verification
"Find all Button implementations across packages"
"Show me different loading patterns used"
"Find inconsistent error handling"
```

## MomsBlog-Specific Patterns

### 📱 Touch Target Compliance (44px)

```bash
# Find non-compliant components
"Search for interactive elements in web package"
"Find buttons and links in components"
"Show me components with click handlers"

# Verify fixes
"Find all Button components using min-height"
"Search for 'h-11' class usage (44px)"
```

### 🎨 Four Theme System

```bash
# Theme implementation
"Find theme provider setup in web"
"Show me components using theme variables"
"Find all CSS variable definitions"

# Theme switching
"Find theme toggle implementation"
"Show me localStorage theme persistence"
"Find system preference detection"
```

### 🌍 Content Sensitivity

```bash
# Find sensitivity markers
"Search for content sensitivity levels"
"Find hope level implementations"
"Show me content warning components"

# Verify implementation
"Find all content-status usage"
"Search for graphic content handling"
```

### ⚡ Performance Patterns

```bash
# Code splitting
"Find dynamic imports in web package"
"Show me lazy-loaded components"
"Find Suspense boundaries"

# Optimization
"Search for React.memo usage"
"Find useMemo and useCallback hooks"
"Show me image optimization code"
```

## Common Tasks

### 🔍 Finding Components

```bash
# By feature
"Find all blog-related components"
"Show me rescue story components"
"Find field update displays"

# By pattern
"Find all card components"
"Show me list view components"
"Find form input components"
```

### 📦 Adding New shadcn/ui Components

```bash
# Check existing usage
"Find existing shadcn/ui components in web"
"Show me UI primitive imports"

# Find installation location
"Show me where to add new shadcn components"
"Find the components/ui directory structure"

# Update registry
"Find shadcn-components.md to update"
```

### 🔧 Updating Shared Types

```bash
# Find type usage
"Find all imports of Animal type"
"Show me components using Animal interface"

# Safe updates
"Find Animal type definition"
"Replace Animal interface with updated version"
"Find any TypeScript errors after change"
```

## Monorepo Best Practices

### ✅ DO:
```bash
# Use package boundaries
"Find types" → "Find types in packages/shared"
"Find components" → "Find components in packages/web"

# Respect separation of concerns
"UI tokens stay in packages/ui"
"Components live in packages/web"
"Types belong in packages/shared"

# Maintain consistency
"Follow existing patterns in each package"
"Use established import conventions"
```

### ❌ DON'T:
```bash
# Don't mix concerns
"Don't put components in ui package"
"Don't duplicate types across packages"
"Don't create circular dependencies"

# Don't break boundaries
"Don't import from web into shared"
"Don't put backend logic in web"
```

## Performance Tips for Monorepo

### 🚀 Efficient Searching
```bash
# Scope searches to packages
"Find in packages/web" vs "Find in entire monorepo"

# Use overview first
"Get symbols overview for packages/"
"Then drill into specific package"

# Leverage memories
"Create memory about package structure"
"Document discovered patterns per package"
```

### 💾 Memory Organization
```bash
# Package-specific memories
"memory_web_component_patterns"
"memory_shared_type_conventions"
"memory_backend_api_structure"

# Cross-package memories
"memory_monorepo_import_rules"
"memory_package_boundaries"
```

## Troubleshooting Monorepo Issues

### Issue: "Can't find component"
```bash
# Check correct package
"Component should be in packages/web, not ui"

# Check import paths
"Find imports using @apf/web"
"Verify tsconfig path mappings"
```

### Issue: "Type not found"
```bash
# Ensure shared package exports
"Find exports in packages/shared/index"
"Check if type is exported"

# Verify import
"Find how other files import this type"
```

### Issue: "Cross-package reference broken"
```bash
# Check package.json dependencies
"Find package.json in each package"
"Verify @apf/* dependencies"

# Trace import chain
"Find all imports of broken reference"
"Follow import path step by step"
```

## Quick Reference - Package Locations

| What | Where | Serena Command |
|------|-------|----------------|
| Theme tokens | `packages/ui/` | `Find tokens in packages/ui` |
| Components | `packages/web/components/` | `Find components in web package` |
| Pages | `packages/web/app/` | `Find page components in web/app` |
| Types | `packages/shared/types/` | `Find interfaces in shared/types` |
| Schemas | `packages/shared/schemas/` | `Find schemas in shared` |
| API clients | `packages/backend/` | `Find services in backend` |

## Integration with MomsBlog Workflow

### Starting Work on a Feature
```bash
1. "Activate project /home/loucmane/dev/javascript/MomsBlog"
2. "Get overview of packages/ structure"
3. "Find similar features across packages"
4. "Create memory about feature architecture"
```

### Before Committing
```bash
1. "Find all files I modified across packages"
2. "Check for broken imports"
3. "Verify type consistency"
4. "Find related tests to update"
```

### During Code Review
```bash
1. "Show me changes impact across packages"
2. "Find if changes follow package patterns"
3. "Check if boundaries are respected"
4. "Verify consistent patterns used"
```

## Summary

Serena's semantic understanding makes monorepo navigation intuitive. Instead of remembering complex paths, think in terms of functionality and let Serena find the right location across packages. This approach ensures consistency, maintains boundaries, and accelerates development in the MomsBlog monorepo structure.