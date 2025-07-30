---
id: run-tests
name: Run Tests
role: trigger
domain: external
stability: stable
triggers:
  - "run tests"
  - "test the code"
  - "execute test suite"
dependencies: []
tools:
  - mcp__serena__find_file
  - Bash
  - mcp__serena__find_symbol
---

# Run Tests Handler

**Target Pattern**: Optional test filter

## Pre-conditions
- Test framework configured
- Tests exist

## Process

1. Use Serena to find test files
2. Check test patterns
3. **EXECUTE**: Run via Bash
4. Monitor output
5. Use Serena to link failures to code

## Success Criteria
Tests run with clear results

## Failure Modes
No tests or setup issues

## Examples
- "run all tests" → npm test
- "test auth module" → Filtered test run