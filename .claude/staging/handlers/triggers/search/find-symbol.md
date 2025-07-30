---
id: find-symbol
name: Find Symbol
role: trigger
domain: search
stability: stable
triggers:
  - "where is X defined"
  - "find class Y"
  - "locate function Z"
dependencies: []
tools:
  - mcp__serena__find_symbol
  - mcp__serena__search_for_pattern
---

# Find Symbol Handler

**Target Pattern**: Symbol name after key phrases

## Pre-conditions
- Valid symbol type (class, function, etc.)
- Project context active

## Process

1. Extract symbol name
2. **PRIMARY**: `mcp__serena__find_symbol`
   - Set depth for nested symbols
   - Include body if needed
3. **FALLBACK**: `mcp__serena__search_for_pattern` with "class X" pattern
4. Show definition with context
5. Offer to show references

## Success Criteria
Symbol found with location

## Failure Modes
Symbol not found, show similar

## Examples
- "where is UserAuth class defined" → Find class definition
- "find handleLogin function" → Locate function