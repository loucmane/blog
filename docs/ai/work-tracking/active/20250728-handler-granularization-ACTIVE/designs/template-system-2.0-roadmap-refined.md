# Template System 2.0 Roadmap - Refined After Deep Analysis

## Critical Context
Deep analysis revealed the template system is both more sophisticated and more broken than initially understood. This refined roadmap addresses the actual system state, not our assumptions.

## System Reality Check

### What We Have (Working)
- **Three-Tier Architecture**: Patterns → Handlers → Templates
- **ULTRATHINK Enforcement**: Sophisticated pre-check protocol
- **Behavioral Templates**: Locked steps with progression gates
- **VOID Resolution**: Automatic routing for unknown values
- **Pattern Matching**: Meta-routing for ambiguous requests

### What We Have (Broken)
- **Phantom Handlers**: MATRICES.md references 5+ non-existent handlers
- **No Cross-File Navigation**: Templates are isolated islands
- **Broad Handlers**: Single handlers doing 3-8 operations
- **No Journey Documentation**: Missing explicit flow guides
- **Poor Discovery**: Must know which file contains what

## Refined Vision
**From**: Broken integrity with disconnected sophistication
**To**: Trusted system with connected flows and precise operations
**Philosophy**: Fix what's broken, connect what exists, add only what's missing

## Phase 0: System Integrity Restoration (Days 1-2)
**Goal**: Restore trust by fixing phantom references

### Immediate Actions
1. **Phantom Handler Audit**
   - [ ] List ALL handlers referenced in MATRICES.md
   - [ ] Check existence in REGISTRY.md
   - [ ] Verify implementation in template files
   - [ ] Document gaps in integrity-report.md

2. **Decision Resolution**
   For each phantom handler, choose:
   - **Option A**: Create the missing handler
   - **Option B**: Remove the reference
   - **Option C**: Route to existing template

3. **Integrity Report**
   ```markdown
   # System Integrity Report
   
   ## Phantom Handlers Found
   - fix-bug → CREATE (routes to bug-fix-template)
   - debug-issue → CREATE (routes to emergency-debug)
   - explain-code → CREATE (new handler needed)
   - code-review → CREATE (routes to code-review-template)
   - optimize-code → CREATE (new handler needed)
   
   ## Cross-Reference Audit
   - MATRICES.md → REGISTRY.md: 5 broken references
   - REGISTRY.md → WORKFLOWS.md: All valid
   - PATTERNS.md → REGISTRY.md: All valid
   ```

### Deliverables
- [ ] Complete phantom handler list
- [ ] Decision matrix for each phantom
- [ ] Implementation plan for fixes
- [ ] Updated MATRICES.md (no broken references)

## Phase 1: Cross-File Connection Web (Days 3-4)
**Goal**: Connect isolated templates into navigable system

### 1. Cross-File Prerequisites
Design format that works with existing handlers:

```yaml
#### Handler: edit-file
Prerequisites:
- READ: conventions.md#file-editing
- CHECK: behaviors.md#before-any-file-edit
- VERIFY: Not editing special files (SESSION.md, TRACKER.md)
- LOAD: serena find_symbol, edit tools
```

Implementation:
- Add to top 10 handlers first
- Each prerequisite must be actionable
- Link to specific anchors
- Test navigation paths

### 2. Related Sections Web
Create multi-directional navigation:

```yaml
Related:
  Before: [read-file, check-conventions]
  After: [run-tests, commit-changes]
  Templates: [feature-template#implementation]
  Patterns: [file-operation, tool-selection]
  If Error: behaviors.md#file-operation-errors
  Atomics: [read-file-content, validate-edit, apply-edit]
```

### 3. Navigation Testing
- [ ] Test 5 common journeys
- [ ] Verify all links work
- [ ] Check circular references
- [ ] Document orphaned handlers

### Deliverables
- [ ] Prerequisites on 10 core handlers
- [ ] Related sections on 10 core handlers
- [ ] Navigation test results
- [ ] Cross-reference map

## Phase 2: Atomic Handler Implementation (Days 5-7)
**Goal**: Precise operations for S:W:H:E accuracy

### Target Handlers for Atomization
Based on usage frequency and breadth:

1. **start-new-work** (currently 6 operations)
   - extract-feature-name
   - create-work-folder
   - create-tracking-file
   - create-todos
   - update-session
   - load-workflow

2. **context-compaction** (currently 5 operations)
   - check-context-usage
   - create-summary
   - save-memory
   - generate-resume
   - handle-auto-compact

3. **commit-changes** (currently 4 operations)
   - stage-changes
   - validate-message
   - create-commit
   - update-tracker

### Implementation Strategy
```yaml
# Composite (backward compatible)
compose-start-work:
  uses: [extract-feature-name, create-work-folder, ...]
  E: 6/"Work initialized"

# Atomics (new precision)
create-work-folder:
  E: 1/"Folder created"
  
extract-feature-name:
  E: 1/"Name extracted"
```

### Deliverables
- [ ] 20 atomic handlers implemented
- [ ] 5 composite handlers created
- [ ] Backward compatibility verified
- [ ] E field precision improved

## Phase 3: Flow Documentation (Days 8-9)
**Goal**: Explicit journey documentation

### FLOWS.md Structure
```markdown
# Development Flows

## 🐛 Bug Fix Flow
**When**: User reports bug or error
**Time**: 30-60 minutes
**Success Rate**: 85%

### Using Composites (Simple)
1. compose-bug-fix → Complete workflow

### Using Atomics (Precise)
1. identify-bug-pattern
2. search-error-locations  
3. analyze-root-cause
4. implement-fix
5. verify-fix
6. commit-changes

### Using Templates (Guided)
1. Route to bug-fix-template
2. Follow locked steps
3. Cannot skip progression
```

### Flow Categories
1. **Investigation Flows** (debug, analyze, understand)
2. **Development Flows** (feature, component, refactor)
3. **Maintenance Flows** (update, optimize, clean)
4. **Collaboration Flows** (review, document, handoff)

### Deliverables
- [ ] FLOWS.md with 10 core flows
- [ ] Each flow with 3 approaches (composite/atomic/template)
- [ ] Time estimates and success rates
- [ ] Common failure points documented

## Phase 4: Enhanced Discovery (Days 10-11)
**Goal**: Multiple ways to find what you need

### REGISTRY.md Enhancements
```markdown
## By Frequency (Daily Usage)
1. edit-file (50+/day) → edit-file-content
2. search-code (30+/day) → search-code-symbols
3. commit-changes (20+/day) → create-git-commit

## By Problem Type
Bug → compose-bug-fix, debug-issue, analyze-error
Performance → optimize-code, measure-complexity
Security → security-check, validate-input

## By Granularity
### Need Precision?
Atomics: create-work-folder, update-todo-status

### Need Guidance?  
Templates: bug-fix-template, feature-template

### Need Speed?
Composites: compose-start-work, compose-bug-fix
```

### Deliverables
- [ ] Frequency index created
- [ ] Problem-based index added
- [ ] Granularity guide included
- [ ] Search hints documented

## Phase 5: System Integration (Days 12-14)
**Goal**: Everything connected and verified

### Integration Tasks
1. **CLAUDE.md Enhancement**
   - Add table of contents with anchors
   - Link to FLOWS.md for journeys
   - Keep monolithic structure
   - Add granularity section

2. **Full System Audit**
   - Every handler has prerequisites
   - Every handler has related sections
   - No orphaned handlers
   - No phantom references

3. **Metrics Implementation**
   ```yaml
   Metrics:
     frequency: 50+/day
     avg_time: 2 minutes
     success_rate: 95%
     common_errors: ["Permission denied (5%)"]
     last_updated: 2025-07-28
   ```

### Deliverables
- [ ] Enhanced CLAUDE.md
- [ ] Full system audit report
- [ ] Metrics on top 20 handlers
- [ ] Final integration test

## Success Criteria

### Phase 0 Success
- Zero phantom handler references
- System integrity restored
- Trust in matrices rebuilt

### Phase 1 Success  
- Navigate between any related handlers
- Prerequisites prevent errors
- No isolated templates

### Phase 2 Success
- E field always 1-3 steps
- Precise handler targeting
- Backward compatibility maintained

### Phase 3 Success
- Clear flows for 10 common tasks
- Multiple approaches documented
- Journey times accurate

### Phase 4 Success
- Find any handler in <10 seconds
- Multiple discovery paths work
- New users can navigate

### Phase 5 Success
- Fully connected system
- All metrics tracked
- Zero broken references

## Risk Mitigation

### Risk: Breaking Existing Workflows
**Mitigation**: 
- All changes additive first
- Composite handlers preserve old behavior
- Extensive testing between phases
- Rollback plan for each phase

### Risk: System Too Complex
**Mitigation**:
- Start with fixes (Phase 0)
- Add features incrementally
- User testing after each phase
- Simplify if needed

## Communication Strategy

### For Each Phase
1. Start: "Fixing [specific problem]"
2. Progress: Daily updates in TRACKER.md
3. Complete: Results in HANDOFF.md
4. Validate: User testing and feedback

## Next Immediate Steps
1. Begin Phase 0 phantom handler audit
2. Create integrity-report.md
3. Make decision matrix for fixes
4. Start implementing highest-impact fixes

## Summary
This refined roadmap addresses the actual system state discovered through deep analysis. It prioritizes:
1. **Integrity** - Fix what's broken first
2. **Connection** - Link what exists
3. **Precision** - Add atomic operations
4. **Discovery** - Multiple access paths
5. **Trust** - No phantom references

By following this phased approach, we evolve the sophisticated but broken system into a connected, trustworthy, and precise Template System 2.0.