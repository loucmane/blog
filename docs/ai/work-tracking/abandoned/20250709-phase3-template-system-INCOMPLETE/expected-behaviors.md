# Expected Behaviors - New Template System

## Purpose
Document what SHOULD happen with the new system so we can identify deviations during actual use.

## Session Start Behaviors

### Expected Flow
1. **CLAUDE.md loads** → Should see navigation hub (3.9KB file)
2. **Quick scan** → Should immediately see:
   - Critical reminders (SESSION.md first)
   - Quick commands to copy
   - Clear navigation options
3. **Natural path** → Should navigate to WORKFLOWS.md for session management
4. **No confusion** → Should NOT:
   - Load all files at once
   - Wonder where to start
   - Create scattered documentation

### SESSION.md Update
**Expected**: 
- AI sees "SESSION.md First!" reminder
- AI navigates to WORKFLOWS.md via link
- AI finds pre-flight checklist
- AI runs actual date command (not from memory)
- Session entry created correctly

**Potential Deviation**:
- AI might skip SESSION.md update
- AI might not follow link to WORKFLOWS.md
- AI might type dates from memory

## Work Organization Behaviors

### Creating Work Documentation
**Expected**:
- AI evaluates if this needs formal work tracking
- For major work: Creates ONE folder for entire initiative
- For minor work: Documents in SESSION.md only
- Follows naming convention: YYYYMMDD-phase-topic-STATUS

**Potential Deviation**:
- Creates multiple folders for related work
- Creates folder for every small task
- Wrong date format in folder names
- Creates documentation instead of doing work

### Using the 6-File Structure
**Expected**:
- Only for significant multi-session work
- Files get populated with actual content
- handoff.md enables real continuity
- Not every task needs all 6 files

**Potential Deviation**:
- Creates 6 files for trivial tasks
- Files remain mostly empty templates
- No real value from the structure

## Todo Management Behaviors

### TodoWrite Usage
**Expected**:
- Proactive use for complex tasks (3+ steps)
- Real-time status updates
- One task in_progress at a time
- Immediate completion marking

**Potential Deviation**:
- Not using todos at all
- Creating todos after work is done
- Multiple tasks in_progress
- Batch marking completions

## Navigation Behaviors

### Cross-File Navigation
**Expected**:
- Start at CLAUDE.md hub
- Navigate to specific file for specific need
- Don't load unnecessary files
- Return to hub when lost

**Potential Deviation**:
- Loading all files "just in case"
- Getting lost in file maze
- Not using hub for navigation
- Creating circular references

### Tool Discovery
**Expected**:
- Clear distinction: built-in vs MCP tools
- Navigate to TOOLS.md when configuring MCP
- Quick reference in CLAUDE.md sufficient for basics

**Potential Deviation**:
- Confusion about which tools are available
- Not finding tool configurations
- Loading TOOLS.md unnecessarily

## Orchestration Behaviors

### When to Deploy Specialists
**Expected**:
- Natural recognition: "This needs specialized expertise"
- No complex scoring system
- User testing checkpoints preserved
- Clear handoffs between specialists

**Potential Deviation**:
- Still thinking in "complexity scores"
- Deploying specialists prematurely
- Skipping user checkpoints
- Poor specialist coordination

## Documentation Behaviors

### When to Create Documents
**Expected**:
- Documentation serves clear purpose
- Created during work, not about work
- Integrated where it will be used
- Focuses on doing, not planning

**Potential Deviation**:
- Creating docs about creating docs
- Over-planning without implementation
- Scattered files not integrated anywhere
- Documentation for documentation's sake

## Common Pitfalls to Watch

### From Old System
1. **Monolithic Thinking**: Trying to load everything at once
2. **Over-Documentation**: Creating files instead of doing work
3. **Sequential Processing**: Not recognizing when to parallelize
4. **Memory Dependence**: Not using actual commands

### New System Risks
1. **Hub Abandonment**: Not returning to CLAUDE.md for navigation
2. **Link Fatigue**: Too many clicks to find information
3. **Context Loss**: Information spread too thin across files
4. **Work Proliferation**: Same problem in new system

## Success Criteria

The new system is working if:
- ✅ Faster time to productive work
- ✅ Less documentation about documentation
- ✅ Natural work organization (one folder per initiative)
- ✅ Clear navigation without getting lost
- ✅ Appropriate tool/specialist deployment
- ✅ Real session continuity

## Key Questions for Testing

1. Does the hub actually help or add extra steps?
2. Is work tracking still creating multiple folders?
3. Are specialists deployed at right times?
4. Is navigation intuitive or confusing?
5. Does modular structure help or hinder?
6. Are old habits persisting despite new structure?

## What to Track in Next Session

When you start with new CLAUDE.md:
1. **Time** from start to first productive action
2. **Path** taken through the files
3. **Confusion** moments (document each)
4. **Deviations** from expected behaviors
5. **Successes** where it works as designed
6. **Surprises** (unexpected behaviors)

Remember: We're looking for honest assessment of what actually happens vs what we designed to happen.