# Comprehensive Walkthrough: TaskMaster Infinite Orchestration System

This document provides a complete, detailed walkthrough of using the TaskMaster Infinite orchestration system from start to finish.

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Complete Command Flow](#complete-command-flow)
4. [Detailed Phase Breakdown](#detailed-phase-breakdown)
5. [What You'll See vs What's Happening](#what-youll-see-vs-whats-happening)
6. [Testing the Results](#testing-the-results)
7. [Advanced Features](#advanced-features)
8. [Cleanup Process](#cleanup-process)
9. [Troubleshooting](#troubleshooting)
10. [Quick Reference](#quick-reference)

## Overview

The TaskMaster Infinite system uses AI agents to explore multiple implementation approaches for any task in parallel. With a single command, it:
- Creates isolated testing environments (git worktrees)
- Deploys ~20 specialized AI agents
- Generates 15+ different implementations
- Lets you test them all side-by-side
- Archives the best solutions

### The Magic Command
```bash
/orchestrate-and-test task_id=7
```

This one command replaces what would normally be hours of manual work.

## Prerequisites

Before starting, ensure:

1. **Environment Setup**
   - You're in the project root directory
   - Git is initialized
   - tmux is installed (`sudo apt-get install tmux` on WSL/Ubuntu)
   - Ports 3001-3006 are available

2. **Clean Working Directory** (Recommended)
   ```bash
   git status  # Should show no changes, or commit/stash first
   ```

3. **Claude Configuration**
   - You're using Claude with MCP tools enabled
   - The Task tool is available
   - Commands are in `.claude/commands/`

## Complete Command Flow

### Basic Usage
```bash
# Full orchestration with all specialists
/orchestrate-and-test task_id=7

# Smaller test with one specialist
/orchestrate-and-test task_id=7 specialists=performance depth=1

# Skip auto-start servers
/orchestrate-and-test task_id=7 auto_start_servers=false

# Reuse existing worktrees
/orchestrate-and-test task_id=7 reuse_worktrees=true
```

### What Happens Next: Timeline
- **0:00-0:05** - Pre-flight checks
- **0:05-0:35** - Worktree creation and setup
- **0:35-3:00** - AI orchestration (most active phase)
- **3:00-3:10** - Server startup
- **3:10+** - Ready for testing!

## Detailed Phase Breakdown

### Phase 0: Pre-Flight Checks (5 seconds)

**What You'll See:**
```
📁 Using worktree prefix: task-7-orch

🔍 Checking port availability (3001-3006)...
✅ All required ports are available

⏱️  Estimated orchestration time: ~170 seconds
```

**What's Actually Happening:**
```bash
# 1. Git status check
if [ -n "$(git status --porcelain)" ]; then
  echo "⚠️  WARNING: You have uncommitted changes"
  echo "Continue anyway? (y/N)"
fi

# 2. Port availability check
for port in 3001 3002 3003 3004 3005 3006; do
  lsof -i:$port  # Ensures port is free
done

# 3. Existing worktree check
git worktree list | grep "task-7-orch"

# 4. State file check for resume capability
if [ -f ".taskmaster/orchestration-state.yaml" ]; then
  # Offers resume option
fi
```

**Possible Warnings:**
- ⚠️ Uncommitted changes warning
- ⚠️ Existing worktrees found
- ❌ Port already in use error

### Phase 1: Smart Worktree Creation (30 seconds)

**What You'll See:**
```
🌳 Creating 6 worktrees...
  Creating: task-7-orch-1-performance
  Creating: task-7-orch-2-architecture
  Creating: task-7-orch-3-ux_dx
  Creating: task-7-orch-4-accessibility
  Creating: task-7-orch-5-innovation
  Creating: task-7-orch-6-synthesis

Installing dependencies...
✅ Worktrees created and dependencies installed
```

**Directory Structure Created:**
```
.worktrees/
├── task-7-orch-1-performance/    # Port 3001
├── task-7-orch-2-architecture/   # Port 3002
├── task-7-orch-3-ux_dx/         # Port 3003
├── task-7-orch-4-accessibility/ # Port 3004
├── task-7-orch-5-innovation/    # Port 3005
└── task-7-orch-6-synthesis/     # Port 3006

.taskmaster/
└── orchestration-state.yaml      # Tracks progress
```

**Git Branches Created:**
```bash
git branch | grep task-7-orch
# Shows:
# task-7-orch-1-performance
# task-7-orch-2-architecture
# ... etc
```

### Phase 2: AI Orchestration (2-3 minutes)

**What You'll See:**
```
🤖 Starting orchestration for Task 7
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Claude becomes very active here...]
```

**Detailed Agent Deployment Sequence:**

1. **Master Orchestrator** (1 deployment)
   ```
   "I'll analyze Task 7 and coordinate the specialist orchestrators..."
   [Uses Task tool to deploy Master Orchestrator]
   ```

2. **Specialist Orchestrators** (5 deployments)
   ```
   "Master Orchestrator deploying Performance Specialist..."
   "Master Orchestrator deploying Architecture Specialist..."
   "Master Orchestrator deploying UX/DX Specialist..."
   "Master Orchestrator deploying Accessibility Specialist..."
   "Master Orchestrator deploying Innovation Specialist..."
   ```

3. **Sub-Agents** (15 deployments, 3 per specialist)
   ```
   "Performance Specialist deploying Bundle Optimizer..."
   "Performance Specialist deploying Runtime Optimizer..."
   "Performance Specialist deploying Memory Optimizer..."
   [Repeats for each specialist]
   ```

4. **Evaluation Orchestrator** (1 deployment)
   ```
   "Deploying Evaluation Orchestrator to score implementations..."
   ```

5. **Synthesis Orchestrator** (1 deployment)
   ```
   "Deploying Synthesis Orchestrator to combine best features..."
   ```

**Total: ~23 Agent Deployments**

**What Each Agent Does:**
- Analyzes the task from its perspective
- Writes complete implementation to worktree
- Includes all necessary files
- Adds test pages

### Phase 3: Directory Structure After Orchestration

**V3 Structure (All Implementations Preserved):**
```
.worktrees/task-7-orch-1-performance/packages/web/src/components/
├── _implementations/
│   ├── bundle-optimizer/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Layout.tsx
│   ├── runtime-optimizer/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Layout.tsx
│   ├── memory-optimizer/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Layout.tsx
│   ├── manifest.json      # Describes all implementations
│   ├── ACTIVE            # Contains "bundle-optimizer"
│   └── switch.sh         # Script to switch implementations
├── Header.tsx            # Active implementation
├── Footer.tsx            # Active implementation
└── Layout.tsx            # Active implementation
```

### Phase 4: Server Startup (10 seconds)

**What You'll See:**
```
🚀 Starting development servers...
✅ All servers started in tmux session 'orchestration'
```

**What's Created:**
- tmux session named "orchestration"
- 6 windows, one per worktree
- Each running `pnpm dev`
- Ports 3001-3006 active

**Verify Servers:**
```bash
# List tmux sessions
tmux list-sessions
# Shows: orchestration: 6 windows

# Attach to see all servers
tmux attach -t orchestration

# Navigate windows:
# Ctrl+B, 0 = Performance (3001)
# Ctrl+B, 1 = Architecture (3002)
# ... etc
# Ctrl+B, D = Detach
```

### Phase 5: Final Summary

**What You'll See:**
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

  • Comparison:    file:///home/loucmane/dev/javascript/MomsBlog/blog/.taskmaster/comparison-dashboard.html

💡 Next Steps:
  1. Review implementations in your browser
  2. Switch implementations: cd .worktrees/<name> && switch-impl <impl>
  3. View server logs: tmux attach -t orchestration
  4. Clean up: /orchestrate-cleanup task_id=7
```

## What You'll See vs What's Happening

### During Orchestration

**What You'll See:**
- Lots of Claude responses
- Multiple "Deploying..." messages
- Code being generated
- Progress updates

**What's Actually Happening:**
- Claude using Task tool ~23 times
- Each agent running independently
- Files being written to worktrees
- State file being updated
- Implementations being evaluated

### The Claude Activity

This is NOT a silent background process. You'll see:

```
Claude: I'll now deploy the Master Orchestrator for Task 7...

<function_calls>
<invoke name="Task">
<parameter name="description">Master Orchestrator</parameter>
<parameter name="prompt">You are the Master Orchestrator for Task 7...</parameter>
</invoke>
</function_calls>

[Response from Master Orchestrator agent]

Claude: The Master Orchestrator will now deploy the Performance Specialist...

<function_calls>
<invoke name="Task">
<parameter name="description">Performance Specialist</parameter>
<parameter name="prompt">You are the Performance Specialist...</parameter>
</invoke>
</function_calls>

[This continues for all ~23 agents]
```

## Testing the Results

### Step 1: Open the Implementations

Open each URL in a new browser tab:
- http://localhost:3001/test-orchestrated → Performance optimized
- http://localhost:3002/test-orchestrated → Clean architecture
- http://localhost:3003/test-orchestrated → Best UX/DX
- http://localhost:3004/test-orchestrated → Accessibility focused
- http://localhost:3005/test-orchestrated → Innovative features
- http://localhost:3006/test-orchestrated → Best of all combined

### Step 2: Compare Implementations

Each page shows the same component implemented differently:
- **Performance**: Minimal bundle, lazy loading, optimized renders
- **Architecture**: Clean patterns, maintainable, testable
- **UX/DX**: Great developer experience, intuitive API
- **Accessibility**: ARIA labels, keyboard nav, screen reader support
- **Innovation**: Modern features, experimental APIs
- **Synthesis**: Cherry-picked best parts from all

### Step 3: Check Implementation Details

```bash
# Go to any worktree
cd .worktrees/task-7-orch-1-performance/packages/web/src/components

# See all implementations
ls _implementations/
# bundle-optimizer/  runtime-optimizer/  memory-optimizer/

# Check manifest
cat _implementations/manifest.json
```

Output shows scores and reasoning:
```json
{
  "specialist": "performance",
  "implementations": [
    {
      "name": "bundle-optimizer",
      "score": 95,
      "metrics": { "bundleSize": "45KB", "treeShakeable": true }
    }
  ],
  "active": "bundle-optimizer",
  "selected_reason": "Smallest bundle with best tree-shaking"
}
```

### Step 4: Switch Implementations (V3 Feature)

```bash
# In any worktree with _implementations/
./_implementations/switch.sh runtime-optimizer

# Refresh browser - now using different implementation!
```

## Advanced Features

### Using Specific Specialists

```bash
# Just performance and architecture
/orchestrate-and-test task_id=7 specialists=performance,architecture

# This creates only 3 worktrees:
# - performance
# - architecture  
# - synthesis
```

### Adjusting Depth

```bash
# Fewer implementations per specialist
/orchestrate-and-test task_id=7 depth=2

# More implementations per specialist
/orchestrate-and-test task_id=7 depth=5
```

### Manual Server Control

```bash
# Skip auto-start
/orchestrate-and-test task_id=7 auto_start_servers=false

# Start manually later
cd .worktrees/task-7-orch-1-performance && pnpm dev
```

### Resuming Failed Orchestration

```bash
# If orchestration fails partway
/orchestrate-and-test task_id=7 resume=true

# Check state
cat .taskmaster/orchestration-state.yaml
```

## Cleanup Process

### Standard Cleanup

```bash
/orchestrate-cleanup task_id=7
```

**What Happens:**
1. Stops all tmux servers
2. Archives best implementations
3. Saves decision records
4. Removes all worktrees
5. Cleans git branches

**Archive Structure:**
```
.taskmaster/orchestration-archive/
└── task-7-20250619-143000/
    ├── decision-record.md
    ├── orchestration-state.yaml
    ├── task-7-orch-1-performance/
    │   ├── manifest.json
    │   └── implementation/
    ├── task-7-orch-2-architecture/
    │   └── ...
    └── ...
```

### Quick Cleanup (No Archive)

```bash
/orchestrate-cleanup task_id=7 archive=false
```

## Troubleshooting

### Common Issues

**1. Port Already in Use**
```bash
❌ Port 3003 is already in use

# Solution: Find and kill process
lsof -i:3003
kill -9 [PID]

# Or use different ports by creating fewer worktrees
/orchestrate-and-test task_id=7 specialists=performance,architecture
```

**2. Worktrees Already Exist**
```bash
⚠️  Found existing worktrees with prefix 'task-7-orch'

# Option 1: Reuse them
/orchestrate-and-test task_id=7 reuse_worktrees=true

# Option 2: Clean and restart
/orchestrate-cleanup task_id=7
/orchestrate-and-test task_id=7
```

**3. tmux Session Issues**
```bash
# Can't attach to tmux
tmux list-sessions  # Check if exists

# Session exists but servers aren't running
tmux kill-session -t orchestration
pnpm worktree:dev:tmux  # Restart
```

**4. Orchestration Seems Stuck**
- Check if Claude is still responding
- Look for error messages
- Normal orchestration takes 2-3 minutes
- You'll see constant activity if working

**5. Can't Access Localhost URLs**
```bash
# Check if servers actually started
tmux attach -t orchestration

# Look for errors in each window
# Common: build errors, missing dependencies

# Try manual start in specific worktree
cd .worktrees/task-7-orch-1-performance
pnpm dev
```

### Recovery Options

**From Partial Failure:**
```bash
# Check what was completed
cat .taskmaster/orchestration-state.yaml

# Resume from where it stopped
/orchestrate-and-test task_id=7 resume=true
```

**From Complete Failure:**
```bash
# Nuclear option - clean everything
git worktree list | grep task-7-orch | awk '{print $1}' | xargs -I {} git worktree remove {} --force
rm -rf .taskmaster/orchestration-state.yaml
tmux kill-session -t orchestration 2>/dev/null

# Start fresh
/orchestrate-and-test task_id=7
```

## Quick Reference

### Commands
```bash
# Full orchestration
/orchestrate-and-test task_id=7

# Minimal test
/orchestrate-and-test task_id=test specialists=performance depth=1

# Cleanup
/orchestrate-cleanup task_id=7

# Check worktrees
git worktree list

# Check servers
tmux attach -t orchestration
```

### File Locations
```bash
# Implementations
.worktrees/task-7-orch-*/packages/web/src/components/

# V3 Implementation folders
.worktrees/task-7-orch-*/_implementations/

# State tracking
.taskmaster/orchestration-state.yaml

# Archives after cleanup
.taskmaster/orchestration-archive/
```

### URLs
- Performance: http://localhost:3001/test-orchestrated
- Architecture: http://localhost:3002/test-orchestrated
- UX/DX: http://localhost:3003/test-orchestrated
- Accessibility: http://localhost:3004/test-orchestrated
- Innovation: http://localhost:3005/test-orchestrated
- Synthesis: http://localhost:3006/test-orchestrated

### Keyboard Shortcuts (tmux)
- `Ctrl+B, [0-5]` - Switch between servers
- `Ctrl+B, D` - Detach from tmux
- `Ctrl+B, X` - Kill current pane
- `Ctrl+C` - Stop current server

## Summary

The TaskMaster Infinite system transforms complex multi-implementation exploration into a single command. While the orchestration phase involves significant Claude activity (not a background process), the result is a comprehensive set of implementations you can test, compare, and learn from.

Key benefits:
- **One command** to rule them all
- **Isolated testing** in worktrees
- **15+ implementations** to compare
- **Preserved knowledge** through archiving
- **Easy cleanup** when done

Remember: This is an active Claude process, not a fire-and-forget script. But the automation and organization make it worthwhile for exploring multiple approaches to any task!