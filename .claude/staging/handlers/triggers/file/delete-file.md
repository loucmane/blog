---
id: delete-file
name: Delete File
role: trigger
domain: file
stability: stable
triggers:
  - "remove X"
  - "delete file Y"
  - "get rid of Z"
dependencies: []
tools:
  - mcp__serena__find_referencing_symbols
  - Bash
---

# Delete File Handler

**Target Pattern**: File to remove

## Pre-conditions
- File exists
- Not critical system file

## Process

1. **PRIMARY**: Check references with `mcp__serena__find_referencing_symbols`
2. Verify safe to delete
3. **EXECUTE**: `rm` via Bash (no Serena delete)
4. Update imports if needed
5. Clean up with Serena tools

## Success Criteria
File removed cleanly

## Failure Modes
File in use or protected

## Examples
- "remove old-component.js" → Delete unused file
- "delete temp files" → Clean up temporary files