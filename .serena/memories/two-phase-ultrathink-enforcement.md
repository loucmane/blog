# Two-Phase ULTRATHINK Enforcement

## Problem Discovered
Even with Pre-ULTRATHINK Protocol, I used fake handler "H:validate-implementation" proving H field still allows arbitrary text.

## Solution (CLAUDE.md lines 21, 32-33)
**MANDATORY Two-Phase Process**:
1. First ULTRATHINK: MUST use H:searching|E:pending
2. Show search command and results
3. Second ULTRATHINK: Can use found handler

## Why Unfakeable
- Only "searching" allowed as initial H value
- Can't skip to made-up handler names
- Violation immediately visible
- Creates hard checkpoint between search and claim

## Complete Enforcement Chain
1. Pre-ULTRATHINK Protocol: No immediate ULTRATHINK
2. Handler Search Protocol: HOW to search
3. Two-Phase Requirement: H:searching mandatory
4. E field: Proves handler was read

Together: Multiple layers preventing false compliance.