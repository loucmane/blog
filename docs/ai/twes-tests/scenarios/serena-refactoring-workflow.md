# TWES Test Scenario: Serena Refactoring Workflow

## Scenario Overview
**Test ID**: TWES-SERENA-002  
**Category**: Complex Workflow  
**Difficulty**: Advanced  
**Tool**: Serena MCP

## Task Description
You need to refactor all button components to ensure they meet the 44px minimum touch target requirement using Serena's semantic capabilities.

**Specific Requirements:**
1. Find all button implementations across the monorepo
2. Identify which don't meet 44px requirement
3. Plan systematic refactoring approach
4. Ensure no references break
5. Document changes in memory

**Context:**
- 44px = h-11 in Tailwind (or min-height: 44px)
- Buttons might be in multiple packages
- Some may use forwardRef pattern
- Need to maintain backward compatibility

## Test Prompt
```
You are testing the Serena MCP documentation. Please simulate (NOT implement) how you would use Serena to refactor all buttons for 44px compliance.

**Task**: Refactor buttons to meet accessibility standards using Serena
**Requirement**: 44px minimum touch targets
**Scope**: Entire MomsBlog monorepo

Available Serena documentation:
- /docs/ai/for-serena/serena-overview.md
- /docs/ai/for-serena/serena-commands.md  
- /docs/ai/for-serena/serena-workflows.md
- /docs/ai/for-serena/serena-monorepo-guide.md
- /docs/ai/protocols/semantic-workflow-protocol.md

Your response should:
1. List exact Serena commands in order
2. Explain the refactoring strategy
3. Show how to verify changes
4. Demonstrate memory usage
5. Rate confidence (0-100%)

DO NOT implement - just plan the complete workflow.
```

## Expected Approach

### Phase 1: Discovery
```bash
# Find all button components
mcp__serena__find_symbol --name_path "Button" --substring_matching true

# Search for interactive elements
mcp__serena__search_for_pattern --pattern "onClick|onPress|onTap"

# Find specific patterns
mcp__serena__search_for_pattern --pattern "<button|Button"
```

### Phase 2: Analysis
```bash
# Check current implementations
mcp__serena__find_symbol --name_path "Button" --include_body true --depth 1

# Find size-related code
mcp__serena__search_for_pattern --pattern "h-[0-9]+|height:|min-height:"

# Document findings
mcp__serena__write_memory --memory_name "button_44px_audit" --content "Found X non-compliant buttons..."
```

### Phase 3: Planning
```bash
# Find all references to plan impact
mcp__serena__find_referencing_symbols --name_path "Button" --relative_path "components/Button.tsx"

# Check for test files
mcp__serena__search_for_pattern --pattern "Button.*test|Button.*spec"

# Create refactor plan memory
mcp__serena__write_memory --memory_name "button_44px_refactor_plan" --content "Refactoring strategy..."
```

### Phase 4: Implementation
```bash
# Update each button systematically
mcp__serena__replace_symbol_body --name_path "Button" --relative_path "path/to/button" --body "updated implementation"

# Use regex for class updates
mcp__serena__replace_regex --regex "className=\"([^\"]*?)\"" --repl "className=\"$1 min-h-11\""
```

### Phase 5: Verification
```bash
# Verify all updates
mcp__serena__search_for_pattern --pattern "Button(?!.*min-h-11)"

# Check references still work
mcp__serena__find_referencing_symbols --name_path "Button" --relative_path "each/button/file"

# Document completion
mcp__serena__write_memory --memory_name "session_2025-06-22_button_44px_complete" --content "Refactoring results..."
```

## Success Criteria
- [ ] Systematic discovery approach
- [ ] Impact analysis before changes
- [ ] Memory-based documentation
- [ ] Verification strategy included
- [ ] Confidence >80%

## Key Patterns to Demonstrate
1. Broad-to-narrow search strategy
2. Reference checking before changes
3. Memory for decision tracking
4. Systematic verification
5. Cross-package awareness

## Documentation References
- Workflows for refactoring pattern
- Commands for all operations
- Monorepo guide for package boundaries
- Protocol for systematic approach

## Common Pitfalls
- Not checking references before changes
- Missing edge cases (icon buttons, etc.)
- Forgetting to update tests
- Not documenting decisions
- Breaking backward compatibility

## Variations
1. Refactor to new theme token system
2. Update all forms to new validation
3. Migrate class components to hooks
4. Update import paths monorepo-wide