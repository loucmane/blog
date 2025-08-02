---
id: update-session
name: Update Session
role: trigger
domain: session
stability: stable
triggers:
  - "update SESSION.md"
  - "record progress"
  - "checkpoint session"
dependencies: []
tools:
  - Edit
version: 1.0.0
---

#### Handler: update-session {#update-session}
**Triggers**: "update SESSION.md", "record progress", "checkpoint session"
**Target Pattern**: Optional specific updates
**Pre-conditions**: 
- SESSION.md exists
- Work has progressed
**Process**:
1. Gather current state
2. Summarize achievements
3. Note any blockers
4. Update SESSION.md
5. Commit if requested
**Success**: Session record updated
**Failure**: No changes to record
**Examples**:
- "update session" → Auto-summarize progress
- "checkpoint our work" → Detailed state capture