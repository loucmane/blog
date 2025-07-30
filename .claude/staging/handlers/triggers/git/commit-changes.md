---
id: commit-changes
name: Commit Changes
role: trigger
domain: git
stability: stable
triggers:
  - "commit with message X"
  - "save changes"
  - "commit Y"
dependencies: []
tools:
  - Bash
  - mcp__serena__find_symbol
---

# Commit Changes Handler

**Target Pattern**: Commit message or description

## Pre-conditions
- Changes staged or stageable
- Valid commit message

## Process

1. Check status first
2. Use Serena to understand changes:
   - What symbols modified
   - What functionality affected
3. **EXECUTE**: `gac` alias or git commit
4. Update SESSION.md

## Success Criteria
Changes committed successfully

## Failure Modes
No changes or commit hook fails

## Examples
- "commit auth changes" → Auto-format message
- "commit with 'fix: login bug'" → Direct message