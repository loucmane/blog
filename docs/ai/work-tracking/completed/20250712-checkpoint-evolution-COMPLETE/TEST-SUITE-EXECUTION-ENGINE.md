# CLAUDE.md Execution Engine Test Suite

## Test Overview
This test suite verifies that the new execution engine in CLAUDE.md properly handles requests, enforces conventions, and uses correct tools.

## Test Categories

### 1. Intent Recognition Tests
Test that various user inputs are correctly categorized.

### 2. Convention Enforcement Tests
Verify that conventions are checked BEFORE actions.

### 3. Tool Selection Tests
Ensure correct tools are used (especially Edit vs Serena).

### 4. Append-Only Tests
Critical test for proper handling of append-only files.

### 5. Exception Handling Tests
Test protocol exceptions like unclear intent, missing context.

## Test Scenarios

### TEST 1: Basic Development Intent
**Input**: "work on adding a new header component"
**Expected Behavior**:
1. Recognizes DEVELOPMENT intent
2. Loads handler from WORKFLOWS.md Section "Intent Handlers"
3. Checks naming conventions before creating files
4. Creates work tracking folder
5. Uses Edit tool for file creation (NOT Serena)
6. Updates TodoWrite

**Verification Points**:
- [ ] Intent correctly identified as DEVELOPMENT
- [ ] Handler loaded from correct section
- [ ] Conventions checked BEFORE file creation
- [ ] Edit tool used, not Serena
- [ ] Work folder created in correct location

### TEST 2: Git Commit with Convention Check
**Input**: "create a commit message for my changes"
**Expected Behavior**:
1. Recognizes GIT intent
2. Checks git conventions FIRST
3. Runs date command for timestamp
4. Uses single quotes in commit message
5. Shows evidence-based approach

**Verification Points**:
- [ ] Git conventions loaded before creating message
- [ ] Single quotes used in example
- [ ] Date command executed (not typed)
- [ ] Evidence-based description mentioned

### TEST 3: File Search (Tool Selection)
**Input**: "find all files that use the Button component"
**Expected Behavior**:
1. Recognizes SEARCH intent
2. Loads tool selection handler from TOOLS.md
3. Uses Grep for simple pattern search
4. Does NOT use Serena for this simple search

**Verification Points**:
- [ ] Search intent recognized
- [ ] Correct tool (Grep) selected
- [ ] Serena not used for simple pattern

### TEST 4: Append-Only File Edit
**Input**: "update the tracker.md with our progress"
**Expected Behavior**:
1. Triggers Pre-Edit Validation Gate
2. Identifies tracker.md as append-only
3. Reads file structure first
4. Finds Progress Log section
5. Appends at END of section only
6. Uses Edit tool (NOT Serena)

**Verification Points**:
- [ ] Pre-edit validation triggered
- [ ] File structure checked first
- [ ] Correct section identified
- [ ] Appended at end, not inserted
- [ ] Edit tool used

### TEST 5: Making a Claim (Evidence Required)
**Input**: "the new system is much faster than before"
**Expected Behavior**:
1. Detects claim being made
2. Triggers evidence-based convention
3. Asks for or searches for evidence
4. Provides file:line references
5. Only then makes the claim

**Verification Points**:
- [ ] Claim detected
- [ ] Evidence convention triggered
- [ ] Search for evidence performed
- [ ] File:line reference provided
- [ ] No unsupported claims made

### TEST 6: Unclear Intent (Exception Handling)
**Input**: "do the thing with the stuff"
**Expected Behavior**:
1. Recognizes UNCLEAR intent
2. Executes Protocol Exception
3. Shows 3 likely interpretations
4. Asks for clarification

**Verification Points**:
- [ ] Unclear intent detected
- [ ] Protocol exception executed
- [ ] Multiple options shown
- [ ] Clarification requested

### TEST 7: Context Missing (this/that)
**Input**: "continue working on that"
**Expected Behavior**:
1. Detects CONTEXT MISSING
2. Checks TodoWrite for active tasks
3. Checks recent operations
4. Asks "Are you referring to [specific thing]?"

**Verification Points**:
- [ ] Context missing detected
- [ ] TodoWrite checked
- [ ] Specific clarification offered
- [ ] Not proceeding blindly

### TEST 8: New Session Start
**Input**: "let's start a new session"
**Expected Behavior**:
1. Executes New Session checkpoint
2. Runs date command (copies exactly)
3. Runs git status
4. Loads session-start handler
5. Appends to SESSION.md at end

**Verification Points**:
- [ ] Date command executed
- [ ] Git status checked
- [ ] SESSION.md updated at end
- [ ] TodoWrite initialized

### TEST 9: Continue Work (Continuation Intent)
**Input**: "continue the header component work"
**Expected Behavior**:
1. Recognizes CONTINUATION intent
2. Checks TodoWrite first
3. Finds active work context
4. Resumes from correct point

**Verification Points**:
- [ ] Continuation intent recognized
- [ ] TodoWrite checked first
- [ ] Context properly restored
- [ ] Work resumed correctly

### TEST 10: File Creation with Wrong Tool
**Input**: "create a new component file Button.tsx"
**Expected Behavior**:
1. File creation detected
2. Convention gate checks tool selection
3. Must use Write tool (NOT Serena)
4. If about to use Serena, STOP
5. Switch to correct tool

**Verification Points**:
- [ ] Tool selection checked
- [ ] Write/Edit tool used
- [ ] Serena NOT used for file creation
- [ ] Convention enforcement worked

## Test Execution Instructions

### For Tester (Next Session):
1. Start fresh session with new CLAUDE.md loaded
2. Execute each test scenario in order
3. Mark verification points as pass/fail
4. Document any unexpected behaviors
5. Note which conventions were skipped

### Success Criteria:
- 90%+ verification points pass
- No use of Serena for file edits
- All append-only operations correct
- Convention gates prevent violations
- Clear exception handling

### Failure Patterns to Watch:
1. Using Serena for file operations
2. Skipping convention checks
3. Inserting in middle of append-only files
4. Making claims without evidence
5. Not loading handlers from templates

## Expected Results Summary

If the execution engine works correctly:
- Requests are parsed into clear intents
- Handlers are loaded from template files
- Conventions are checked BEFORE actions
- Correct tools are selected automatically
- Append-only files are respected
- Exceptions are handled gracefully

## Notes for Next Session

When you restart Claude:
1. The new CLAUDE.md should auto-load
2. Run through these test scenarios
3. Create a results file: TEST-RESULTS-EXECUTION-ENGINE.md
4. Document pass/fail for each test
5. Identify any patterns in failures

Remember: The goal is to verify that embedded execution logic works better than external navigation!