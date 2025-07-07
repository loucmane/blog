# Phase 3 Deep Review Implementation Plan

## Purpose
Provide a structured approach for conducting the deep, detailed review of the Claude Template System that the user has requested.

## Key Learning from Today
**What went wrong**: I rushed to implement fixes without proper analysis and discussion.  
**What the user wants**: Detailed walkthrough, discussion of expected behaviors, collaborative gap identification.  
**New approach**: Slow, methodical review with user input at every step.

## Review Methodology

### 1. Session Initialization
```markdown
1. Update SESSION.md with proper session entry
2. Read previous memory and understand context
3. State clearly: "Today we're doing a deep review, not implementing"
4. Ask user where they'd like to start
```

### 2. File Review Process
For each file being reviewed:

#### Step 1: Complete Read
- Read the entire file first
- Note initial observations
- Don't jump to conclusions

#### Step 2: Section-by-Section Analysis
```markdown
## Section: [Name]
Lines: [X-Y]

### Content
[Quote the section]

### Purpose Analysis
- What this section is trying to achieve
- Why it's structured this way
- How it fits with other sections

### Expected Behavior
- How should this work in practice?
- What should the AI do when reading this?
- What outcomes are expected?

### Potential Issues
- Ambiguities in wording
- Missing information
- Conflicting instructions
- Edge cases not covered

### Questions for User
1. Is this what you intended?
2. Have you seen issues with this in practice?
3. What would you change?
```

#### Step 3: Wait for Discussion
- Present analysis to user
- Ask specific questions
- Listen to feedback
- Take notes on user's thoughts
- Do NOT suggest fixes yet

#### Step 4: Document Insights
- Record what was learned
- Note agreed issues
- Mark areas for future improvement
- Update tracker with progress

### 3. Cross-File Analysis
After individual file reviews:

```markdown
## Integration Analysis

### How Files Work Together
- Loading patterns observed
- Dependencies identified
- Redundancies found
- Gaps in coverage

### Workflow Coherence
- Do workflows make sense?
- Are there contradictions?
- Missing connections?

### User Experience
- Is it clear what to do?
- Too complex? Too simple?
- Confusing parts?
```

### 4. Mechanism Deep Dives

#### Orchestration Review
```markdown
## Orchestration Mechanism Analysis

### Sequential Processing
- Trace through complete flow
- Identify decision points
- Question assumptions
- Discuss with user

### Value-Based Decisions
- Are thresholds right?
- Too rigid? Too flexible?
- Real-world application?

### Testing Integration
- Natural checkpoint placement?
- Clear instructions?
- User burden appropriate?
```

#### Session Management Review
```markdown
## Session Management Analysis

### Pre-Flight Checks
- Are all checks necessary?
- Missing any checks?
- Too many hoops to jump through?

### Progress Tracking
- SESSION.md format working?
- Too much documentation?
- Key info captured?

### Continuity
- Handoffs clear?
- Context preserved?
- Easy to resume?
```

## Discussion Guidelines

### DO:
- Ask "What do you think about this?"
- Say "I noticed X, is that intentional?"
- Provide multiple perspectives
- Wait for user response
- Take time to understand

### DON'T:
- Say "This should be fixed"
- Jump to solutions
- Make assumptions
- Rush through sections
- Implement without asking

## Daily Structure

### Morning Session (2-3 hours)
1. Review 2-3 core files in detail
2. Discuss findings with user
3. Document insights
4. Update tracker

### Afternoon Session (2-3 hours) 
1. Continue file reviews
2. Start integration analysis
3. Identify patterns
4. Prepare summary

### End of Day
1. Update SESSION.md thoroughly
2. Create detailed memory
3. Prepare questions for next day
4. Do NOT rush to complete

## Success Metrics

### Good Review:
- User actively engaged
- Many "aha" moments
- Clear understanding achieved
- Gaps identified collaboratively
- No rushed decisions

### Bad Review:
- User frustrated
- Quick fixes applied
- Surface-level analysis
- Assumptions made
- Implementation without discussion

## Example Deep Review Segment

```markdown
### Lines 5-11: Critical Reminders Section

**Content**:
```
### SESSION.md First!
**BEFORE DOING ANYTHING ELSE**: Update SESSION.md following the pre-flight checklist in WORKFLOWS.md
```

**Purpose Analysis**:
This appears to be enforcing a specific workflow where SESSION.md must be updated before any other action. It's prominently placed and uses strong emphasis (bold, caps).

**Expected Behavior**:
When an AI loads this file, the first thing it should do is navigate to SESSION.md and follow the update procedure. This should happen automatically without user prompting.

**Potential Issues**:
1. What if SESSION.md doesn't exist yet?
2. Is "BEFORE DOING ANYTHING ELSE" too rigid? What about urgent fixes?
3. The instruction references WORKFLOWS.md - adds a dependency
4. No explanation of WHY this is critical

**Questions for User**:
1. Have you seen AIs skip SESSION.md updates despite this reminder?
2. Is the all-caps emphasis effective or does it feel aggressive?
3. Should there be a quick explanation of why SESSION.md is critical?
4. What happens in practice when people ignore this?

[WAIT FOR USER RESPONSE BEFORE CONTINUING]
```

## Remember
The goal is UNDERSTANDING, not FIXING. We're exploring what exists, how it works, what's missing, and what could be better. The user will guide when to move from analysis to implementation.

Take your time. Be thorough. Listen actively. Question everything.