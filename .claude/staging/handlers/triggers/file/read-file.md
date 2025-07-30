---
id: read-file
name: Read File
role: trigger
domain: file
stability: stable
triggers:
  - "show me X"
  - "what's in Y"
  - "display Z file"
dependencies: []
tools:
  - Read
---

# Read File Handler

**Target Pattern**: File path after action phrase

## Pre-conditions
- File path identifiable
- Read permission available

## Process

1. Extract file path
2. **PRIMARY**: `Read` tool (no Serena equivalent)
3. Handle large files with offset/limit
4. Display with line numbers
5. For symbols in file: suggest Serena overview

## Success Criteria
File contents displayed

## Failure Modes
File not found or too large

## Examples
- "show me package.json" → Display package file
- "what's in the config" → Read configuration