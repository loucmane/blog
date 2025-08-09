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
dependencies:
  - session-resolver
tools:
  - Edit
  - Read
  - TodoWrite
version: 2.0.0
---

#### Handler: end-session {#end-session}
**Triggers**: "let's wrap up", "end for today", "finish session"
**Target Pattern**: Optional handoff notes
**Pre-conditions**: 
- Active session exists in sessions/
- Changes need preservation
**Process**:
1. **Load current session via session-resolver**:
   - Call `get-current-session()` to get active session
   - If no current session, check SESSION.md for compatibility
   - Get session_id, path, and content
2. **Perform final updates**:
   - Run TodoWrite status check if todos exist
   - Gather final progress summary
   - Note any incomplete work
3. **Add session closing section**:
   ```markdown
   ### 🎆 Session End: [HH:MM ZONE]
   
   **Summary**:
   - Started: [start time]
   - Ended: [end time]
   - Duration: [calculated]
   
   **Completed**:
   - ✓ [completed item 1]
   - ✓ [completed item 2]
   
   **Remaining**:
   - [ ] [incomplete item 1]
   - [ ] [incomplete item 2]
   
   **Handoff Notes**:
   [Any special instructions for next session]
   
   **Next Session Should**:
   1. [Priority 1]
   2. [Priority 2]
   ```
4. **Update session file metadata**:
   - Add `ended_at` field to YAML frontmatter
   - Update line and character counts
   - Calculate final checksum
   - Mark session as completed
5. **Archive the session (optional)**:
   - If requested, move to sessions/archive/YYYY/MM/
   - Maintain original filename
   - Preserve all metadata
6. **Clear current session symlink**:
   - Remove sessions/current symlink
   - Or update to point to "none" indicator
   - System now in "between sessions" state
7. **Update work tracking files**:
   - If docs/ai/work-tracking exists, update status
   - Create handoff notes if needed
   - Update any project-specific tracking
8. **Backwards compatibility**:
   - Append session end marker to SESSION.md
   - Note: "Session archived to: sessions/[path]"
   - SESSION.md remains as historical record
9. **Suggest commit**:
   - Generate commit message:
     ```
     session: end [date] - [main achievement]
     
     - Completed: [summary]
     - Duration: [time]
     - Next: [priority]
     ```
10. **Clean up**:
    - Remove any temporary files
    - Clear any session-specific state
    - Prepare for clean next session
**Success**: Session properly closed, archived if requested, ready for handoff
**Failure**: Uncommitted changes need attention first
**Examples**:
- "let's wrap up" → Full end-session with archive
- "done for today" → Quick close, session remains in place
- "finish and archive" → Move to archive/ directory