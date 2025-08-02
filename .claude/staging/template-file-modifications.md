# Template File Modifications for Migration

## Overview
After moving handlers to the new folder structure, the original template files need to be updated to redirect to the new locations.

## WORKFLOWS.md Modifications

Add at the top of the file after the header:
```markdown
# Workflows

> ⚠️ **HANDLERS MIGRATED**: All handlers from this file have been migrated to the new folder-based structure.
> 
> Handlers are now located in:
> - `.claude/templates/handlers/triggers/` - User-facing entry points
> - `.claude/templates/handlers/orchestrators/` - Complex workflows
> - `.claude/templates/handlers/operators/` - Atomic operations
>
> To find a specific handler, use:
> ```
> mcp__serena__search_for_pattern --substring_pattern "id: handler-name" --relative_path ".claude/templates/handlers/"
> ```

[Original content preserved below for reference]

---
```

## CONVENTIONS.md Modifications

Add at the top of the file:
```markdown
# Conventions

> ⚠️ **HANDLERS MIGRATED**: All handlers from this file have been migrated to the new folder-based structure.
>
> Convention-related handlers are now in:
> - `.claude/templates/handlers/operators/development/` - Code style and naming handlers
> - `.claude/templates/handlers/operators/git/` - Git convention handlers
> - `.claude/templates/handlers/operators/docs/` - Documentation handlers
> - `.claude/templates/handlers/orchestrators/` - Convention enforcement handlers

[Original content preserved below for reference]

---
```

## PATTERNS.md Modifications

Add at the top of the file:
```markdown
# Patterns

> ⚠️ **HANDLERS MIGRATED**: All handlers from this file have been migrated to the new folder-based structure.
>
> Pattern handlers are now in:
> - `.claude/templates/handlers/orchestrators/` - Most pattern handlers (routing, meta-patterns)
> - `.claude/templates/handlers/operators/external/` - External operation patterns

[Original content preserved below for reference]

---
```

## BUILDING-BETTER.md Modifications

Add at the top of the file:
```markdown
# Building Better

> ⚠️ **HANDLERS MIGRATED**: All handlers from this file have been migrated to the new folder-based structure.
>
> Integration and extension handlers are now distributed across appropriate domains in:
> - `.claude/templates/handlers/triggers/`
> - `.claude/templates/handlers/operators/`

[Original content preserved below for reference]

---
```

## Additional Files to Update

### TOOLS.md
While TOOLS.md handlers were test migrated earlier, ensure it has the migration notice if handlers were moved.

### BEHAVIORS.md
Update any references to handlers in the behavior enforcement sections to point to new locations.

### MATRICES.md
Update any handler references in decision matrices to use new paths.

## Important Notes

1. **Preserve Original Content**: Keep all original content below the migration notices for reference
2. **Don't Delete Files**: These files contain valuable documentation beyond just handlers
3. **Update Cross-References**: Any references to handlers within the documentation should be updated
4. **Test Discovery**: After modifications, test that handler discovery still works

## Post-Modification Checklist

- [ ] WORKFLOWS.md has migration notice
- [ ] CONVENTIONS.md has migration notice
- [ ] PATTERNS.md has migration notice
- [ ] BUILDING-BETTER.md has migration notice
- [ ] Cross-references updated in all files
- [ ] Original content preserved
- [ ] Handler discovery tested