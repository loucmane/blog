# Phase 3: Full Session Migration - Detailed Prompt

## Your Mission
Complete the full migration from SESSION.md to the sessions/ directory structure. This involves updating all remaining references, creating a migration tool, and deprecating the old system.

## Prerequisites
Phase 2 must be complete - all 5 session handlers updated and tested.

## Major Tasks

### 1. Deprecate SESSION.md

**Actions Required**:
1. Add deprecation notice at top of SESSION.md:
   ```markdown
   # ⚠️ DEPRECATED - READ ONLY
   # This file is no longer updated. 
   # New sessions are created in sessions/YYYY/MM/
   # Current session: sessions/current (symlink)
   ```
2. Ensure no handlers write to it
3. Keep for historical reference only

### 2. Update Remaining References (26 files)

**Files to Update**:
Search and update all references to SESSION.md in:
- CLAUDE.md and all engine modules
- Hook files (ultrathink_detector.py, etc.)
- Work tracking files
- Any handlers not in the original 5

**Change Pattern**:
```markdown
# Old:
- Primary source: SESSION.md
- Reference: Read SESSION.md for context

# New:
- Primary source: sessions/current (or session-resolver)
- Reference: Load session via session-resolver module
```

### 3. Create Migration Tool

**Create**: `.claude/templates/tools/session-migration-tool.md`

**Functionality**:
1. Parse existing SESSION.md
2. Split into individual session files
3. Generate proper YAML frontmatter for each
4. Create directory structure (YYYY/MM)
5. Calculate checksums
6. Preserve all content and formatting
7. Create report of migrated sessions

**Algorithm**:
```python
def migrate_sessions():
    sessions = parse_session_md()
    for session in sessions:
        # Extract date, create ID
        session_id = f"{date}-{sequence:03d}"
        
        # Create directory
        dir_path = f"sessions/{year}/{month:02d}/"
        
        # Generate frontmatter
        metadata = {
            'session_id': session_id,
            'date': date,
            'title': extract_title(session),
            'line_count': len(session.lines),
            'checksum': calculate_checksum(session)
        }
        
        # Write file
        write_session_file(dir_path, session_id, metadata, content)
    
    # Update current symlink to latest
    update_current_symlink(latest_session)
```

### 4. Remove Compatibility Layer

**After Testing Period**:
1. Remove fallback logic from session-resolver
2. Remove SESSION.md checks from handlers  
3. Simplify to only use sessions/ directory
4. Update all documentation

### 5. System-Wide Updates

**Update These Core Files**:

#### CLAUDE.md
- Change S field documentation
- Update session loading protocol
- Remove SESSION.md references

#### enforcement-check.md
- Update session validation logic
- Check sessions/current exists
- Validate YAML frontmatter

#### validation-framework.md
- Update S field patterns to accept new formats
- Add session ID validation regex
- Update examples

#### All Handlers
- Remove any remaining SESSION.md references
- Use session-resolver consistently
- Update documentation

#### Hook Files
- Update Python hooks to track new session format
- Modify state tracking for session IDs
- Update any session-dependent logic

## Testing Requirements

### Functional Tests
- [ ] Create new session works
- [ ] Update session works
- [ ] End session works
- [ ] Checkpoint works
- [ ] Migration tool processes SESSION.md correctly
- [ ] All migrated sessions have valid structure

### Integration Tests
- [ ] ULTRATHINK uses correct session ID
- [ ] S:W:H:E format accepts all variations
- [ ] Hooks track sessions properly
- [ ] Work folders link to sessions correctly

### Performance Tests
- [ ] Session loading < 100ms
- [ ] No performance degradation
- [ ] Symlink resolution fast

### Rollback Test
- [ ] Can revert if issues found
- [ ] Backup plan documented
- [ ] No data loss possible

## Success Criteria

- [ ] SESSION.md marked deprecated
- [ ] All 31 references updated
- [ ] Migration tool created and tested
- [ ] All sessions migrated successfully
- [ ] Compatibility layer removed
- [ ] Full system test passed
- [ ] Documentation updated
- [ ] Zero functionality lost

## Risk Mitigation

### Data Loss Prevention
1. Create backup of SESSION.md before migration
2. Verify each session after migration
3. Keep SESSION.md as read-only backup

### Rollback Plan
1. If issues found, revert session-resolver to use SESSION.md
2. Keep compatibility layer for 1 week minimum
3. Document any issues found

## Timeline

- **Hour 1**: Update all references, deprecate SESSION.md
- **Hour 2**: Create and test migration tool
- **Hour 3**: Run migration, verify results
- **Hour 4**: Remove compatibility layer (after validation)

## Example Final State

```
blog/
├── SESSION.md (DEPRECATED - READ ONLY)
├── sessions/
│   ├── 2025/
│   │   ├── 06/
│   │   │   └── 2025-06-24-001-project-setup.md
│   │   ├── 07/
│   │   │   └── [multiple session files]
│   │   └── 08/
│   │       ├── 2025-08-04-001-hook-fixes.md
│   │       └── 2025-08-09-001-session-integration.md
│   ├── current → 2025/08/2025-08-09-001-session-integration.md
│   └── archive/
│       ├── completed/
│       └── stale/
```

All systems use sessions/ exclusively, SESSION.md never updated.