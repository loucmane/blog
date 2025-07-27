# Session 2025-07-27: S:W:H:E Fake Handler Prevention

## Critical Discovery
While refining S:W:H:E implementation, user pointed out a fundamental flaw: I often use fake handler names in ULTRATHINK lines (like H:swhe-additional-refinements) that don't exist in templates.

## The Core Problem
This completely defeats the purpose of the E field, which is meant to prove I actually read the handler. Can't have evidence for a handler that doesn't exist!

## Solution: Handler Validation Protocol

### Always Start with Search
When unsure about handler name:
```
Let me ultrathink about this... [S:20250727|W:bug-fix|H:searching|E:pending]
Searching REGISTRY.md for "fix bug"...
Found: fix-problem (WORKFLOWS.md#fix-problem)
Let me ultrathink about this... [S:20250727|W:bug-fix|H:fix-problem|E:5:"Bug fixed"]
```

### When No Handler Found
```
Let me ultrathink about this... [S:20250727|W:feature|H:VOID→registry|E:searching]
Searching for appropriate handler...
No exact match found. Using closest: implement-feature
Let me ultrathink about this... [S:20250727|W:feature|H:implement-feature|E:4:"Feature added"]
```

## Implementation Requirements
Add to CLAUDE.md after S:W:H:E format section:

```markdown
**Handler Validation Required**
Never use a handler name without finding it first:
- If unsure: Use H:searching|E:pending initially
- If not found: Use H:VOID→registry|E:searching
- Always show: "Found: [handler-name] ([template]#[anchor])"
- Then execute with real handler in new ULTRATHINK line
```

## Complete Refinement Summary
1. **Multi-handler workflows**: Sequential ULTRATHINK lines
2. **Nested execution**: Sub-handler notation with → prefix
3. **Partial success**: Decimal progress (3.5 of 5) + status
4. **User interaction**: Pause/resume with ⏸️ symbol
5. **Performance**: 96% overhead reduction
6. **Fake handlers**: Validation protocol with H:searching first

## Why This Matters
The fake handler problem is THE core issue undermining the entire template system. Without fixing this, the S:W:H:E format is just another layer of fake compliance.

## Status
All 6 refinements documented in `/designs/swhe-additional-refinements.md`. Ready for implementation with this critical fake handler prevention mechanism included.