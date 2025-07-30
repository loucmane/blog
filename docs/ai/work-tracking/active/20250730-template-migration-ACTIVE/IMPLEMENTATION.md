# Template Migration Implementation Plan

## Goal
Migrate template system from monolithic files to interaction-based folder structure (triggers/orchestrators/operators).

## Approach

### Phase 1: Infrastructure & Agent Creation ✓
- [x] Create staging directory structure
- [x] Add constraints to agents for safety
- [x] Create migration agents (scanner, migrator, validator, optimizer)
- [x] Create security and version control agents

### Phase 2: Pipeline Testing ✓
- [x] Run template-scanner to map system
- [x] Test migration with TOOLS.md (18 handlers)
- [x] Validate migrated handlers
- [x] Run optimizer for recommendations

### Phase 3: Full Migration (Current)
- [ ] Migrate WORKFLOWS.md handlers (~25)
- [ ] Migrate CONVENTIONS.md handlers (~15)
- [ ] Migrate PATTERNS.md handlers (~8)
- [ ] Migrate BUILDING-BETTER.md handlers (~3)
- [ ] Create 6 missing critical handlers

### Phase 4: Optimization
- [ ] Implement shared pattern files
- [ ] Consolidate redundant code (25-30%)
- [ ] Standardize tool selection keywords
- [ ] Add version metadata to all handlers

### Phase 5: Production Cutover
- [ ] Update CLAUDE.md search paths
- [ ] Update REGISTRY.md references
- [ ] Create cutover and rollback scripts
- [ ] Execute atomic migration
- [ ] Validate in production

## Technical Design

### Folder Structure
```
.claude/templates/handlers/
├── triggers/        # User-initiated entry points
├── orchestrators/   # Coordinate multiple operations
└── operators/       # Single atomic operations
    ├── development/
    ├── git/
    ├── file/
    ├── search/
    ├── testing/
    └── documentation/
```

### Handler Format
```yaml
---
id: handler-name
role: trigger|orchestrator|operator
domain: [development, git, search, etc.]
stability: stable|experimental|deprecated
triggers: ["trigger phrase 1", "trigger phrase 2"]
dependencies: [handler1, handler2]
tools: [Tool1, Tool2]
version: 1.0.0
---

# Handler content...
```

### Migration Pipeline
1. **Scan** - Map dependencies and issues
2. **Extract** - Pull handlers from monolithic files
3. **Transform** - Add metadata and reorganize
4. **Stage** - Place in staging directory
5. **Validate** - Check structure and references
6. **Optimize** - Consolidate patterns
7. **Test** - Integration testing
8. **Activate** - Move to production

## Risk Mitigation
- All work in staging first
- Atomic cutover (all or nothing)
- Instant rollback capability
- Multiple validation gates
- Option for gradual rollout