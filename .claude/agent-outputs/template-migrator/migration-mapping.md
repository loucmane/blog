# Handler Migration Mapping

This file tracks the migration of handlers from monolithic template files to the new folder-based structure.

## Migration Log

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
| start-new-work | WORKFLOWS.md | #start-new-work | handlers/triggers/development/start-new-work.md | trigger | development |

## Cross-Reference Updates Needed

The following references to migrated handlers need updating:

1. **REGISTRY.md** - Update handler location references
2. **WORKFLOWS.md** - Update internal handler links
3. **CLAUDE.md** - Update example handler paths
4. Any handlers that depend on migrated handlers

## Verification Checklist

- [x] Handler content preserved exactly
- [x] YAML frontmatter includes all metadata
- [x] Handler ID matches filename
- [x] Proper folder placement (trigger/orchestrator/operator)
- [x] Domain classification correct
- [x] Dependencies identified
- [x] Tools listed
- [x] Trigger phrases captured
- [x] Examples maintained
- [x] Process steps complete