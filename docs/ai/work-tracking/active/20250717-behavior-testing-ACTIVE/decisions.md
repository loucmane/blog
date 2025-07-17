# Behavior Testing Decisions

## Decision Log

### 2025-07-17: Create Separate Work Folder
- **Decision**: Create new folder for behavior testing instead of continuing in navigation folder
- **Rationale**: 
  - Navigation work complete (72.5% improvement achieved)
  - Different focus area deserves separate tracking
  - Tests Work Tracking behavior by using it
- **Result**: Clean separation and successful behavior test

### 2025-07-17: Test by Using, Not Simulating
- **Decision**: Test behaviors through actual use rather than simulation
- **Rationale**:
  - Real usage reveals actual gaps
  - Natural enforcement through practice
  - More authentic test results
- **Example**: Created work folder to test Work Tracking

### 2025-07-17: Document All Gaps
- **Decision**: Document every instance where behavior doesn't trigger
- **Rationale**:
  - Patterns emerge from multiple examples
  - Helps identify systemic issues
  - Provides evidence for improvements

## Testing Approach Decisions

### Priority Order
1. **Core Development** - Most frequently used
2. **Process Behaviors** - Critical workflows
3. **Quality Behaviors** - Important but less frequent
4. **Advanced Behaviors** - Edge cases

### Success Criteria
- Behavior triggers when expected
- Handler executes correctly
- Conventions are followed
- Gaps are documented

## Future Considerations
- May need to modify CLAUDE.md for stronger enforcement
- Consider behavioral "gates" that can't be skipped
- Look for patterns in successful vs failed behaviors

### 2025-07-17: First Question Protocol
- **Decision**: Use questions instead of gates for enforcement
- **Rationale**:
  - Gates/OS metaphor didn't work before
  - Questions create natural cognitive pause
  - Wrong answers are visible accountability
  - Simple enough to actually use
- **Design**: "What behavior should trigger for this request?"
- **Implementation**: Add to top of CLAUDE.md as first thing to answer