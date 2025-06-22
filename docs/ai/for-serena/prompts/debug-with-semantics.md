# Debug with Semantics Prompt

## Purpose
Use Serena's semantic understanding to trace and debug issues efficiently.

## Prompt Template
```
Using Serena, help me debug this issue:

Error/Symptom: [DESCRIBE_ISSUE]
Context: [WHEN_IT_HAPPENS]

Investigation steps:
1. Search for error message/pattern
2. Find the component/function involved
3. Trace the execution flow
4. Identify potential causes
5. Find related code that might have same issue
6. Document findings and fix

Additional info: [ANY_CLUES]
```

## Example Usage
```
Using Serena, help me debug this issue:

Error/Symptom: "Cannot read property 'user' of undefined"
Context: Happens when refreshing the profile page

Investigation steps:
1. Search for error message/pattern
2. Find the component/function involved
3. Trace the execution flow
4. Identify potential causes
5. Find related code that might have same issue
6. Document findings and fix

Additional info: Works fine during normal navigation
```

## Key Serena Commands
```bash
# Search for error
mcp__serena__search_for_pattern --pattern "Cannot read property" --context_lines_after 5

# Find component
mcp__serena__find_symbol --name_path "ProfilePage|UserProfile" --include_body true

# Trace calls
mcp__serena__find_referencing_symbols --name_path "getUserData" --relative_path "api/user.ts"

# Check similar patterns
mcp__serena__search_for_pattern --pattern "\\.user\\b" --context_lines_before 2

# Document investigation
mcp__serena__write_memory --memory_name "debug_user_undefined_issue" --content "findings..."
```

## Debugging Strategy
1. **Locate Error** - Find where it occurs
2. **Understand Context** - See surrounding code
3. **Trace Back** - Follow execution path
4. **Find Pattern** - Look for similar issues
5. **Test Theory** - Verify root cause
6. **Document Fix** - Create memory

## Success Indicators
- Error source identified
- Root cause understood
- Execution flow traced
- Similar issues found
- Fix documented in memory