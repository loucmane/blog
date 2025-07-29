# Handler Orchestration Design - From Doers to Conductors

## Executive Summary
Transform handlers from "things that do work" to "orchestrators that conduct templates". Not making handlers atomic, but making them well-connected and smart about using ALL template files.

## Current State Analysis

### The Problem
1. **Monolithic Control**: CLAUDE.md describes templates but doesn't enforce their usage
2. **Over-broad Handlers**: Each doing 4-6 operations internally
3. **Template Isolation**: Files exist but work independently
4. **Underutilization**: Several templates rarely or never used
5. **No Enforcement**: System describes but doesn't require

### Evidence
- `start-new-work`: Does 6 operations itself instead of orchestrating
- `PATTERNS.md`: Only for ambiguous requests 
- `MATRICES.md`: Has phantom handlers, rarely consulted
- `BEHAVIORS.md`: Mentioned but not enforced
- `BUILDING-BETTER.md`: Only for system extension

## Proposed Solution: Handler Orchestration Model

### Core Concept
Handlers become orchestrators that MUST consult multiple templates as part of their execution flow.

### Handler Execution Flow
```
Handler Called
    ↓
1. MATRICES.md → Get decision criteria
    ↓
2. PATTERNS.md → Load execution pattern
    ↓
3. BEHAVIORS.md → Check preconditions
    ↓
4. CONVENTIONS.md → Apply standards
    ↓
5. TOOLS.md → Execute operations
    ↓
6. WORKFLOWS.md → Follow workflow steps
    ↓
Evidence: "consulted-X, applied-Y, verified-Z"
```

## Template Role Redefinition

### REGISTRY.md (Well-utilized)
- **Current**: Index of handlers
- **Enhanced**: Index with mandatory template dependencies

### WORKFLOWS.md (Moderate use)
- **Current**: Development processes
- **Enhanced**: Orchestration sequences that reference other templates

### TOOLS.md (Moderate use)
- **Current**: Tool selection guidance
- **Enhanced**: Execution layer that requires convention/behavior checks

### CONVENTIONS.md (Moderate use)
- **Current**: Standards and rules
- **Enhanced**: Mandatory validation gates

### PATTERNS.md (Underutilized)
- **Current**: Only for ambiguous requests
- **Enhanced**: Execution patterns for ALL operations
  - Component creation patterns
  - Error handling patterns
  - Validation patterns
  - Integration patterns

### MATRICES.md (Severely underutilized)
- **Current**: Has phantom handlers, rarely checked
- **Enhanced**: Decision engine for every handler
  - Component Type → Structure Matrix
  - Error Type → Recovery Matrix
  - File Type → Convention Matrix
  - Operation → Validation Matrix

### BEHAVIORS.md (Underutilized)
- **Current**: Mentioned but not enforced
- **Enhanced**: Mandatory precondition checks
  - Before file operations
  - Before commits
  - Before tool usage
  - Creates "cannot proceed without" gates

### BUILDING-BETTER.md (Underutilized)
- **Current**: Only for extending system
- **Enhanced**: Operational integration patterns
  - Context management
  - Cross-template operations
  - State preservation

## Practical Handler Transformations

### Example 1: edit-file (Current)
```yaml
Handler: edit-file
Process:
1. Read file first
2. Edit with appropriate tool
3. Verify changes
```

### Example 1: edit-file (Orchestrated)
```yaml
Handler: edit-file
Process:
1. MATRICES.md#file-type-matrix → Determine file type rules
2. PATTERNS.md#edit-patterns → Select appropriate pattern
3. BEHAVIORS.md#before-file-edit → Pass precondition checks
4. CONVENTIONS.md#file-standards → Validate naming/structure
5. TOOLS.md#edit-operation → Execute with proper tool
6. WORKFLOWS.md#post-edit-validation → Verify success
Evidence: "type:component, pattern:safe-edit, checks:passed, tool:MultiEdit"
```

### Example 2: commit-changes (Current)
```yaml
Handler: commit-changes
Process:
1. Check status
2. Create commit message
3. Execute commit
```

### Example 2: commit-changes (Orchestrated)
```yaml
Handler: commit-changes
Process:
1. BEHAVIORS.md#pre-commit → Run mandatory checks
2. MATRICES.md#commit-type-matrix → Select commit type
3. CONVENTIONS.md#commit-format → Apply message rules
4. PATTERNS.md#commit-patterns → Follow commit pattern
5. TOOLS.md#git-operations → Execute commit
6. WORKFLOWS.md#post-commit → Update tracking
Evidence: "type:feat, format:conventional, pattern:standard, tracking:updated"
```

### Example 3: create-component (Current)
```yaml
Handler: create-component
Process:
1. Determine component type
2. Create file with template
3. Update exports
```

### Example 3: create-component (Orchestrated)
```yaml
Handler: create-component
Process:
1. MATRICES.md#component-matrix → Select component type
2. PATTERNS.md#creation-pattern → Load creation pattern
3. BEHAVIORS.md#component-checks → Validate location
4. CONVENTIONS.md#component-rules → Apply naming standards
5. BUILDING-BETTER.md#integration → Setup connections
6. TOOLS.md#file-creation → Create with template
7. WORKFLOWS.md#component-setup → Complete setup
Evidence: "type:functional, pattern:hooks-based, valid:true, integrated:yes"
```

## Enforcement Mechanisms

### S:W:H:E Enhancement
Current: `H:edit-file|E:3/"file edited"`
Enhanced: `H:edit-file|E:6/"matrix:applied,pattern:3,behavior:checked,convention:valid,tool:MultiEdit,workflow:complete"`

### Mandatory Consultation Evidence
Each handler must produce evidence of template consultation:
- Which matrix was consulted
- Which pattern was applied
- Which behaviors were checked
- Which conventions validated
- Which tools were used
- Which workflow was followed

### Cannot Proceed Gates
Structural enforcement through required checks:
```
if (!BEHAVIORS.checkPreconditions()) {
  throw "Cannot proceed: behavior check failed"
}
```

## Implementation Strategy

### Phase 1: Document Orchestration Patterns
Create detailed orchestration flows for top 20 handlers showing exactly which templates they consult and why.

### Phase 2: Update Handler Definitions
Rewrite handlers to be orchestrators rather than doers, with explicit template dependencies.

### Phase 3: Create Template Cross-References
Each template references others it depends on, creating a web of connections.

### Phase 4: Implement Enforcement
Add structural gates that prevent skipping template consultations.

### Phase 5: Validate Integration
Test that all templates are actively used in common workflows.

## Success Metrics

1. **Template Utilization**: All 7 template files used in every session
2. **Handler Clarity**: Each handler has single clear orchestration purpose
3. **Evidence Trail**: Every operation shows which templates were consulted
4. **Integration Depth**: Templates reference each other naturally
5. **Enforcement Success**: Cannot skip template checks

## Benefits

1. **Self-Reinforcing**: Using one template naturally leads to others
2. **Discoverable**: Clear paths through the system
3. **Debuggable**: Evidence trail shows what was consulted
4. **Maintainable**: Changes in one template properly propagate
5. **Learnable**: Patterns become obvious through repetition

## Risks and Mitigation

### Risk: Over-complexity
**Mitigation**: Start with top 10 handlers, measure impact

### Risk: Performance overhead
**Mitigation**: Cache template lookups, optimize paths

### Risk: User confusion
**Mitigation**: Clear documentation, helpful error messages

## Next Steps

1. Review and refine this proposal
2. Select 3 pilot handlers for transformation
3. Document detailed orchestration flows
4. Implement and test
5. Iterate based on results

This isn't about making handlers smaller (atomic) - it's about making them smarter (orchestrated). Each handler becomes a conductor ensuring every template plays its part.