# Session Flow Test - Complete Journey Verification

## Purpose
Ensure that after CLAUDE.md migration, the complete session flow from start to end remains crystal clear and nothing is lost.

## The Complete Session Journey

### 1. Session Start (Current vs After Migration)

**Current Flow:**
1. Load CLAUDE.md
2. See "SESSION.md First!" reminder
3. See Flight Protocol directly
4. Update SESSION.md
5. Check todos
6. Start work

**After Migration:**
1. Load CLAUDE.md
2. See "SESSION.md first → [Pre-flight checklist]"
3. Click link → WORKFLOWS.md#session-management
4. Find complete session start workflow
5. Follow steps
6. Start work

**Test:** Can a user start a session without confusion?

### 2. During Work Scenarios

#### Scenario A: "I need to fix a bug"
**Current:** 
- CLAUDE.md → Common Workflows → Bug Fix

**After Migration:**
- CLAUDE.md → Common Tasks → Bug template link
- Direct link to WORKFLOWS.md#bug-fix-template

#### Scenario B: "I need to search for code"
**Current:**
- CLAUDE.md → Essential Tools → Check Tool Router

**After Migration:**
- CLAUDE.md → Questions → "Which tool?" → Tool Router
- Direct link to TOOLS.md#tool-selection-router

#### Scenario C: "I'm lost"
**Current:**
- CLAUDE.md → Flight Protocol → ABORT procedures

**After Migration:**
- CLAUDE.md → Questions → "I'm lost?" → Emergency procedures
- Link to WORKFLOWS.md#emergency-procedures

### 3. Session End

**Current Flow:**
1. See Quick Actions → End of Session
2. Follow 4 steps listed
3. Create memory
4. Update SESSION.md

**After Migration:**
1. CLAUDE.md → Starting Work → "End session"
2. Link to WORKFLOWS.md#session-end
3. Complete workflow there
4. All steps preserved

## Critical Checkpoints

### Must Be Findable in <3 Clicks:
- [ ] How to start a session
- [ ] How to end a session
- [ ] Flight protocol (pre/during/post)
- [ ] Tool selection router
- [ ] Behavioral templates
- [ ] Emergency procedures
- [ ] Evidence-based requirements
- [ ] Common commands (timestamps, git)

### Must Work for These Users:
1. **First Timer**: Never used system before
2. **Returning User**: Knows system, needs quick reference
3. **Emergency Mode**: Something is broken, need help fast
4. **Complex Task**: Needs orchestration/specialists

## Test Scripts

### Test 1: New Session Start
```
1. Open CLAUDE.md
2. Find how to start session (should be obvious)
3. Follow links to complete workflow
4. Verify nothing missing from current flow
```

### Test 2: Mid-Session Task
```
1. "I need to implement a new feature"
2. Can you find the Feature Template?
3. Is tool selection clear?
4. Are all steps accessible?
```

### Test 3: Error Recovery
```
1. "I made a mistake with git"
2. Can you find help?
3. Are recovery procedures findable?
4. Is the path clear?
```

### Test 4: Session Handoff
```
1. "I need to end my session"
2. Find end session workflow
3. Create memory
4. Document handoff
5. Verify completeness
```

## Navigation Speed Test

Time how long it takes to find:
- [ ] Session start workflow: Target <5 seconds
- [ ] Bug fix template: Target <5 seconds
- [ ] Tool router: Target <5 seconds
- [ ] Emergency help: Target <3 seconds
- [ ] Session end workflow: Target <5 seconds

## Red Flags to Watch For

1. **Circular References**: CLAUDE points to WORKFLOWS which points back
2. **Missing Steps**: Current flow has X steps, new has X-1
3. **Broken Links**: Link points to non-existent section
4. **Context Loss**: Moved content loses important context
5. **Discoverability Issues**: Common task becomes hard to find

## Validation Questions

After migration, can you confidently answer:
- Where do I start? ✓
- What do I do next? ✓
- Where do I find X? ✓
- What if something goes wrong? ✓
- How do I finish? ✓

If any answer is unclear, the migration needs adjustment.