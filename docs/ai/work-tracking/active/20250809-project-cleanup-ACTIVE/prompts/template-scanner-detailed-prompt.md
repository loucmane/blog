# Template Scanner Agent - Detailed Prompt

## CRITICAL CONTEXT
Templates have been MOVED from .claude/templates/ to /templates/ at the project root. The .claude directory now contains only configurations, backups, and other non-template files.

## YOUR MISSION
Scan the .claude directory systematically to identify ALL obsolete, deprecated, and removable files. Create a detailed cleanup report.

## SPECIFIC SCANNING TARGETS

### 1. Backup Directories (PRIORITY)
Known targets to investigate:
- `.claude/templates.backup-20250802-125926` (440K)
- `.claude/templates.backup-20250807-134248` (856K)

For each backup:
- Compare with current /templates/ directory (NOT .claude/templates which no longer exists)
- Check if content is identical to current templates
- Note creation date and size
- Determine if safe to delete

### 2. Staging Directory Analysis
Check `.claude/staging/` contents:
- migration-state.json - is migration complete?
- CLAUDE-md-updates.md - still needed?
- REGISTRY-md-updates.md - still needed?
- backups/ subdirectory - what's in there?
- reports/ subdirectory - any old reports?
- shared/ subdirectory - what's this for?

### 3. Agent Outputs Directory
Review `.claude/agent-outputs/` for:
- Old migration reports
- Completed test outputs
- Redundant validation reports
- Empty directories

### 4. Scripts Directory
Check `.claude/scripts/` (if exists) for:
- One-time migration scripts
- Temporary utilities
- Completed automation scripts

### 5. State and Config Files
Look for:
- Old state files (.json, .yaml)
- Outdated configurations
- Migration markers
- Temporary lock files

### 6. Hidden Files and Directories
Search for:
- .tmp files
- .bak files
- ~ backup files
- Hidden directories starting with .

## SCANNING METHODOLOGY

1. First, get the complete directory structure:
   ```bash
   find .claude -type d | sort
   ```

2. Check sizes of all major directories:
   ```bash
   du -sh .claude/* | sort -h
   ```

3. Find all old/backup/temp files:
   ```bash
   find .claude -type f \( -name "*.old" -o -name "*.bak" -o -name "*.tmp" -o -name "*~" -o -name "*.backup" \)
   ```

4. Search for DEPRECATED markers:
   ```bash
   grep -r "DEPRECATED" .claude --include="*.md" --include="*.json"
   ```

5. Find empty directories:
   ```bash
   find .claude -type d -empty
   ```

6. Compare backup templates with current:
   ```bash
   # For each backup directory, diff against /templates/
   diff -r .claude/templates.backup-20250802-125926 /templates/
   ```

## OUTPUT REQUIREMENTS

Create report at: `.claude/agent-outputs/template-scanner/cleanup-scan-report.md`

Structure your report EXACTLY like this:

```markdown
# Template Scanner Cleanup Report
Generated: [timestamp]

## Executive Summary
- Total directories scanned: X
- Total files analyzed: Y  
- Safe to delete: Z files (A.B MB)
- Requires review: W files (C.D MB)
- Must keep: V files

## SAFE TO DELETE - Low Risk (Can Delete Immediately)

### Template Backup Directories
- [ ] `.claude/templates.backup-20250802-125926` (440K)
  - **Reason**: Content identical to current /templates/, backup from 8 days ago
  - **Dependencies**: None found
  - **Command**: `rm -rf .claude/templates.backup-20250802-125926`

### Staging Files
- [ ] `.claude/staging/migration-state.json`
  - **Reason**: Migration completed on 2025-08-09
  - **Dependencies**: None
  - **Command**: `rm .claude/staging/migration-state.json`

[Continue for all safe items...]

## CAUTION - Medium Risk (Requires Review)

### Potentially Active Files
- [ ] [file path]
  - **Reason**: [why it might be obsolete]
  - **Concern**: [why we're not sure]
  - **Check**: [what to verify before deletion]

## DO NOT DELETE - High Risk

### Active Configuration
- [file path] - Reason: Still in use by [what]

## Size Analysis
| Category | Files | Current Size | Savings if Deleted |
|----------|-------|--------------|-------------------|
| Backup dirs | 2 | 1.3MB | 1.3MB |
| Staging | X | Y MB | Y MB |
| Agent outputs | X | Y MB | Y MB |
| **TOTAL** | **X** | **Y MB** | **Y MB** |

## Recommended Cleanup Commands
```bash
# Create safety backup first
tar -czf .claude-backup-$(date +%Y%m%d).tar.gz .claude/

# Delete safe items
rm -rf .claude/templates.backup-20250802-125926
rm -rf .claude/templates.backup-20250807-134248
[other commands...]
```

## Post-Cleanup Verification
After cleanup, run:
```bash
# Check nothing broke
grep -r "\.claude/templates\.backup" . --include="*.md"
# Verify system still works
[verification commands]
```
```

## IMPORTANT RULES

1. **BE CONSERVATIVE**: If unsure, mark as "Caution" not "Safe"
2. **CHECK REFERENCES**: Use grep to find ANY references before marking safe:
   ```bash
   grep -r "filename" . --exclude-dir=.git --exclude-dir=node_modules
   ```
3. **NEVER MARK AS SAFE**:
   - Active .claude/hooks/
   - Active .claude/agents/
   - CLAUDE.md or any active handlers
   - Current work tracking

4. **ALWAYS INCLUDE**:
   - Exact file paths
   - File sizes
   - Clear deletion commands
   - Verification steps

Start by examining the full .claude directory structure, then systematically analyze each category. Your report will be used to execute the actual cleanup, so be thorough and accurate!