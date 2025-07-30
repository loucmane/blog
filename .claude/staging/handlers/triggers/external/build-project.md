---
id: build-project
name: Build Project
role: trigger
domain: external
stability: stable
triggers:
  - "build the project"
  - "compile code"
  - "run build"
dependencies: []
tools:
  - Bash
  - mcp__serena__find_symbol
---

# Build Project Handler

**Target Pattern**: Optional build target

## Pre-conditions
- Build system configured
- Dependencies installed

## Process

1. Check build config
2. **EXECUTE**: Build via Bash
3. On errors:
   - Use Serena to find error locations
   - Show symbol context
4. Report results

## Success Criteria
Build completed successfully

## Failure Modes
Build errors occurred

## Examples
- "build project" → npm run build
- "production build" → Build with prod flag