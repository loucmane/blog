# Template Folder Structure Proposal

## Executive Summary
Transform monolithic template files (1600+ lines each) into a folder-based structure where each handler, pattern, and behavior lives in its own file. This aligns perfectly with our handler orchestration model.

## Current Problems with Monolithic Files
1. **Size**: REGISTRY.md is 1600+ lines, hard to navigate
2. **Merge Conflicts**: Multiple handlers in one file = conflicts
3. **Discovery**: Must load entire file to find one handler
4. **Maintenance**: Hard to update individual handlers
5. **Testing**: Can't test handlers in isolation
6. **Orchestration**: Dependencies hidden in prose

## Proposed Structure
```
.claude/templates/
├── README.md                    # Overview and navigation
├── REGISTRY.md                  # Lightweight index (not full content)
├── handlers/
│   ├── _template.md            # Handler template for consistency
│   ├── development/
│   │   ├── start-new-work.md
│   │   ├── create-component.md
│   │   └── refactor-code.md
│   ├── git/
│   │   ├── commit-changes.md
│   │   ├── gac.md
│   │   └── create-branch.md
│   ├── search/
│   │   ├── find-symbol.md
│   │   └── search-code.md
│   └── ...
├── patterns/
│   ├── tool-selection.md
│   ├── work-activity.md
│   └── ...
├── behaviors/
│   ├── file-operations.md
│   ├── work-tracking.md
│   └── ...
├── conventions/
│   ├── naming.md
│   ├── git-format.md
│   └── ...
└── matrices/
    ├── request-to-handler.md
    └── error-recovery.md
```

## Handler File Format
Each handler file would contain:

```markdown
---
id: edit-file
category: file-operations
triggers: ["change X to Y", "update Z", "modify file"]
keywords: [edit, change, update, modify, fix]
orchestrates:
  - behaviors/file-operations
  - conventions/file-editing
  - tools/serena-edit
  - patterns/evidence-gathering
version: 2.0
---

# Handler: edit-file

## Purpose
Orchestrate safe file editing with full convention compliance

## Orchestration Flow
```yaml
1. Check Behaviors:
   - file-operations.md#before-edit
   - Evidence: "behavior:checked"

2. Load Conventions:
   - file-editing.md#special-files
   - Evidence: "convention:loaded"

3. Execute Edit:
   - Use appropriate tool (Edit/MultiEdit)
   - Evidence: "edit:completed"
```

## Process
[Full process steps here]

## Success Criteria
- File conventions checked
- Appropriate tool selected
- Edit completed successfully
- Evidence trail created
```

## Benefits

### 1. Perfect for Orchestration Model
- Each handler explicitly lists what it orchestrates
- Dependencies are machine-readable (in frontmatter)
- Can generate orchestration diagrams automatically
- Evidence requirements clear and testable

### 2. Better Performance
- Load only what you need (one 50-line file vs 1600-line file)
- Serena caching works better with smaller files
- Parallel loading of orchestrated templates

### 3. Improved Maintainability
- Update handlers independently
- Version handlers separately
- Add handler-specific docs/examples
- Easier PR reviews (change 1 file, not monolith)

### 4. Enhanced Discovery
- `find_file "*.md" handlers/` finds all handlers
- Category folders for logical grouping
- Frontmatter enables rich queries
- REGISTRY.md becomes fast index

### 5. Testing & Validation
- Test individual handlers
- Validate orchestration flows
- Check for broken references
- Ensure evidence completeness

## Migration Strategy

### Phase 1: Pilot (1 day)
1. Create folder structure
2. Migrate 3 pilot handlers (edit-file, gac, create-component)
3. Update REGISTRY.md to point to files
4. Test discovery and loading

### Phase 2: Core Handlers (2 days)
1. Migrate high-use handlers first
2. Update CLAUDE.md references
3. Create migration script for remaining handlers
4. Validate all orchestration flows

### Phase 3: Complete Migration (1 day)
1. Migrate all remaining handlers
2. Archive monolithic files
3. Update all documentation
4. Performance testing

### Phase 4: Enhancements
1. Add handler validation tool
2. Create orchestration visualizer
3. Build handler test framework
4. Add handler generator

## Technical Considerations

### 1. Discovery Changes
```python
# Old way
search_pattern("edit-file", ".claude/templates/TOOLS.md")

# New way
find_file("edit-file.md", ".claude/templates/handlers/")
# OR
search_pattern("id: edit-file", ".claude/templates/handlers/")
```

### 2. Reference Updates
- Change `[edit-file](TOOLS.md#edit-file)`
- To: `[edit-file](handlers/file-operations/edit-file.md)`

### 3. Anchor Alternatives
- Use file paths as unique identifiers
- Or keep anchors: `handlers/edit-file.md#process`

### 4. Backwards Compatibility
- Keep redirect mapping in REGISTRY.md
- Gradual migration with both systems active
- Update references incrementally

## Decision Points

1. **Folder Depth**: Deep categories or flat structure?
2. **Naming Convention**: `edit-file.md` or `edit-file-handler.md`?
3. **Frontmatter Standard**: YAML, JSON, or TOML?
4. **Cross-References**: Relative or absolute paths?
5. **Version Control**: In frontmatter or filename?

## Risks & Mitigation

### Risk 1: Broken References
- **Mitigation**: Migration script validates all references
- **Mitigation**: Keep old structure during transition

### Risk 2: Discovery Complexity
- **Mitigation**: Enhanced REGISTRY.md with clear index
- **Mitigation**: Consistent file naming convention

### Risk 3: Performance Regression
- **Mitigation**: Benchmark before/after
- **Mitigation**: Serena caching optimization

## Recommendation

**Proceed with folder structure** because:

1. **Aligns with Orchestration**: Makes handler dependencies explicit
2. **Scales Better**: 69+ handlers need organization
3. **Enables Innovation**: Testing, validation, generation
4. **Improves DX**: Easier to find, read, update handlers
5. **Future-Proof**: Can grow without monolithic burden

The folder structure isn't just organization—it's an architectural improvement that makes our orchestration model concrete and enforceable.

## Next Steps

1. Review and discuss this proposal
2. Decide on technical details (naming, frontmatter, etc.)
3. Create pilot implementation with 3 handlers
4. Test discovery, loading, and orchestration
5. Plan full migration if pilot succeeds