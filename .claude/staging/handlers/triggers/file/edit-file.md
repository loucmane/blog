---
id: edit-file
name: Edit File
role: trigger
domain: file
stability: stable
triggers:
  - "change X to Y"
  - "update Z"
  - "modify file"
dependencies: []
tools:
  - Read
  - Edit
  - MultiEdit
  - Write
  - mcp__serena__find_symbol
  - mcp__serena__get_symbols_overview
---

# Edit File Handler

**Target Pattern**: File and changes specified

## Pre-conditions
- File exists and readable
- Clear change description

## Process

1. Read file first (mandatory)
2. **ALWAYS use Edit/Write for modifications**:
   - Creating files → `Write`
   - Editing files → `Edit` or `MultiEdit`
   - NEVER use Serena for file modifications
3. **Use Serena ONLY for understanding before edit**:
   - Find symbol location → `mcp__serena__find_symbol`
   - Understand structure → `mcp__serena__get_symbols_overview`
   - Then use Edit/Write for actual changes
   - Multiple changes → `MultiEdit`
4. Verify changes

## Success Criteria
Changes applied correctly

## Failure Modes
Can't locate text or conflicts

## Examples
- "change function body" → Serena symbol replace
- "update config value" → Edit tool