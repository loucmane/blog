# TWES Test Scenario: Serena Debugging Investigation

## Scenario Overview
**Test ID**: TWES-SERENA-003  
**Category**: Problem Solving  
**Difficulty**: Intermediate  
**Tool**: Serena MCP

## Task Description
Users report that theme changes aren't persisting after page refresh. Use Serena to investigate and locate the issue semantically.

**Symptoms:**
- Theme changes work during session
- Revert to default on refresh
- No console errors visible
- Happens across all browsers

**Context:**
- Should use localStorage for persistence
- Four theme system implementation
- Theme context should handle state
- May involve SSR/hydration issues

## Test Prompt
```
You are testing the Serena MCP documentation. Please simulate (NOT implement) how you would use Serena to debug theme persistence issues.

**Problem**: Theme selection not persisting after refresh
**Symptoms**: Changes work in session but reset on reload
**Goal**: Find root cause using semantic navigation

Available Serena documentation:
- /docs/ai/for-serena/serena-overview.md
- /docs/ai/for-serena/serena-commands.md  
- /docs/ai/for-serena/serena-workflows.md
- /docs/ai/for-serena/serena-monorepo-guide.md

Your response should:
1. Show systematic debugging approach
2. List Serena commands for investigation
3. Explain what you're looking for
4. Show how findings connect
5. Rate confidence (0-100%)

DO NOT implement - simulate the debugging process.
```

## Expected Approach

### Step 1: Understand Theme Implementation
```bash
# Find theme context/provider
mcp__serena__find_symbol --name_path "ThemeProvider|ThemeContext" --include_body true

# Look for theme-related hooks
mcp__serena__find_symbol --name_path "useTheme|useDarkMode" --substring_matching true
```

### Step 2: Investigate Persistence Layer
```bash
# Search for localStorage usage
mcp__serena__search_for_pattern --pattern "localStorage" --context_lines_before 3 --context_lines_after 3

# Find theme storage specifically
mcp__serena__search_for_pattern --pattern "localStorage.*theme|theme.*localStorage"

# Check for storage event handlers
mcp__serena__search_for_pattern --pattern "storage.*event|addEventListener.*storage"
```

### Step 3: Trace Theme Flow
```bash
# Find where theme is read on load
mcp__serena__search_for_pattern --pattern "getItem.*theme|defaultTheme"

# Find initialization code
mcp__serena__find_symbol --name_path "initializeTheme|loadTheme" --substring_matching true

# Check for SSR considerations
mcp__serena__search_for_pattern --pattern "typeof window|isServer|use client"
```

### Step 4: Find State Updates
```bash
# Find theme setter calls
mcp__serena__find_referencing_symbols --name_path "setTheme" --relative_path "found/theme/file"

# Look for theme change handlers
mcp__serena__search_for_pattern --pattern "onChange.*theme|handleTheme"

# Check for side effects
mcp__serena__search_for_pattern --pattern "useEffect.*theme"
```

### Step 5: Identify Hydration Issues
```bash
# Find server/client mismatches
mcp__serena__search_for_pattern --pattern "suppressHydrationWarning|hydration"

# Check initial render logic
mcp__serena__search_for_pattern --pattern "useState.*theme|initial.*theme"

# Look for mounting effects
mcp__serena__search_for_pattern --pattern "useEffect.*\\[\\].*theme"
```

### Step 6: Document Findings
```bash
# Create investigation memory
mcp__serena__write_memory --memory_name "debug_theme_persistence" --content "Investigation findings..."

# Note potential fixes
mcp__serena__write_memory --memory_name "theme_persistence_fix_options" --content "Possible solutions..."
```

## Success Criteria
- [ ] Logical investigation flow
- [ ] Checks both read and write paths
- [ ] Considers SSR/hydration
- [ ] Uses context from findings
- [ ] Confidence >85%

## Key Investigation Areas
1. Theme initialization timing
2. localStorage read/write operations
3. SSR vs client-side rendering
4. Event handler registration
5. Default value handling

## Documentation References
- Debugging workflow in workflows guide
- Search patterns in commands reference
- Memory usage for investigation tracking
- Monorepo guide for package locations

## Common Pitfalls
- Not checking initialization order
- Missing SSR considerations  
- Overlooking event handlers
- Not tracing full data flow
- Forgetting hydration issues

## Expected Findings
Could discover issues like:
- localStorage read happens after render
- No useEffect to sync on mount
- SSR/client hydration mismatch
- Missing persistence on change
- Race condition in initialization

## Variations
1. Debug authentication loss on refresh
2. Investigate form data not saving
3. Find why API calls fail intermittently
4. Debug component not re-rendering