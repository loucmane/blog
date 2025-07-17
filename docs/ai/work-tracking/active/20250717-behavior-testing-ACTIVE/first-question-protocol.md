# First Question Protocol Design (DDII)

## Define: The Problem

### Current State
- Behaviors documented but not followed
- Can process requests without checking behaviors
- Easy to skip checks when focused on task
- 0/4 tested behaviors have proper enforcement

### Desired State
- Cannot proceed without identifying relevant behavior
- Natural pause point before any action
- Visible accountability for behavior checking
- Simple enough to actually use

## Design: The Solution

### Core Concept
Replace "you must check" gates with "you must answer" questions.

### Why Questions Work Better
1. **Cognitive Hook** - Brain wants to answer questions
2. **Visible Output** - Wrong answers exposed to user
3. **Natural Flow** - Fits into response pattern
4. **Low Friction** - Quick to answer if known

### The First Question
```
"What behavior should trigger for this request?"
```

### Answer Types
1. **Specific behavior** → Proceed with that behavior
2. **"None"** → Red flag - check coverage matrix
3. **"I don't know"** → Must check BEHAVIORS.md
4. **Wrong answer** → User sees and corrects

## Implement: Protocol Structure

### Version 1: Minimal
```markdown
# What behavior should trigger for this request?

Edit file? → "File Operations"
Timestamp? → "Timestamp Accuracy"  
Search? → "Tool Selection"
New work? → "Work Tracking"
Git? → "Git Operations"
Don't know? → Check BEHAVIORS.md
```

### Version 2: With Examples
```markdown
# 🤔 First Question: What behavior should trigger?

**Common Behaviors:**
- Editing file → "File Operations - check conventions"
- Adding time → "Timestamp Accuracy - run date command"  
- Searching → "Tool Selection - Serena for code"
- Starting work → "Work Tracking - create folder"
- Committing → "Git Operations - verify gac format"

**Your Answer**: [State the behavior that applies]

**Can't answer?** → You're about to skip a behavior!
```

### Version 3: With Verification
```markdown
# Behavior Check Protocol

## 1. What behavior should trigger for this request?
_[Your answer here]_

## 2. Quick Verification:
- If editing → Did you check file conventions?
- If timestamp → Did you run date command?
- If searching → Did you check tool matrix?
- If no behavior → Did you check coverage matrix?

## 3. Proceed only after answering above
```

## Iterate: Refinement Ideas

### Placement Options
1. **At very top** - Before any other content
2. **After context detection** - Part of routing
3. **As comment** - <!--ANSWER THIS FIRST-->

### Enhancement Ideas
1. **Behavior counter** - "Behaviors checked today: 3/15"
2. **Recent misses** - "You missed: File Operations (17:06)"
3. **Success tracking** - "Navigation ✓ Timestamp ✓"

### Testing Approach
1. Implement minimal version first
2. Test on next 3 requests
3. Measure if behavior checking improves
4. Iterate based on what gets skipped

## Success Metrics
- Answer the question on every request
- Correct behavior identification >80%
- Reduced "I went straight to task" incidents
- User notices improvement

## Next Steps
1. Choose version to implement
2. Inject into CLAUDE.md
3. Test immediately
4. Refine based on results