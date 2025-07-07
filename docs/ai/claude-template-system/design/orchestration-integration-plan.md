# Orchestration Integration Plan for WORKFLOWS.md

## Overview

This document outlines how to integrate lightweight orchestration patterns into WORKFLOWS.md, making multi-agent delegation a natural part of standard development workflow.

## Integration Points in WORKFLOWS.md

### 1. New Section: "Multi-Agent Patterns"

Add after "Standard Development Workflow":

```markdown
## Multi-Agent Patterns (When Complexity Warrants)

### Natural Delegation Triggers

The main agent should consider delegation when:
- **Complexity Score > 3**: Task involves multiple specialized domains
- **Risk Level > Medium**: Changes to critical systems need review
- **Unknown Factor > 40%**: Significant research needed before implementation
- **Scope > 2 packages**: Cross-package coordination required

### Lightweight Patterns (2-4 agents, <30 minutes)

#### Pattern 1: Quick Quality Review (2 agents, 15-20 min)
```
Trigger: "Fix authentication bug" + critical system
Flow:
1. Developer Agent: Implement fix with tests
2. Security Agent: Review for vulnerabilities
3. Main Agent: Integrate if approved
```

#### Pattern 2: Domain Split (2-3 agents, 20-25 min)
```
Trigger: "Add accessible dark mode" + multiple domains
Flow:
1. Parallel deployment:
   - UI Agent: Theme implementation
   - A11y Agent: Accessibility compliance
2. Main Agent: Integrate both perspectives
```

#### Pattern 3: Research-Implement (2 agents, 20-30 min)
```
Trigger: "Integrate new charting library" + unknown tech
Flow:
1. Research Agent: Evaluate options, create recommendation
2. Implementation Agent: Apply chosen solution
3. Main Agent: Polish and integrate
```
```

### 2. Update "Task Management" Section

Enhance TodoWrite usage to include orchestration:

```markdown
### TodoWrite for Orchestrated Tasks

When task complexity warrants delegation:

```markdown
- [ ] 🎭 Add search functionality (orchestrated)
  - [ ] 🔍 Research: Best search libraries for our stack
  - [ ] 💻 Implementation: Core search functionality
  - [ ] ⚡ Performance: Optimize for large datasets
  - [ ] ♿ Accessibility: Screen reader support
  - [ ] 🔄 Integration: Combine all perspectives
```

Mark sub-agent tasks with emoji indicators:
- 🔍 Research tasks
- 💻 Implementation tasks
- 🔒 Security reviews
- ⚡ Performance optimization
- ♿ Accessibility compliance
- 🔄 Integration work
```

### 3. Update "SESSION.md Management" Section

Add orchestration tracking:

```markdown
### Tracking Multi-Agent Work

When using delegation patterns, track in SESSION.md:

```markdown
### 📝 Progress Log
- **14:30** - Analyzing task: "Add search functionality"
- **14:32** - Complexity score: 4/5 (UI + Performance + A11y)
- **14:33** - Deploying 3 specialized agents for parallel work
- **14:35** - Agents deployed:
  - Search Implementation Agent (worktree: search-impl)
  - Performance Agent (worktree: search-perf)  
  - A11y Agent (worktree: search-a11y)
- **14:50** - All agents complete, integrating results
- **15:00** - Integration complete, search feature ready
```

### 💻 Code Changes
| File | Changes | Agent | Status |
|------|---------|--------|---------|
| components/Search.tsx | Created search UI | Implementation | ✅ |
| lib/search-index.ts | Added indexing | Performance | ✅ |
| components/Search.test.tsx | A11y tests | Accessibility | ✅ |
| pages/search.tsx | Integrated all | Main | ✅ |
```

### 4. New Subsection: "Agent Deployment Patterns"

```markdown
## Agent Deployment Patterns

### Lightweight Deployment Template

When deploying specialized agents, use this minimal template:

```
Role: [Specific expertise]
Task: [Clear, focused objective]
Context:
  - Key files: [Relevant paths]
  - Standards: [Applicable rules]
  - Constraints: [Time/scope limits]
Output: [Expected deliverable]
Time limit: [15-30 minutes max]
```

### Example: Performance Agent Deployment

```
Role: Performance Optimization Specialist
Task: Optimize search functionality for 10k+ posts
Context:
  - Key files: /lib/search-index.ts, /components/Search.tsx
  - Standards: <100ms search response, <50KB bundle increase
  - Constraints: Use existing dependencies only
Output: Optimized implementation + performance metrics
Time limit: 20 minutes
```

### Integration Protocol

1. Main agent creates focused task specification
2. Deploy agents with `Task` tool (2-4 max)
3. Agents work in isolated contexts
4. Main agent reviews and integrates outputs
5. Update todos and SESSION.md throughout
```

## Practical Examples for WORKFLOWS.md

### Example 1: Bug Fix with Review

```markdown
User: "Fix the authentication timeout bug in production"

Main Agent Recognition:
- Critical system (auth) = High risk
- Production bug = Needs careful review
- Delegation warranted for quality assurance

Workflow:
1. Main: "This touches critical auth logic. I'll use a quality review pattern."
2. Deploy Developer Agent to implement fix
3. Deploy Security Agent to review changes
4. Integrate approved changes
5. Total time: ~20 minutes
```

### Example 2: Feature with Multiple Concerns

```markdown
User: "Add data export functionality with good UX"

Main Agent Recognition:
- Data handling = Backend complexity
- Good UX = Frontend expertise
- Multiple domains = Parallel agents

Workflow:
1. Main: "This needs both backend and UX expertise. Deploying specialists..."
2. Parallel deployment:
   - Backend Agent: API and data formatting
   - UX Agent: Interface and user flow
3. Integration of both implementations
4. Total time: ~25 minutes
```

## Decision Matrices for CONVENTIONS.md

### When to Delegate (Add to CONVENTIONS.md)

```markdown
## Multi-Agent Delegation Guidelines

### Delegation Decision Matrix

| Complexity | Risk | Scope | Unknown | Action |
|------------|------|-------|---------|---------|
| Low (1-2) | Low | Single | <20% | Single agent |
| Medium (3) | Low | Single | <40% | Consider delegation |
| High (4+) | Any | Any | Any | Delegate recommended |
| Any | High | Any | Any | Quality review required |
| Any | Any | Multi | Any | Parallel agents |
| Any | Any | Any | >40% | Research first |

### Anti-Patterns to Avoid

❌ **Over-orchestration**: Using 10+ agents for simple tasks
❌ **Sequential overload**: Agents waiting on each other unnecessarily  
❌ **Context explosion**: Giving agents entire codebase context
❌ **Time creep**: Letting agents run for hours

✅ **Do Instead**:
- 2-4 focused agents maximum
- Parallel when possible
- Minimal, focused context
- 15-30 minute time boxes
```

## Implementation Steps

1. **Phase 1**: Add patterns to WORKFLOWS.md
   - Multi-agent patterns section
   - Enhanced todo tracking
   - SESSION.md examples

2. **Phase 2**: Update CONVENTIONS.md
   - Decision matrices
   - Anti-patterns
   - Time limits

3. **Phase 3**: Create working examples
   - Test on real tasks
   - Document what works
   - Refine patterns

4. **Phase 4**: Natural language recognition
   - Build trigger phrases
   - Make delegation conversational
   - Remove command dependency

## Success Metrics

- Delegation feels natural, not forced
- Tasks complete in <30 minutes
- Clear value from multiple perspectives
- No friction in standard workflow
- Transparent in todos/SESSION.md

## Key Innovation

Instead of:
```
/orchestrate-and-test 7
```

We get:
```
"This authentication refactor is complex and touches critical systems. 
Let me deploy a developer agent for implementation and a security 
specialist for review. This should take about 20 minutes."
```

The orchestration becomes invisible - just good engineering practice.