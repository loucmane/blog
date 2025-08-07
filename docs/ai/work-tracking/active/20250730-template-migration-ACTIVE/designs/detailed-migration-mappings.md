# Detailed Migration Mappings - Template System Modularization

## CLAUDE.md Extraction Map (366 lines → multiple modules)

### From CLAUDE.md → `.claude/templates/engine/`

```
Lines 1-17: → engine/core/execution-engine.md
Lines 9-17: → engine/core/enforcement-check.md  
Lines 19-46: → engine/core/ultrathink-protocol.md
Lines 37-46: → engine/core/pre-ultrathink.md
Lines 48-97: → engine/activation/context-aware.md
Lines 50-56: → engine/activation/mode-detection.md
Lines 58-70: → engine/activation/triggers/explicit.md
Lines 71-80: → engine/activation/triggers/implicit.md
Lines 81-86: → engine/activation/triggers/behavioral.md
Lines 87-91: → engine/activation/triggers/protocol-echo.md
Lines 99-145: → engine/execution/swhe-format.md
Lines 110-120: → engine/execution/handler-validation.md
Lines 122-132: → engine/execution/evidence-based.md
Lines 147-190: → engine/navigation/template-protocol.md
Lines 165-180: → engine/navigation/handler-loading.md
Lines 192-230: → engine/navigation/common-flows.md
Lines 232-280: → engine/structure/template-system.md
Lines 282-295: → engine/enforcement/cannot-proceed.md
Lines 297-310: → engine/enforcement/natural-execution.md
Lines 312-350: → engine/examples/practical.md
Lines 352-366: → engine/fallbacks/error-handling.md
```

### New CLAUDE.md Structure (slim router ~50 lines)
```markdown
# AI Execution Engine

## ⚠️ CRITICAL: THIS IS YOUR OPERATING SYSTEM ⚠️

This file loads the modular execution engine. All components are in `.claude/templates/engine/`

## Core Components
- Execution: `.claude/templates/engine/core/`
- Activation: `.claude/templates/engine/activation/`
- Navigation: `.claude/templates/engine/navigation/`
- Enforcement: `.claude/templates/engine/enforcement/`

[Import all modules via references]
```

## WORKFLOWS.md Extraction Map (2,468 lines → ~500 lines)

### Sections to Extract

```
Lines 1-37: Keep (header + navigation)
Lines 38-114: → shared/patterns/ultrathink.md
Lines 115-167: → workflows/processes/task-management.md
Lines 168-346: → workflows/processes/standard-dev-workflow.md
Lines 347-398: → workflows/processes/work-tracking-org.md
Lines 399-450: → workflows/processes/workflow-improvement.md
Lines 451-650: → workflows/processes/development-patterns.md
Lines 651-850: → workflows/processes/testing-workflow.md
Lines 851-1050: → workflows/processes/debugging-workflow.md
Lines 1051-1250: → workflows/processes/documentation-workflow.md
Lines 1251-1450: → shared/patterns/git-workflow.md
Lines 1451-1650: → shared/patterns/session-management.md
Lines 1651-1850: → workflows/processes/deployment-workflow.md
Lines 1851-2050: → workflows/processes/review-workflow.md
Lines 2051-2250: → workflows/processes/refactoring-workflow.md
Lines 2251-2468: → workflows/processes/integration-workflow.md
```

## CONVENTIONS.md Extraction Map (1,299 lines → ~400 lines)

### Sections to Extract

```
Lines 1-50: Keep (header + overview)
Lines 51-200: → conventions/git/commit-format.md
Lines 201-350: → conventions/git/branch-naming.md
Lines 351-500: → conventions/files/naming-standards.md
Lines 501-650: → conventions/files/structure.md
Lines 651-800: → conventions/code/style-guide.md
Lines 801-950: → conventions/code/documentation.md
Lines 951-1100: → conventions/work/tracking-format.md
Lines 1101-1299: → conventions/work/session-format.md
```

## REGISTRY.md Extraction Map (637 lines → ~200 lines)

### Sections to Extract

```
Lines 1-50: → registry/index.md (keep as slim entry)
Lines 51-200: → registry/handlers/triggers-registry.md
Lines 201-350: → registry/handlers/orchestrators-registry.md
Lines 351-500: → registry/handlers/operators-registry.md
Lines 501-637: → registry/navigation/keywords.md
```

## TOOLS.md Extraction Map (981 lines → ~300 lines)

### Sections to Extract

```
Lines 1-50: Keep (overview)
Lines 51-250: → tools/search/serena-guide.md
Lines 251-450: → tools/search/grep-patterns.md
Lines 451-650: → tools/file/edit-strategies.md
Lines 651-750: → tools/file/multi-edit.md
Lines 751-850: → tools/git/commands.md
Lines 851-950: → tools/task/agent-usage.md
Lines 951-981: → tools/selection-matrix.md
```

## BEHAVIORS.md Extraction Map (442 lines → modular behaviors/)

### Sections to Extract

```
Lines 1-50: → behaviors/index.md
Lines 51-100: → behaviors/file-operations/before-edit.md
Lines 101-150: → behaviors/file-operations/before-create.md
Lines 151-200: → behaviors/timestamps/before-adding.md
Lines 201-250: → behaviors/git/before-commit.md
Lines 251-300: → behaviors/work-tracking/update-tracker.md
Lines 301-350: → behaviors/validation/evidence-claims.md
Lines 351-400: → behaviors/task-management/todo-write.md
Lines 401-442: → behaviors/session/compaction-detection.md
```

## MATRICES.md Extraction Map (200 lines → matrices/)

### Sections to Extract

```
Lines 1-25: → matrices/index.md
Lines 26-50: → matrices/routing/request-to-handler.md
Lines 51-75: → matrices/routing/context-to-mode.md
Lines 76-100: → matrices/selection/tool-selection.md
Lines 101-125: → matrices/selection/file-to-convention.md
Lines 126-150: → matrices/recovery/error-to-recovery.md
Lines 151-175: → matrices/mapping/trigger-to-action.md
Lines 176-200: → matrices/mapping/keyword-to-handler.md
```

## USER-GUIDE.md Extraction Map (933 lines → guides/)

### Sections to Extract

```
Lines 1-100: → guides/quickstart/getting-started.md
Lines 101-300: → guides/quickstart/first-request.md
Lines 301-500: → guides/workflows/development-flow.md
Lines 501-700: → guides/reference/trigger-phrases.md
Lines 701-850: → guides/reference/swhe-format.md
Lines 851-933: → guides/troubleshooting/common-issues.md
```

## PATTERNS.md Extraction Map (235 lines → patterns/meta/)

### Sections to Extract

```
Lines 1-50: → patterns/meta/index.md
Lines 51-100: → patterns/meta/work-activity.md
Lines 101-150: → patterns/meta/tool-selection.md
Lines 151-200: → patterns/meta/evidence-check.md
Lines 201-235: → patterns/meta/ambiguous-request.md
```

## BUILDING-BETTER.md Extraction Map (452 lines → integration/)

### Sections to Extract

```
Lines 1-100: → integration/overview.md
Lines 101-200: → integration/handler-creation.md
Lines 201-300: → integration/system-connections.md
Lines 301-400: → integration/cross-system.md
Lines 401-452: → integration/improvements.md
```

## Shared Patterns to Create

### `.claude/shared/patterns/`

1. **ultrathink.md** - Consolidate from 5 sources
2. **work-tracking.md** - Consolidate from 13 sources
3. **git-conventions.md** - Consolidate from 12 sources
4. **session-format.md** - Consolidate from 8 sources
5. **handler-template.md** - Standard handler format
6. **yaml-frontmatter.md** - YAML standards
7. **search-commands.md** - Common search patterns
8. **validation-checks.md** - Common validations

## Files to Delete

1. **HANDLERS.md** - 199 lines (obsolete)
2. **REGISTRY-REFINED.md** - 590 lines (duplicate)
3. **All .backup files** - Move to version control

## Cross-Reference Updates Required

### In CLAUDE.md
- Update `.claude/templates/PATTERNS.md#execute-ultrathink` → `.claude/templates/engine/core/ultrathink-protocol.md`
- Update all template references to new paths

### In all template files
- Replace `#handler-name` anchors with `handlers/role/domain/handler.md`
- Update relative paths to absolute where needed
- Fix all import statements

## Testing Requirements

### After each phase
1. Test handler discovery still works
2. Test ULTRATHINK protocol execution
3. Test work tracking creation
4. Test git operations
5. Test tool selection
6. Verify no broken references

## Success Metrics

- ✅ All functionality preserved
- ✅ 40% reduction in total lines
- ✅ No duplicate patterns remain
- ✅ All cross-references work
- ✅ Clean folder structure achieved
- ✅ Each file has single responsibility

---
*Mapping Created: 2025-08-04*
*Ready for Execution: Yes*