---
id: create-branch
name: Create Git Branch
role: trigger
domain: git
stability: stable
triggers:
  - "new branch for X"
  - "create branch Y"
  - "branch off"
dependencies: []
tools:
  - Bash
  - mcp__serena__write_memory
---

# Create Git Branch Handler

**Target Pattern**: Branch name or feature

## Pre-conditions
- Clean working directory
- Valid branch name

## Process

1. Generate branch name
2. **EXECUTE**: Git commands via Bash
3. Use Serena to:
   - Document branch purpose
   - Track related symbols
4. Update tracking

## Success Criteria
Branch created and checked out

## Failure Modes
Branch exists or dirty working dir

## Examples
- "new branch for auth feature" → feat/auth-feature
- "create bugfix branch" → fix/issue-description