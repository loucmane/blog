# Settled Decisions - Claude Template System

## Purpose
This document captures all settled architectural and design decisions for the Claude Template System. These decisions have been thoroughly discussed and should NOT be revisited without compelling new evidence. This prevents circular discussions and maintains forward momentum.

## Core Architecture Decision: 5-File Modular Structure

### Decision
Split the monolithic CLAUDE.md (1400+ lines) into 5 focused files:
1. **CLAUDE-NEW.md** (~150 lines) - Navigation hub
2. **WORKFLOWS.md** (~400 lines) - Universal patterns
3. **TOOLS.md** (~300 lines) - MCP configurations
4. **CONVENTIONS.md** (~200 lines) - Standards
5. **PROJECT.md** (~300 lines) - Project-specific content

### Rationale
- **Context Efficiency**: AI loads 200-600 lines instead of 1400
- **Task-Specific Loading**: Only load files relevant to current task
- **Clear Separation**: Each file has one clear purpose
- **Maintainability**: Easier to update specific sections
- **Reduced Friction**: Less scrolling, clearer navigation

### Why Not Other Structures?
- **10+ files**: Too much navigation overhead
- **3 files**: Still too much irrelevant content per file
- **Single file**: Current pain point - too much loaded every time

## Implementation Strategy: Extraction-First

### Decision
Extract content from the working CLAUDE.md rather than creating templates from scratch.

### Rationale
- **Proven Patterns**: CLAUDE.md contains battle-tested workflows
- **No Disruption**: Current system continues working
- **Real Testing**: Can validate on actual project work
- **Safer Approach**: Templates only created after proven to work

### Why Not Template-First?
- **Untested Patterns**: Risk of creating theoretical workflows
- **Disruption Risk**: Might break current productivity
- **Unknown Unknowns**: Might miss important edge cases

## Development Approach: Parallel Systems

### Decision
Keep current CLAUDE.md active while developing new modular system.

### Rationale
- **Zero Downtime**: No interruption to current work
- **A/B Testing**: Can compare efficiency directly
- **Easy Rollback**: If issues arise, original still works
- **Gradual Migration**: Can move section by section if needed

### Safety Mechanisms
1. Both systems available simultaneously
2. Clear file naming (CLAUDE-NEW.md vs CLAUDE.md)
3. Test on real work before switching
4. Document any missing pieces discovered

## Knowledge Persistence System

### Decision
Create three files to maintain knowledge across sessions:
- **DECISIONS.md** - This file, settled decisions
- **EVOLUTION.md** - Journey timeline and insights
- **SESSION-BRIDGE.md** - Exact handoff instructions

### Rationale
- **Prevent Repetition**: Don't revisit settled debates
- **Maintain Momentum**: Clear next steps always available
- **Learning History**: Can see how understanding evolved
- **Efficient Handoffs**: New sessions start productively

### Implementation
- Created at start of Phase 1
- Referenced in all key documents
- Updated as new decisions are made
- Checked at start of each session

## System Identity: Modular Claude Documentation

### Decision
This is a modular evolution of AI documentation systems.

### Rationale
- **Builds on Success**: Previous systems proven valuable but had friction
- **Simpler Structure**: 5 files vs deep directory trees
- **Better Integration**: Workflow-centric vs tool-centric
- **Natural Evolution**: Not starting from zero

### Key Improvements
1. **Flatter structure** - Easier navigation
2. **Workflow focus** - Tools serve workflows, not vice versa
3. **Built-in persistence** - Knowledge accumulation by design
4. **Context aware** - Load only what's needed

## Meta-Improvement Philosophy

### Decision
Improve our workflows WHILE building the new system.

### Rationale
- **Immediate Value**: Benefits start now, not later
- **Real Testing**: Improvements tested on actual work
- **Documentation**: Meta-process captured in BUILDING-BETTER.md
- **Continuous Evolution**: System improves through use

### Examples
- Enhanced tracker with more detail
- Better memory patterns discovered through use
- Refined session handoff procedures
- Improved cross-referencing patterns

## File Naming Convention

### Decision
Use UPPERCASE.md for core system files, lowercase for supporting docs.

### Rationale
- **Visual Hierarchy**: Core files stand out immediately
- **Quick Recognition**: Can spot system files at a glance
- **Consistency**: All core files follow same pattern
- **Proven Pattern**: Common in many projects (README.md, etc.)

## Cross-Reference Strategy

### Decision
Every file must have smart navigation - no dead ends.

### Implementation
- "See also" sections in each file
- Quick links for common task paths
- Context-aware helpers ("If doing X, see Y")
- Back-references to navigation hub

### Rationale
- **Reduces Friction**: Always know where to go next
- **Progressive Learning**: AI learns structure through use
- **User Friendly**: Humans can navigate easily too

## Testing Before Templates

### Decision
Must prove system works on real project before creating templates.

### Success Criteria
1. No lost functionality vs current system
2. Measurably faster AI loading
3. No workflow friction noticed
4. All cross-references working
5. Used successfully for multiple sessions

### Rationale
- **Avoid Theoretical Solutions**: Templates must be practical
- **Real-World Validation**: Catches edge cases
- **Confidence**: Know it works before sharing/reusing

## Manual Setup Initially

### Decision
Start with manual setup process, automate only if friction appears.

### Rationale
- **Simplicity**: No complex scripts to maintain
- **Flexibility**: Easy to customize per project
- **Learning**: Understand what's really needed
- **YAGNI**: Don't automate until proven necessary

### Future Automation Triggers
- If setup takes >5 minutes repeatedly
- If same customizations needed often
- If error-prone manual steps identified

---

## Meta-Note on This Document

This document itself demonstrates the value of knowledge persistence. By clearly documenting what we've decided and why, we:
1. Save time in future sessions
2. Prevent "but what if we..." discussions
3. Maintain clear direction
4. Build on solid foundations

Last Updated: 2025-01-05
Next Review: After Phase 3 completion