# Behavior Testing Plan

## Overview
Test all 13 untested behaviors from the coverage matrix to verify they work as designed.

## Testing Priority (Based on Usage Frequency)

### Phase 1: Core Development Behaviors
1. **Work Tracking** ✅ (just tested by creating this folder!)
   - Trigger: "work on", "start new"
   - Expected: Create folder, initialize files
   - Status: PASSED - folder created successfully

2. **File Operations**
   - Trigger: Before any file edit
   - Expected: Check conventions first
   - Test: Try to edit a file, see if conventions checked

3. **Tool Selection**
   - Trigger: Search/find operations
   - Expected: Use Serena for code, Grep for text
   - Test: Various search scenarios

4. **Task Management**
   - Trigger: Start of work
   - Expected: TodoWrite usage
   - Test: New task creation

### Phase 2: Process Behaviors
5. **Development Work**
   - Trigger: "implement", "build"
   - Expected: Full workflow execution
   - Test: Small feature implementation

6. **Git Operations (gac)**
   - Trigger: "gac" mention
   - Expected: Format checking, no double quotes
   - Test: Commit message creation

7. **Session Management**
   - Trigger: "start session"
   - Expected: Proper SESSION.md structure
   - Test: New session creation

### Phase 3: Quality Behaviors
8. **Evidence & Claims**
   - Trigger: Making assertions
   - Expected: Gather proof first
   - Test: Claim about code behavior

9. **Testing & Validation**
   - Trigger: Before marking complete
   - Expected: User testing checkpoint
   - Test: Feature completion flow

10. **Error Recovery**
    - Trigger: Errors/failures
    - Expected: Check recovery matrix
    - Test: Simulated errors

### Phase 4: Advanced Behaviors
11. **Context Detection**
    - Trigger: Request analysis
    - Expected: Dev vs chat mode
    - Test: Various request types

12. **Memory Usage**
    - Trigger: Session end/handoff
    - Expected: Create memory
    - Test: Session completion

13. **Compaction Detection**
    - Trigger: Context size
    - Expected: Warning/action
    - Test: Large context scenario

## Testing Methodology
1. Document trigger scenario
2. Execute the trigger
3. Observe actual behavior
4. Compare with expected behavior
5. Document gaps/issues
6. Rate enforcement strength (Strong/Weak/Missing)