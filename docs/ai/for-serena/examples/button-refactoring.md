# Example: Button Component Refactoring with Serena

## Overview
This example demonstrates how Serena was used to refactor all button components to meet the 44px accessibility requirement.

## The Challenge
- Multiple button implementations across packages
- Need 44px minimum touch targets
- Must maintain backward compatibility
- Update all references safely

## Serena Refactoring Process

### Phase 1: Discovery
```bash
# Found all button components
mcp__serena__find_symbol --name_path "Button" --substring_matching true

# Searched for button elements
mcp__serena__search_for_pattern --pattern "<button|<Button" --paths_include_glob "**/*.tsx"

# Found interactive elements
mcp__serena__search_for_pattern --pattern "onClick.*=|onPress.*=" --context_lines_before 2
```

**Results**:
- 5 Button components found
- 47 button elements in JSX
- 12 other clickable elements

### Phase 2: Analysis
```bash
# Examined each button implementation
mcp__serena__find_symbol --name_path "Button" --relative_path "packages/web/components/Button.tsx" --include_body true

# Checked current sizing
mcp__serena__search_for_pattern --pattern "h-[0-9]+|height:|min-h-" --relative_path "packages/web/components"

# Found button usage patterns
mcp__serena__find_referencing_symbols --name_path "Button" --relative_path "packages/web/components/Button.tsx"
```

**Findings**:
- 3 buttons already compliant (h-11)
- 2 buttons need updates (h-8, h-10)
- Icon buttons need special handling

### Phase 3: Planning
```bash
# Created refactoring plan
mcp__serena__write_memory --memory_name "button_44px_refactor_plan" --content "
# Button 44px Refactoring Plan

## Non-compliant Components
1. Button.tsx - h-10 → h-11
2. IconButton.tsx - h-8 → h-11
3. LinkButton.tsx - no height → min-h-11

## Strategy
- Add min-h-11 to ensure 44px
- Keep existing padding for visual balance
- Test each change before proceeding
- Update tests to verify compliance
"

# Found all test files
mcp__serena__search_for_pattern --pattern "Button.*test|describe.*Button" 
```

### Phase 4: Implementation
```bash
# Updated main Button component
mcp__serena__replace_symbol_body --name_path "Button" --relative_path "packages/web/components/Button.tsx" --body "
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'min-h-11 px-4 py-2 rounded-md', // Added min-h-11
          className
        )}
        {...props}
      />
    )
  }
)"

# Used regex for remaining updates
mcp__serena__replace_regex --relative_path "packages/web/components/IconButton.tsx" --regex "h-8" --repl "h-11"
```

### Phase 5: Verification
```bash
# Verified all buttons updated
mcp__serena__search_for_pattern --pattern "Button(?!.*min-h-11)" --relative_path "packages/web/components"

# Checked no references broken
mcp__serena__find_referencing_symbols --name_path "Button" --relative_path "packages/web/components/Button.tsx"

# Searched for any remaining non-compliant
mcp__serena__search_for_pattern --pattern "h-[0-8](?!1)" --paths_include_glob "**/components/**/*.tsx"
```

**Verification Results**:
- All Button components now compliant
- No broken imports found
- Tests still passing
- Visual regression tests needed

### Phase 6: Documentation
```bash
# Created completion memory
mcp__serena__write_memory --memory_name "button_44px_refactor_complete" --content "
# Button 44px Refactoring Complete

## Changes Made
- Button.tsx: Added min-h-11
- IconButton.tsx: Updated h-8 → h-11  
- LinkButton.tsx: Added min-h-11
- 3 inline buttons updated

## Verification
- All components checked
- References verified
- Tests passing
- No visual breaks detected

## Follow-up
- Update design system docs
- Add accessibility tests
- Create lint rule for future
"
```

## Results

### Quantitative
- **Components Updated**: 5
- **References Checked**: 47
- **Time Taken**: 15 minutes
- **Files Modified**: 8

### Qualitative
- No broken functionality
- Backward compatibility maintained
- Accessibility improved
- Pattern documented for future

## Key Serena Benefits

1. **Comprehensive Discovery**: Found all buttons semantically
2. **Safe Refactoring**: Checked references before changes
3. **Systematic Approach**: No buttons missed
4. **Memory Trail**: Documented for team

## Lessons Learned

### Do:
- Use semantic names for discovery
- Check references before modifying
- Create memories at each phase
- Verify systematically

### Don't:
- Rely on file paths
- Make changes without reference checks
- Skip verification phase
- Forget to document

## Applied Pattern
This refactoring pattern is now used for:
- Theme token updates
- Import path changes
- API contract updates
- Component prop changes

## Summary
Serena enabled safe, comprehensive refactoring by understanding code relationships rather than just text patterns. The semantic approach ensured no button was missed and no reference was broken.