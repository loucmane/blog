---
id: measure-complexity
name: Measure Complexity
role: trigger
domain: analysis
stability: stable
triggers:
  - "how complex is X"
  - "complexity of Y"
  - "analyze complexity"
dependencies: []
tools:
  - mcp__serena__get_symbols_overview
  - mcp__serena__find_symbol
  - Task
---

# Measure Complexity Handler

**Target Pattern**: Code section to measure

## Pre-conditions
- Code section identified
- Complexity metrics defined

## Process

1. **PRIMARY**: Use Serena to:
   - Get symbol structure
   - Count nesting levels
   - Analyze branching
2. **ENHANCED**: Task tool for detailed metrics
3. Calculate complexity scores
4. Compare to thresholds
5. Suggest improvements

## Success Criteria
Complexity metrics provided

## Failure Modes
Can't calculate metrics

## Examples
- "complexity of auth flow" → Flow analysis
- "how complex is this function" → Function metrics