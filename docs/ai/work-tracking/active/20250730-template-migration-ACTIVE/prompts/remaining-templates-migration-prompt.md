# Remaining Template Files Migration - Phase 14-17

## Mission Overview
Complete the modularization of the 4 remaining monolithic template files. Each file contains a mix of handlers (already migrated) and other content that needs to be extracted into appropriate modular structures.

## CRITICAL CONTEXT
- **Handlers are already migrated** to `.claude/templates/handlers/`
- **Do NOT re-migrate handlers** - they're already done
- **Focus on non-handler content** - workflows, conventions, patterns, guides
- **Use existing shared libraries** when you find duplicate content
- **All modules go under** `.claude/templates/` NOT `.claude/`

## Files to Process

### 1. WORKFLOWS.md (2,943 lines)
**Current State**: Handlers migrated, but contains extensive workflow documentation
**Target Structure**: `.claude/templates/workflows/`

**Content to Extract**:
- ULTRATHINK System documentation (lines 38-135) → Check if duplicates shared/patterns/ultrathink-format.md
- Universal Flight Protocol (lines ~200-300) → workflows/protocols/flight-protocol.md
- Task Management patterns → workflows/patterns/task-management.md
- Session Management lifecycle → workflows/session/
- Memory Management patterns → workflows/memory/
- Evidence-Based Analysis → workflows/analysis/
- Testing Workflows → workflows/testing/
- Behavioral Templates → workflows/templates/
- Common Mistakes section → workflows/guides/common-mistakes.md

**Final State**: Slim index file (~50 lines) with imports to modular components

### 2. CONVENTIONS.md (estimated ~1,500 lines)
**Current State**: Mix of handlers and convention documentation
**Target Structure**: `.claude/templates/conventions/`

**Content to Extract**:
- Naming conventions → conventions/naming/
- File organization rules → conventions/files/
- Git conventions → conventions/git/
- Code style guides → conventions/code-style/
- Documentation standards → conventions/docs/
- Testing conventions → conventions/testing/
- Work tracking conventions → conventions/work-tracking/
- Timestamp formats → conventions/timestamps/

**Final State**: Convention index with category navigation

### 3. PATTERNS.md (estimated ~1,200 lines)
**Current State**: Meta-routing patterns and handlers
**Target Structure**: `.claude/templates/patterns/`

**Content to Extract**:
- Meta-routing patterns → patterns/routing/
- Request analysis patterns → patterns/analysis/
- Handler selection patterns → patterns/selection/
- Evidence patterns → patterns/evidence/
- Work tracking patterns → patterns/work-tracking/
- Session patterns → patterns/session/
- Tool selection patterns → Check against shared/tools/tool-selection-matrix.md

**Final State**: Pattern library index

### 4. BUILDING-BETTER.md (estimated ~800 lines)
**Current State**: Integration and extension documentation
**Target Structure**: `.claude/templates/integration/`

**Content to Extract**:
- Handler creation guide → integration/guides/creating-handlers.md
- Template extension guide → integration/guides/extending-templates.md
- Cross-system integration → integration/cross-system/
- Workflow composition → integration/composition/
- Best practices → integration/best-practices/
- System architecture → integration/architecture/

**Final State**: Integration guide index

## Extraction Process for Each File

### Step 1: Analyze Current State
1. Read the entire file
2. Identify all sections and their line numbers
3. Categorize content:
   - Already migrated handlers (skip these)
   - Unique content to extract
   - Duplicate content that references shared libraries
   - Obsolete content to remove

### Step 2: Create Module Structure
1. Create appropriate directory structure under `.claude/templates/`
2. Follow the module format:
```yaml
---
id: module-name
type: workflow-component | convention | pattern | integration
category: specific-category
dependencies:
  - list of dependencies
related:
  - related modules
version: 1.0.0
---

# Module Title

[Content]
```

### Step 3: Extract Content
1. Extract each identified section to its appropriate module
2. Preserve all formatting and examples
3. Update any internal references to use new paths
4. Add cross-references between related modules

### Step 4: Create Index File
1. Replace original file with slim index (~50-100 lines)
2. Include:
   - Brief description of the file's purpose
   - Module directory structure
   - Navigation links to all modules
   - Import statements for critical components

### Step 5: Validate Migration
1. Ensure no content was lost
2. Verify all cross-references work
3. Check that no handlers were re-duplicated
4. Confirm all paths use `.claude/templates/`

## Special Considerations

### Deduplication Check
Before creating any new module, check if similar content exists in:
- `.claude/templates/shared/patterns/ultrathink-format.md`
- `.claude/templates/shared/tools/tool-selection-matrix.md`
- Already migrated modules in engine/, behaviors/, matrices/, etc.

If duplicate found, reference the shared module instead of creating a new one.

### Handler References
When you encounter handler definitions in these files:
1. **DO NOT migrate them** - they're already in handlers/
2. **DO NOT delete them yet** - we're keeping as backup
3. **DO add a note** like: `[Handler migrated to: handlers/role/domain/handler-name.md]`

### Path Consistency
- All new modules go under `.claude/templates/[category]/`
- Never create modules directly under `.claude/`
- Use relative paths for cross-references within templates/

## Deliverables

### For Each File Create:
1. **Migration Report**: `migration-report-[filename]-20250808.md`
   - Sections identified and extracted
   - Line number mappings
   - Modules created
   - Deduplication performed
   - Any issues encountered

2. **Module Structure**: Properly organized modules under `.claude/templates/`

3. **Updated Index File**: Slim version of original file with module imports

### Final Summary Report:
Create: `docs/ai/work-tracking/active/20250730-template-migration-ACTIVE/reports/phase14-17-migration-complete.md`

Include:
- Total modules created per file
- Total lines reduced per file
- Deduplication statistics
- Cross-reference updates made
- Any remaining issues
- Ready for validation status

## Success Criteria

Migration is complete when:
1. All 4 files have been modularized
2. Each file reduced to <100 line index
3. All non-handler content properly extracted
4. No duplicate modules created
5. All cross-references updated
6. Zero content loss
7. Module structure follows conventions
8. All paths use `.claude/templates/`

## Order of Operations

1. Start with WORKFLOWS.md (largest, most complex)
2. Then CONVENTIONS.md (systematic structure)
3. Then PATTERNS.md (may reference workflows/conventions)
4. Finally BUILDING-BETTER.md (integration of all above)

This ensures dependencies are resolved in the correct order.

## Important Notes

- **DO NOT delete old handler definitions** - they're intentional backups
- **DO NOT re-migrate handlers** - they're already done
- **DO check for duplicates** before creating new shared patterns
- **DO preserve all examples and code blocks** exactly as they are
- **DO maintain markdown formatting** and structure
- **DO update the TRACKER.md** after completing each file

Remember: The goal is to complete the modularization so we can then validate everything works before final cleanup.