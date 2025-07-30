---
id: grep-pattern
name: Grep Pattern
role: trigger
domain: search
stability: stable
triggers:
  - "grep for X"
  - "search pattern Y"
  - "find regex Z"
dependencies: []
tools:
  - mcp__serena__search_for_pattern
  - Grep
---

# Grep Pattern Handler

**Target Pattern**: Pattern or regex after action

## Pre-conditions
- Valid pattern/regex
- Clear scope (files/directories)

## Process

1. **PRIMARY**: `mcp__serena__search_for_pattern`
   - Supports full regex
   - Context lines available
2. **FALLBACK**: `Grep` tool (if Serena fails)
3. Never use bash grep/rg directly
4. Format results with line numbers

## Success Criteria
Pattern matches found

## Failure Modes
No matches or invalid pattern

## Examples
- "grep for console.log" → Find debug statements
- "search pattern /api/.*POST" → Find POST endpoints