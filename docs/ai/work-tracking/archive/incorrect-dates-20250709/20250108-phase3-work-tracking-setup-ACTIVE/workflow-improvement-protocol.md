# Workflow Improvement Protocol

## Purpose
Create a self-improving system where every gap discovered leads to immediate documentation and workflow enhancement.

## Core Principle
"We need to make sure we do things correctly all the time" - loucmane

## The Protocol

### 1. Immediate Gap Recognition
When you notice ANY workflow gap or missed expected behavior:
- STOP what you're doing
- Document it immediately
- Don't continue until it's captured

### 2. Documentation Steps

#### Step 1: Add to Current Work's findings.md
```markdown
### [Number]. [Gap Name]
**Discovery**: [What happened]
**Impact**: [Why this matters]
**User Feedback**: [Any user comments]
**Root Cause**: [Why did this happen]
**Fix Needed**: [What should change]
```

#### Step 2: Create Todo Item
- Add todo for updating the relevant workflow
- Mark as high priority if it affects daily work
- Include which file needs updating

#### Step 3: Update the Workflow
Add explicit instruction where the gap occurred:
- If it's a missing step, add the step
- If it's unclear behavior, clarify it
- If it's a missing "why", add explanation

#### Step 4: Test the Improvement
- Follow the updated workflow immediately
- Verify it prevents the gap
- Adjust if needed

### 3. Examples from Today

**Gap Found**: Not updating todos when creating work files
**Fix Applied**: Add to WORKFLOWS.md: "Create todo for each work file BEFORE creating it"

**Gap Found**: Guessing timestamps instead of checking
**Fix Applied**: Add to SESSION.md section: "ALWAYS run `date` command, never approximate"

**Gap Found**: Creating files in wrong location
**Fix Applied**: Add to work tracking: "Check directory structure FIRST, create folders if needed"

### 4. Gap Categories

#### Workflow Gaps
- Missing steps
- Unclear sequences
- Assumed knowledge

#### Behavior Gaps
- Expected vs actual behavior mismatch
- Implicit expectations not documented
- Edge cases not covered

#### Tool Usage Gaps
- Commands used incorrectly
- Tools not mentioned in workflow
- Missing integration points

#### Documentation Gaps
- Where to put things not specified
- Naming conventions missing
- Templates not referenced

### 5. Continuous Improvement Cycle

```
Discover Gap → Document → Create Todo → Fix Workflow → Test → Verify
     ↑                                                           ↓
     ←←←←←←←←←←←← Next Gap Found ←←←←←←←←←←←←←←←←←←←←←←←←←←
```

### 6. Success Metrics

- Fewer gaps found over time
- Workflows become more complete
- New sessions have fewer startup issues
- Less confusion about "where" and "how"

### 7. Integration Points

This protocol should be referenced in:
- WORKFLOWS.md - "When gaps are found, follow Workflow Improvement Protocol"
- CONVENTIONS.md - "All workflows must be explicit and complete"
- Session handoffs - "Note any workflow gaps discovered"

## Remember

Every gap is an opportunity to improve the system. Don't be frustrated by gaps - be glad you found them so they can be fixed for everyone!

The goal: Make workflows so complete and explicit that they work correctly every time.