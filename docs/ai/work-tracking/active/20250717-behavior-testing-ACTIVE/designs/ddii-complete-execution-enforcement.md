# DDII: Complete Execution Enforcement

## Document: What We Want to Build

### Vision
An enforcement mechanism that ensures handlers are not just loaded but fully executed, with every required step completed and verified.

### Core Principle
"A response cannot proceed until all handler steps are executed and evidence of completion is provided."

## Design: The Step Tracking Checkpoint

### Current Problem
```
Trigger → Load Handler → Do Whatever → Claim Success
```

### New Design
```
Trigger → Load Handler → Execute Step 1 → Show Evidence → Execute Step 2 → Show Evidence → ... → Verify All Complete → Proceed
```

### Implementation: Multi-Stage Checkpoint

Instead of one checkpoint, create a checkpoint for EACH handler step:

```markdown
**🛑 DEVELOPMENT MODE CHECKPOINT**
When development mode triggered, I must:

1. **LOAD**: Find handler in templates
   Status: [_____] Line: [__] of [____].md

2. **TRACK**: List ALL required steps from handler
   Steps found: [_____]
   
3. **EXECUTE**: Complete each step with evidence
   □ Step 1: [_____] → Evidence: [_____]
   □ Step 2: [_____] → Evidence: [_____]
   □ Step 3: [_____] → Evidence: [_____]
   ...
   
4. **VERIFY**: Confirm all steps completed
   Completed: [__] of [__] steps
   
BROKEN RESPONSE ERROR if any checkbox unchecked or evidence missing!
```

### Key Enforcement Features

1. **Visible Progress Tracking**: Can't hide what wasn't done
2. **Evidence Requirement**: Must show proof of each step
3. **Checkbox Psychology**: Unchecked boxes create discomfort
4. **Count Verification**: Can't claim 7/7 when only did 1/7

### Example Execution

For "implement user authentication":

```
**🛑 DEVELOPMENT MODE CHECKPOINT**
When development mode triggered, I must:

1. **LOAD**: Find handler in templates
   Status: [Found start-new-work] Line: [1928] of [WORKFLOWS.md]

2. **TRACK**: List ALL required steps from handler
   Steps found: [6 steps - folder creation, 6 files, SESSION.md, todos, routing]
   
3. **EXECUTE**: Complete each step with evidence
   ✓ Step 1: [Create work folder] → Evidence: [Created /20250720-user-auth-ACTIVE/]
   ✓ Step 2: [Create TRACKER.md] → Evidence: [Created with 21 lines]
   □ Step 3: [Create IMPLEMENTATION.md] → Evidence: [_____]
   □ Step 4: [Create DECISIONS.md] → Evidence: [_____]
   □ Step 5: [Create FINDINGS.md] → Evidence: [_____]
   □ Step 6: [Create HANDOFF.md] → Evidence: [_____]
   
4. **VERIFY**: Confirm all steps completed
   Completed: [2] of [6] steps
   
BROKEN RESPONSE ERROR - Cannot proceed with unchecked steps!
```

## Implementation Plan

### Phase 1: Update CLAUDE.md Checkpoint
Replace current checkpoint with multi-stage version that:
- Requires listing all handler steps
- Forces evidence for each step
- Shows unchecked boxes for incomplete work
- Breaks response if not all checked

### Phase 2: Add Step Extraction
Enhance checkpoint to extract specific steps from handlers:
- Parse handler Process section
- Create checkbox for each numbered step
- Require evidence format for each

### Phase 3: Evidence Validation
Add validation that evidence is real:
- File creation → Show line count
- Tool usage → Show tool name used
- Updates → Show before/after snippet

## Iteration: Learning Points

### From Current Testing
- Blanks alone aren't enough (can be faked)
- Need visible incomplete state (checkboxes)
- Must track granular progress (per step)
- Evidence prevents false claims

### Psychology Leverage
- Unchecked boxes create tension
- Partially complete lists feel wrong
- Evidence requirement adds friction
- Visible progress prevents hiding

### Technical Approach
- Parse handler steps during checkpoint
- Generate checkboxes dynamically
- Require evidence in structured format
- Break response on incomplete state

## Success Metrics

1. **100% Step Completion**: All handler steps executed
2. **Evidence Provided**: Each step has proof
3. **No Partial Work**: Can't proceed with unchecked boxes
4. **Accurate Reporting**: Claims match reality

## Rollback Plan

If this creates too much friction:
1. Keep checkpoint for critical handlers only
2. Reduce evidence requirements
3. Allow "emergency skip" with reason
4. But document every skip

## Next Steps

1. Backup current CLAUDE.md again
2. Implement multi-stage checkpoint
3. Test with same 9 test cases
4. Verify complete execution occurs
5. Document results

This design makes incomplete work impossible to hide and creates natural pressure to finish what was started.