# Phase 2: Session Handler Updates - Execution Prompt

## Mission Critical
You are updating 5 session-related handlers to use the new sessions/ directory structure instead of the monolithic SESSION.md file. The session-resolver module has already been created at `.claude/templates/engine/core/session-resolver.md` to help with this transition.

## Context
- **Old System**: SESSION.md (single file, append-only)
- **New System**: sessions/YYYY/MM/YYYY-MM-DD-NNN-title.md (individual files with YAML frontmatter)
- **Compatibility**: Must maintain backwards compatibility - read SESSION.md but NEVER write to it
- **Session Resolver**: Use the module at `.claude/templates/engine/core/session-resolver.md` for all operations

## Critical Requirements
1. **NEVER write to SESSION.md** - only read for backwards compatibility
2. **Always use session-resolver** for format detection and loading
3. **Create directories as needed** - sessions/YYYY/MM/ might not exist
4. **Maintain checksums** - recalculate after any content change
5. **Update symlinks correctly** - sessions/current must point to active session

## Handler 1: start-session
**File**: `.claude/templates/handlers/triggers/session/start-session.md`

### Current Implementation
- Appends new session header to SESSION.md
- Uses simple date format
- No metadata tracking

### Required Changes
```yaml
# Add to frontmatter:
dependencies:
  - session-resolver
  - directory-creator
```

### New Logic
```markdown
1. Import session-resolver module
2. Generate session ID:
   - Format: YYYY-MM-DD-NNN (NNN = sequence number)
   - Check existing sessions for today to get next sequence
3. Create directory structure:
   - Ensure sessions/YYYY/MM/ exists
4. Create new session file with YAML frontmatter:
   ```yaml
   ---
   session_id: 2025-08-09-001
   date: 2025-08-09
   time: "14:30 EST"
   title: "Untitled"
   status: "active"
   character_count: 0
   line_count: 0
   checksum: "<calculate>"
   ---
   # Session 2025-08-09-001
   ```
5. Update sessions/current symlink to point to new file
6. Return success with session ID
```

## Handler 2: session-start (orchestrator)
**File**: `.claude/templates/handlers/orchestrators/session-start.md`

### Current Implementation
- Orchestrates session initialization
- Reads SESSION.md directly
- No format detection

### Required Changes
```yaml
# Update imports:
imports:
  - engine/core/session-resolver
```

### New Logic
```markdown
1. Import and initialize session-resolver
2. Use resolver's load-session function:
   ```
   session = session-resolver.load-current-session()
   ```
3. Handle both formats during transition:
   - If sessions/current exists → use it
   - Else if SESSION.md exists → read from it (compatibility mode)
   - Else → trigger start-session handler
4. Validate session format:
   - Check for valid YAML frontmatter
   - Verify session_id format
   - Ensure metadata is complete
5. Return session context for ULTRATHINK
```

## Handler 3: update-session
**File**: `.claude/templates/handlers/triggers/session/update-session.md`

### Current Implementation
- Appends progress directly to SESSION.md
- No metadata tracking

### Required Changes
```yaml
# Add dependency:
dependencies:
  - session-resolver
```

### New Logic
```markdown
1. Load current session via resolver:
   ```
   session = session-resolver.load-current-session()
   ```
2. Read current file at sessions/current (follow symlink)
3. Parse YAML frontmatter and content separately
4. Append new progress to content section
5. Update metadata:
   - line_count += new_lines
   - character_count += new_chars
   - checksum = recalculate(full_content)
6. Write updated file with new frontmatter and content
7. NEVER write to SESSION.md
```

## Handler 4: end-session
**File**: `.claude/templates/handlers/triggers/session/end-session.md`

### Current Implementation
- Adds session end marker to SESSION.md
- No archival process

### Required Changes
```yaml
# Add dependencies:
dependencies:
  - session-resolver
  - archive-manager
```

### New Logic
```markdown
1. Load current session via resolver
2. Add session end marker with timestamp:
   ```
   ---
   Session ended: 2025-08-09 15:45 EST
   Duration: 1h 15m
   Status: completed
   ```
3. Update final metadata:
   - status: "completed"
   - end_time: <timestamp>
   - total_duration: <calculated>
4. Consider archival:
   - If status is "completed" → move to sessions/archive/completed/
   - If status is "abandoned" → move to sessions/archive/stale/
5. Update or clear sessions/current symlink:
   - If new session exists → point to it
   - Else → remove symlink
```

## Handler 5: checkpoint-session
**File**: `.claude/templates/handlers/operators/session/checkpoint-session.md`

### Current Implementation
- Creates inline checkpoint in SESSION.md
- No backup mechanism

### Required Changes
```yaml
# Update role if needed (operators don't have triggers):
role: operator
# Add dependencies:
dependencies:
  - session-resolver
```

### New Logic
```markdown
1. Load current session via resolver
2. Add checkpoint marker to content:
   ```
   --- CHECKPOINT: 2025-08-09 14:45 EST ---
   Reason: <checkpoint reason>
   State: <current state summary>
   ---
   ```
3. Update checkpoint metadata in YAML:
   ```yaml
   checkpoints:
     - timestamp: "2025-08-09 14:45 EST"
       line: 156
       reason: "Major refactor complete"
   ```
4. Create backup copy if configured:
   - Copy to sessions/checkpoints/YYYY-MM-DD-NNN-checkpoint-N.md
5. Recalculate checksum
6. Save updated session file
```

## Testing Each Handler

### Test Scenarios
1. **New Session Creation**
   - Verify file created in correct location
   - Check YAML frontmatter is valid
   - Confirm symlink points to new file

2. **Session Updates**
   - Verify appends to correct file
   - Check metadata updates correctly
   - Ensure SESSION.md untouched

3. **Session End**
   - Verify proper closure
   - Check archival if applicable
   - Confirm symlink handling

4. **Backwards Compatibility**
   - Test reading old SESSION.md entries
   - Verify no writes to SESSION.md
   - Check graceful format detection

### Validation Commands
```bash
# Check no writes to SESSION.md
git diff SESSION.md  # Should show no changes

# Verify new session structure
ls -la sessions/2025/08/

# Check symlink
readlink sessions/current

# Validate YAML frontmatter
head -20 sessions/current | grep -E "^(session_id|date|checksum):"
```

## Success Criteria
- [ ] All 5 handlers updated with session-resolver
- [ ] Zero writes to SESSION.md (verified with git diff)
- [ ] sessions/current symlink working
- [ ] YAML frontmatter properly maintained
- [ ] All test scenarios pass
- [ ] Documentation updated in each handler

## Important Notes
1. **Preserve all existing handler logic** except for session file operations
2. **Keep error handling robust** - handle missing directories, invalid formats
3. **Update examples** in each handler to show new format
4. **Test incrementally** - update and test one handler at a time
5. **Document changes** in handler's documentation section

## Final Checklist
- [ ] start-session creates new format files
- [ ] session-start uses resolver for loading
- [ ] update-session modifies current session correctly
- [ ] end-session handles closure and archival
- [ ] checkpoint-session creates proper checkpoints
- [ ] All handlers maintain backwards compatibility
- [ ] No handler writes to SESSION.md
- [ ] All handlers use session-resolver module