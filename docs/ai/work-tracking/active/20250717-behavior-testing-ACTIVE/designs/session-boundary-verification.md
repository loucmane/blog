# Session Boundary Verification Design

## Problem Statement
Need clear rules for when a session is "current" vs "stale" and how to verify session boundaries.

## Current Implementation
```markdown
S = Today's session ID from SESSION.md (or VOID→conventions for proper session)
```

## Session Verification Rules

### 1. Session is Current When:
- **Date Match**: S value matches output of `date '+%Y%m%d'`
- **SESSION.md Entry**: Today's date has an entry in SESSION.md
- **Active Work**: Work folders have been updated today

### 2. Session Becomes Stale When:
- **Date Mismatch**: S value doesn't match current date
- **No Entry**: No SESSION.md entry for today
- **Long Gap**: More than 4 hours since last progress log entry
- **Explicit End**: Previous session marked as ENDED

### 3. Session Boundary Detection

#### Automatic Triggers
1. **First Request of Day**
   - Check: Is there a session entry for today?
   - Action: If no → S = VOID→conventions

2. **Post-Compaction**
   - Check: Was previous session compacted?
   - Action: S = VOID→conventions for fresh start

3. **After Long Break**
   - Check: Last progress log > 4 hours ago?
   - Action: Prompt for session continuation

4. **Date Change**
   - Check: System date != session date
   - Action: S = VOID→conventions

### 4. Verification Process

```
1. Get current date: date '+%Y%m%d'
2. Check SESSION.md for matching entry
3. If no match → S = VOID→conventions
4. If match → Check last progress timestamp
5. If > 4 hours → Confirm continuation
6. If confirmed → Use existing session
7. If not → S = VOID→conventions
```

## Implementation Enhancement for CLAUDE.md

### Current:
```markdown
S = Today's session ID from SESSION.md (or VOID→conventions for proper session)
```

### Enhanced:
```markdown
S = Today's session ID from SESSION.md (or VOID→conventions for proper session)
  - S = YYYYMMDD format matching today's date
  - S = VOID when: no SESSION.md entry for today, date mismatch, or after compaction
  - Verify: Compare with `date '+%Y%m%d'` output
```

## Edge Cases

### 1. Multiple Sessions Per Day
- Use same session ID (date)
- Track via progress log timestamps
- Each has its own goals/context

### 2. Session Spanning Midnight
- Explicit decision needed at midnight
- Can continue with same ID if actively working
- New date = new session for clarity

### 3. Resumed After Compaction
- Always start fresh session
- Reference previous via memory
- Clean context boundaries

## Benefits

1. **Clear Boundaries**
   - No ambiguity about session state
   - Explicit verification process

2. **Prevents Stale References**
   - Can't use yesterday's session ID
   - Forces proper session hygiene

3. **Supports Natural Breaks**
   - 4-hour rule allows for meals/breaks
   - Explicit end prevents confusion

4. **Self-Correcting**
   - VOID→conventions guides to proper setup
   - Can't proceed without valid session

## Test Scenarios

### Scenario 1: Morning Start
- Yesterday: Session 20250725 ended
- Today: First request at 09:00
- Expected: S = VOID→conventions
- Resolution: Create new session entry

### Scenario 2: Afternoon Continue
- Morning: Worked until 11:30
- Afternoon: Resume at 14:00 (2.5 hours)
- Expected: S = 20250726 (continues)
- Resolution: Add progress log entry

### Scenario 3: Evening Break
- Afternoon: Worked until 16:00
- Evening: Resume at 21:00 (5 hours)
- Expected: Prompt for continuation
- Resolution: Confirm or start new

### Scenario 4: Post-Compaction
- Previous: Compacted at 18:00
- Next: Request at 18:30
- Expected: S = VOID→conventions
- Resolution: Fresh session start

## Summary

Session boundaries are verified through:
1. Date matching with system time
2. SESSION.md entry existence
3. Progress log recency (4-hour rule)
4. Explicit session end markers
5. Post-compaction fresh starts

This ensures clean session management and prevents stale context pollution.