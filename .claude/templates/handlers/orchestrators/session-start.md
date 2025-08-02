---
id: session-start
name: Session Start
role: orchestrator
domain: session
stability: stable
triggers:
  - "start new session"
  - "begin session"
  - "new session"
dependencies: []
tools:
  - date
  - git
version: 1.0.0
---

#### Handler: session-start {#session-start}
**Triggers**: "start new session", "begin session", "new session"
**Target Pattern**: User's task description
**Pre-conditions**: 
- SESSION.md exists and accessible
- Git status available
- Date command available
**Process**:
1. **CRITICAL**: Check if "## Current Focus" exists
   - If missing, add it after main header
   - Update with current work description
2. Get required data:
   - `date "+%Y-%m-%d %H:%M %Z"` for timestamp
   - `git config user.name` for developer
   - `git branch --show-current` for branch
   - User's exact task description
3. Create session entry AFTER Current Focus:
   ```markdown
   ## Session: [TIMESTAMP]
   **AI Assistant**: Claude (model) ✓
   **Developer**: [name]
   **Task**: [exact user words]
   **Task Source**: User request
   **TaskMaster ID**: [if applicable]
   
   ### Session Validation ✓
   - [x] Date from `date` command: [timestamp]
   - [x] Task verified by: user request
   - [x] Git status checked: Yes - [branch]
   - [x] TaskMaster tasks reviewed: [status]
   - [x] Previous SESSION.md read: Yes
   
   ### 🎯 Session Goals
   - [ ] Primary: [main goal]
   - [ ] Secondary: [secondary goal]
   - [ ] Tertiary: [tertiary goal]
   
   ### 📍 Starting Context
   [context description]
   
   ### Current Focus:
   [what we're working on right now]
   ```
4. DO NOT append at bottom of file!
**Success**: Session created after Current Focus
**Failure**: Missing Current Focus section
**Examples**:
- "start new session" → Create full session structure
- "begin work on auth" → Session with auth task