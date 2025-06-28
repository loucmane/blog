# Ready to Fix Nested Code Blocks - Implementation Plan

## Session Context
**Date**: 2025-06-28
**Status**: Root cause identified, ready to implement fix
**Task**: Fix orchestrate-and-test.md to execute properly

## What We're Fixing

### The Problem
Command displays as template due to nested markdown code blocks:
```
Execute these roles in order:
```                              <-- Outer block
## Performance Specialist Role
```                              <-- NESTED (breaks parser)
ROLE: Performance Specialist...
```
```                              <-- Mismatched closing

### The Solution
Transform to flat structure without nesting:
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

## What This Preserves

### Full Functionality Maintained:
1. ✅ **Conditional deployment** - Only deploys requested specialists
2. ✅ **Multiple sub-agents** - Uses ${depth} parameter
3. ✅ **Spec references** - Points to sections 3.1, 3.2, etc.
4. ✅ **Absolute paths** - Each sub-agent gets own worktree
5. ✅ **Orchestration flow** - All phases work as designed

### Key Design Elements:
- **PROJECT_ROOT** variable for absolute paths
- **Individual worktrees**: task-${id}-orch-${type}-${num}
- **Spec sections**: 3.1-3.3 (Performance), 4.1-4.3 (Architecture), etc.
- **5-step instructions** for each sub-agent in spec

## Implementation Steps

### For Each Specialist Section:
1. Remove outer code block wrapper
2. Remove code blocks around ROLE content
3. Keep TASK: declaration visible
4. Maintain conditional logic
5. Preserve spec references

### Pattern to Apply:
```
## [Specialist] Role
If "[specialist]" is in ${specialists}:

TASK: Deploy [Specialist] Orchestrator

You are now the [Specialist]. Your focus: [focus areas].

Actions:
1. Review [specialist]-related contracts from contracts/
2. Deploy ${depth} [Specialist] Sub-Agents using the built-in Task function
   - Load deployment instructions from spec file Section "Sub-Agent Deployment Instructions" → "[Section]"
   - Each sub-agent gets its own isolated worktree
3. Log deployments to orchestration.log
4. Transition to next role
```

## Expected Results

### If Fix Works:
- Command executes instead of displaying
- Specialists deploy conditionally
- Sub-agents create proper worktrees
- Full orchestration runs as designed

### Confidence Level: 85%
- Nested blocks are definitely the problem
- Flat structure should parse correctly
- TASK: pattern preserved for execution
- All functionality maintained

## Potential Issues to Watch

1. **TASK: visibility** - Ensure parser recognizes TASK declarations
2. **Variable passing** - PROJECT_ROOT must reach sub-agents
3. **Spec loading** - Orchestrators must find their sections
4. **Conditional logic** - If statements might need adjustment

## How to Initialize Next Session

```
Activate project /home/loucmane/dev/javascript/MomsBlog/blog,
read memory session_2025-06-28_nested_blocks_fix_ready and SESSION.md.

Implement the nested blocks fix in orchestrate-and-test.md and test execution.
```

## Files to Update

1. **orchestrate-and-test.md** - Remove ALL nested code blocks
2. Keep spec file unchanged - sub-agent instructions are good
3. Test with: `/orchestrate-and-test 7 default performance 2`

## Success Criteria

- Command executes (no template display)
- Worktrees created: task-7-orch-perf-1, task-7-orch-perf-2
- No nesting in worktree paths
- Orchestration log shows progress

This fix should finally make our sophisticated orchestration system work as designed!