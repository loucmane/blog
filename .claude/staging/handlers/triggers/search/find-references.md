---
id: find-references
name: Find References
role: trigger
domain: search
stability: stable
triggers:
  - "what uses X"
  - "find references to Y"
  - "who calls Z"
dependencies: []
tools:
  - mcp__serena__find_referencing_symbols
  - mcp__serena__search_for_pattern
---

# Find References Handler

**Target Pattern**: Symbol to find references for

## Pre-conditions
- Symbol exists in codebase
- Valid symbol path available

## Process

1. **PRIMARY**: `mcp__serena__find_referencing_symbols`
2. **FALLBACK**: `mcp__serena__search_for_pattern` with symbol name
3. Categorize by reference type
4. Show usage contexts
5. Highlight critical usages

## Success Criteria
All references found and categorized

## Failure Modes
No references found

## Examples
- "what uses the auth service" → Find all imports/calls
- "find references to User class" → Show all usages