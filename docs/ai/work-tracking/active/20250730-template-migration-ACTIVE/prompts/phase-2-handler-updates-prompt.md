# Phase 2: Session Handler Updates - Detailed Prompt

## Your Mission
Update the 5 session-related handlers to use the new sessions/ directory structure instead of SESSION.md. The session-resolver module has already been created to help with this transition.

## Context
- **Old System**: SESSION.md (monolithic file)
- **New System**: sessions/YYYY/MM/YYYY-MM-DD-NNN-title.md with YAML frontmatter
- **Session Resolver**: `.claude/templates/engine/core/session-resolver.md` handles format detection

## Handlers to Update

### 1. start-session
**Location**: `.claude/templates/handlers/triggers/session/start-session.md`
**Current Behavior**: 
- Appends new session to SESSION.md
- Uses simple date format

**Required Changes**:
- Generate session ID: `YYYY-MM-DD-NNN` format
- Create directory if needed: `sessions/YYYY/MM/`
- Create new session file with YAML frontmatter:
  ```yaml
  ---
  session_id: 2025-08-09-001
  date: 2025-08-09
  time: HH:MM TIMEZONE
  title: Untitled
  character_count: 0
  line_count: 0
  checksum: (calculate)
  ---
  ```
- Update `sessions/current` symlink to point to new file
- Use session-resolver for all operations

### 2. session-start
**Location**: `.claude/templates/handlers/orchestrators/session-start.md`
**Current Behavior**:
- Orchestrates session initialization
- Reads from SESSION.md directly

**Required Changes**:
- Import and use session-resolver module
- Load session via resolver's `load-session` function
- Handle both formats during transition:
  - If sessions/current exists → use it
  - Else if SESSION.md exists → read from it (don't write)
  - Else → create new session
- Update validation to check for valid session formats

### 3. update-session
**Location**: `.claude/templates/handlers/triggers/session/update-session.md`
**Current Behavior**:
- Appends progress to SESSION.md

**Required Changes**:
- Read current session via resolver
- Update the file at `sessions/current` (follow symlink)
- Maintain metadata in YAML frontmatter:
  - Update line_count
  - Update character_count
  - Recalculate checksum
- Append progress to body (after frontmatter)
- Never write to SESSION.md

### 4. end-session
**Location**: `.claude/templates/handlers/triggers/session/end-session.md`
**Current Behavior**:
- Adds session end marker to SESSION.md

**Required Changes**:
- Finalize current session file
- Add end status and timestamp
- Consider moving to `sessions/archive/completed/` if fully done
- Clear or update `sessions/current` symlink
- Update final metadata (total duration, final status)

### 5. checkpoint-session
**Location**: `.claude/templates/handlers/operators/session/checkpoint-session.md`
**Current Behavior**:
- Creates checkpoint in SESSION.md

**Required Changes**:
- Add checkpoint marker to current session file
- Update checkpoint metadata in YAML
- Create backup copy if needed
- Use session-resolver for file operations

## Testing Requirements

Each handler must:
1. Work with new sessions/ format
2. Maintain backwards compatibility (read SESSION.md, never write)
3. Handle missing directories gracefully
4. Update symlinks correctly
5. Preserve all metadata

## Success Criteria

- [ ] All 5 handlers updated
- [ ] Zero writes to SESSION.md
- [ ] sessions/current symlink works
- [ ] YAML frontmatter properly maintained
- [ ] All tests pass
- [ ] Documentation updated

## Important Notes

1. **Never write to SESSION.md** - only read for backwards compatibility
2. **Always use session-resolver** for format detection and loading
3. **Create directories as needed** - sessions/YYYY/MM/ might not exist
4. **Maintain checksums** - recalculate after any content change
5. **Test both formats** - ensure old sessions can still be read

## Example Usage

After updates, this should work:
```
User: "Start a new session"
→ Creates: sessions/2025/08/2025-08-09-001-untitled.md
→ Updates: sessions/current → ../2025/08/2025-08-09-001-untitled.md
→ Returns: "Session 2025-08-09-001 started"
```