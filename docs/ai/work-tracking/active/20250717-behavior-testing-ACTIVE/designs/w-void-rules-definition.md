# W VOID Rules Definition

## When W Becomes VOID

### 1. No Active Work Context
**Trigger**: Request doesn't match any active work folder
**Example**: "implement user auth" when only behavior-testing folder exists
**Resolution**: VOID→workflows guides to start-new-work handler

### 2. Domain Switch
**Trigger**: Moving from one type of work to another
**Examples**:
- Feature development → Bug fixing
- Implementation → Documentation
- Testing → Refactoring
**Resolution**: VOID→workflows helps select appropriate workflow

### 3. Post-Compaction
**Trigger**: First development request after compaction
**Exception**: Unless explicitly continuing previous work
**Resolution**: VOID→workflows ensures proper context setup

### 4. Explicit Context Switch
**Trigger**: User says "work on something else", "switch to X", "new task"
**Resolution**: Save current context, then VOID→workflows

### 5. Stale Context
**Trigger**: Work folder hasn't been updated in current session
**Check**: No entries in tracker.md for today
**Resolution**: VOID→workflows to verify or switch context

## When W Remains Active

### 1. Continuing Work
**Condition**: Request relates to current work folder
**Example**: "add tests" while in feature-implementation folder
**W Value**: Keep current folder name

### 2. Investigation State
**Condition**: Searching, exploring, analyzing code
**Examples**: "find all login references", "how does auth work?"
**W Value**: "investigating"

### 3. Review State  
**Condition**: Reviewing code, docs, or PRs
**Examples**: "review this PR", "check the docs"
**W Value**: "reviewing"

### 4. Planning State
**Condition**: Design, architecture, or planning discussions
**Examples**: "how should we structure this?", "plan the feature"
**W Value**: "planning"

## Implementation in CLAUDE.md

### Current Text
```
W = Current work context from active/ (or VOID→workflows for optimal work)
```

### Enhanced Text
```
W = Current work context from active/ (or VOID→workflows for optimal work)
  - W = folder name when continuing work in that folder
  - W = "investigating"/"reviewing"/"planning" for those activities  
  - W = VOID when: no matching folder, switching domains, post-compaction, explicit switch, or stale context
```

## Decision Tree

```
Is this continuing work in active folder?
├─ YES → W = folder name
└─ NO → Is this investigation/review/planning?
    ├─ YES → W = that state
    └─ NO → W = VOID→workflows
```

## Examples

1. **"Fix the login bug"**
   - No bug-fix folder active → W = VOID→workflows
   
2. **"Continue with behavior testing"**
   - behavior-testing folder exists → W = behavior-testing
   
3. **"Find where getUserData is defined"**
   - Search request → W = investigating
   
4. **"Plan how to implement caching"**
   - Planning request → W = planning
   
5. **"Switch to working on the API"**
   - Explicit switch → W = VOID→workflows

## Edge Cases

1. **Multiple Active Folders**
   - Shouldn't happen with proper workflow
   - If it does: most recently updated wins
   
2. **Unclear Request Domain**
   - Default to W = VOID→workflows
   - Let workflow handler determine context
   
3. **Quick Questions During Work**
   - Keep current W value
   - Only VOID on explicit context switch

## Benefits

1. **Prevents Context Confusion**
   - Can't accidentally mix work contexts
   - Forces proper setup for new work

2. **Guides Best Practices**
   - VOID→workflows ensures proper workflow
   - Encourages work folder organization

3. **Flexible for Reality**
   - Allows investigation without folder
   - Supports planning discussions
   - Handles review activities

4. **Self-Documenting**
   - W value shows current mental context
   - VOID explicitly signals transition needed