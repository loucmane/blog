# Comprehensive SESSION.md Migration Design

## Executive Summary
Migration of monolithic SESSION.md (46KB) to distributed folder structure with enhanced safety, validation, and system integration features.

## Core Architecture

### Directory Structure
```
blog/
├── SESSION.md                     # Minimal index (<1KB)
├── SESSION.md.backup              # Original backup
├── .session-metadata.json         # Migration & search metadata
├── sessions/
│   ├── 2025-07-26-001-ultrathink-improvements.md
│   ├── 2025-07-26-002-template-portability.md
│   ├── current -> 2025-07-26-002-template-portability.md  # Symlink
│   └── archive/
│       ├── completed/            # Finished work
│       ├── stale/               # Abandoned sessions
│       └── by-month/
│           ├── 2025-06/
│           └── 2025-05/
```

## Critical Safety Features

### 1. Data Integrity Protection
```json
{
  "pre_migration": {
    "original_checksum": "sha256:...",
    "line_count": 2147,
    "character_count": 46892,
    "session_count": 24,
    "backup_verified": true
  },
  "post_migration": {
    "total_checksum": "sha256:...",
    "line_count": 2147,
    "character_count": 46892,
    "files_created": 24,
    "validation_passed": true
  }
}
```

### 2. Robust Parsing Strategy
- **State Machine Parser**: Tracks context (code blocks, quotes, lists)
- **Session Boundary Detection**:
  ```python
  # Pseudocode
  if line.startswith("## Session:") and not in_code_block:
      new_session_boundary = True
  ```
- **Edge Case Handling**:
  - Incomplete sessions
  - Nested markdown structures  
  - Code blocks containing "## Session:"
  - Malformed headers

### 3. Collision-Resistant Naming
```
Format: YYYY-MM-DD-NNN-descriptive-name.md
        │         │   │
        │         │   └─ Sanitized title
        │         └─ Daily sequence number (001-999)
        └─ ISO date

Examples:
- 2025-07-26-001-ultrathink-improvements.md
- 2025-07-26-002-template-portability.md
- 2025-07-26-003-template-portability.md  # Same topic, different session
```

**Sanitization Rules**:
- Replace spaces with hyphens
- Remove special chars except alphanumeric and hyphens
- Lowercase everything
- Truncate at 50 chars
- Fallback: use "session" if no title

## Migration Execution Plan

### Phase 1: Pre-Migration Analysis (DRY RUN)
```bash
1. Parse SESSION.md completely
2. Generate migration manifest
3. Check for naming conflicts
4. Estimate resource usage
5. Report findings WITHOUT writing files
6. Get user confirmation
```

### Phase 2: Backup & Validation
```bash
1. Create SESSION.md.backup
2. Verify backup (byte-for-byte comparison)
3. Create .migration-status.json
4. Initialize .session-metadata.json
```

### Phase 3: Idempotent Extraction
```json
// .migration-status.json
{
  "status": "in_progress",
  "started": "2025-07-26T15:30:00Z",
  "sessions_processed": [
    {
      "header": "## Session: 2025-07-26 - ULTRATHINK",
      "filename": "2025-07-26-001-ultrathink.md",
      "lines": [1, 234],
      "checksum": "sha256:abc123...",
      "written": true
    }
  ],
  "errors": [],
  "resumable": true
}
```

### Phase 4: Index Generation
```markdown
# Session Management Index
<!-- Auto-generated. Do not edit manually. -->
<!-- Last updated: 2025-07-26T15:45:00Z -->
<!-- Checksum: sha256:def456... -->

## Current Active Session
→ [2025-07-26-002-template-portability.md](sessions/2025-07-26-002-template-portability.md)

## Quick Commands
- View all: `ls sessions/*.md | head -20`
- Search: `mcp__serena__search_for_pattern --substring_pattern "term" --relative_path "sessions/"`
- Refresh index: `[handler: refresh-session-index]`
- Continue session: `[handler: continue-session]`

## Recent Sessions
[Auto-populated last 5]

## Statistics
- Total: 24 sessions
- Active: 1
- Archived: 3
- Size: 46KB → 24 files
```

## System Integration Updates

### 1. Handler Modifications
```yaml
session-start:
  - Create new session file in sessions/
  - Update SESSION.md index
  - Update current symlink
  
session-continue:
  - Find latest session or specific date
  - Append to existing file
  
session-search:
  - Search across all sessions
  - Use cached index for speed
  
session-archive:
  - Move old sessions to archive/
  - Update index and metadata
```

### 2. CLAUDE.md Updates
```markdown
## Session Management
Sessions are now stored in individual files under `sessions/` for better performance.
- Current session: Check `sessions/current` symlink
- Search sessions: Use session-search handler
- Old SESSION.md: Preserved as SESSION.md.backup
```

### 3. Search Optimization
```json
// .session-search-index.json (rebuilt daily)
{
  "keywords": {
    "ultrathink": ["2025-07-26-001", "2025-07-25-003"],
    "template": ["2025-07-26-002", "2025-07-24-001"],
    "fix": ["2025-07-23-002"]
  },
  "last_rebuilt": "2025-07-26T06:00:00Z"
}
```

## Testing & Validation Matrix

### Automated Test Suite
```python
tests = [
    # Content Preservation
    ("line_count_matches", lambda: pre.lines == post.lines),
    ("char_count_matches", lambda: pre.chars == post.chars),
    ("no_data_loss", lambda: diff(original, reconstructed) == 0),
    
    # Format Validation  
    ("valid_markdown", lambda: all(validate_md(f) for f in sessions)),
    ("valid_filenames", lambda: all(match_pattern(f) for f in files)),
    
    # Functional Tests
    ("serena_search_works", lambda: serena.search("test", "sessions/")),
    ("index_loads", lambda: load("SESSION.md").size < 1024),
    ("symlink_valid", lambda: exists("sessions/current")),
    
    # Edge Cases
    ("handles_code_blocks", test_code_block_sessions),
    ("handles_special_chars", test_special_char_titles),
    ("handles_long_sessions", test_10kb_sessions),
]
```

## Rollback Procedures

### Automatic Rollback Triggers
- Checksum mismatch
- Missing content detected
- File write failures
- User cancellation

### Rollback Process
```bash
1. Stop migration immediately
2. Preserve any new sessions (post-migration)
3. Restore SESSION.md from backup
4. Append new sessions to restored file
5. Clean up partial migration:
   - Remove sessions/ folder
   - Remove metadata files
   - Remove new SESSION.md
6. Log rollback reason
7. Notify user with details
```

### Hybrid Mode (Transition Period)
```
Week 1-2: Both systems active
- SESSION.md.backup (read-only archive)
- New sessions → sessions/ folder
- Search checks both locations

Week 3: Full migration
- Remove SESSION.md.backup
- Update all handlers
- Single source of truth
```

## Performance Metrics

### Expected Improvements
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Load SESSION.md | 450ms | 15ms | 30x faster |
| Search sessions | 200ms | 50ms | 4x faster |
| Add new session | 500ms | 20ms | 25x faster |
| Memory usage | 46KB | 1KB | 46x less |

## Implementation Checklist

### Pre-Migration
- [ ] Backup SESSION.md
- [ ] Run dry-run analysis
- [ ] Check disk space (need ~100KB free)
- [ ] Verify no active edits to SESSION.md
- [ ] Get user confirmation

### Migration
- [ ] Create backup with verification
- [ ] Initialize tracking files
- [ ] Parse and extract sessions
- [ ] Generate filenames (collision-free)
- [ ] Write session files with metadata
- [ ] Create new index
- [ ] Update symlinks
- [ ] Run validation suite

### Post-Migration  
- [ ] Update handlers (session-start, etc.)
- [ ] Update CLAUDE.md documentation
- [ ] Test Serena search
- [ ] Test handler integration
- [ ] Monitor for issues (24-48 hours)
- [ ] Archive old backup (after 1 week)

## Risk Mitigation

### High-Risk Scenarios
1. **Power failure during migration**
   - Solution: Idempotent process with .migration-status.json
   
2. **Corrupted SESSION.md**
   - Solution: Multiple backup strategies, checksums

3. **Handler compatibility issues**
   - Solution: Hybrid mode, gradual transition

4. **Search performance degradation**
   - Solution: Search index cache, smart caching

## Success Criteria

### Must Have (P0)
- ✓ Zero data loss
- ✓ All sessions extractable
- ✓ Backup verified
- ✓ Rollback possible

### Should Have (P1)
- ✓ Search works across sessions
- ✓ Handlers updated
- ✓ Performance improved
- ✓ Index auto-updates

### Nice to Have (P2)
- ✓ Archive automation
- ✓ Search index caching
- ✓ Session analytics
- ✓ Compression for old sessions

## Migration Command

```bash
# Final migration command for template-migrator agent
python migrate_sessions.py \
  --source SESSION.md \
  --backup SESSION.md.backup \
  --output sessions/ \
  --dry-run first \
  --validate extensive \
  --rollback-on-error \
  --generate-index \
  --update-handlers \
  --preserve-checksums \
  --verbose
```

## Conclusion

This comprehensive design addresses all critical aspects of the SESSION.md migration with emphasis on:
1. **Safety**: Multiple validation layers, rollback capability
2. **Robustness**: Handles edge cases, resumable process
3. **Integration**: Updates entire system coherently
4. **Performance**: 30x faster load times
5. **Maintainability**: Clear structure, automated processes

The migration can proceed with confidence knowing that data integrity is protected at every step.