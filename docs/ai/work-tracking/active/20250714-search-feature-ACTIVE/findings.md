# Search Feature Implementation - Findings

## Codebase Structure
- **Monorepo**: Using pnpm workspaces
- **Packages**:
  - `@minniewinnie/web` - Next.js app
  - `@minniewinnie/ui` - Shared UI components
  - `@minniewinnie/backend` - Backend services

## Existing Content Types (packages/web/src/types/content.ts)
1. **BlogPost** - Standard blog posts
2. **RescueStory** - Animal rescue stories with specific metadata
3. **EmergencyAppeal** - Urgent donation appeals

## Key Interfaces
- `ContentSearchResult` interface already defined with:
  - `item: ContentType`
  - `score: number`
  - `matches: string[]`

## UI Framework
- Using shadcn/ui components
- Tailwind CSS for styling
- Theme system with light/dark/gentle/contrast modes

## Search Integration Points
1. Header component exists at: `packages/web/src/components/layout/Header.tsx`
2. Main layout at: `packages/web/src/components/layout/MainLayout.tsx`
3. No existing search functionality found

## Package Organization Rules (Critical)
From docs/architecture/monorepo-structure.md:
- **UI Package**: Only design tokens, themes, and minimal shared components
- **Web Package**: All application components including shadcn/ui components
- **shadcn/ui lives in `packages/web/src/components/ui/`** NOT in UI package

From PROJECT-BLOG.md:
- All components go in `apps/web/components` (or `packages/web/src/components`)
- UI package has NO components except minimal truly shared ones
- Search feature is application-specific, belongs in web package