# Orchestration Spec Refactor Tracker

**Created**: 2025-06-27 15:25 CEST
**Purpose**: Track refactoring of orchestration files to implement spec architecture pattern
**Problem**: Command file (380 lines) exceeds ~200 line execution threshold

## Problem Statement

After implementing the absolute path solution for worktree isolation, the orchestration command file grew from 295 to 380 lines. Commands over ~200 lines are treated as documentation rather than executable, preventing the orchestration from running.

## Current State

### File Sizes (After Refactoring)
- **Command file**: 275 lines (RESOLVED - was 380)
- **Spec file**: 626 lines (OK - specs can be large, was 414)

### What Made It Large
Each sub-agent needs detailed absolute path instructions:
```
For Performance Sub-Agent 1:
CRITICAL INSTRUCTIONS - USE ABSOLUTE PATHS:
1. Create the .worktrees directory if needed: mkdir -p ${PROJECT_ROOT}/.worktrees
2. Create git worktree at ABSOLUTE path: 
   git worktree add ${PROJECT_ROOT}/.worktrees/task-${task_id}-orch-perf-1 -b task-${task_id}-orch-perf-1
3. Navigate using ABSOLUTE path: cd ${PROJECT_ROOT}/.worktrees/task-${task_id}-orch-perf-1
4. Verify location: pwd (should show the worktree path)
5. All file operations use ABSOLUTE paths: ${PROJECT_ROOT}/.worktrees/task-${task_id}-orch-perf-1/...
THEN implement with focus on: render optimization and initial load performance
```

With 5 specialists × 2-3 sub-agents each = 10-15 sets of these instructions.

## Solution Design

### Pattern to Follow: infinite.md
The infinite command successfully uses external spec files:
- Command file: 181 lines (executes properly)
- Loads specifications from external files
- Same functionality, better organization

### Refactoring Plan

#### Command File Changes
Replace detailed instructions with references:

**Before** (10+ lines per sub-agent):
```markdown
Deploy ${depth} Performance Sub-Agents using the built-in Task function with absolute path instructions:

For Performance Sub-Agent 1:
CRITICAL INSTRUCTIONS - USE ABSOLUTE PATHS:
[... 8-10 lines of instructions ...]
```

**After** (2-3 lines):
```markdown
Deploy ${depth} Performance Sub-Agents using the built-in Task function.
Use deployment instructions from spec Sections 3.1-3.3 for Performance Sub-Agents.
```

#### Spec File Additions
Add new sections for sub-agent deployments:

```markdown
## Sub-Agent Deployment Instructions

### 3.1 Performance Sub-Agent 1
You are Performance Sub-Agent 1 for Task ${task_id}.

CRITICAL INSTRUCTIONS - USE ABSOLUTE PATHS:
1. Create the .worktrees directory if needed: mkdir -p ${PROJECT_ROOT}/.worktrees
2. Create git worktree at ABSOLUTE path: 
   git worktree add ${PROJECT_ROOT}/.worktrees/task-${task_id}-orch-perf-1 -b task-${task_id}-orch-perf-1
3. Navigate using ABSOLUTE path: cd ${PROJECT_ROOT}/.worktrees/task-${task_id}-orch-perf-1
4. Verify location: pwd (should show the worktree path)
5. All file operations use ABSOLUTE paths: ${PROJECT_ROOT}/.worktrees/task-${task_id}-orch-perf-1/...

THEN implement with focus on: render optimization and initial load performance

Context Variables Available:
- Task specification: ${task_spec}
- Contracts: ${contracts}
- Project root: ${PROJECT_ROOT}

### 3.2 Performance Sub-Agent 2
[Similar structure...]

### 3.3 Performance Sub-Agent 3 (if depth=3)
[Similar structure...]
```

## Implementation Checklist

### Phase 1: Preparation
- [x] Create final backup of 380-line command file (backup-380-lines-20250627-1911)
- [x] Create final backup of 414-line spec file (backup-414-lines-20250627-1911)
- [x] Document current line counts

### Phase 2: Spec File Updates
- [x] Add Section 3: Performance Sub-Agent Instructions (3.1, 3.2, 3.3)
- [x] Add Section 4: Architecture Sub-Agent Instructions (4.1, 4.2, 4.3)
- [x] Add Section 5: UX/DX Sub-Agent Instructions (5.1, 5.2, 5.3)
- [x] Add Section 6: Accessibility Sub-Agent Instructions (6.1, 6.2, 6.3)
- [x] Add Section 7: Innovation Sub-Agent Instructions (7.1, 7.2, 7.3)

### Phase 3: Command File Simplification
- [x] Update Performance Specialist section to reference spec
- [x] Update Architecture Specialist section to reference spec
- [x] Update UX/DX Specialist section to reference spec
- [x] Update Accessibility Specialist section to reference spec
- [x] Update Innovation Specialist section to reference spec

### Phase 4: Verification
- [x] Count command file lines (result: 275 lines - acceptable)
- [x] Verify all sub-agent instructions moved to spec
- [x] Check variable references still correct
- [x] Ensure spec loading happens before agent deployment

### Phase 5: Testing
- [x] Test with single specialist: `/orchestrate-and-test 7 default performance 2`
- [x] Verify command executes (not displays as template) - SUCCESS after nested blocks fix
- [x] Check worktrees created with correct paths
- [ ] Test with all specialists if successful

## Success Criteria

1. **Command file reduced significantly** - ✅ 380 → 275 lines (105 lines removed)
2. **All instructions preserved** - Same functionality
3. **Variables work correctly** - ${PROJECT_ROOT} and ${task_id} substituted
4. **Absolute paths used** - Worktree isolation maintained
5. **Command executes** - ✅ CONFIRMED after nested blocks fix

## Risk Mitigation

- Keep all backups until testing confirms success
- Test with single specialist before full orchestration
- Document any issues discovered during testing
- Have rollback plan if refactoring fails

## Notes

- The absolute path solution is proven to work
- This is purely a file organization issue  
- Following established patterns (infinite.md) reduces risk
- Variables will be substituted when command executes properly

## Implementation Results (2025-06-27)

### Option 2 Successfully Implemented
- Created new section "Sub-Agent Deployment Instructions" after Synthesis Orchestrator
- All 15 sub-agent sections added (3.1-3.3, 4.1-4.3, 5.1-5.3, 6.1-6.3, 7.1-7.3)
- Each specialist section in command file now references the spec
- Clean separation of concerns achieved

### Final Metrics
- **Command file**: 275 lines (27.6% reduction from 380)
- **Spec file**: 626 lines (51.2% increase from 414)
- **Net change**: Better organized, command file executable size

## Testing Results (2025-06-28)

### CRITICAL DISCOVERY: Nested Code Blocks Break Execution

**Test Result**: Command still displays as template (not executing)
**Root Cause Found**: NESTED MARKDOWN CODE BLOCKS

The refactoring introduced nested triple-backtick code blocks:
```
Execute these roles in order:
```
   ## Performance Specialist Role
   ```
   ROLE: Performance Specialist...
   ```
```

This nested structure breaks markdown parsing. The working backup (164 lines) used a single TASK block without nesting:
```
TASK: Deploy [N] Specialist Orchestrators in parallel

For each selected specialist:
- Load their definition from orchestrate-test-spec.md
```

**Line count was NOT the issue** - it was the improper markdown structure!

### Solution Required
1. Remove ALL nested code blocks
2. Return to single TASK block pattern for specialist deployment
3. Keep the spec references but fix the markdown structure

## Implementation Plan (2025-06-28)

### Proposed Fix: Remove Nesting While Preserving Functionality

Instead of nested blocks:
```
Execute these roles in order:
```
## Performance Specialist Role
```
ROLE: Performance Specialist...
```
```

Use flat structure:
```
## Performance Specialist Role
If "performance" is in ${specialists}:

TASK: Deploy Performance Specialist Orchestrator

You are now the Performance Specialist. Your focus: speed, efficiency, and optimization.

Actions:
1. Review performance-related contracts from contracts/
2. Deploy ${depth} Performance Sub-Agents using the built-in Task function
   - Load deployment instructions from spec file Section "Sub-Agent Deployment Instructions" → "3. Performance Sub-Agents"
   - Each sub-agent gets its own isolated worktree
3. Log deployments to orchestration.log
4. Transition to next role
```

### What This Preserves:
- ✅ Conditional specialist deployment
- ✅ References to spec sections with sub-agent instructions
- ✅ Absolute path worktree creation for each sub-agent
- ✅ All sophisticated orchestration features
- ✅ No nested markdown blocks

### Expected Outcome:
- Command should execute instead of displaying as template
- Each specialist deploys only if requested
- Sub-agents create individual worktrees using absolute paths
- Full orchestration functionality as designed

## Fix Implementation (2025-06-28 13:15)

### Changes Made
- Removed ALL nested code blocks from orchestrate-and-test.md
- Transformed each specialist section from nested to flat structure
- Removed outer code block wrapper around "SEQUENTIAL ROLE EXECUTION"
- Each specialist now has flat TASK: declaration

### Implementation Details
```
## Performance Specialist Role
If "performance" is in ${specialists}:

TASK: Deploy Performance Specialist Orchestrator

You are now the Performance Specialist. Your focus: speed, efficiency, and optimization.

Actions:
1. Review performance-related contracts from contracts/
2. Deploy ${depth} Performance Sub-Agents using the built-in Task function
   - Load deployment instructions from spec file Section "Sub-Agent Deployment Instructions" → "3. Performance Sub-Agents"
   - Each sub-agent gets its own isolated worktree
3. Log deployments to orchestration.log
4. Transition to next role
```

### Files Updated
- **orchestrate-and-test.md**: 268 lines (down from 275)
- **Backup created**: orchestrate-and-test.md.backup-nested-blocks-[timestamp]
- **All 5 specialists** transformed to flat TASK structure

### What Was Preserved
- ✅ Conditional deployment logic (If "x" is in ${specialists})
- ✅ References to spec sections for sub-agent instructions
- ✅ Absolute path worktree creation (in spec file)
- ✅ All orchestration functionality and flow

### Ready for Testing
The hypothesis is that removing nested code blocks will allow the command to execute properly. The command should now:
1. Parse correctly without nested markdown blocks
2. Execute each specialist conditionally
3. Deploy sub-agents with proper worktree isolation
4. Complete full orchestration flow

## SUCCESS: Command Execution Confirmed (2025-06-28 16:xx)

### Test Results
- ✅ **Command EXECUTED successfully** with `/orchestrate-and-test 7`
- ✅ All phases completed as expected (1-5 + partial 6)
- ✅ Contracts generated properly
- ✅ Master Orchestrator strategy created
- ✅ Performance Specialist role assumed

### Nested Blocks Fix Verified
The removal of nested code blocks successfully fixed the parser issue. The command now:
1. Executes instead of displaying as template
2. Creates proper directory structure
3. Deploys agents as designed
4. Logs progress correctly

## Parallel Deployment Enhancement (2025-06-28 17:xx)

### Issue Discovered
Sub-agents within each specialist were being deployed sequentially, not in parallel.

### Enhancement Applied
Updated all specialist sections to explicitly state parallel deployment:

**Before**:
```
2. Deploy ${depth} Performance Sub-Agents using the built-in Task function
```

**After**:
```
2. Deploy ${depth} Performance Sub-Agents IN PARALLEL using the built-in Task function
   - CRITICAL: Deploy all sub-agents in a single message with multiple Task invocations for parallel execution
```

### Changes Made
1. Updated all 5 specialist sections with "IN PARALLEL" directive
2. Added CRITICAL instruction for multiple Task invocations
3. Updated Phase 8 summarization to emphasize "IN A SINGLE MESSAGE"
4. Command file grew to 380 lines (still executable)

### Expected Benefits
- Significantly faster orchestration
- Better resource utilization
- Maintains all existing functionality
- Clear instructions prevent sequential deployment

---
*Status: Enhancement Complete - Parallel deployment now explicit*
*Next Action: Full orchestration test with parallel sub-agent deployment*