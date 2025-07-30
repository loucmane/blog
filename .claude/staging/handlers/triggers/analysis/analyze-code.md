---
id: analyze-code
name: Analyze Code
role: trigger
domain: analysis
stability: stable
triggers:
  - "analyze X for issues"
  - "check Y quality"
  - "review Z"
dependencies: []
tools:
  - mcp__serena__get_symbols_overview
  - mcp__serena__find_referencing_symbols
  - mcp__serena__search_for_pattern
  - Task
---

# Analyze Code Handler

**Target Pattern**: Code location to analyze

## Pre-conditions
- Code exists and accessible
- Analysis type clear

## Process

1. **PRIMARY**: Serena analysis tools
   - `mcp__serena__get_symbols_overview` for structure
   - `mcp__serena__find_referencing_symbols` for usage
   - Pattern search for code smells
2. **ENHANCED**: Deploy Task with expert for deep analysis
3. Categorize findings
4. Prioritize by severity

## Success Criteria
Issues found and prioritized

## Failure Modes
No issues or unclear scope

## Examples
- "analyze auth module" → Full module review
- "check for memory leaks" → Specific analysis