# Unified Workflow Guide: Practical Developer Environment

This guide documents the streamlined workflow improvements we've implemented for the TaskMaster Infinite orchestration system, focusing on maintainability and automation.

## Overview: From Complex to Simple

### Before (V1 - Manual Process)
```bash
# 1. Run orchestration (files go to .taskmaster/)
/orchestrate-task task_id=7

# 2. Create worktrees manually
git worktree add -b feature-1 .worktrees/feature-1
# ... repeat 6 times

# 3. Install dependencies in each
cd .worktrees/feature-1 && pnpm install
# ... repeat 6 times

# 4. Copy implementations manually
cp -r .taskmaster/infinite/orchestrated/task-7/performance/* .worktrees/feature-1/
# ... repeat with correct mappings

# 5. Start servers individually
cd .worktrees/feature-1 && pnpm dev
# ... in separate terminals
```

### After (Unified Commands)
```bash
# Everything in one command!
/orchestrate-and-test task_id=7

# That's it! 🎉
```

## Key Improvements Implemented

### 1. **Unified Command (`orchestrate-and-test.md`)**
Combines the entire workflow into a single, intelligent command that:
- Runs pre-flight checks (git status, port availability)
- Creates worktrees automatically with smart naming
- Runs orchestration with direct deployment
- Starts all dev servers in tmux
- Tracks state for recovery
- Provides clear next steps

### 2. **Smart Cleanup (`orchestrate-cleanup.md`)**
Intelligent cleanup that:
- Archives best implementations before removing
- Saves decision records for future reference
- Stops all running servers
- Cleans up git branches
- Provides restore commands

### 3. **Direct Deployment (V2/V3)**
Orchestrators now deploy directly to worktrees:
- No manual copying needed
- Implementations go exactly where they're needed
- Each worktree is immediately runnable

### 4. **State Management**
`.taskmaster/orchestration-state.yaml` tracks:
- Current task and configuration
- Worktree mappings and ports
- Progress through orchestration
- Error states for recovery

### 5. **Better Error Messages**
Clear, actionable error messages:
```
❌ Port 3003 is already in use
Please free up ports 3001-3006 or adjust configuration
```

### 6. **Automatic Server Management**
Using tmux for organized server management:
- All servers start automatically
- Each in its own tmux window
- Easy to monitor: `tmux attach -t orchestration`
- Clean shutdown: kills tmux session

## Complete Workflow Example

### Starting Fresh
```bash
# 1. Single command does everything
/orchestrate-and-test task_id=7

# Output shows progress:
📁 Using worktree prefix: task-7-orch
🔍 Checking port availability (3001-3006)...
✅ All required ports are available
⏱️ Estimated orchestration time: ~170 seconds

🌳 Creating 6 worktrees...
  Creating: task-7-orch-1-performance
  Creating: task-7-orch-2-architecture
  ...

🤖 Starting orchestration for Task 7
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 Starting development servers...
✅ All servers started in tmux session 'orchestration'

✅ ORCHESTRATION COMPLETE!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔗 Quick Links:
  • Performance:    http://localhost:3001/test-orchestrated
  • Architecture:   http://localhost:3002/test-orchestrated
  • UX/DX:         http://localhost:3003/test-orchestrated
  • Accessibility: http://localhost:3004/test-orchestrated
  • Innovation:    http://localhost:3005/test-orchestrated
  • Synthesis:     http://localhost:3006/test-orchestrated
```

### Monitoring Progress
```bash
# View all servers
tmux attach -t orchestration

# Check orchestration state
cat .taskmaster/orchestration-state.yaml

# See what's running
tmux list-sessions
git worktree list
```

### Switching Implementations (V3)
```bash
# In any worktree
cd .worktrees/task-7-orch-1-performance/packages/web/src/components
ls _implementations/
# bundle-optimizer/
# runtime-optimizer/
# memory-optimizer/

# Switch to different implementation
./_implementations/switch.sh runtime-optimizer
```

### Cleaning Up
```bash
# Smart cleanup with archiving
/orchestrate-cleanup task_id=7

# Output:
📦 Archiving implementations to: .taskmaster/orchestration-archive/task-7-20250619-1430
✅ Archive created
🌳 Removing worktrees...
✅ Removed 6 worktrees
✅ CLEANUP COMPLETE!
```

### Recovering from Errors
```bash
# If orchestration fails
❌ Orchestration failed during orchestrating

The system state has been saved. You can:
  1. Resume: /orchestrate-and-test task_id=7 resume=true
  2. Start over: /orchestrate-cleanup task_id=7 && /orchestrate-and-test task_id=7
```

## Configuration Options

### Basic Usage
```bash
/orchestrate-and-test task_id=7
```

### Custom Specialists
```bash
/orchestrate-and-test task_id=7 specialists=performance,architecture,ux_dx
```

### Adjust Depth
```bash
/orchestrate-and-test task_id=7 depth=2  # Fewer sub-agents, faster
```

### Manual Server Start
```bash
/orchestrate-and-test task_id=7 auto_start_servers=false
# Start servers later with: pnpm worktree:dev:tmux
```

### Reuse Existing Worktrees
```bash
/orchestrate-and-test task_id=7 reuse_worktrees=true
```

## Benefits of the Unified Approach

### 1. **Reduced Complexity**
- From ~15 manual commands to 1
- No need to remember the sequence
- Built-in error prevention

### 2. **Faster Iteration**
- Pre-flight checks catch issues early
- Parallel operations where possible
- Smart defaults reduce configuration

### 3. **Better Recovery**
- State tracking enables resume
- Clear error messages with solutions
- Archive before cleanup preserves work

### 4. **Developer Experience**
- One command to rule them all
- Consistent naming conventions
- Automatic test page creation
- Organized server management

### 5. **Maintainability**
- Less documentation needed (simpler process)
- Fewer moving parts
- Self-documenting commands
- Version control friendly

## Common Workflows

### Testing a New Feature
```bash
# Full orchestration with all specialists
/orchestrate-and-test task_id=8

# Browse implementations
# Pick the best one
# Clean up when done
/orchestrate-cleanup task_id=8 preserve_best=true
```

### Quick Performance Test
```bash
# Just performance specialist, faster
/orchestrate-and-test task_id=9 specialists=performance depth=2

# Test at http://localhost:3001
# Synthesis at http://localhost:3002
```

### Debugging Failed Orchestration
```bash
# Check state
cat .taskmaster/orchestration-state.yaml

# Check logs
cat .taskmaster/orchestration.log

# Resume or restart
/orchestrate-and-test task_id=7 resume=true
```

## Implementation Details

### State File Structure
```yaml
task_id: 7
worktree_prefix: task-7-orch
started_at: 2025-06-19 14:30:00 UTC
status: completed
specialists_requested: all
depth: 3
worktrees:
  - name: task-7-orch-1-performance
    path: .worktrees/task-7-orch-1-performance
    port: 3001
    specialist: performance
  # ... more worktrees
completed_at: 2025-06-19 14:35:00 UTC
```

### Archive Structure
```
.taskmaster/orchestration-archive/
└── task-7-20250619-1430/
    ├── decision-record.md
    ├── orchestration-state.yaml
    └── task-7-orch-1-performance/
        ├── manifest.json
        └── implementation/
            └── [best implementation files]
```

## Tips and Best Practices

1. **Always commit before orchestrating** - The pre-flight check will warn you

2. **Use descriptive task IDs** - They become part of branch and worktree names

3. **Monitor the first run** - Watch tmux to ensure servers start correctly

4. **Archive important results** - The cleanup command preserves by default

5. **Document decisions** - The archive includes space for decision records

## Troubleshooting

### Ports Already in Use
```bash
# Find what's using the port
lsof -i:3001

# Kill if needed
kill -9 [PID]

# Or use different ports by adjusting the worktree numbers
```

### Worktrees Already Exist
```bash
# Option 1: Reuse them
/orchestrate-and-test task_id=7 reuse_worktrees=true

# Option 2: Clean and restart
/orchestrate-cleanup task_id=7
/orchestrate-and-test task_id=7
```

### Can't Find tmux Session
```bash
# List all sessions
tmux list-sessions

# The session is named "orchestration"
tmux attach -t orchestration
```

## Summary

The unified workflow achieves the goal of "simpler fixes that make for a better developer environment for maintainability and automation" by:

1. **Reducing complexity** - One command instead of many
2. **Preventing errors** - Pre-flight checks and validation
3. **Enabling recovery** - State tracking and resume capability
4. **Improving visibility** - Clear output and progress tracking
5. **Maintaining flexibility** - All the power, none of the complexity

The system now embodies the principle: make the right thing the easy thing.