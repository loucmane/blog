# Phase 3: Full Session Migration - Execution Prompt

## Mission Critical
Complete the full migration from SESSION.md to the sessions/ directory structure. This involves updating all remaining references (26 files), creating a migration tool, deprecating SESSION.md, and eventually removing the compatibility layer.

## Prerequisites
- Phase 2 must be complete (all 5 handlers updated)
- Session-resolver module operational
- Test that new sessions are being created in sessions/ directory

## Task 1: Deprecate SESSION.md

### Add Deprecation Notice
**File**: `SESSION.md`

Add at the very top of the file:
```markdown
# ⚠️ DEPRECATED - READ ONLY ⚠️
# This file is no longer updated as of 2025-08-09
# New sessions are created in sessions/YYYY/MM/
# Current active session: sessions/current (symlink)
# 
# To access current session:
# - Read: sessions/current
# - Via module: session-resolver.load-current-session()
#
# Historical sessions remain below for reference only.
# ---
```

### Ensure No Writes
Verify all 5 handlers from Phase 2 are NOT writing to SESSION.md:
```bash
# Run this check
grep -r "SESSION.md.*Write\|SESSION.md.*Edit\|SESSION.md.*>>" .claude/templates/
# Should return NO results
```

## Task 2: Update Remaining References (26 files)

### Files to Update
Search and update all references in these locations:

#### Core Engine Files
1. **CLAUDE.md** and all engine modules
   - Change: `SESSION.md` → `session-resolver module`
   - Update S field documentation

2. **enforcement-check.md**
   - Old: `Read SESSION.md for session context`
   - New: `Load session via session-resolver`

3. **validation-framework.md**
   - Update S field validation patterns:
   ```regex
   # Add new patterns:
   S:2025-08-09-001  # New format
   S:current         # Symlink reference
   S:resolver        # Via module
   ```

#### Hook Files
4. **ultrathink_detector.py**
   ```python
   # Old:
   session = read_file("SESSION.md")
   
   # New:
   from session_resolver import load_current_session
   session = load_current_session()
   ```

5. **session_analyzer.py**
   - Update to track new session format
   - Modify state tracking for session IDs

6. **development_context_injector.py**
   - Update session reference injection

#### Work Tracking Files
7. All files in `docs/ai/work-tracking/`
   - Update any SESSION.md references to explain new system

### Search Command
```bash
# Find all remaining references
grep -r "SESSION\.md" .claude/templates/ --exclude-dir=handlers | grep -v "DEPRECATED"
```

### Replacement Pattern
```markdown
# Old patterns:
- "Read SESSION.md"
- "Update SESSION.md"
- "Check SESSION.md"
- "SESSION.md for context"

# New patterns:
- "Load session via session-resolver"
- "Update current session"
- "Check sessions/current"
- "session-resolver for context"
```

## Task 3: Create Migration Tool

### Create New Handler
**File**: `.claude/templates/tools/session-migration-tool.md`

```yaml
---
name: session-migration-tool
role: tool
purpose: Migrate existing SESSION.md to individual session files
dependencies:
  - session-resolver
  - file-operations
---

# Session Migration Tool

## Purpose
Parse existing SESSION.md and split into individual session files in sessions/ directory.

## Algorithm
```python
def migrate_sessions():
    # 1. Parse SESSION.md
    content = read_file("SESSION.md")
    sessions = parse_sessions(content)
    
    # 2. For each session found
    for idx, session in enumerate(sessions):
        # Extract metadata
        date = extract_date(session)
        year, month, day = parse_date(date)
        
        # Generate session ID
        sequence = f"{idx+1:03d}"
        session_id = f"{year}-{month:02d}-{day:02d}-{sequence}"
        
        # Create directory
        dir_path = f"sessions/{year}/{month:02d}/"
        ensure_directory(dir_path)
        
        # Generate frontmatter
        metadata = {
            'session_id': session_id,
            'date': f"{year}-{month:02d}-{day:02d}",
            'title': extract_title(session) or "Migrated Session",
            'migrated_from': 'SESSION.md',
            'migration_date': '2025-08-09',
            'line_count': count_lines(session),
            'character_count': len(session),
            'checksum': calculate_checksum(session)
        }
        
        # Write file
        file_path = f"{dir_path}{session_id}-migrated.md"
        write_session_file(file_path, metadata, session)
    
    # 3. Update current symlink to latest
    latest_session = sessions[-1] if sessions else None
    if latest_session:
        update_symlink("sessions/current", latest_session)
    
    # 4. Generate report
    return {
        'sessions_migrated': len(sessions),
        'files_created': [paths],
        'latest_session': latest_session
    }
```

## Session Detection Pattern
```regex
# Session start patterns:
^#{1,3}\s+Session\s+\d{4}-\d{2}-\d{2}
^---\s*Session\s+Started
^Session\s+\#\d+
```

## Usage
```bash
Task: operator-executor "Run session-migration-tool to migrate SESSION.md"
```
```

## Task 4: System-Wide Updates

### Update CLAUDE.md
**File**: `.claude/templates/engine/core/enforcement-check.md`

Update S field validation:
```markdown
## S Field Validation
- Check sessions/current exists OR
- Check SESSION.md exists (deprecated) OR
- Use session-resolver for format detection

Valid formats:
- S:2025-08-09-001 (new session ID)
- S:current (symlink reference)
- S:20250809 (legacy format - deprecated)
```

### Update Hook Files
**File**: All Python hooks

```python
# Add session resolver support
def get_current_session():
    """Get current session using new format."""
    try:
        # Try new format first
        if os.path.exists("sessions/current"):
            return read_symlink_target("sessions/current")
        # Fallback to SESSION.md (deprecated)
        elif os.path.exists("SESSION.md"):
            return "SESSION.md (deprecated)"
        else:
            return None
    except:
        return None
```

## Task 5: Testing & Validation

### Functional Tests
```bash
# Test new session creation
echo "start new session" | assistant
# Should create: sessions/2025/08/2025-08-09-XXX.md

# Test session update
echo "update current session with progress" | assistant
# Should modify: sessions/current (not SESSION.md)

# Test migration tool
Task: operator-executor "Run session-migration-tool"
# Should create multiple files in sessions/

# Verify SESSION.md unchanged
git diff SESSION.md
# Should show only deprecation notice
```

### Integration Tests
```bash
# Test ULTRATHINK with new format
echo "work on improving documentation" | assistant
# Check S field uses new format

# Test hooks recognize new sessions
python3 .claude/hooks/ultrathink_detector.py
# Should detect current session

# Test work folders link correctly
ls -la docs/ai/work-tracking/active/
# Should show symlinks to sessions/
```

## Task 6: Remove Compatibility Layer (After Testing)

### After 1 Week Testing Period
1. **Remove fallback logic from session-resolver**
   ```markdown
   # Remove:
   - SESSION.md checking
   - Legacy format detection
   ```

2. **Simplify handlers**
   - Remove SESSION.md compatibility checks
   - Use only sessions/ directory

3. **Update documentation**
   - Remove all mentions of SESSION.md except historical

## Success Metrics

### Immediate Success
- [ ] SESSION.md marked with deprecation notice
- [ ] 0 writes to SESSION.md after deprecation
- [ ] All 26+ references updated
- [ ] Migration tool created and tested
- [ ] All sessions successfully migrated

### Long-term Success
- [ ] All handlers use new format exclusively
- [ ] Performance maintained or improved
- [ ] No functionality lost
- [ ] Clean separation of sessions
- [ ] Easy session management

## Risk Mitigation

### Backup Strategy
```bash
# Before migration
cp SESSION.md SESSION.md.backup-20250809
cp -r sessions/ sessions.backup-20250809/

# After migration
tar -czf sessions-migrated-20250809.tar.gz sessions/
```

### Rollback Plan
If critical issues found:
1. Restore SESSION.md from backup
2. Update session-resolver to use SESSION.md only
3. Document issues for resolution
4. Retry migration after fixes

## Final Validation

### Checklist
- [ ] SESSION.md is read-only (deprecated)
- [ ] All new sessions created in sessions/
- [ ] All handlers updated and tested
- [ ] Migration tool executed successfully
- [ ] All hooks updated
- [ ] Performance benchmarks acceptable
- [ ] Documentation fully updated
- [ ] No breaking changes for users

### Performance Benchmarks
```bash
# Measure session operations
time echo "start new session" | assistant
# Should be < 200ms

time echo "update session" | assistant  
# Should be < 100ms

# Check symlink resolution
time readlink sessions/current
# Should be < 10ms
```

## Timeline
- Hour 1: Deprecate SESSION.md, update core references
- Hour 2: Update remaining files, create migration tool
- Hour 3: Run migration, extensive testing
- Hour 4: Documentation and cleanup
- Week 1: Monitor and validate
- Week 2: Remove compatibility layer