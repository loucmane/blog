# Template System 2.0 Implementation Roadmap

## Executive Summary
This roadmap integrates handler granularization with system-wide enhancements to evolve our template system from disconnected files to a unified, self-enforcing flow system. The plan maintains backward compatibility while adding structural enforcement, navigation, and metrics.

## Vision Statement
**From**: Disconnected template islands with broad handlers
**To**: Unified flow system with atomic operations and natural navigation
**Philosophy**: Evolution, not revolution - keep what works, fix what doesn't

## Core Components

### Component 1: Prerequisites Format (Structural Gates)

**Design**: Action-based lists that enforce proper setup

```markdown
#### Handler: edit-file
Prerequisites:
- READ: conventions.md#file-editing
- CHECK: git status is clean  
- VERIFY: not editing special files
- LOAD: Read, Edit tools
```

**Action Words**:
- **READ**: Must read section (opens file, confirms read)
- **CHECK**: Must verify condition (runs command)
- **VERIFY**: Must confirm constraint (validates state)
- **LOAD**: Must have tool ready (loads into context)

**Enforcement Protocol**:
```
1. See "Prerequisites:" → STOP
2. Execute each line with evidence
3. Can't proceed without completion
4. S:W:H:E shows prerequisite status
```

### Component 2: Related Sections (Navigation Web)

**Design**: Multi-directional navigation for natural flow

```markdown
Related:
  Before This: [read-file, check-conventions]
  After This: [run-tests, commit-changes]
  If Error: BEHAVIORS.md#edit-recovery
  Similar: [create-file, refactor-code]
  Atomics: [read-file-content, edit-file-content]
```

**Navigation Types**:
- **Before This**: Setup/prerequisite handlers
- **After This**: Natural next steps
- **If Error**: Recovery procedures
- **Similar**: Alternative approaches
- **Atomics**: Granular sub-operations

### Component 3: Handler Granularization

**From Broad to Atomic**:
```yaml
# OLD: start-new-work (6 operations)
H:start-new-work|E:6/"Work initialized"

# NEW: Atomic handlers
H:extract-feature-name|E:1/"Name extracted"
H:create-work-folder|E:1/"Folder created"
H:create-tracking-file|E:1/"TRACKER.md created"
...

# NEW: Composite handler
H:compose-start-work|E:6/"Work initialized"
  uses: [extract-feature-name, create-work-folder, ...]
```

**Naming Convention**:
- Atomics: `[verb]-[object]-[qualifier]`
- Composites: `compose-[workflow-name]`

### Component 4: FLOWS.md Structure

**Organization by Journey Type**:

```markdown
# Common Development Flows

## 🚀 Getting Started Flows
### First Time Project Setup
Handlers: check-environment → read-conventions → setup-tools → verify-setup
Time: 10 minutes | Success: 95% | Frequency: Once per project

## 🔨 Development Flows  
### Feature Implementation Flow
Handlers: compose-start-work → design-approach → create-todos → implement-feature → test-feature → commit-changes
Time: 2-4 hours | Success: 85% | Frequency: Daily

### Atomic Feature Flow (Granular)
Handlers: create-work-folder → create-tracking-file → extract-feature-name → ...
Time: 2-4 hours | Success: 90% | Frequency: For precision work
```

### Component 5: Enhanced REGISTRY.md

**Multiple Discovery Indexes**:

```markdown
## By Frequency (Most Used)
1. edit-file (50+ daily) → edit-file-content (atomic)
2. search-code (30+ daily) → search-code-symbols (atomic)
3. commit-changes (20+ daily) → create-git-commit (atomic)

## By Intent (What You Want)
### Fix Something
- compose-bug-fix → Full bug workflow
- debug-issue → Investigation only
- implement-fix → Fix implementation (atomic)

## By Granularity
### Atomic Operations (150)
- create-* (20 handlers)
- update-* (25 handlers)
- search-* (15 handlers)

### Composite Workflows (25)
- compose-start-work (uses 6 atomics)
- compose-bug-fix (uses 8 atomics)
```

### Component 6: CLAUDE.md Organization

**Enhanced with TOC (Not Split)**:

```markdown
# CLAUDE.md - AI Execution Engine

## Table of Contents
- [⚠️ Critical: Operating System](#operating-system)
- [🧠 ULTRATHINK Protocol](#ultrathink)
- [🎯 Context Activation](#activation)
- [📊 Common Flows](#flows) → See FLOWS.md
- [🔧 Atomic vs Composite](#granularity)
- [📖 Documentation Hub](#docs)

## Operating System {#operating-system}
[Core engine stays here]

## Common Flows {#flows}
Quick reference - full details in FLOWS.md:
- Bug Fix: compose-bug-fix or atomic sequence
- Feature: compose-start-work or atomic sequence
- Debug: debug-issue → analyze → fix
```

### Component 7: Metrics & Checkpoints

**For Complex Workflows**:

```yaml
#### Handler: compose-bug-fix
Checkpoint: bug-reproduced
Context Saved:
  - error_message: "Login timeout"
  - test_case: "auth.test.js:45"
  - hypothesis: "Session validation"
Resume: H:analyze-root-cause

Metrics:
  avg_time: 45 minutes
  success_rate: 85%
  common_failures: ["Can't reproduce (15%)"]
  atomic_alternative: true
```

## Implementation Phases

### Phase 0: Foundation (Day 1)
**Goal**: Document the plan and prepare

Tasks:
- [x] Create comprehensive roadmap
- [ ] Update IMPLEMENTATION.md with phases
- [ ] Create Prerequisites examples
- [ ] Design atomic handler examples

Deliverables:
- This roadmap document
- Updated work tracking files
- Communication plan

### Phase 1: Documentation & Discovery (Days 2-3)
**Goal**: Immediate value, zero risk

Tasks:
- [ ] Create FLOWS.md with 10 initial flows
- [ ] Add TOC to CLAUDE.md with anchors
- [ ] Document Prerequisites format
- [ ] Create handler granularity guide

Deliverables:
- FLOWS.md with journey documentation
- Enhanced CLAUDE.md navigation
- Prerequisites specification
- Granularity examples

### Phase 2: Core Handler Enhancement (Days 4-6)
**Goal**: Prove concepts with most-used handlers

Target Handlers (top 10 by frequency):
1. edit-file → Add prerequisites, atomics
2. search-code → Add prerequisites, search types
3. commit-changes → Add git checks, format validation
4. create-component → Add conventions, patterns
5. fix-bug → Link to compose-bug-fix flow
6. read-file → Add navigation options
7. start-new-work → Create atomic versions
8. update-tracker → Add timestamp checks
9. find-symbol → Add search strategies
10. run-tests → Add test discovery

For each:
- Add Prerequisites section
- Create atomic alternatives
- Add Related navigation
- Document metrics

### Phase 3: Atomic Handler Creation (Days 7-9)
**Goal**: Build granular operation library

Categories to implement:
1. **Create Operations** (20 atomics)
   - create-work-folder
   - create-tracking-file
   - create-todo-item
   
2. **Update Operations** (25 atomics)
   - update-tracker-entry
   - update-todo-status
   - update-session-log

3. **Search Operations** (15 atomics)
   - search-code-symbols
   - search-text-pattern
   - find-references

4. **Composite Builders** (10 composites)
   - compose-start-work
   - compose-end-session
   - compose-bug-fix

### Phase 4: Full System Integration (Days 10-12)
**Goal**: Connect everything into unified flow

Tasks:
- [ ] Complete all Related sections
- [ ] Verify all navigation paths
- [ ] Add metrics to all handlers
- [ ] Create checkpoint examples
- [ ] Test atomic vs composite flows

Deliverables:
- Fully connected handler web
- Navigation verification report
- Metrics dashboard design
- Checkpoint implementation guide

### Phase 5: Polish & Optimization (Days 13-14)
**Goal**: Refine based on usage

Tasks:
- [ ] Analyze metrics data
- [ ] Optimize common paths
- [ ] Document learnings
- [ ] Create improvement workflow
- [ ] Plan Phase 2 enhancements

## Success Metrics

### Phase 1 Success
- FLOWS.md reduces "how do I?" questions by 50%
- CLAUDE.md navigation time cut by 75%
- Prerequisites format understood

### Phase 2 Success
- Top 10 handlers enhanced
- Prerequisites prevent 90% of violations
- Atomic alternatives documented

### Phase 3 Success
- 60+ atomic handlers created
- All composites use atomics
- Granular S:W:H:E working

### Phase 4 Success
- Zero orphaned handlers
- 3+ navigation paths per handler
- Metrics collection active

### Phase 5 Success
- Data-driven improvements identified
- Common paths optimized
- User satisfaction increased

## Risk Mitigation

### Risk: Too Complex
**Mitigation**: 
- Start with documentation only
- Add features incrementally
- Keep old handlers working
- Provide atomic + composite options

### Risk: Performance Impact
**Mitigation**:
- Monitor S:W:H:E execution time
- Cache Prerequisites results
- Optimize atomic handler calls
- Allow composite shortcuts

### Risk: User Confusion
**Mitigation**:
- Clear documentation
- Migration guides
- Both atomic and composite options
- Gradual rollout

## Backward Compatibility

### Principles
1. **Addition Only**: No removals in Phase 1
2. **Dual Mode**: Atomic + Composite options
3. **Graceful Enhancement**: Missing Prerequisites don't break
4. **Clear Versioning**: Mark v2.0 handlers

### Implementation
```markdown
#### Handler: edit-file
<!-- Version: 2.0 -->
<!-- Atomic alternatives: edit-file-content, validate-edit -->
Prerequisites: [new section]
[Original content preserved]
Related: [new section]
```

## Communication Plan

### For Users
1. "We're enhancing the template system for better flow"
2. "All existing handlers still work"
3. "New atomic handlers give more precision"
4. "Prerequisites help avoid errors"

### Progress Updates
- Daily: Update TRACKER.md
- Weekly: Summary in HANDOFF.md
- Completion: Full report with metrics

## Next Steps

1. **Immediate**: Review and approve roadmap
2. **Today**: Begin Phase 1 documentation
3. **Tomorrow**: Create first atomic handlers
4. **This Week**: Complete Phases 1-3
5. **Next Week**: Full system integration

## Summary

Template System 2.0 transforms our system through:
- **Atomic Handlers**: Precise, composable operations
- **Prerequisites**: Structural gates prevent errors
- **Related Sections**: Natural navigation flow
- **FLOWS.md**: Explicit journey documentation
- **Enhanced Discovery**: Find handlers multiple ways
- **Metrics**: Data-driven optimization

All while maintaining 100% backward compatibility and implementing in careful phases with clear success metrics.