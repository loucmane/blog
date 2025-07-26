# Protocol Enforcement Design

## Problem Analysis
Currently I skip checking conventions because:
1. They're in separate files (easy to "forget")
2. No automatic triggers before actions
3. Treated as optional references vs requirements

## Solution: Pre-Action Gates

### Core Concept
Before ANY action, trigger a mandatory check:
"What protocol applies to [action]? Check it NOW."

### Implementation Strategy

#### 1. Add to CLAUDE.md (After ULTRATHINK)
```markdown
## 🔒 PROTOCOL GATES: MANDATORY CHECKS
**CANNOT PROCEED WITHOUT CHECKING RELEVANT PROTOCOL**

Before ANY action, find and verify the protocol:
- **Creating files** → Check CONVENTIONS.md for structure/naming
- **Editing files** → Check if Read required first
- **Work folders** → Verify 7-file structure (UPPERCASE)
- **Changelogs** → Confirm reverse chronological
- **Sessions** → Check session-start handler
- **Git commits** → Verify gac format
- **Using tools** → Check tool selection matrix
- **Unsure?** → Search: `mcp__serena__search_for_pattern --substring_pattern "[action]" --relative_path ".claude/templates/"`

VIOLATION = IMMEDIATE STOP AND CORRECT
```

#### 2. Make It Unavoidable
- Position right after ULTRATHINK (can't miss it)
- Use strong language: "CANNOT PROCEED"
- Give specific search commands
- Make violations feel like errors

#### 3. Connect to Existing Patterns
Link to BEHAVIORS.md enforcement pattern:
- "Before X, must check Y"
- Create same "cannot proceed" feeling
- Reference specific handlers

#### 4. Test Cases
After implementation, test:
1. Try creating a file → Should check conventions first
2. Try editing → Should read first
3. Try work folder → Should verify structure
4. Try changelog → Should check order

## Success Criteria
- Zero protocol reminders from user
- Automatic checking becomes habit
- Conventions treated as hard requirements
- Clear trail of protocol checks in conversation

## Integration Points
- BEHAVIORS.md - Add "Before Action Protocol Check"
- PATTERNS.md - Add "protocol-check" pattern
- CLAUDE.md - Main enforcement section

## Key Principle
Make it feel WRONG to act without checking, like:
- Writing code without syntax check
- Crossing street without looking
- Sending email without recipient

The check must become automatic and unavoidable.