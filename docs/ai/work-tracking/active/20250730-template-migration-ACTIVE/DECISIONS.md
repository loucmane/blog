# Template Migration Decisions

## Major Decisions

### 1. Staging-First Approach
**Decision**: All migration work happens in `.claude/staging/` first
**Rationale**: 
- Zero risk to production templates
- Can validate and test thoroughly
- Easy rollback if issues found
**Alternative Considered**: Direct migration
**Why Rejected**: Too risky, no safety net

### 2. Interaction-Based Organization
**Decision**: Organize handlers by role (triggers/orchestrators/operators)
**Rationale**:
- Matches mental model of handler relationships
- Clear hierarchy and dependencies
- Easier to understand system flow
**Alternative Considered**: Domain-based (git/, file/, search/)
**Why Rejected**: Cross-domain handlers awkward, less intuitive

### 3. Rich YAML Frontmatter
**Decision**: Every handler gets comprehensive metadata
**Rationale**:
- Enables programmatic discovery
- Supports future tooling
- Documents handler capabilities
**Format Chosen**:
```yaml
id: handler-name
role: trigger|orchestrator|operator
domain: [primary, secondary]
stability: stable|experimental|deprecated
triggers: ["phrase1", "phrase2"]
dependencies: [handler1, handler2]
tools: [Tool1, Tool2]
version: 1.0.0
```

### 4. Multi-Agent Pipeline
**Decision**: Use specialized agents in sequence
**Rationale**:
- Each agent does one thing well
- Clear separation of concerns
- Easier to debug and improve
**Pipeline**: Scanner → Migrator → Validator → Optimizer → Tester

### 5. Explicit Agent Constraints
**Decision**: Add constraints section to every agent
**Rationale**:
- Prevents accidental production changes
- Makes behavior predictable
- Builds trust in automation
**Categories**: Scope, Safety, Output, Validation, Communication

### 6. Atomic Cutover
**Decision**: Migration must be all-or-nothing
**Rationale**:
- CLAUDE.md expects consistent structure
- Partial migration breaks discovery
- Clean rollback possible
**Implementation**: Shell scripts for cutover/rollback

### 7. Create Missing Handlers
**Decision**: Add 6 missing critical handlers during migration
**Rationale**:
- Scanner identified gaps
- High-frequency user requests
- Better to add during restructure
**Handlers**: fix-bug, debug-issue, explain-code, code-review, optimize-code, create-docs

### 8. Shared Pattern Extraction
**Decision**: Create shared pattern files for common code
**Rationale**:
- 40% redundancy identified
- 25-30% size reduction possible
- Easier maintenance
**Patterns**: serena-usage, tool-selection, error-handling

## Future Considerations

### Gradual Rollout Option
**Reserved Decision**: Could run both systems in parallel
**When to Consider**: If atomic cutover proves too risky
**Implementation**: CLAUDE.md checks both locations

### Dependencies Field
**Pending Decision**: Use it or remove it
**Current State**: All handlers have empty array
**Options**: 
1. Populate with handler dependencies
2. Remove from frontmatter
3. Repurpose for something else

### Handler Versioning
**Pending Decision**: How to handle handler evolution
**Considerations**:
- Semantic versioning in frontmatter
- Compatibility tracking
- Deprecation timeline