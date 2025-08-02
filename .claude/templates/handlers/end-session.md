---
id: end-session
name: End Session
role: trigger
domain: session
stability: stable
triggers:
  - "let's wrap up"
  - "end for today"
  - "finish session"
dependencies: []
tools:
  - Edit
  - TodoWrite
version: 1.0.0
---

#### Handler: end-session {#end-session}
**Triggers**: "let's wrap up", "end for today", "finish session"
**Target Pattern**: Optional handoff notes
**Pre-conditions**: 
- Active work exists
- Changes need preservation
**Process**:
1. Final todo status check
2. Update all work tracking files
3. Create handoff notes
4. Update SESSION.md
5. Suggest commit message
6. Clean up any temp files
**Success**: Clean session end, ready for handoff
**Failure**: Uncommitted changes need attention
**Examples**:
- "let's wrap up" → Full end-session flow
- "done for today" → Quick wrap with essentials