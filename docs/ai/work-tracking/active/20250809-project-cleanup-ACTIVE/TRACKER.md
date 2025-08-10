# Project Cleanup Task Tracker

## Phase 1: Discovery & Documentation
### Subagent Deployments
- [x] Deploy template-scanner agent ✅
  - [x] Scan .claude directory structure ✅
  - [x] Identify all backup directories ✅
  - [x] Find deprecated handlers/behaviors ✅
  - [x] Locate temporary files ✅
  - [x] Generate cleanup-scan-report.md ✅

- [ ] Deploy dependency analyzer agent
  - [ ] Map file dependencies
  - [ ] Identify orphaned files  
  - [ ] Find unused handlers
  - [ ] Check for broken references
  - [ ] Generate dependency-analysis-report.md

- [ ] Deploy work tracking auditor agent
  - [ ] Review work-tracking folders
  - [ ] Identify completed projects
  - [ ] Recommend archival candidates
  - [ ] Generate work-tracking-audit-report.md

- [ ] Deploy session history analyzer agent
  - [ ] Analyze session patterns
  - [ ] Extract key learnings
  - [ ] Identify archive candidates
  - [ ] Generate session-analysis-report.md

## Phase 2: Review & Validation
- [ ] Consolidate all agent reports
- [ ] Create master cleanup list
- [ ] Categorize by risk level (safe/caution/risky)
- [ ] Cross-reference dependencies
- [ ] Get user approval for deletions

## Phase 3: Execution
### Backup & Safety
- [ ] Create full project backup
- [ ] Document current project size
- [ ] Create rollback script

### Cleanup Execution
- [x] Remove old backup directories ✅
  - [x] templates.backup-20250802-125926 ✅
  - [x] templates.backup-20250807-134248 ✅
- [x] Delete 1.4GB worktrees (manual deletion) ✅
- [ ] Archive completed work tracking
- [ ] Remove deprecated handlers
- [ ] Clean staging/temporary files
- [ ] Remove obsolete scripts

### Validation
- [ ] Test all handlers still work
- [ ] Verify no broken references
- [ ] Check template system integrity
- [ ] Document size reduction achieved

## Metrics
- Initial project size: [TBD]
- Target reduction: 30-50%
- Files removed: [TBD]
- Space saved: [TBD]
- Final project size: [TBD]