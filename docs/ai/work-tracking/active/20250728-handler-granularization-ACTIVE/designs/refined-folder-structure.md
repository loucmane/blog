# Refined Folder Structure Design

## Executive Summary
After 15 sequential thoughts, the optimal structure organizes handlers by their **interaction pattern** rather than domain, with rich metadata for cross-cutting concerns.

## Core Structure

```
.claude/templates/
├── handlers/
│   ├── triggers/          # User-initiated entry points
│   │   ├── start-new-work.md
│   │   ├── fix-bug.md
│   │   └── create-component.md
│   ├── orchestrators/     # Coordinate multiple operations
│   │   ├── refactor-code.md
│   │   ├── deploy-feature.md
│   │   └── debug-issue.md
│   └── operators/         # Single atomic operations
│       ├── edit-file.md
│       ├── find-symbol.md
│       └── commit-changes.md
├── patterns/              # Request routing patterns
├── behaviors/             # Automatic enforcement
├── conventions/           # Standards and rules
└── REGISTRY.md           # Master index with metadata
```

## Key Design Decisions

### 1. Interaction-Based Organization
- **triggers/**: Handlers directly triggered by users
- **orchestrators/**: Handlers that coordinate other handlers
- **operators/**: Handlers that perform single operations

This reflects the actual flow of execution and our orchestration model.

### 2. Rich Frontmatter Metadata

```yaml
---
id: edit-file
role: operator
stability: stable
domain: [file, development]
triggers: ["edit X", "change Y", "modify Z"]
orchestrates:
  required:
    - behaviors/file-operations
    - conventions/file-editing
  optional:
    - patterns/evidence-gathering
dependencies: [read-file, validate-path]
version: 2.0
---
```

### 3. Flat Handler Structure
- No deep subdirectories within handler types
- Domain organization via tags, not folders
- Simplifies paths and discovery

### 4. Handler ID Independence
- Handler IDs remain simple: `H:edit-file`
- Not `H:operators/edit-file` 
- Folder structure doesn't leak into execution

### 5. Consistent Across All Templates
```
templates/
├── handlers/
│   ├── triggers/
│   ├── orchestrators/
│   └── operators/
├── patterns/
│   ├── routing/
│   └── validation/
├── behaviors/
│   ├── enforcement/
│   └── automation/
└── conventions/
    ├── code/
    └── process/
```

## Benefits of This Structure

### 1. Clear Execution Flow
- See at a glance what triggers what
- Understand orchestration relationships
- Natural hierarchy from triggers → orchestrators → operators

### 2. Supports Orchestration Model
- Orchestrators explicitly coordinate
- Operators are composed by orchestrators
- Dependencies are clear

### 3. Flexible Discovery
- Physical location for browsing
- Metadata tags for cross-cutting searches
- Both human and machine friendly

### 4. Gradual Migration
- Can start with just handlers/
- Add patterns/, behaviors/ later
- Backward compatibility via REGISTRY.md

## Handler Lifecycle Example

```
User: "refactor this component"
    ↓
triggers/refactor-component.md (entry point)
    ↓
orchestrators/refactor-code.md (coordinates)
    ├── operators/analyze-code.md
    ├── operators/find-references.md
    ├── operators/edit-file.md
    └── operators/run-tests.md
```

## Metadata Schema

### Required Fields
- `id`: Unique handler identifier
- `role`: trigger | orchestrator | operator
- `triggers`: User phrases that activate this

### Optional Fields
- `stability`: stable | beta | experimental
- `domain`: Array of domain tags
- `orchestrates`: Templates this handler uses
- `dependencies`: Other handlers this needs
- `version`: Semantic version
- `deprecated`: Migration instructions

## Discovery Patterns

### For Humans
1. Browse by role (triggers/orchestrators/operators)
2. Use domain tags to find related handlers
3. Follow orchestration paths

### For Serena
1. Search by ID: `find_file "edit-file.md"`
2. Search by trigger: `search_pattern "triggers:.*edit"`
3. Search by domain: `search_pattern "domain:.*git"`

## Migration Strategy

### Phase 1: Structure Only
1. Create folder structure
2. Move handlers maintaining current content
3. Update REGISTRY.md with locations

### Phase 2: Add Metadata
1. Add frontmatter to each handler
2. Validate orchestration declarations
3. Build dependency graph

### Phase 3: Enhance Content
1. Standardize handler format
2. Add orchestration blocks
3. Include examples

### Phase 4: Full System
1. Migrate patterns, behaviors, conventions
2. Update CLAUDE.md references
3. Deprecate monolithic files

## Alternative Considerations

### Why Not Domain-Based?
- Cross-domain handlers are common
- Domains are subjective
- Doesn't reflect execution flow

### Why Not Flat?
- Loses organizational benefits
- 69+ files in one directory
- No semantic grouping

### Why Not Atomic-Based?
- Too granular
- Loses user mental model
- Over-emphasizes implementation

## Open Questions

1. **Naming Convention**: 
   - `edit-file.md` or `edit-file-handler.md`?
   - Decision: Keep it simple with `.md`

2. **Cross-References**:
   - Use handler IDs or file paths?
   - Decision: IDs in metadata, paths optional

3. **Versioning**:
   - In filename or frontmatter?
   - Decision: Frontmatter only

4. **Testing**:
   - Separate test files or inline?
   - Decision: Inline examples, separate test suite

## Success Metrics

1. **Discoverability**: Can find any handler in <3 seconds
2. **Maintainability**: PRs touch only relevant files
3. **Clarity**: New users understand structure immediately
4. **Performance**: Faster loading of individual handlers
5. **Orchestration**: Dependencies are explicit and validated

## Conclusion

This refined structure optimizes for:
- **Execution flow** (triggers → orchestrators → operators)
- **Orchestration model** (explicit coordination)
- **Human understanding** (clear roles)
- **Machine discovery** (rich metadata)

It's a fundamental rethinking that aligns structure with function.