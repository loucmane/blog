# SESSION.md Migration Guide

## ⚠️ CRITICAL SAFETY FIRST ⚠️

This migration tool is designed with **extreme safety** in mind:
- **NEVER** modifies the original SESSION.md
- Creates **real backup** (209KB, not placeholder)
- **Verifies everything** with checksums
- **Dry-run first** - always preview before executing
- **Full rollback** capability if anything goes wrong

## Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run Pre-flight Check
```bash
python pre_migration_check.py
```
This will verify:
- SESSION.md exists and is readable
- No conflicting backups
- Sufficient disk space
- Dependencies installed

### 3. Preview with Dry Run (ALWAYS DO THIS FIRST!)
```bash
python migrate_sessions.py --dry-run
```
This shows exactly what will happen WITHOUT making any changes.

### 4. Execute Migration
```bash
python migrate_sessions.py
```
The script will:
1. Create SESSION.md.backup (verified with checksum)
2. Parse all 38 sessions with state machine
3. Apply date corrections (2025-01-0X → 2025-07-0X)
4. Create folder structure (sessions/2025/MM/)
5. Generate metadata headers for each file
6. Create symlink to current session
7. Generate minimal index file
8. Validate everything

### 5. Verify Migration
```bash
python test_migration.py
```
Runs 10+ tests to verify:
- Backup integrity
- Folder structure
- File naming
- Date corrections
- Line preservation
- Metadata headers

## Command Options

### Basic Usage
```bash
# Preview only (recommended first)
python migrate_sessions.py --dry-run

# Execute with confirmations
python migrate_sessions.py

# Skip all confirmations
python migrate_sessions.py --force

# Verbose debugging output
python migrate_sessions.py --verbose
```

### Advanced Options
```bash
# Use different source file
python migrate_sessions.py --session-file path/to/SESSION.md

# Use different output directory
python migrate_sessions.py --output-dir custom_sessions/

# Rollback a failed migration
python migrate_sessions.py --rollback
```

## Expected Output Structure

```
blog/
├── SESSION.md                   # Original (untouched)
├── SESSION.md.backup            # Real backup (209KB)
├── SESSION_NEW.md               # New minimal index (<1KB)
├── sessions/
│   ├── 2025/
│   │   ├── 08/                 # August (4 sessions)
│   │   │   ├── 2025-08-04-001-hook-path-resolution.md
│   │   │   ├── 2025-08-03-001-hook-template-integration.md
│   │   │   ├── 2025-08-02-001-hook-trigger-fixes.md
│   │   │   └── 2025-08-01-001-claude-code-hooks.md
│   │   ├── 07/                 # July (23 sessions)
│   │   │   ├── 2025-07-31-001-template-migration-pipeline.md
│   │   │   ├── 2025-07-30-001-template-migration-staging.md
│   │   │   └── ... (21 more)
│   │   └── 06/                 # June (11 sessions)
│   │       └── ... (11 sessions)
│   ├── current                  # Symlink to latest session
│   └── archive/
│       ├── completed/
│       └── stale/
└── .migration-manifest.json     # Migration metadata
```

## File Format

Each migrated session includes metadata header:
```markdown
---
session_id: 2025-08-04-001
date: 2025-08-04
time: 11:02 CEST
title: Hook Path Resolution
original_lines: [6, 60]
line_count: 55
character_count: 2943
checksum: sha256:abc123...
migrated_at: 2025-08-06T15:30:00Z
---

## Session: 2025-08-04 11:02 CEST

[Original content exactly preserved]
```

## Safety Features

### 1. Multiple Verification Layers
- Checksum verification of backup
- Line count validation
- Character count validation
- File count verification

### 2. State Machine Parser
- Handles code blocks correctly
- Doesn't split on "Session:" inside code
- Preserves all formatting

### 3. Date Corrections
Automatically fixes known date anomalies:
- 2025-01-06 → 2025-07-06
- 2025-01-05 → 2025-07-05
- 2025-01-03 → 2025-07-03

### 4. Rollback Capability
```bash
# If something goes wrong
python migrate_sessions.py --rollback
```
This will:
- Remove sessions/ folder
- Remove manifest files
- Remove new index
- Leave backup intact

## After Migration

1. **Review SESSION_NEW.md** - The new minimal index
2. **Test everything works** - Use test_migration.py
3. **When satisfied**, rename files:
   ```bash
   mv SESSION.md SESSION.md.old
   mv SESSION_NEW.md SESSION.md
   ```
4. **Keep backup** until absolutely certain

## Troubleshooting

### "Backup already exists"
```bash
# Use --force to overwrite
python migrate_sessions.py --force
```

### "Sessions folder not empty"
Either:
- Remove it: `rm -rf sessions/`
- Or use: `python migrate_sessions.py --force`

### "Migration failed"
1. Check migration.log for details
2. Run rollback: `python migrate_sessions.py --rollback`
3. Fix issues and retry

### "Validation warnings"
Small line count differences are normal due to metadata headers.
Run `python test_migration.py` for detailed analysis.

## Important Notes

- **Original SESSION.md is NEVER modified**
- Backup is created with full verification
- All content is preserved exactly
- Metadata is added without changing original text
- Migration can be fully reversed

## Success Indicators

After successful migration:
- ✅ SESSION.md.backup exists (209KB)
- ✅ 38 session files created
- ✅ Proper folder structure (2025/06/, 2025/07/, 2025/08/)
- ✅ Date corrections applied
- ✅ Current symlink works
- ✅ SESSION_NEW.md is tiny (<1KB)
- ✅ All validation checks pass