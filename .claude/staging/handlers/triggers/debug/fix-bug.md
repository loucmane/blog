---
id: fix-bug
name: Fix Bug
role: trigger
domain: debug
stability: stable
triggers:
  - "fix bug X"
  - "fix the Y bug"
  - "resolve issue with Z"
  - "bug in X"
dependencies:
  - bug-fix-template
tools:
  - Read
  - Edit
  - Grep
version: 1.0.0
---

#### Handler: fix-bug {#fix-bug}
**Triggers**: "fix bug X", "fix the Y bug", "resolve issue with Z", "bug in X"
**Target Pattern**: Bug description and location
**Pre-conditions**: 
- Bug identified or reported
- Can reproduce or understand issue
**Process**:
1. Understand the bug clearly
2. Route to bug-fix-template:
   ```yaml
   STATE: "I need to fix: [bug description]"
   USE: Load WORKFLOWS.md#bug-fix-template
   FOLLOW: Locked step progression
   ```
3. Cannot skip bug reproduction step
4. Must gather evidence before theorizing
**Success**: Bug fixed with evidence
**Failure**: Skipped template steps
**Examples**:
- "fix bug in login" → Load bug-fix-template
- "resolve issue with nav" → Bug fix workflow
- "login is broken" → Systematic debugging