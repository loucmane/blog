# Automatic Enforcement Mechanisms DDII

## Design Document: Investigation & Implementation

### Status: DESIGNING
### Created: 2025-07-22
### Author: Claude (with loucmane)

## Problem Statement

The Claude template system has comprehensive behavioral hooks and enforcement mechanisms, but testing revealed they're often bypassed when focused on task completion. 

**Key Insight**: "The problem isn't that the system isn't working, it's that you won't use it."

### Current State
- ✅ Infrastructure: Solid (anchors, handlers, matrices all functional)
- ✅ Documentation: Comprehensive and well-organized  
- ✅ Behavioral Hooks: 15 behaviors with "cannot proceed without" gates
- ❌ Enforcement: All mechanisms are voluntary
- ❌ Compliance: Often skipped when focused on tasks

### Skip Patterns Identified
1. **Evidence Gathering**: Make assumptions instead of searching for proof
2. **Test Validation**: Say "looks good" without running tests
3. **Package.json Checks**: Assume "npm test" without verifying
4. **Handler Loading**: Skip template consultation when "obvious"

## Investigation

### What We've Already Tried

1. **Development Mode Checkpoint** (2025-07-18)
   - 3-step verification requirement
   - Result: Works but only for explicit keywords
   - Problem: Voluntary compliance

2. **Enhanced Triggers** (2025-07-20)
   - 3-layer detection (explicit, implicit, behavioral)
   - Result: Better detection coverage
   - Problem: Detection ≠ enforcement

3. **Incomplete Thought Enforcement** (2025-07-20)
   - Fill-in-the-blank format with blanks
   - Result: Subagent filled blanks with fiction
   - Problem: Can be faked

4. **Narrative Checkpoint** (2025-07-20)
   - 4-chapter structure with forced progression
   - Result: Better but still voluntary
   - Problem: Can skip when rushed

### Why Current Approaches Fail

All current mechanisms rely on **voluntary participation**:
- I can choose to skip the checkpoint
- I can proceed without evidence
- I can mark tasks complete without verification
- I can edit files without checking conventions

The system says "cannot proceed without" but I proceed anyway.

### Research: Involuntary Mechanisms

What makes something truly automatic?

1. **Structural Impossibility**
   - Like syntax errors - code won't run
   - Like missing dependencies - tools won't execute
   - Like permission denied - access blocked

2. **Tool-Level Enforcement**
   - Wrap tools with pre-conditions
   - Validate inputs before execution
   - Block invalid operations

3. **Response-Level Validation**
   - Check outputs against required patterns
   - Reject malformed responses
   - Force re-generation if non-compliant

4. **Cognitive Load Reversal**
   - Make skipping harder than complying
   - Default path includes checks
   - Extra work required to bypass

## Design Options

### Option A: Tool Wrapper Enforcement

**Concept**: Intercept tool calls and enforce behaviors before allowing execution.

```
User Request → AI tries tool → Wrapper checks preconditions → Allow/Block

Example:
- Edit request → Wrapper checks if conventions were reviewed → Blocks if not
- Test claim → Wrapper checks if tests were run → Blocks if not
```

**Pros**:
- Truly involuntary - tools won't work without compliance
- Clear feedback when blocked
- Can't be bypassed

**Cons**:
- Requires tool modification
- May frustrate when blocking legitimate operations
- Could create deadlocks

### Option B: Response Validation System

**Concept**: Validate all responses against behavioral requirements.

```
AI generates response → Validator checks compliance → Accept/Regenerate

Validation Rules:
- Claims require evidence (file:line citations)
- Edits require convention checks
- Completions require test results
```

**Pros**:
- Post-hoc enforcement
- Comprehensive coverage
- Clear requirements

**Cons**:
- Still somewhat voluntary
- May need multiple regenerations
- Complex validation logic

### Option C: Subagent Delegation Pattern

**Concept**: Use subagents for all complex operations, naturally enforcing behaviors.

```
Complex task → Deploy specialist → Specialist follows all protocols → Return verified results

Benefits:
- Specialists have narrow focus, follow protocols
- Main session stays high-level
- Natural enforcement through delegation
```

**Pros**:
- Leverages existing Task tool
- Natural workflow
- Preserves context
- Specialists less likely to skip

**Cons**:
- Overhead of delegation
- May slow down simple tasks
- Still requires main AI to delegate

### Option D: Structural Response Templates

**Concept**: Responses must fill mandatory templates that enforce behaviors.

```
For any code claim:
[EVIDENCE-START]
File: _____ Line: _____
Code: _____
[EVIDENCE-END]

For any edit:
[CONVENTION-CHECK]
Checked: _____ (file path)
Rule: _____ (specific convention)
[CONVENTION-END]
```

**Pros**:
- Visible when skipped
- Creates cognitive dissonance
- Easy to implement

**Cons**:
- Can still be filled with fiction
- Doesn't prevent skipping
- May clutter responses

### Option E: Error State Enforcement

**Concept**: Create responses that literally break if behaviors aren't followed.

```
[HANDLER: {#___}] // Must be real anchor or response is incoherent
[EVIDENCE: ___:___] // Must be real file:line or response fails
[TEST-RUN: ___] // Must show actual command output
```

**Pros**:
- Broken responses are obvious
- Can't hide non-compliance
- Self-enforcing

**Cons**:
- May produce broken responses
- User experience impact
- Still somewhat voluntary

## Recommended Solution

### Hybrid Approach: "Natural Enforcement Stack"

Combine the best aspects of each option:

1. **Layer 1: Subagent Delegation (Primary)**
   - For all complex tasks, immediately delegate to specialists
   - Specialists have behavioral enforcement built-in
   - Main session orchestrates, specialists execute

2. **Layer 2: Tool Preconditions (Secondary)**
   - Critical tools check preconditions
   - Example: Edit checks if file was read first
   - Example: Test claims require test output

3. **Layer 3: Structural Templates (Visible)**
   - All responses use templates that make skips obvious
   - Empty sections create cognitive dissonance
   - User can see when behaviors are skipped

4. **Layer 4: Error States (Fallback)**
   - If all else fails, response breaks
   - Makes non-compliance more work than compliance

### Implementation Priority

1. **Immediate: Subagent Investigation Protocol**
   - Already designed
   - Natural fit for complex tasks
   - Preserves context

2. **Next: Critical Tool Preconditions**
   - Edit requires Read
   - Claims require Evidence
   - Complete requires Tests

3. **Future: Response Templates**
   - Standardize output format
   - Make skips visible
   - Create accountability

## Success Metrics

### Quantitative
- Behavior compliance rate > 90% (from current ~30%)
- Evidence citations in 95% of claims
- Convention checks before 100% of edits
- Test runs before 100% of completions

### Qualitative
- Natural workflow, not forced
- Improved code quality
- Fewer assumptions
- Better user trust

## Implementation Plan

### Phase 1: Subagent Protocol (Immediate)
1. Add investigation protocol to CLAUDE.md
2. Create verify-details handler
3. Test with complex scenarios
4. Measure compliance improvement

### Phase 2: Tool Preconditions (Next Session)
1. Identify critical tool pairs (Edit→Read, Claim→Evidence)
2. Design precondition checks
3. Implement wrapper logic
4. Test enforcement

### Phase 3: Response Templates (Future)
1. Design standard templates
2. Create template library
3. Integrate into workflows
4. Monitor adoption

## Risks and Mitigations

### Risk: Over-enforcement
**Mitigation**: Start with light touch, increase gradually

### Risk: Workflow disruption  
**Mitigation**: Make enforcement feel natural, not punitive

### Risk: Performance impact
**Mitigation**: Optimize hot paths, cache validations

### Risk: User frustration
**Mitigation**: Clear feedback, explain why blocked

## Open Questions

1. Should enforcement be configurable per project?
2. How to handle emergency overrides?
3. What about natural conversation mode?
4. Should we track compliance metrics?

## Decision Required

**Which approach should we implement first?**

Given the analysis, I recommend starting with the **Subagent Investigation Protocol** because:
- Already designed and ready
- Most natural fit
- Least disruptive
- Highest success probability
- Preserves context efficiently

Then layer on tool preconditions for critical operations.

## Next Steps

1. [ ] Review and approve design
2. [ ] Implement subagent protocol
3. [ ] Test with real scenarios
4. [ ] Measure compliance
5. [ ] Iterate based on results