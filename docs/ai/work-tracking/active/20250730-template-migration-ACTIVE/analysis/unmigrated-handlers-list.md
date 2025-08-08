# Unmigrated Handlers Inventory
**Date**: 2025-08-08  
**Purpose**: Complete list of handlers still embedded in monolithic files  

## Summary
- **Total Unmigrated**: 42 handlers/patterns
- **Files Affected**: 3 monolithic template files
- **Migration Priority**: HIGH - these create confusion and duplication

## CONVENTIONS.md - 22 Embedded Handlers

### Evidence & Analysis Handlers (Lines 1082-1151)
1. **verify-claim** (Line 1082)
   - Role: Operator
   - Domain: Analysis
   - Already partially migrated to operators/analysis/

2. **gather-evidence** (Line 1103)
   - Role: Operator
   - Domain: Analysis
   - Already migrated but original remains

3. **cite-source** (Line 1128)
   - Role: Operator
   - Domain: Analysis
   - Duplicate definition exists

### Naming & Style Handlers (Lines 1152-1290)
4. **check-naming** (Line 1152)
   - Role: Operator
   - Domain: Development
   - Exists in operators/development/

5. **suggest-name** (Line 1177)
   - Role: Operator
   - Domain: Development
   - Already migrated

6. **validate-path** (Line 1199)
   - Role: Operator
   - Domain: File
   - Migrated to operators/file/

7. **check-style** (Line 1222)
   - Role: Operator
   - Domain: Development
   - Duplicate exists

8. **format-code** (Line 1244)
   - Role: Operator
   - Domain: Development
   - Already migrated

9. **review-patterns** (Line 1268)
   - Role: Operator
   - Domain: Development
   - Exists in operators/

### Git Handlers (Lines 1291-1338)
10. **check-commit-msg** (Line 1291)
    - Role: Operator
    - Domain: Git
    - Already migrated

11. **suggest-commit-type** (Line 1313)
    - Role: Operator
    - Domain: Git
    - Duplicate exists

### Session Handlers (Lines 1339-1416)
12. **session-start** (Line 1339)
    - Role: Orchestrator
    - Domain: Session
    - DUPLICATE with orchestrators version

13. **resolve-session-void** (Line 1389)
    - Role: Orchestrator
    - Domain: Session
    - Already migrated

### Documentation Handlers (Lines 1417-1468)
14. **check-docs-needed** (Line 1417)
    - Role: Operator
    - Domain: Docs
    - Exists in operators/docs/

15. **validate-comments** (Line 1442)
    - Role: Operator
    - Domain: Docs
    - Already migrated

### Pre-flight Handlers (Lines 1469-1493)
16. **check-conventions-first** (Line 1469)
    - Role: Orchestrator
    - Domain: Workflow
    - Migrated to orchestrators/

17. **enforce-pre-flight** (Line 1493)
    - Role: Orchestrator
    - Domain: Workflow
    - Already exists

## PATTERNS.md - 14 Embedded Patterns (Actually Orchestrators)

All of these are in the pattern format but are actually orchestrators:

1. **execute-ultrathink** (Line 35)
   - Already migrated to orchestrators/
   - Original still remains

2. **work-activity** (Line 73)
   - Migrated to orchestrators/
   - Duplicate definition

3. **work-continuation** (Line 88)
   - Exists in orchestrators/
   - Should be removed

4. **file-operation** (Line 103)
   - Already migrated
   - Creates confusion

5. **file-creation** (Line 121)
   - In orchestrators/
   - Redundant

6. **tool-selection** (Line 137)
   - Migrated
   - Should reference shared pattern

7. **code-creation** (Line 154)
   - Exists in orchestrators/
   - Duplicate

8. **evidence-check** (Line 169)
   - Already migrated
   - Redundant

9. **architecture-claim** (Line 183)
   - In orchestrators/
   - Should be removed

10. **time-capture** (Line 198)
    - Actually an operator
    - Exists in operators/external/

11. **ambiguous-request** (Line 213)
    - Migrated to orchestrators/
    - Original unnecessary

12. **multi-step-request** (Line 226)
    - Already in orchestrators/
    - Duplicate

13. **lost-context** (Line 241)
    - Exists in orchestrators/
    - Should be removed

14. **system-improvement** (Line 255)
    - Migrated
    - Redundant definition

## BUILDING-BETTER.md - 6 Integration Handlers

### Integration Handlers (Lines 280-390)
1. **workflow-to-tool** (Line 280)
   - Role: Orchestrator
   - Already migrated to orchestrators/
   - Original remains

2. **tool-to-convention** (Line 297)
   - Role: Orchestrator
   - Exists in orchestrators/
   - Duplicate

3. **convention-to-workflow** (Line 314)
   - Role: Orchestrator
   - Already migrated
   - Should be removed

4. **save-context** (Line 333)
   - Role: Operator
   - Exists in operators/session/
   - Redundant

5. **restore-context** (Line 350)
   - Role: Operator
   - Already in operators/session/
   - Duplicate

6. **switch-context** (Line 367)
   - Role: Orchestrator
   - Migrated to orchestrators/
   - Original unnecessary

## Migration Status Analysis

### Already Migrated but Not Removed (HIGHEST RISK)
These 36 handlers exist in both places, creating version control nightmares:
- All handlers in CONVENTIONS.md (22)
- All patterns in PATTERNS.md (14)
- All handlers in BUILDING-BETTER.md (6)

### Never Migrated (MISSING)
These handlers are referenced but don't exist anywhere:
- `analyze-code` - Referenced by multiple handlers
- `run-tests` - Mentioned in workflows
- `test-implementation` - Referenced in testing workflows

### Incorrectly Categorized
These are in wrong locations:
- `time-capture` - Listed as pattern, actually an operator
- Patterns in PATTERNS.md - All are actually orchestrators

## Recommended Migration Order

### Phase 1: Remove Duplicates (URGENT)
1. Delete all 42 handler definitions from monolithic files
2. These are ALL already migrated
3. Keep only the handler reference/index

### Phase 2: Create Missing Handlers
1. Create `analyze-code` handler
2. Create `run-tests` handler  
3. Create `test-implementation` handler

### Phase 3: Fix Categorization
1. Ensure `time-capture` is only in operators/
2. Verify all patterns are actual patterns, not handlers

### Phase 4: Update References
1. Update all internal references to point to new locations
2. Add migration notices to old locations
3. Update REGISTRY.md with correct paths

## Impact of Not Migrating

### Current Problems
1. **Version conflicts** - Changes to one version not reflected in other
2. **Routing confusion** - System may use old or new version randomly
3. **Maintenance nightmare** - Must update multiple places
4. **User confusion** - Documentation points to different places

### Risk Assessment
- **Critical**: 42 duplicate definitions active
- **High**: Missing handlers cause workflow failures
- **Medium**: Incorrect categorization causes confusion
- **Severe**: No single source of truth

---
*This inventory shows that the migration is technically complete but cleanup was never done, creating a dual-definition crisis.*