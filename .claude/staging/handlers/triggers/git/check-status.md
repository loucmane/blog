---
id: check-status
name: Check Git Status
role: trigger
domain: git
stability: stable
triggers:
  - "what's changed"
  - "git status"
  - "show changes"
dependencies: []
tools:
  - Bash
  - mcp__serena__find_symbol
---

# Check Git Status Handler

**Target Pattern**: Optional scope filter

## Pre-conditions
- Git repository active
- Working directory accessible

## Process

1. **EXECUTE**: `git status` via Bash (no Serena git)
2. Parse output for clarity
3. For changed files:
   - Use Serena to show symbol changes
   - Highlight structural modifications
4. Format summary

## Success Criteria
Clear status summary shown

## Failure Modes
Not a git repository

## Examples
- "what's changed" → Full git status
- "show staged changes" → Filtered view