# Orchestrate-Task V2: Direct Worktree Deployment

The V2 orchestrate-task command eliminates the manual copying step by deploying implementations directly to worktrees.

## Key Improvement: Direct Deployment

### V1 Workflow (Original)
```bash
1. Generate implementations → .taskmaster/infinite/orchestrated/
2. Create worktrees
3. Manually copy implementations to worktrees ← ELIMINATED IN V2!
4. Start dev servers
```

### V2 Workflow (Enhanced)
```bash
1. Create worktrees
2. Generate implementations → DIRECTLY into worktrees!
3. Start dev servers
```

## How It Works

Each specialist orchestrator deploys their BEST implementation directly to their assigned worktree:

```
Performance Specialist    → .worktrees/task-7-test-1/ (Port 3001)
Architecture Specialist   → .worktrees/task-7-test-2/ (Port 3002)
UX/DX Specialist         → .worktrees/task-7-test-3/ (Port 3003)
Accessibility Specialist → .worktrees/task-7-test-4/ (Port 3004)
Innovation Specialist    → .worktrees/task-7-test-5/ (Port 3005)
Synthesis Orchestrator   → .worktrees/task-7-test-6/ (Port 3006)
```

## Quick Start Example

```bash
# Step 1: Create 6 worktrees
/init-parallel feature-name=task-7-layout number-of-parallel-worktrees=6

# Step 2: Orchestrate directly into them!
/orchestrate-task-v2 task_id=7 specialists=all depth=3 \
  deployment_mode=worktree worktree_prefix=task-7-layout

# Step 3: Start all servers - NO COPYING NEEDED!
pnpm worktree:dev:tmux

# That's it! Open browser to:
# http://localhost:3001 - Performance optimized
# http://localhost:3002 - Architecture optimized
# http://localhost:3003 - UX/DX optimized
# http://localhost:3004 - Accessibility optimized
# http://localhost:3005 - Innovation optimized
# http://localhost:3006 - Synthesized best of all
```

## Command Parameters

### Required for Worktree Mode:
- `deployment_mode=worktree` - Activates direct deployment
- `worktree_prefix=<name>` - Must match your worktree names

### Optional:
- `target_path` - Where in worktree to deploy (default: "packages/web/src/components")
- `specialists` - Which specialists to use (default: "all")
- `depth` - Sub-agents per specialist (default: 3)

## What Happens Behind the Scenes

### 1. Each Specialist Still Creates Multiple Implementations
- Performance specialist creates 3 implementations (if depth=3)
- But only deploys the BEST one to the worktree
- Other implementations are kept for reference

### 2. Smart Selection Process
```
Performance Specialist:
├── bundle-optimizer/      ← Scores: 95/100 ⭐ SELECTED
├── runtime-optimizer/     ← Scores: 87/100
└── memory-optimizer/      ← Scores: 82/100

Only bundle-optimizer goes to worktree-1
```

### 3. Synthesis Reads from Worktrees
The Synthesis Orchestrator (worktree 6) reads the deployed implementations from worktrees 1-5 to create the combined version.

## Error Prevention

### Worktrees Must Exist First
```bash
# Wrong order:
/orchestrate-task-v2 deployment_mode=worktree  # ERROR: No worktrees!

# Correct order:
/init-parallel feature-name=test number-of-parallel-worktrees=6
/orchestrate-task-v2 deployment_mode=worktree worktree_prefix=test  # ✓
```

### Number of Worktrees Must Match
- If using `specialists=all` → Need 6 worktrees (5 specialists + synthesis)
- If using specific specialists → Need N+1 worktrees (N specialists + synthesis)

## Advanced Usage

### Partial Deployment
```bash
# Only 3 specialists = need 4 worktrees
/init-parallel feature-name=quick number-of-parallel-worktrees=4

/orchestrate-task-v2 task_id=7 specialists=performance,architecture,ux_dx \
  deployment_mode=worktree worktree_prefix=quick
```

### Custom Target Path
```bash
# Deploy to a different location
/orchestrate-task-v2 task_id=7 deployment_mode=worktree \
  worktree_prefix=test target_path=packages/web/src/features/blog
```

### Skip Synthesis
```bash
# Only need 5 worktrees if skipping synthesis
/init-parallel feature-name=no-synth number-of-parallel-worktrees=5

/orchestrate-task-v2 task_id=7 specialists=all depth=3 \
  deployment_mode=worktree worktree_prefix=no-synth \
  synthesis_strategy=none
```

## Benefits Over V1

1. **Speed**: No manual copying saves 5-10 minutes
2. **Accuracy**: No chance of copying wrong files
3. **Simplicity**: 3 commands instead of ~10
4. **Integration**: Test pages automatically created
5. **Cleaner**: Only the best implementations in worktrees

## Testing Workflow

```bash
# Complete workflow in 4 commands:
/init-parallel feature-name=blog-feature number-of-parallel-worktrees=6
/orchestrate-task-v2 task_id=7 deployment_mode=worktree worktree_prefix=blog-feature
pnpm worktree:dev:tmux
tmux attach -t worktrees

# Browse to:
# http://localhost:3001/test-orchestrated - Performance
# http://localhost:3002/test-orchestrated - Architecture
# http://localhost:3003/test-orchestrated - UX/DX
# http://localhost:3004/test-orchestrated - Accessibility
# http://localhost:3005/test-orchestrated - Innovation
# http://localhost:3006/test-orchestrated - Synthesized
```

## Fallback to Central Mode

If you prefer the original behavior:
```bash
# Omit deployment_mode to use central deployment
/orchestrate-task-v2 task_id=7 specialists=all depth=3

# Files go to: .taskmaster/infinite/orchestrated/task-7/
# Then manually copy as before
```

## Summary

V2 makes your suggested workflow a reality:
1. Create worktrees first
2. Orchestrate directly into them
3. Test immediately

No more manual copying - the AI agents write directly where you need the code!