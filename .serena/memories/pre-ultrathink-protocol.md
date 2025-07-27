# Pre-ULTRATHINK Protocol

## Problem Solved
AI was outputting ULTRATHINK immediately with made-up handler names, requiring constant user reminders to search REGISTRY.

## Solution (CLAUDE.md lines 26-33)
**PRE-ULTRATHINK PROTOCOL** prohibits immediate ULTRATHINK output.

Required sequence:
1. First output: "Searching for appropriate handler for [request type]..."
2. Show actual search command and 1-2 results
3. Only THEN output: "Let me ultrathink about this... [S:W:H:E]"

## Why It Works
- Can't claim handler without showing search first
- Creates visible audit trail
- Natural workflow enforcement
- Simple rule that's hard to skip

## Combined with
- Handler Search Protocol (line 20): Details of HOW to search
- E field: Proves handler was read (step count + criteria)
- Together: Complete enforcement chain