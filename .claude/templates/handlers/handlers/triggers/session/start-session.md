---
id: start-session
name: Start Session
role: trigger
domain: session
stability: stable
triggers:
  - "let's start"
  - "begin work"
  - "start today's session"
dependencies: []
tools:
  - Edit
version: 1.0.0
---

#### Handler: start-session {#start-session}
**Triggers**: "let's start", "begin work", "start today's session"
**Target Pattern**: Optional continuation context
**Pre-conditions**: 
- Git repository accessible
- Previous session checked
**Process**:
1. Run date command for timestamp
2. Check git status
3. Read SESSION.md
4. Review recent commits
5. Ask what to work on
6. Update SESSION.md
**Success**: Session context established
**Failure**: Git issues, resolve first
**Examples**:
- "let's start" → Full session initialization
- "start working" → Quick session start