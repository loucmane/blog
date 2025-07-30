# Handler Migration Mapping

This file tracks the migration of handlers from monolithic template files to the new folder-based structure.

## Migration Log

### 2025-01-30 - TOOLS.md Migration

**Migration Summary**:
- **Source File**: `.claude/templates/TOOLS.md`
- **Total Handlers**: 17
- **All Type**: triggers (100%)
- **Target**: `.claude/staging/handlers/`

#### Search Domain (4 handlers)
- **search-code**: TOOLS.md#search-code → staging/handlers/triggers/search/search-code.md ✅
- **find-symbol**: TOOLS.md#find-symbol → staging/handlers/triggers/search/find-symbol.md ✅
- **find-references**: TOOLS.md#find-references → staging/handlers/triggers/search/find-references.md ✅
- **grep-pattern**: TOOLS.md#grep-pattern → staging/handlers/triggers/search/grep-pattern.md ✅

#### File Domain (4 handlers)
- **read-file**: TOOLS.md#read-file → staging/handlers/triggers/file/read-file.md ✅
- **edit-file**: TOOLS.md#edit-file → staging/handlers/triggers/file/edit-file.md ✅
- **create-file**: TOOLS.md#create-file → staging/handlers/triggers/file/create-file.md ✅
- **delete-file**: TOOLS.md#delete-file → staging/handlers/triggers/file/delete-file.md ✅

#### Git Domain (4 handlers)
- **check-status**: TOOLS.md#check-status → staging/handlers/triggers/git/check-status.md ✅
- **commit-changes**: TOOLS.md#commit-changes → staging/handlers/triggers/git/commit-changes.md ✅
- **create-branch**: TOOLS.md#create-branch → staging/handlers/triggers/git/create-branch.md ✅
- **view-history**: TOOLS.md#view-history → staging/handlers/triggers/git/view-history.md ✅

#### Analysis Domain (3 handlers)
- **analyze-code**: TOOLS.md#analyze-code → staging/handlers/triggers/analysis/analyze-code.md ✅
- **check-dependencies**: TOOLS.md#check-dependencies → staging/handlers/triggers/analysis/check-dependencies.md ✅
- **measure-complexity**: TOOLS.md#measure-complexity → staging/handlers/triggers/analysis/measure-complexity.md ✅

#### External Domain (3 handlers)
- **run-tests**: TOOLS.md#run-tests → staging/handlers/triggers/external/run-tests.md ✅
- **check-lint**: TOOLS.md#check-lint → staging/handlers/triggers/external/check-lint.md ✅
- **build-project**: TOOLS.md#build-project → staging/handlers/triggers/external/build-project.md ✅

### 2025-01-29

#### start-new-work
- **Original Location**: WORKFLOWS.md#start-new-work (line 2006)
- **New Location**: handlers/triggers/development/start-new-work.md
- **Type**: trigger (responds to user requests)
- **Domain**: development (work initialization)
- **Dependencies**: standard-dev-workflow
- **Tools**: Write, TodoWrite, MultiEdit
- **Status**: ✅ Migrated

## Mapping Reference

| Handler ID | Original File | Original Anchor | New Path | Type | Domain |
|------------|---------------|-----------------|----------|------|---------|
| search-code | TOOLS.md | #search-code | staging/handlers/triggers/search/search-code.md | trigger | search |
| find-symbol | TOOLS.md | #find-symbol | staging/handlers/triggers/search/find-symbol.md | trigger | search |
| find-references | TOOLS.md | #find-references | staging/handlers/triggers/search/find-references.md | trigger | search |
| grep-pattern | TOOLS.md | #grep-pattern | staging/handlers/triggers/search/grep-pattern.md | trigger | search |
| read-file | TOOLS.md | #read-file | staging/handlers/triggers/file/read-file.md | trigger | file |
| edit-file | TOOLS.md | #edit-file | staging/handlers/triggers/file/edit-file.md | trigger | file |
| create-file | TOOLS.md | #create-file | staging/handlers/triggers/file/create-file.md | trigger | file |
| delete-file | TOOLS.md | #delete-file | staging/handlers/triggers/file/delete-file.md | trigger | file |
| check-status | TOOLS.md | #check-status | staging/handlers/triggers/git/check-status.md | trigger | git |
| commit-changes | TOOLS.md | #commit-changes | staging/handlers/triggers/git/commit-changes.md | trigger | git |
| create-branch | TOOLS.md | #create-branch | staging/handlers/triggers/git/create-branch.md | trigger | git |
| view-history | TOOLS.md | #view-history | staging/handlers/triggers/git/view-history.md | trigger | git |
| analyze-code | TOOLS.md | #analyze-code | staging/handlers/triggers/analysis/analyze-code.md | trigger | analysis |
| check-dependencies | TOOLS.md | #check-dependencies | staging/handlers/triggers/analysis/check-dependencies.md | trigger | analysis |
| measure-complexity | TOOLS.md | #measure-complexity | staging/handlers/triggers/analysis/measure-complexity.md | trigger | analysis |
| run-tests | TOOLS.md | #run-tests | staging/handlers/triggers/external/run-tests.md | trigger | external |
| check-lint | TOOLS.md | #check-lint | staging/handlers/triggers/external/check-lint.md | trigger | external |
| build-project | TOOLS.md | #build-project | staging/handlers/triggers/external/build-project.md | trigger | external |
| start-new-work | WORKFLOWS.md | #start-new-work | handlers/triggers/development/start-new-work.md | trigger | development |

## Cross-Reference Updates Needed

The following references to migrated handlers need updating:

1. **REGISTRY.md** - Update handler location references
2. **WORKFLOWS.md** - Update internal handler links
3. **CLAUDE.md** - Update example handler paths
4. Any handlers that depend on migrated handlers

## Verification Checklist

For TOOLS.md migration:
- [x] All 17 handlers extracted
- [x] Handler content preserved exactly
- [x] YAML frontmatter includes all metadata
- [x] Handler ID matches filename
- [x] Proper folder placement (all triggers)
- [x] Domain classification correct
- [x] Dependencies identified
- [x] Tools listed
- [x] Trigger phrases captured
- [x] Examples maintained
- [x] Process steps complete