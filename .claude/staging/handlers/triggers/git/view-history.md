---
id: view-history
name: View Git History
role: trigger
domain: git
stability: stable
triggers:
  - "show recent commits"
  - "git log"
  - "history"
dependencies: []
tools:
  - Bash
  - mcp__serena__find_symbol
---

# View Git History Handler

**Target Pattern**: Optional filter or count

## Pre-conditions
- Git repository active
- History available

## Process

1. **EXECUTE**: Git log via Bash
2. For each commit:
   - Use Serena to analyze changes
   - Show affected symbols
3. Format nicely

## Success Criteria
History displayed clearly

## Failure Modes
No commits found

## Examples
- "show last 5 commits" → Recent history
- "history of auth.js" → File-specific log