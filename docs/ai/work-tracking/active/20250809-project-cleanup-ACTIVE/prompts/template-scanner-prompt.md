# Template Scanner Agent Prompt

## Mission
Perform a comprehensive scan of the .claude directory to identify obsolete, deprecated, and removable files.

## Scanning Targets

### 1. Backup Directories
Search for and document:
- `templates.backup-*` directories
- Their creation dates
- Size of each backup
- Whether content differs from current templates

### 2. Deprecated Files
Identify files marked as:
- DEPRECATED in content or filename
- Old versions with .old suffix
- Superseded handlers/behaviors
- Files with "legacy" indicators

### 3. Temporary/Staging Files
Locate:
- Files in staging/ directory
- Temporary scripts no longer needed
- Migration state files that are complete
- Test files or experiments

### 4. Duplicate Content
Find:
- Files with identical or near-identical content
- Redundant documentation
- Multiple versions of same handler

### 5. Obsolete References
Check for:
- Files referencing deleted components
- Broken internal links
- Outdated configuration files

## Output Requirements

Create a report at: `.claude/agent-outputs/template-scanner/cleanup-scan-report.md`

### Report Structure:
```markdown
# Template Scanner Cleanup Report
Generated: [timestamp]

## Executive Summary
- Total files scanned: X
- Files recommended for deletion: Y
- Estimated space savings: Z MB

## Safe to Delete (Low Risk)
### Backup Directories
- [ ] templates.backup-20250802-125926 (X MB)
  - Reason: Outdated backup, current templates stable
  - Dependencies: None
  
### Temporary Files
- [ ] staging/old-migration-file.json
  - Reason: Migration complete
  - Dependencies: None

## Caution - Review Required (Medium Risk)
### Deprecated Handlers
- [ ] handlers/old-handler.md
  - Reason: Marked deprecated, replaced by new-handler.md
  - Dependencies: Check REGISTRY.md reference

## High Risk - Do Not Delete Without Verification
### Active But Obsolete
- [ ] [file]
  - Reason: [reason]
  - Dependencies: [list]
  - Recommendation: Archive instead of delete

## Statistics
- Backup directories: X (Y MB)
- Deprecated files: X (Y MB)
- Temporary files: X (Y MB)
- Total removable: X files (Y MB)
```

## Scanning Guidelines

1. **Be Conservative**: When in doubt, mark as "Caution" not "Safe"
2. **Check References**: Use grep to find any references to files
3. **Preserve History**: Recommend archiving for important deprecated files
4. **Document Everything**: Every file should have a clear reason for removal
5. **Calculate Sizes**: Include file/directory sizes for decision making

## Special Considerations

- Never recommend deleting:
  - CLAUDE.md or core engine files
  - Active handlers in REGISTRY.md
  - Current session files
  - Active work tracking folders
  
- Always check:
  - If deprecated files have replacements
  - If backup content matches current
  - If staging files are referenced anywhere

## Tools to Use
- Find for file discovery
- Grep for reference checking
- Du for size calculations
- Diff for comparing backups to current

Generate a comprehensive, actionable report that can be safely executed!