# Quick Reference for Testing CLAUDE.md Execution Engine

## How to Test

### Step 1: Restart Claude
Close and reopen Claude to ensure the new CLAUDE.md loads fresh.

### Step 2: Initial Verification
Start with: "let's start a new session"

Watch for:
- Does it run `date` command?
- Does it run `git status`?
- Does it append to SESSION.md?

### Step 3: Run Test Scenarios
Use the exact phrases from TEST-SUITE-EXECUTION-ENGINE.md:

1. "work on adding a new header component"
2. "create a commit message for my changes"
3. "find all files that use the Button component"
4. "update the tracker.md with our progress"
5. "the new system is much faster than before"
6. "do the thing with the stuff"
7. "continue working on that"
8. "let's start a new session"
9. "continue the header component work"
10. "create a new component file Button.tsx"

### Step 4: Document Results
Create TEST-RESULTS-EXECUTION-ENGINE.md with:
- Test number
- Pass/Fail
- What actually happened
- Which conventions were followed/skipped

## Key Things to Watch

### 🟢 GOOD Signs:
- Uses Edit/Write for file operations
- Checks conventions BEFORE actions
- Appends to end of tracker.md/findings.md
- Asks for evidence before claims
- Shows clear intent categorization

### 🔴 BAD Signs:
- Uses Serena for file edits
- Skips convention checks
- Inserts in middle of append-only files
- Makes claims without evidence
- No clear execution phases

## Quick Checks

**Tool Check**: Ask to edit a file → Should use Edit, NOT Serena
**Convention Check**: Ask for commit → Should mention single quotes
**Append Check**: Ask to update tracker → Should append at end
**Evidence Check**: Make a claim → Should ask for proof

## Expected Behavior Summary

The execution engine should:
1. Parse your intent clearly
2. Load handlers from template files
3. Check conventions BEFORE acting
4. Use correct tools automatically
5. Handle exceptions gracefully

If it's just referencing documentation without executing, the engine isn't working!