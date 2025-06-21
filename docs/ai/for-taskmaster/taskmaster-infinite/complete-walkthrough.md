# Complete Walkthrough: Using TaskMaster Infinite Orchestration

This guide walks through the entire process with expected results at each step, so you can identify any deviations.

## Prerequisites

Before starting, ensure:
1. You're in the project root directory
2. Git is initialized and you have a clean working tree (or you've acknowledged the warning)
3. Ports 3001-3006 are available
4. tmux is installed (for server management)

## Step 1: Run the Unified Command

### Command:
```bash
/orchestrate-and-test task_id=7
```

### Expected Output - Phase 0 (Pre-flight Checks):
```
📁 Using worktree prefix: task-7-orch

🔍 Checking port availability (3001-3006)...
✅ All required ports are available

⏱️  Estimated orchestration time: ~170 seconds
```

**Possible Deviations:**
- If you have uncommitted changes:
  ```
  ⚠️  WARNING: You have uncommitted changes
  It's recommended to commit or stash before orchestrating.
  
  Continue anyway? (y/N)
  ```
- If ports are in use:
  ```
  ❌ Port 3003 is already in use
  Please free up ports 3001-3006 or adjust configuration
  ```
- If worktrees already exist:
  ```
  ⚠️  Found existing worktrees with prefix 'task-7-orch'
  
  Options:
  1. Remove and recreate (clean start)
  2. Reuse existing worktrees
  3. Cancel
  ```

## Step 2: Worktree Creation

### Expected Output - Phase 1:
```
🌳 Creating 6 worktrees...
  Creating: task-7-orch-1-performance
  Creating: task-7-orch-2-architecture
  Creating: task-7-orch-3-ux_dx
  Creating: task-7-orch-4-accessibility
  Creating: task-7-orch-5-innovation
  Creating: task-7-orch-6-synthesis

[pnpm install output for each worktree]

✅ Worktrees created and dependencies installed
```

### What's Actually Happening:
1. Creates `.worktrees/` directory if it doesn't exist
2. Creates 6 git worktrees with descriptive names
3. Each gets its own branch
4. Dependencies installed in parallel
5. State file created at `.taskmaster/orchestration-state.yaml`

### Verify:
```bash
# Check worktrees were created
git worktree list

# Expected output:
/path/to/project                    [current-branch]
/path/to/project/.worktrees/task-7-orch-1-performance  [task-7-orch-1-performance]
/path/to/project/.worktrees/task-7-orch-2-architecture [task-7-orch-2-architecture]
# ... etc for all 6
```

## Step 3: Orchestration Execution

### Expected Output - Phase 2:
```
🤖 Starting orchestration for Task 7
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[This is where the orchestrate-task-v3 command runs]
[You'll see multiple Claude responses as agents are deployed]
[Each specialist creates 3 implementations, selects the best]
[Synthesis combines the best features]
```

### What's Actually Happening:
1. Master Orchestrator analyzes the task
2. Deploys 5 Specialist Orchestrators (using Task tool)
3. Each Specialist deploys 3 Sub-Agents
4. Each Sub-Agent creates an implementation
5. Specialists select their best implementation
6. Best implementations deployed to worktrees
7. Synthesis Orchestrator combines best features

### Directory Structure After Orchestration (V3):
```
.worktrees/task-7-orch-1-performance/packages/web/src/components/
├── _implementations/
│   ├── bundle-optimizer/      # Complete implementation
│   ├── runtime-optimizer/     # Complete implementation
│   ├── memory-optimizer/      # Complete implementation
│   ├── manifest.json         # Describes all implementations
│   ├── ACTIVE               # Contains "bundle-optimizer"
│   └── switch.sh            # Script to switch implementations
├── Header.tsx               # Active implementation files
├── Footer.tsx
└── Layout.tsx
```

## Step 4: Server Startup

### Expected Output - Phase 3:
```
🚀 Starting development servers...
✅ All servers started in tmux session 'orchestration'
```

### What's Actually Happening:
1. Creates tmux session named "orchestration"
2. Starts dev server in each worktree
3. Each on its own port (3001-3006)
4. All running in background

### Verify:
```bash
# Check tmux session exists
tmux list-sessions

# Expected output:
orchestration: 6 windows (created [timestamp])

# Attach to see servers
tmux attach -t orchestration

# You'll see 6 windows:
# 0: Performance (port 3001)
# 1: Architecture (port 3002)
# 2: UX/DX (port 3003)
# 3: Accessibility (port 3004)
# 4: Innovation (port 3005)
# 5: Synthesis (port 3006)
```

## Step 5: Final Summary

### Expected Output - Phase 5:
```
✅ ORCHESTRATION COMPLETE!
━━━━━━━━━━━━━━━━━━━━━━━━

📊 Summary:
  • Task ID: 7
  • Implementations: 17 generated
  • Worktrees: 6 created
  • Time taken: 2m 45s

🔗 Quick Links:
  • Performance:    http://localhost:3001/test-orchestrated
  • Architecture:   http://localhost:3002/test-orchestrated
  • UX/DX:         http://localhost:3003/test-orchestrated
  • Accessibility: http://localhost:3004/test-orchestrated
  • Innovation:    http://localhost:3005/test-orchestrated
  • Synthesis:     http://localhost:3006/test-orchestrated

  • Comparison:    file:///path/to/project/.taskmaster/comparison-dashboard.html

💡 Next Steps:
  1. Review implementations in your browser
  2. Switch implementations: cd .worktrees/<name> && switch-impl <impl>
  3. View server logs: tmux attach -t orchestration
  4. Clean up: /orchestrate-cleanup task_id=7
```

## Step 6: Testing the Implementations

### Open Browser:
Visit each URL to see different implementations:
- http://localhost:3001/test-orchestrated - Performance optimized version
- http://localhost:3002/test-orchestrated - Architecture optimized version
- etc.

### Expected Behavior:
- Each shows a test page with the orchestrated components
- Each implementation has different characteristics
- All should be functional but optimized differently

### Switching Implementations (V3):
```bash
# Go to any worktree
cd .worktrees/task-7-orch-1-performance/packages/web/src/components

# See available implementations
cat _implementations/manifest.json

# Switch to different implementation
./_implementations/switch.sh runtime-optimizer

# The site at localhost:3001 now uses runtime-optimizer!
```

## Step 7: Cleanup

### Command:
```bash
/orchestrate-cleanup task_id=7
```

### Expected Output:
```
🧹 Cleaning up orchestration for Task 7
   Worktree prefix: task-7-orch

📡 Stopping development servers...

📦 Archiving implementations to: .taskmaster/orchestration-archive/task-7-20250619-1430
  Archiving: task-7-orch-1-performance
  Archiving: task-7-orch-2-architecture
  Archiving: task-7-orch-3-ux_dx
  Archiving: task-7-orch-4-accessibility
  Archiving: task-7-orch-5-innovation
  Archiving: task-7-orch-6-synthesis
✅ Archive created

🌳 Removing worktrees...
  Removing: task-7-orch-1-performance
  Removing: task-7-orch-2-architecture
  Removing: task-7-orch-3-ux_dx
  Removing: task-7-orch-4-accessibility
  Removing: task-7-orch-5-innovation
  Removing: task-7-orch-6-synthesis
✅ Removed 6 worktrees

🌿 Cleaning up branches...

✅ CLEANUP COMPLETE!
━━━━━━━━━━━━━━━━━━

📁 Archived to: .taskmaster/orchestration-archive/task-7-20250619-1430
   • Decision record saved
   • Best implementations preserved

💡 To orchestrate again: /orchestrate-and-test task_id=7
```

## Common Issues & Solutions

### Issue 1: Command Not Found
```bash
# If you get "command not found"
# Make sure you're using Claude's command syntax:
/orchestrate-and-test task_id=7
```

### Issue 2: Orchestration Seems Stuck
- Check if Claude is still generating responses
- The orchestration involves ~20 agent deployments, so it takes time
- Expected time: 2-3 minutes

### Issue 3: Servers Don't Start
```bash
# Check if tmux session exists
tmux list-sessions

# If not, start servers manually
pnpm worktree:dev:tmux
```

### Issue 4: Can't Access Localhost URLs
- Ensure servers actually started (check tmux)
- Check for build errors in tmux windows
- Verify ports aren't blocked by firewall

### Issue 5: Resume After Failure
```bash
# If orchestration failed partway through
/orchestrate-and-test task_id=7 resume=true

# Or start fresh
/orchestrate-cleanup task_id=7
/orchestrate-and-test task_id=7
```

## Success Criteria

You'll know everything worked correctly when:
1. ✅ 6 worktrees created with clear naming
2. ✅ Each worktree has implementations in `_implementations/`
3. ✅ All 6 servers running on ports 3001-3006
4. ✅ Each URL shows a working test page
5. ✅ You can switch implementations within worktrees
6. ✅ Cleanup archives everything before removing

## File Locations to Verify

After successful run:
```
.worktrees/
├── task-7-orch-1-performance/
├── task-7-orch-2-architecture/
├── task-7-orch-3-ux_dx/
├── task-7-orch-4-accessibility/
├── task-7-orch-5-innovation/
└── task-7-orch-6-synthesis/

.taskmaster/
├── orchestration-state.yaml     # Current state
├── comparison-dashboard.html    # Comparison page
└── orchestration-archive/       # After cleanup
    └── task-7-[timestamp]/
        ├── decision-record.md
        └── [archived implementations]
```

## The Magic

The beauty of this system:
1. **One command** starts everything
2. **Automatic recovery** if something fails
3. **15+ implementations** explored, best ones deployed
4. **Side-by-side testing** in browser
5. **Clean archival** preserves learnings

If anything deviates from this expected flow, let me know and we can debug!