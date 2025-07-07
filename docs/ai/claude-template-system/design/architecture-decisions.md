# Claude Template System - Architecture Decisions

## Decision Date: 2025-01-03

## Context
The current CLAUDE.md file has grown to over 1400 lines, mixing universal workflows with project-specific details. This creates challenges:
- AI loads unnecessary content for many tasks
- Difficult to maintain and update
- Hard to reuse across projects
- Mixing of concerns (workflows vs project details)

## Decision: Modular File Architecture

### Chosen Approach
Split CLAUDE.md into 5 focused files with clear separation of concerns:

1. **CLAUDE.md** (~150 lines) - Navigation hub
2. **WORKFLOWS.md** (~400 lines) - Universal patterns  
3. **TOOLS.md** (~300 lines) - MCP configurations
4. **CONVENTIONS.md** (~200 lines) - Standards
5. **PROJECT.md** (~300 lines) - Project specifics

### Rationale

#### 1. Context-Aware Loading
- AI loads only relevant files for each task type
- Feature work: CLAUDE + PROJECT + WORKFLOWS
- Bug fixes: CLAUDE + PROJECT + maybe CONVENTIONS
- Meta work: CLAUDE + WORKFLOWS mainly
- Reduces from 1400 lines to 200-600 lines per session

#### 2. Maintainability
- Each file has single responsibility
- Updates happen in one place
- Clear ownership of content

#### 3. Reusability
- Universal patterns (WORKFLOWS) separated from project details
- Easy to create templates after proven to work
- Project-specific content clearly isolated

#### 4. Progressive Enhancement
- Start with minimal CLAUDE.md
- Load more detail as needed
- Quick links for common paths

## Alternatives Considered

### 1. Keep Monolithic CLAUDE.md
- **Pros**: No change, everything in one place
- **Cons**: Growing unmaintainable, loads unnecessary content
- **Rejected**: Scaling issues already apparent

### 2. Many Small Files (10+)
- **Pros**: Very granular, ultimate flexibility
- **Cons**: Too much friction, hard to navigate
- **Rejected**: Over-engineering for personal use

### 3. Two Files (Universal + Project)
- **Pros**: Simple split
- **Cons**: Still too large, poor organization
- **Rejected**: Doesn't solve context-aware loading

## Implementation Strategy

### Phase 1: Extraction (Not Templates)
- Extract from working CLAUDE.md
- Preserve exact patterns that work
- Test in parallel with current system

### Phase 2: Refinement
- Use both systems side by side
- Note friction points
- Add navigation helpers

### Phase 3: Templating
- Only after proven to work
- Replace project-specific with placeholders
- Create reusable system

## Friction Mitigation

### Concerns
- Multiple file reads instead of one
- Knowing where to look
- Extra complexity

### Solutions
1. **Smart Navigation** in CLAUDE.md
   - Quick links for common tasks
   - Clear file purposes
   - Decision trees

2. **Cross-References**
   - "See also" sections
   - Contextual links
   - No dead ends

3. **Gradual Learning**
   - AI learns file structure quickly
   - Can cache in Serena memory
   - Becomes natural after few uses

## Success Criteria

1. **No Lost Functionality** - Everything from current system preserved
2. **Faster Loading** - AI loads 50-70% less content per task
3. **Easier Maintenance** - Clear where to update things
4. **Proven Through Use** - Test on real work before templating
5. **Low Friction** - No noticeable slowdown in workflow

## Rollback Plan

- Keep current CLAUDE.md as active system
- Develop new structure in parallel
- Easy reversion if new system doesn't work
- No disruption to current workflow

## Future Considerations

- Could add task-specific quick reference cards
- Might benefit from Serena memory of file purposes
- Consider automation only if manual process proves painful
- Possible framework-specific extensions later