# Orchestrate and Test Command - Ready for Task 7

## Command Status
The `/orchestrate-and-test` command has been fixed and is ready for use. The fix involved integrating all agent deployment prompts directly into the command file.

## What Was Fixed
- Original issue: Task tool can only deploy agents, not invoke other commands
- Solution: Embedded all 23 agent prompts directly in orchestrate-and-test.md
- No longer tries to delegate to orchestrate-task-v3

## How to Run Task 7
```bash
/orchestrate-and-test task_id=7
```

## Optional Parameters
- `specialists` (default: "all") - Which specialists to use
- `depth` (default: 3) - How many iterations
- `auto_start_servers` (default: true) - Auto-start dev servers
- `reuse_worktrees` (default: false) - Reuse existing worktrees

## What to Expect
1. **Pre-flight checks** - Validates environment
2. **23 Agent Deployments**:
   - 1 Master Orchestrator
   - 5 Specialists (Architecture, Performance, etc.)
   - 15 Sub-agents (3 per specialist)
   - 1 Evaluation Agent
   - 1 Synthesis Agent
3. **Git Worktrees** - Creates 6 worktrees (master + 5 specialists)
4. **Dev Servers** - Runs on ports 3001-3006
5. **Output** - Results in .taskmaster/infinite/orchestrated/task-7/

## Task 7 Details
**Build Core Layout Components**
- Semantic HTML Structure
- Header Component
- Mobile Navigation System
- Main Layout Wrapper
- Accessibility Landmarks
- Footer Component
- Responsive Testing

## Important Notes
- Let all agents complete their work
- Check each worktree for implementations
- Test on all dev server ports
- The command is self-contained now
- Monitor .taskmaster/infinite/state.yaml for progress

## Current Branch
Make sure you're on: `feat/007-core-layout-components`