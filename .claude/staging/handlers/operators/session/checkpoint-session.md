---
id: checkpoint-session
name: Checkpoint Session
role: operator
domain: session
stability: stable
triggers: []
dependencies: []
tools:
  - Edit
version: 1.0.0
---

#### Handler: checkpoint-session {#checkpoint-session}
**Triggers**: Mid-session progress saves
**Target Pattern**: Automatic based on time/progress
**Pre-conditions**: 
- Significant progress made
- Time threshold passed
**Process**:
1. Auto-save current state
2. Update progress markers
3. Quick SESSION.md append
4. No interruption to flow
**Success**: Progress preserved
**Failure**: Silent skip
**Examples**:
- After major milestone → Auto-checkpoint
- Every 2 hours → Time-based checkpoint