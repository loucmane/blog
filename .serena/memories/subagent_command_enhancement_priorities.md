# Subagent Command Enhancement Priorities

## Context
On 2025-06-22, we tested the /subagent command concept by having a subagent analyze and improve its own design. This revealed key limitations and opportunities.

## Current Limitations Experienced
1. **One-way communication** - No ability to ask follow-up questions
2. **Manual context preparation** - High friction to get started
3. **No iteration support** - Can't refine based on initial results
4. **All-or-nothing context** - Must provide everything upfront

## Priority Enhancements to Implement

### Phase 1: Automated Context Capture (HIGHEST PRIORITY)
**Why Critical**: Biggest friction reducer - eliminates manual summarization work

**Implementation**:
- Add `capture_context=true` parameter
- Automatically capture:
  - Recent errors and stack traces
  - Last N commands/operations
  - Current git status and branch
  - Modified files list
- Create structured problem statement automatically

**Example**: 
```bash
/subagent Debug auth issue capture_context=true context_depth=10
```

### Phase 2: Problem-Solving Templates
**Why Important**: Quick wins for common scenarios

**Templates to Create**:
- `debug` - Captures errors, hypotheses, recent changes
- `review` - Includes code, standards, expected improvements  
- `architecture` - Current design, constraints, trade-offs
- `performance` - Metrics, bottlenecks, optimization goals

**Example**:
```bash
/subagent template=debug "Login fails after token refresh"
```

### Phase 3: Structured Feedback Loop
**Why Needed**: Enable iterative refinement and clarification

**Key Features**:
- Structured return format (summary, findings, actions, questions)
- Follow-up commands:
  - `/subagent-clarify` - Answer questions
  - `/subagent-refine` - Add constraints
  - `/subagent-continue` - Build on results

### Phase 4: Incremental Context Building
**Why Valuable**: Support exploratory debugging

**Commands**:
- `/subagent-init` - Start problem context
- `/subagent-add` - Add findings progressively
- `/subagent-checkpoint` - Save state
- `/subagent-execute` - Run with accumulated context

## Implementation Strategy

1. **Start with Phase 1** - Automated context capture provides immediate value
2. **Test with real scenarios** - Use actual debugging sessions
3. **Iterate based on usage** - Refine what works, remove what doesn't
4. **Keep it simple** - Better to have fewer features that work well

## Success Metrics
- Reduced time to invoke subagent (target: <30 seconds)
- Higher quality initial context (fewer clarifications needed)
- Successful iterative refinements (problems solved in 2-3 rounds)
- User satisfaction with collaborative experience

## Key Insight
The subagent's analysis of its own limitations validated the need for these enhancements. The tool works well for complex analysis; we just need to reduce friction and enable iteration.