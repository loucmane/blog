---
id: check-dependencies
name: Check Dependencies
role: trigger
domain: analysis
stability: stable
triggers:
  - "what does X depend on"
  - "show Y dependencies"
  - "imports"
dependencies: []
tools:
  - mcp__serena__find_symbol
  - mcp__serena__search_for_pattern
  - Read
---

# Check Dependencies Handler

**Target Pattern**: Module or file to check

## Pre-conditions
- Valid module/file
- Dependency tracking possible

## Process

1. **PRIMARY**: Use Serena to:
   - Find imports in file
   - Track symbol usage
   - Map relationships
2. **FALLBACK**: Parse package.json
3. Build dependency graph
4. Show clear summary

## Success Criteria
Dependencies mapped clearly

## Failure Modes
Can't resolve dependencies

## Examples
- "what does auth depend on" → Import analysis
- "show package dependencies" → npm/yarn deps