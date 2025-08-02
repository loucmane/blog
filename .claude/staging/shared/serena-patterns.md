# Serena Search Patterns

Shared patterns for consistent Serena usage across handlers.

## Primary Search Patterns

### Evidence Gathering
```
2. **PRIMARY**: Serena searches:
   - Code implementation
   - Documentation
   - Test coverage
   - Comments/commits
```
Used in: gather-evidence, verify-claim

### Symbol Finding
```
2. **PRIMARY**: Use Serena to find evidence:
   - Symbol definitions for code claims
   - Pattern search for implementation claims
   - Reference search for usage claims
```
Used in: verify-claim, cite-source

### Pattern Matching
```
2. **PRIMARY**: Use Serena to find examples
   - Search existing patterns
   - Find similar implementations
   - Compare with conventions
```
Used in: review-patterns, suggest-name, check-naming

### File Discovery
```
2. **PRIMARY**: Use Serena to find similar files
   - Pattern matching for structure
   - Location validation
   - Naming convention checks
```
Used in: validate-path, file-creation, code-creation

## Common Operations

### Standard Evidence Flow
1. Define search target
2. Use Serena with specific patterns
3. Gather concrete file:line references
4. Present evidence with context
5. State confidence level

### Symbol Search Template
```
mcp__serena__find_symbol --symbol "target_symbol"
mcp__serena__search_for_pattern --substring_pattern "search_pattern"
```

### Pattern Analysis Template
```
mcp__serena__search_for_pattern --substring_pattern "pattern" --relative_path "target_area"
```

## Best Practices
- Always use Serena for code understanding
- Provide specific search patterns
- Include file:line references in results
- Verify findings with concrete evidence
- Use pattern search before symbol search for broader discovery
