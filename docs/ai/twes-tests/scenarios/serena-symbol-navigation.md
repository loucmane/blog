# TWES Test Scenario: Serena Symbol Navigation

## Scenario Overview
**Test ID**: TWES-SERENA-001  
**Category**: Tool Usage  
**Difficulty**: Basic  
**Tool**: Serena MCP

## Task Description
You need to find and understand the theme implementation in the MomsBlog project using Serena's semantic navigation capabilities.

**Specific Requirements:**
1. Find the theme provider implementation
2. Locate all components using theme tokens
3. Identify the theme toggle component
4. Find where theme preferences are persisted

**Context:**
- Project uses a four-theme system
- Themes are: warm, watercolor, cyberpunk, vibe shift
- Theme tokens should come from @apf/ui package
- Implementation should be in the web package

## Test Prompt
```
You are testing the Serena MCP documentation. Please simulate (NOT implement) how you would use Serena to find and understand the theme implementation in MomsBlog.

**Task**: Use Serena's semantic navigation to explore the theme system
**Location**: MomsBlog monorepo
**Goal**: Understand complete theme implementation

Available Serena documentation:
- /docs/ai/for-serena/serena-overview.md
- /docs/ai/for-serena/serena-commands.md  
- /docs/ai/for-serena/serena-workflows.md
- /docs/ai/for-serena/serena-monorepo-guide.md

Your response should:
1. List the exact Serena commands you would use
2. Explain why each command helps
3. Describe expected results
4. Show how commands build on each other
5. Rate confidence (0-100%)

DO NOT implement - just plan the Serena usage.
```

## Expected Approach

### Step 1: Project Activation
```
mcp__serena__activate_project --project /home/loucmane/dev/javascript/MomsBlog
```

### Step 2: Discover Theme Structure
```
mcp__serena__find_symbol --name_path "theme" --substring_matching true
mcp__serena__find_symbol --name_path "ThemeProvider" 
```

### Step 3: Find Token Usage
```
mcp__serena__search_for_pattern --pattern "@apf/ui"
mcp__serena__find_referencing_symbols --name_path "theme tokens from ui package"
```

### Step 4: Locate Theme Toggle
```
mcp__serena__find_symbol --name_path "themeToggle|ThemeToggle|theme.*switch"
```

### Step 5: Find Persistence
```
mcp__serena__search_for_pattern --pattern "localStorage.*theme"
```

## Success Criteria
- [ ] Uses semantic names, not file paths
- [ ] Commands build logical investigation flow
- [ ] Leverages monorepo-specific knowledge
- [ ] Shows understanding of symbol relationships
- [ ] Confidence >85%

## Documentation References
- Serena overview for capabilities
- Commands reference for syntax
- Workflows for investigation patterns
- Monorepo guide for package structure

## Common Pitfalls
- Using file paths instead of semantic search
- Not utilizing symbol relationships
- Missing substring matching for variations
- Forgetting to check cross-package references

## Variations
1. Find all form validation patterns
2. Locate error boundary implementations
3. Discover API integration patterns
4. Find accessibility implementations