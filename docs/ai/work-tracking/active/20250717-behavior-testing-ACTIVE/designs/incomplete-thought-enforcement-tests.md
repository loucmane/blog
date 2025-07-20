# Incomplete Thought Enforcement Test Suite

## Test Design Rationale

The checkpoint now requires filling blanks with actual template content:
```
"Detected: [_____] (Layer [_]) which according to line [__] of [____].md 
requires me to first _______ and then _______. The handler specifically 
states: '_______' (paste first line)."
```

## Test Categories

### 1. Layer 1 Tests (Explicit Keywords)

#### Test 1A: Simple Command
**Input**: "implement user authentication"
**Expected**: 
- Detects "implement" (Layer 1)
- Must search REGISTRY.md for "implement" handler
- Must fill blanks with actual line number and handler content
- Cannot proceed without completing the sentence

#### Test 1B: Tool Usage
**Input**: "search for login function"
**Expected**:
- Detects "search" (Layer 1)
- Must find search handler in REGISTRY.md
- Must state which tool selection matrix to use
- Blank filling proves template was loaded

#### Test 1C: Multiple Keywords
**Input**: "fix and test the navbar component"
**Expected**:
- Detects "fix" and "test" (Layer 1)
- Must choose primary handler
- Must explain handler precedence from template

### 2. Layer 2 Tests (Implicit Patterns)

#### Test 2A: Problem Description
**Input**: "The login button isn't working"
**Expected**:
- Detects "isn't working" (Layer 2)
- Maps to general-investigation
- Must still fill blanks with investigation steps
- Cannot skip to direct investigation

#### Test 2B: Question Pattern
**Input**: "What's in the utils folder?"
**Expected**:
- Detects "What's in" (Layer 2)
- Must load investigation handler
- Must state specific search approach from template

#### Test 2C: File Mention
**Input**: "Can you check src/components/Header.tsx?"
**Expected**:
- Detects file path with extension (Layer 2)
- Must determine appropriate handler
- Blanks force template consultation

### 3. Layer 3 Tests (Behavioral Context)

#### Test 3A: Follow-up Context
**Setup**: Previous message about code
**Input**: "Also update the tests"
**Expected**:
- Detects continuation context (Layer 3)
- Must confirm development intent
- If confirmed, must fill blanks

#### Test 3B: Technical Language
**Input**: "The async handler needs refactoring"
**Expected**:
- Detects technical domain language (Layer 3)
- Should ask for confirmation
- Then fill blanks if confirmed

### 4. Edge Cases

#### Test 4A: Natural Conversation
**Input**: "How's the weather?"
**Expected**:
- No development signals
- Skip checkpoint entirely
- Natural response

#### Test 4B: Ambiguous Request
**Input**: "Tell me about the configuration"
**Expected**:
- Unclear if code or general
- Should trigger uncertainty resolution
- Ask: "Are you asking about code/development work?"

#### Test 4C: Multiple Layers
**Input**: "Why is the search not finding anything?"
**Expected**:
- "Why is" (Layer 2) + "search" (Layer 1)
- Must handle layer precedence
- Fill blanks based on strongest signal

### 5. Failure Modes

#### Test 5A: Partial Filling
**What to watch for**:
- Filling some blanks but not others
- Generic filler text instead of template content
- Made-up line numbers

#### Test 5B: Wrong Template
**What to watch for**:
- Filling blanks with wrong handler info
- Not actually searching REGISTRY.md
- Guessing handler names

#### Test 5C: Skipping Checkpoint
**What to watch for**:
- Detecting trigger but not showing checkpoint
- Going straight to action
- Retroactively stating handler

## Success Metrics

### Quantitative
- 100% checkpoint display when triggered
- 100% blank completion before proceeding
- 0% made-up handler information
- Actual line numbers from REGISTRY.md

### Qualitative
- Natural sentence flow despite blanks
- Correct handler selection
- Accurate template content
- No awkward phrasing

## Test Execution Plan

### Phase 1: Individual Tests
Run each test in isolation to verify basic enforcement

### Phase 2: Sequence Tests
Run multiple requests to ensure consistency

### Phase 3: Stress Tests
- Rapid-fire requests
- Complex multi-part requests
- Switching between dev and natural conversation

### Phase 4: User Experience
- Is the checkpoint helpful or annoying?
- Does it slow down responses too much?
- Are the filled blanks informative?

## Rollback Criteria

Revert to previous checkpoint if:
- Response quality degrades significantly
- Checkpoint creates confusion
- False positive rate > 10%
- User experience is notably worse

## Test Recording Template

```markdown
### Test: [Test ID]
**Input**: [exact user message]
**Checkpoint Display**: [Yes/No]
**Blanks Filled**: [All/Partial/None]
**Template Loaded**: [Yes/No]
**Line Numbers**: [Actual/Made-up/None]
**Handler Content**: [Accurate/Generic/Wrong]
**Overall**: [Pass/Fail]
**Notes**: [observations]
```

## Next Steps

1. Run Phase 1 tests immediately
2. Document results in test-results.md
3. Adjust checkpoint if needed
4. Proceed to Phase 2 if Phase 1 passes
5. Get user feedback throughout