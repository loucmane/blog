# Session Memory: Worktree Context Fix Discovery

## Date: 2025-06-26 14:00-16:30 CEST

## Major Discovery
Sub-agents deployed via Task function inherit the working directory of their deployer!

### The Problem
- Orchestration created worktrees but stayed in main directory
- Deployed Performance Sub-Agent from main directory
- Sub-agent inherited main directory context
- Files were modified in main project instead of worktree

### The Testing That Revealed It
1. Deployed test agent with explicit CD - it said "already in worktree"
2. Deployed agent to check pwd - confirmed it starts in worktree
3. Deployed agent to modify code - successfully modified IN worktree

**Key insight**: If you deploy from main dir, agent works in main. If you deploy from worktree, agent works in worktree.

## The Solution
Main session must CD into each worktree before deploying sub-agents:

```bash
git worktree add .worktrees/task-7-orch-perf
cd .worktrees/task-7-orch-perf  # Critical step!
# Deploy sub-agents (they inherit this directory)
cd -  # Return to main
```

## Implementation Plan (30 tasks)
Created comprehensive todo list covering:
- Update all 5 specialist roles with CD commands
- Update spec to document working directory context
- Add orchestration exception to CLAUDE.md
- Test single specialist then full orchestration

## Current Status
- Role-playing approach works perfectly
- Command executes (284 lines is fine)
- Worktree solution discovered and tested
- Ready to implement CD context switches
- All 5 worktrees will remain active (no memory constraints)

## Files Created
- worktree-context-fix-tracker.md
- worktree-context-fix-implementation.md
- 30-item todo list for implementation

## How to Initialize Next Session
```
Activate project /home/loucmane/dev/javascript/MomsBlog/blog, 
read memory session_2025-06-26_worktree_context_fix_discovery and SESSION.md.

Key focus: Implement CD commands in Phase 6 for all 5 specialists.
Start with backups: cp .claude/commands/orchestrate-and-test.md .backup-worktree-fix
```

## Critical Implementation Order
1. Backup files first
2. Update Performance Specialist (test single)
3. If working, update other 4 specialists
4. Update spec and CLAUDE.md
5. Test full orchestration

Remember: CD happens AFTER worktree creation but BEFORE sub-agent deployment!