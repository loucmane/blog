# TaskMaster Infinite Documentation

This directory contains all documentation for the TaskMaster Infinite System - a sophisticated multi-agent orchestration approach for exploring parallel implementations of tasks.

## Documentation Structure

### Core Documentation
- [Implementation Guide](./implementation-guide.md) - Step-by-step guide to implementing the system
- [Orchestrate Usage](./orchestrate-usage.md) - How to use the orchestrate-task command
- [Implementation Notes](./implementation-notes.md) - Technical details and confidence assessment
- [Worktree Example](./worktree-example.md) - Practical example using git worktrees

### System Documentation (in .taskmaster/infinite/)
- System overview and concepts
- Templates for interface contracts, decision records, etc.
- Example implementations

### Related Documentation
- [Git Worktrees Guide](/docs/ai/shared-context/guidelines/git-worktrees.md) - General guide to using git worktrees
- [Orchestrate-Task Command](/.claude/commands/orchestrate-task.md) - The actual command implementation

## Quick Start

1. **Explore different implementations:**
   ```bash
   /orchestrate-task task_id=7 specialists=all depth=3 synthesis_strategy=best-of-breed
   ```

2. **Test with staging:**
   ```bash
   /orchestrate-task task_id=7 specialists=all depth=3 synthesis_strategy=best-of-breed \
     output_mode=project-ready target_dir=packages/web/src/components/layout integration_plan=staging
   ```

3. **Review outputs:**
   ```bash
   ls -la .taskmaster/infinite/orchestrated/task-7/
   ```

## Key Concepts

- **Parallel Implementation Exploration**: Multiple agents create different approaches
- **Specialist Orchestrators**: Performance, Architecture, UX/DX, Accessibility, Innovation
- **Sub-Agents**: Each specialist deploys 3-5 focused implementations
- **Synthesis**: Best elements combined into final solution
- **Git-Friendly Integration**: Staging or worktree modes respect your workflow

## Integration Modes

1. **exploration** (default): Keep outputs for study
2. **project-ready + manual**: Get code and instructions
3. **project-ready + staging**: Test in isolation first
4. **project-ready + worktree**: Full app testing in git worktree