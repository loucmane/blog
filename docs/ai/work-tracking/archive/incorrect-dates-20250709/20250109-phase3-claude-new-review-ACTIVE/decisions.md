# CLAUDE-NEW.md Review - Decision Record

## Context
User feedback from 2025-01-08 identified multiple gaps in CLAUDE-NEW.md. Need to decide how to restructure while maintaining its role as a concise navigation hub.

## Decisions Made

### 1. Add Quick Reference Section at Top
**Decision**: Create new section with 5-7 most-used items
**Rationale**: Experienced users need instant access to common commands
**Alternatives Considered**: 
- Sidebar approach - Rejected: Doesn't work well in terminal
- Footer approach - Rejected: Requires scrolling
**Trade-offs**: Adds 10-15 lines but massive time savings

### 2. Reorganize Quick Actions by Frequency
**Decision**: Three-tier frequency system (Daily/Common/Occasional)
**Rationale**: Matches how users actually think about tasks
**Alternatives Considered**:
- By task type - Rejected: Current approach that isn't working
- Alphabetical - Rejected: No logical flow
- By complexity - Rejected: Doesn't help finding items
**Trade-offs**: May need updates as usage patterns change

### 3. Expand Key Principles to 6 Categories
**Decision**: Add Collaboration, Problem-Solving, and Improvement
**Rationale**: Current 3 categories miss critical behaviors
**Alternatives Considered**:
- 10+ categories - Rejected: Too many to remember
- Keep 3 - Rejected: User explicitly said too narrow
**Trade-offs**: Slightly longer but more complete guidance

### 4. Add Common Workflows Section
**Decision**: Include 4-5 most common complete workflows
**Rationale**: Bridges gap between principles and tools
**Alternatives Considered**:
- Link to WORKFLOWS.md only - Rejected: Extra hop slows users
- Embed all workflows - Rejected: Makes doc too long
**Trade-offs**: Adds ~20 lines but prevents constant lookups

### 5. Include "Why" Explanations
**Decision**: Add brief rationale for non-obvious items only
**Rationale**: Builds understanding and compliance
**Alternatives Considered**:
- Why for everything - Rejected: Too verbose
- No explanations - Rejected: Current problem
**Trade-offs**: Adds a few words per item but improves adoption

## Guiding Principles
- Speed of information retrieval is paramount
- Frequency of use should drive organization
- Brief explanations better than none
- Link to details rather than embed everything
- User feedback is the ultimate guide

## Impact Analysis
- **Short-term**: Document grows from 100 to ~130 lines
- **Long-term**: Significant time savings for all users
- **Dependencies**: Other templates may need to update references

## Review Notes
- **Review Date**: After 1 week of use
- **Success Criteria**: Users find info in <10 seconds
- **Adjustment Triggers**: New workflow patterns emerge