---
id: check-lint
name: Check Lint
role: trigger
domain: external
stability: stable
triggers:
  - "check code style"
  - "run linter"
  - "lint the code"
dependencies: []
tools:
  - mcp__serena__find_file
  - Bash
  - mcp__serena__find_symbol
---

# Check Lint Handler

**Target Pattern**: Optional scope

## Pre-conditions
- Linter configured
- Lint rules defined

## Process

1. Use Serena to identify files
2. **EXECUTE**: Linter via Bash
3. For each issue:
   - Use Serena to show context
   - Link to symbol definition
4. Group by severity

## Success Criteria
Lint results categorized

## Failure Modes
No linter configured

## Examples
- "check style" → Run default linter
- "lint src folder" → Scoped linting