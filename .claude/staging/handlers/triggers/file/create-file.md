---
id: create-file
name: Create File
role: trigger
domain: file
stability: stable
triggers:
  - "create new file X"
  - "make file Y"
  - "new Z"
dependencies: []
tools:
  - Write
  - mcp__serena__find_symbol
  - mcp__serena__search_for_pattern
---

# Create File Handler

**Target Pattern**: File path and type

## Pre-conditions
- Valid file path
- Directory exists
- No file conflict

## Process

1. Extract file path
2. Check existing patterns with Serena
3. **PRIMARY**: `Write` tool (no Serena equivalent)
4. For code files:
   - Use Serena to find similar files first
   - Copy patterns and conventions
5. Add to git if needed

## Success Criteria
File created with correct content

## Failure Modes
File exists or invalid path

## Examples
- "create new component Button" → Component file
- "make config file" → Configuration template