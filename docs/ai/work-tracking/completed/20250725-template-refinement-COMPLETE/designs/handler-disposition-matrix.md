# Handler Disposition Matrix

## Decision Framework

### Keep As-Is ✅
Handler follows conventions and serves unique purpose

### Rename 🔄
Handler function is good but name doesn't follow conventions

### Consolidate 🔀
Multiple handlers serve same purpose - merge them

### Remove ❌
Handler is redundant or obsolete

### Add New ➕
Missing functionality that needs a handler

## Current Handler Analysis

### WORKFLOWS.md Handlers

| Current Handler | Decision | New Name | Rationale |
|----------------|----------|----------|-----------|
| `start-new-work` | 🔄 Rename | `start-work` | Remove 'new' for consistency |
| `continue-work` | ✅ Keep | `continue-work` | Follows convention |
| `standard-dev-workflow` | ✅ Keep | - | Section, not handler |
| `create-component` | 🔄 Rename | `create-module` | Broaden scope |
| `refactor-code` | ✅ Keep | - | Clear and follows pattern |
| `implement-feature` | ❌ Remove | - | Redundant with start-work |
| `create-work-folder` | ✅ Keep | - | Specific workflow step |
| `fix-problem` | 🔄 Rename | `fix-bug` | More specific, fix anchor |
| `debug` | 🔄 Rename | `debug-error` | Add noun for clarity |
| `test-implementation` | ❌ Remove | - | Use create-test-checkpoint |
| `analyze-error` | 🔀 Consolidate | → `debug-error` | Same as debug |
| `root-cause-analysis` | 🔀 Consolidate | → `debug-error` | Same as debug |
| `session-end` | 🔄 Rename | `end-session` | Verb-first |
| `show-capabilities` | ✅ Keep | - | Follows pattern |
| `check-progress` | ✅ Keep | - | Follows pattern |
| `update-tracker` | ✅ Keep | - | Follows pattern |
| `create-todos` | ✅ Keep | - | Follows pattern |
| `orchestrate-task` | ❌ Remove | - | Covered in sections |
| `create-test-checkpoint` | ✅ Keep | - | Unique purpose |
| `sequential-processing` | ❌ Remove | - | Section, not handler |
| `create-commit-message` | ❌ Remove | - | Use gac convention |
| `create-pr` | ➕ Add | `create-pull-request` | Needed functionality |
| `tag-release` | ➕ Add | `create-release` | Needed functionality |

### Missing Handlers to Add

| Handler Name | Purpose | Location |
|--------------|---------|----------|
| `create-pull-request` | PR creation workflow | WORKFLOWS.md |
| `create-release` | Version tagging workflow | WORKFLOWS.md |
| `validate-code` | Pre-commit validation | WORKFLOWS.md |

### Consolidation Groups

#### Debug/Error Group
- `debug` → `debug-error`
- `analyze-error` → `debug-error`  
- `root-cause-analysis` → `debug-error`
- `emergency-debug` → `debug-error`
- Keep only `bug-fix-template` separate (different workflow)

#### Work Start Group  
- `implement-feature` → `start-work`
- `start-new-work` → `start-work`
- Single entry point for new work

## Implementation Priority

### Phase 1: Critical Fixes
1. Fix anchor mismatches (fix-problem → bug-fix-template)
2. Consolidate debug handlers
3. Rename create-component → create-module

### Phase 2: Add Missing
1. Add create-pull-request handler
2. Add create-release handler
3. Document gac as commit handler

### Phase 3: Clean Up
1. Remove redundant handlers
2. Update all references
3. Clean registry

## Summary Statistics
- **Total Handlers Reviewed**: 23
- **Keep As-Is**: 10 (43%)
- **Rename**: 6 (26%)
- **Remove/Consolidate**: 7 (30%)
- **Add New**: 3

## Expected Outcome
- Reduced handler count: 23 → ~19
- Improved naming consistency: 100%
- No broken anchors: 0
- Clear purpose for each handler