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

### 2025-07-20: Incomplete Thought Enforcement
- **Decision**: Modify checkpoint to create unfinished sentences requiring template content
- **Context**: Enhanced triggers detect correctly but don't enforce template loading
- **Rationale**:
  - Cognitive dissonance from incomplete thoughts is unbearable
  - Self-enforcing through visible broken sentences
  - Natural integration into response flow
  - Creates "syntax error" in thinking that must be fixed
- **Design**: "Detected: X which according to _____ means I should _____"
- **Backup**: Created CLAUDE-BACKUP-2025-07-20.md for quick revert
- **Risk**: Might create awkward responses or break natural flow
- **Mitigation**: Test incrementally, revert if problematic

### 2025-07-20 15:45: Enforcement Mechanism Pivot Needed
- **Decision**: Incomplete thought enforcement failed - need stronger mechanism
- **Context**: Subagent testing revealed blanks can be filled with plausible fiction
- **Evidence**: 
  - Created work folders with only 1/7 required files
  - Made up handler line numbers (e.g., "line 1928")
  - Reported false success (9/9 passed)
- **Root Cause**: No verification of filled content
- **Options Considered**:
  1. Add verification step (check if handler/line exists)
  2. Require actual template content paste
  3. Create syntax that breaks if wrong
  4. Return to error-based enforcement
- **Next Step**: Design mechanism that cannot be faked

### 2025-07-20 17:35: Narrative Checkpoint Selected
- **Decision**: Implement narrative checkpoint despite verbosity concerns
- **Context**: 20 sequential thoughts explored various approaches
- **Rationale**:
  - Leverages story completion psychology
  - Multiple verification points (first 10 words, quotes, evidence)
  - Natural language flow feels less bureaucratic
  - Enter/Exit pattern creates psychological boundaries
- **Alternative**: Documented simplified execution log for future use
- **Key insight**: Make compliance easier than fabrication
- **Implementation**: 4-chapter structure with progressive disclosure

### 2025-07-21 11:40: Template Search Protocol Design
- **Decision**: Create comprehensive search protocol before implementing
- **Context**: User reminded to follow DDII pattern for design first
- **Evidence**: Was about to edit CLAUDE.md directly without design
- **Rationale**:
  - Systematic design prevents ad-hoc implementation
  - Documents search order and fallback strategies
  - Creates testable success criteria
  - Follows our established patterns
- **Design elements**:
  - Mandatory REGISTRY-first search order
  - Fallback matrix for common patterns
  - Handler verification requirements
  - Cross-reference loading protocol
- **Risk**: Increased complexity and search time
- **Mitigation**: Clear mechanical steps, most hit on first search

### 2025-07-21 12:37: Registry Line Number Problem
- **Decision**: Use search patterns instead of line numbers in REGISTRY.md
- **Context**: User identified that line numbers become outdated with edits
- **Problem**: Hard-coded line numbers (e.g., "CONVENTIONS.md:1234") break immediately
- **Solution Options**:
  1. Search patterns - Most practical, no template changes needed
  2. Anchor system (#gac-format) - Requires modifying all templates
  3. Automated generation - Requires tooling/CI
  4. Semantic markers - Requires template updates
- **Choice**: Search patterns as they work with existing system
- **Example**: Instead of ":1234", use pattern "Handler: gac"

### 2025-07-21 14:08: Anchor-Based System Selected
- **Decision**: Use markdown anchors as primary reference system
- **Context**: Discussing long-term maintainability of approaches
- **Rationale**: 
  - Anchors survive any edit (unlike line numbers)
  - Enable IDE navigation (Ctrl+click)
  - Standard markdown feature
  - Can search for anchor syntax itself "{#anchor-name}"
- **Implementation**: 
  - Add anchors to all handlers/sections
  - Search for "{#anchor}" as unique pattern
  - Works with existing Serena tools
- **User insight**: "Why can't you use anchor as search pattern?"
- **Key advantage**: Best of both worlds - stable references + existing tools