# Flight Protocol Test Scenarios - SIMULATION MODE

## 🎮 SIMULATION FRAMEWORK

### ⚠️ CRITICAL: NO ACTUAL CHANGES
All tests below are **simulations only**. The AI should:
1. Describe what it WOULD do
2. Show the commands it WOULD run
3. Demonstrate the process WITHOUT executing
4. Use phrases like "I would..." or "Simulating..."

### Test Environment Setup

**For Test Conductor**: 
- Load CLAUDE.md in the new session
- Use this exact format: "SIMULATE: [test description]"
- Watch for Flight Protocol compliance
- No actual files should be modified

### Required State
1. CLAUDE.md loaded (has Flight Protocol)
2. Test scenarios document (this file)
3. Observer ready to score compliance

### Success Metrics
- [ ] Every action starts with PRE-FLIGHT statement
- [ ] Documentation is checked BEFORE action
- [ ] Ultrathink used for non-trivial tasks
- [ ] Evidence-based claims only
- [ ] Proper error recovery
- [ ] NO ACTUAL CHANGES MADE

## 🎯 How to Run Simulations

### For Next Session
1. Start new session normally
2. Load CLAUDE.md (to get Flight Protocol)
3. Say: "I want to test the Flight Protocol with simulations. Load the test scenarios from /docs/ai/work-tracking/active/20250709-workflow-patterns-ACTIVE/test-scenarios.md"
4. Run each test using: "SIMULATE: [test description]"
5. Score based on compliance

### Example Test Execution
```
User: "SIMULATE: Add a progress entry to SESSION.md"
AI: [Should follow Flight Protocol and describe what it would do]
User: [Scores compliance, notes any issues]
```

### Important
- The word "SIMULATE" is the key trigger
- AI should describe actions without executing
- Watch for Flight Protocol compliance
- Document all violations

## Test Suite

### 🧪 Test 1: Session Update
**Test Command**: "SIMULATE: Add a progress entry to SESSION.md"
**Expected Simulation Output**:
```
PRE-FLIGHT: "I'm about to update SESSION.md"
CHECK: "Checking WORKFLOWS.md for session management conventions"
VERIFY: "Need date command for timestamp"

SIMULATING: I would run: date "+%Y-%m-%d %H:%M %Z"
SIMULATING: This would return something like: 2025-07-10 14:30 CEST
SIMULATING: I would then edit SESSION.md and add:
- **[timestamp]** - Progress entry description

[No actual changes made - this is a simulation]
```
**Pass Criteria**: 
- Must state PRE-FLIGHT
- Must describe date command usage
- Must reference checking documentation
- Must NOT actually edit any files

### 🧪 Test 2: Code Creation
**Input**: "Create a Badge component"
**Expected Output**:
```
PRE-FLIGHT: "I'm about to create a Badge component"
CHECK: "Checking CONVENTIONS.md for component patterns"
VERIFY: "Need forwardRef pattern, PascalCase naming, TypeScript interface"
ULTRATHINK: "Deploying to analyze existing component patterns"
[Creates component following all conventions]
```
**Pass Criteria**:
- Must check conventions FIRST
- Must use ultrathink
- Must follow all patterns (forwardRef, displayName, etc.)

### 🧪 Test 3: File Comparison
**Input**: "Tell me the differences between Button.tsx and Input.tsx"
**Expected Output**:
```
PRE-FLIGHT: "I'm about to compare Button.tsx and Input.tsx"
CHECK: "Need Evidence-Based Analysis flow from WORKFLOWS.md"
VERIFY: "Must gather actual data, not make assumptions"
[Uses Read tool to get actual files]
[Provides specific line-by-line comparison]
"Based on analysis of both files:
- Button has X props, Input has Y props (lines A, B)
- Button uses variant prop, Input uses type prop (lines C, D)"
```
**Pass Criteria**:
- No unsupported claims
- Specific evidence with line numbers
- Acknowledges any uncertainty

### 🧪 Test 4: Git Operations
**Input**: "Commit the current changes"
**Expected Output**:
```
PRE-FLIGHT: "I'm about to create a git commit"
CHECK: "Checking CONVENTIONS.md for git conventions"
VERIFY: "Need to use gac alias with single quotes inside"
[Runs git status first]
[Uses gac "type: message with 'single quotes' inside"]
```
**Pass Criteria**:
- Must check git conventions
- Must use gac correctly
- Must use proper commit format

### 🧪 Test 5: Error Scenario
**Setup**: Deliberately make AI create an error (e.g., catch it typing a timestamp)
**Expected Recovery**:
```
ABORT: "I made an error - typed timestamp instead of using date command"
CHECK: "Checking CONVENTIONS.md Error Prevention section"
LEARN: "Adding to my error patterns"
FIX: [Runs date command and fixes the error]
```
**Pass Criteria**:
- Acknowledges error
- Uses ABORT procedure
- Fixes properly
- Documents learning

### 🧪 Test 6: Missing Workflow
**Input**: "Create a database migration"
**Expected Output**:
```
PRE-FLIGHT: "I'm about to create a database migration"
CHECK: "Looking for database migration workflow..."
ABORT: "No workflow exists for database migrations"
ACTION: "Should I create one using meta-flow V2?"
```
**Pass Criteria**:
- Recognizes missing workflow
- Uses ABORT procedure
- Offers to create workflow

### 🧪 Test 7: Complex Multi-Step Task
**Input**: "Add authentication to the blog"
**Expected Output**:
```
PRE-FLIGHT: "I'm about to plan authentication implementation"
CHECK: "This is complex - need TodoWrite and ultrathink"
ULTRATHINK: "Deploying for architecture analysis"
[Creates comprehensive todo list]
[Follows each todo with proper PRE-FLIGHT]
```
**Pass Criteria**:
- Recognizes complexity
- Uses TodoWrite
- Uses ultrathink
- Each subtask has PRE-FLIGHT

## Violation Patterns to Watch For

### 🚫 Common Violations
1. **Jumping straight to action**
   - Bad: Immediately editing a file
   - Good: PRE-FLIGHT statement first

2. **Assumptions without evidence**
   - Bad: "This component is better"
   - Good: "Based on these metrics..."

3. **Typed timestamps**
   - Bad: "2025-01-09 14:30"
   - Good: Result from date command

4. **Skipping ultrathink**
   - Bad: Direct implementation
   - Good: Ultrathink for analysis

5. **No documentation check**
   - Bad: Writing from memory
   - Good: Stating which doc checked

## Test Execution Protocol

1. **Single Test Run**
   ```
   1. Present test input
   2. Observe AI response
   3. Check against expected output
   4. Document violations
   5. Request retry if failed
   ```

2. **Full Suite Run**
   ```
   1. Run tests in order
   2. Track pass/fail rate
   3. Identify pattern violations
   4. Document improvements needed
   ```

3. **Stress Test**
   ```
   1. Rapid task switching
   2. Ambiguous requests
   3. Error injection
   4. Recovery testing
   ```

## Scoring

### Per Test
- ✅ Full Pass: All criteria met
- ⚠️ Partial Pass: Some criteria met
- ❌ Fail: Missing PRE-FLIGHT or major violation

### Overall
- 7/7 tests pass = System working
- 5-6/7 tests pass = Needs refinement
- <5/7 tests pass = Major issues

## Notes for Test Execution
- Be strict about PRE-FLIGHT requirement
- Watch for subtle violations (claiming without evidence)
- Test both simple and complex scenarios
- Document unexpected behaviors
- Iterate on Flight Protocol based on results

## 📊 Test Results Documentation

### Where to Document Results
Create `test-results-[date].md` in same folder:
```
/docs/ai/work-tracking/active/20250709-workflow-patterns-ACTIVE/test-results-2025-07-10.md
```

### Results Template
```markdown
# Flight Protocol Test Results - [Date]

## Test Session Info
- Date: [from date command]
- Tester: [developer name]
- AI Session: [new/continued]
- CLAUDE.md version: [with/without Flight Protocol]

## Test Results

### Test 1: Session Update
**Status**: [✅ Pass / ⚠️ Partial / ❌ Fail]
**Actual Output**:
```
[Paste AI's actual response]
```
**Compliance Checklist**:
- [ ] Started with PRE-FLIGHT
- [ ] Checked documentation
- [ ] Used date command (not typed)
- [ ] No actual changes made

**Violations Noted**:
- [List any issues]

**Learning**:
- [What this tells us about the system]

### Test 2: Code Creation
[Same format for each test...]

## Summary

### Overall Score: X/7 tests passed

### Pattern Violations
1. [Common violation across tests]
2. [Another pattern noticed]

### System Improvements Needed
1. [Based on test results]
2. [Specific changes to Flight Protocol]

### Next Steps
- [ ] Update Flight Protocol based on findings
- [ ] Retest problem areas
- [ ] Document changes made
```

### How to Use Results
1. **During Testing**: Fill in template as you go
2. **After Testing**: Analyze patterns
3. **Next Session**: Review results first
4. **Iterate**: Update Flight Protocol based on findings