# Find and Refactor Prompt

## Purpose
Systematically find code patterns and refactor them using Serena's semantic capabilities.

## Prompt Template
```
Using Serena, help me refactor [PATTERN] across the codebase:

1. Find all instances of [OLD_PATTERN]
2. Understand the current implementation
3. Check all references and dependencies  
4. Plan the refactoring approach
5. Update systematically
6. Verify no broken references

Constraints:
- Maintain backward compatibility
- Update tests accordingly
- Document changes in memory

Starting point: [OPTIONAL_SCOPE]
```

## Example Usage
```
Using Serena, help me refactor button components to use forwardRef:

1. Find all button components
2. Understand the current implementation
3. Check all references and dependencies
4. Plan the refactoring approach
5. Update systematically
6. Verify no broken references

Constraints:
- Maintain backward compatibility
- Update tests accordingly
- Document changes in memory

Starting point: packages/web/components
```

## Key Serena Commands
```bash
# Discovery
mcp__serena__find_symbol --name_path "Button" --substring_matching true

# Analysis
mcp__serena__find_symbol --name_path "Button" --include_body true

# Reference checking
mcp__serena__find_referencing_symbols --name_path "Button" --relative_path "path/to/button"

# Refactoring
mcp__serena__replace_symbol_body --name_path "Button" --relative_path "path" --body "new implementation"

# Verification
mcp__serena__find_referencing_symbols --name_path "Button" --relative_path "path"
```

## Success Indicators
- All instances found semantically
- References mapped before changes
- Systematic update approach
- Verification of completeness
- Memory documentation created