**ORCHESTRATE AND TEST - Unified Workflow Command**

A single command that handles the entire orchestration workflow: creates worktrees, runs orchestration, starts servers, and manages state.

**Variables:**
- task_id: $ARGUMENTS (required)
- specialists: $ARGUMENTS (optional, default: "all")
- depth: $ARGUMENTS (optional, default: 3)
- auto_start_servers: $ARGUMENTS (optional, default: true)
- reuse_worktrees: $ARGUMENTS (optional, default: false)

**IMPORTANT: Execute this command by running the bash commands below and using the Task tool for orchestration**

When this command is invoked, you should:
1. Execute the bash commands in each phase using the Bash tool
2. Use the Task tool to deploy agents during the orchestration phase
3. Create actual worktrees and run actual commands, not just display templates

**PHASE 0: PRE-FLIGHT CHECKS**

Before doing anything expensive, validate environment using the Bash tool:

```bash
# 1. Check git status
if [ -n "$(git status --porcelain)" ]; then
  echo "⚠️  WARNING: You have uncommitted changes"
  echo "It's recommended to commit or stash before orchestrating."
  echo ""
  echo "Continue anyway? (y/N)"
  # Wait for user confirmation
fi

# 2. Derive worktree prefix from task
WORKTREE_PREFIX="task-${task_id}-orch"
echo "📁 Using worktree prefix: ${WORKTREE_PREFIX}"

# 3. Check for existing worktrees
EXISTING_WORKTREES=$(git worktree list | grep -c "${WORKTREE_PREFIX}" || true)
if [ $EXISTING_WORKTREES -gt 0 ]; then
  if [ "${reuse_worktrees}" = "true" ]; then
    echo "♻️  Reusing existing worktrees"
  else
    echo "⚠️  Found existing worktrees with prefix '${WORKTREE_PREFIX}'"
    echo ""
    echo "Options:"
    echo "1. Remove and recreate (clean start)"
    echo "2. Reuse existing worktrees"
    echo "3. Cancel"
    # Handle user choice
  fi
fi

# 4. Check available ports
REQUIRED_PORTS=6
if [ "${specialists}" != "all" ]; then
  SPECIALIST_COUNT=$(echo "${specialists}" | tr ',' '\n' | wc -l)
  REQUIRED_PORTS=$((SPECIALIST_COUNT + 1))  # +1 for synthesis
fi

echo "🔍 Checking port availability (3001-300${REQUIRED_PORTS})..."
for i in $(seq 1 $REQUIRED_PORTS); do
  PORT=$((3000 + i))
  if lsof -i:$PORT > /dev/null 2>&1; then
    echo "❌ Port $PORT is already in use"
    echo "Please free up ports 3001-300${REQUIRED_PORTS} or adjust configuration"
    exit 1
  fi
done
echo "✅ All required ports are available"

# 5. Check for state file
STATE_FILE=".taskmaster/orchestration-state.yaml"
if [ -f "$STATE_FILE" ]; then
  LAST_TASK=$(grep "task_id:" "$STATE_FILE" | awk '{print $2}')
  if [ "$LAST_TASK" = "${task_id}" ]; then
    echo "📄 Found previous orchestration state for task ${task_id}"
    echo "Resume previous orchestration? (y/N)"
    # Handle resume logic
  fi
fi

# 6. Estimate time
AGENT_COUNT=$((${depth} * 5 + 2))  # specialists * depth + evaluation + synthesis
EST_TIME=$((AGENT_COUNT * 10))  # ~10 seconds per agent
echo "⏱️  Estimated orchestration time: ~${EST_TIME} seconds"
echo ""
```

**PHASE 1: SMART WORKTREE CREATION**

If worktrees need to be created:

```bash
echo "🌳 Creating ${REQUIRED_PORTS} worktrees..."

# Create state directory
mkdir -p .taskmaster/orchestration-state

# Save initial state
cat > "$STATE_FILE" << EOF
task_id: ${task_id}
worktree_prefix: ${WORKTREE_PREFIX}
started_at: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
status: initializing
specialists_requested: ${specialists}
depth: ${depth}
worktrees:
EOF

# Create worktrees with better naming
SPECIALIST_NAMES=("performance" "architecture" "ux_dx" "accessibility" "innovation" "synthesis")
for i in $(seq 1 $REQUIRED_PORTS); do
  WORKTREE_NAME="${WORKTREE_PREFIX}-${i}-${SPECIALIST_NAMES[$((i-1))]}"
  
  echo "  Creating: ${WORKTREE_NAME}"
  git worktree add -b "${WORKTREE_NAME}" ".worktrees/${WORKTREE_NAME}"
  
  # Update state file
  echo "  - name: ${WORKTREE_NAME}" >> "$STATE_FILE"
  echo "    path: .worktrees/${WORKTREE_NAME}" >> "$STATE_FILE"
  echo "    port: $((3000 + i))" >> "$STATE_FILE"
  echo "    specialist: ${SPECIALIST_NAMES[$((i-1))]}" >> "$STATE_FILE"
  
  # Install dependencies
  (cd ".worktrees/${WORKTREE_NAME}" && pnpm install --prefer-offline) &
done

# Wait for all installations
wait
echo "✅ Worktrees created and dependencies installed"
```

**PHASE 2: ORCHESTRATION WITH PROGRESS TRACKING**

Launch orchestration with better progress reporting:

```bash
echo ""
echo "🤖 Starting orchestration for Task ${task_id}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Update state
sed -i 's/status: initializing/status: orchestrating/' "$STATE_FILE"
```

**IMPORTANT: Now use the Task tool to run the orchestrate-task-v3 command**

Deploy the orchestration using the Task tool with these parameters:
- task_id=${task_id}
- specialists=${specialists}
- depth=${depth}
- deployment_mode=worktree-all
- worktree_prefix=${WORKTREE_PREFIX}

This will deploy approximately 23 agents (Master Orchestrator, 5 Specialist Orchestrators, 15 Sub-Agents, Evaluation Orchestrator, and Synthesis Orchestrator).

The orchestration will write implementations to the worktrees created in Phase 1.

**PHASE 3: AUTO-START DEV SERVERS**

If auto_start_servers=true:

```bash
echo ""
echo "🚀 Starting development servers..."

# Create a session management script
cat > ".taskmaster/orchestration-servers.sh" << 'EOF'
#!/bin/bash
# Auto-generated server management script
WORKTREE_PREFIX="${WORKTREE_PREFIX}"
PORTS=(3001 3002 3003 3004 3005 3006)
NAMES=("Performance" "Architecture" "UX/DX" "Accessibility" "Innovation" "Synthesis")

echo "📡 Development Servers:"
echo "━━━━━━━━━━━━━━━━━━━━━"
for i in ${!PORTS[@]}; do
  echo "  http://localhost:${PORTS[$i]} - ${NAMES[$i]}"
done
echo ""
echo "Commands:"
echo "  'tmux attach -t orchestration' - View all servers"
echo "  'Ctrl+C' - Stop all servers"
echo ""

# Start tmux session
tmux new-session -d -s orchestration
for i in ${!PORTS[@]}; do
  WORKTREE_NAME="${WORKTREE_PREFIX}-$((i+1))-${NAMES[$i],,}"
  if [ $i -eq 0 ]; then
    tmux rename-window -t orchestration:0 "${NAMES[$i]}"
    tmux send-keys -t orchestration:0 "cd .worktrees/${WORKTREE_NAME} && pnpm dev" C-m
  else
    tmux new-window -t orchestration -n "${NAMES[$i]}"
    tmux send-keys -t orchestration:$i "cd .worktrees/${WORKTREE_NAME} && pnpm dev" C-m
  fi
done
EOF

chmod +x ".taskmaster/orchestration-servers.sh"
./.taskmaster/orchestration-servers.sh

echo "✅ All servers started in tmux session 'orchestration'"
```

**PHASE 4: CREATE COMPARISON DASHBOARD**

Generate a simple HTML dashboard:

```html
<!-- .taskmaster/comparison-dashboard.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Task ${task_id} - Implementation Comparison</title>
  <style>
    body { margin: 0; font-family: system-ui; }
    .header { background: #1a1a1a; color: white; padding: 1rem; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; padding: 1rem; }
    .frame-container { 
      border: 2px solid #ddd; 
      border-radius: 8px; 
      overflow: hidden;
      height: 600px;
    }
    .frame-header {
      background: #f5f5f5;
      padding: 0.5rem;
      font-weight: bold;
      border-bottom: 1px solid #ddd;
    }
    iframe { width: 100%; height: calc(100% - 40px); border: none; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Task ${task_id} - Implementation Comparison</h1>
    <p>Compare all ${REQUIRED_PORTS} implementations side by side</p>
  </div>
  <div class="grid">
    <!-- Auto-generated iframes for each worktree -->
  </div>
  <script>
    // Auto-refresh every 5 seconds if servers aren't ready
    setTimeout(() => location.reload(), 5000);
  </script>
</body>
</html>
```

**PHASE 5: FINAL SUMMARY**

```bash
echo ""
echo "✅ ORCHESTRATION COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Summary:"
echo "  • Task ID: ${task_id}"
echo "  • Implementations: ${AGENT_COUNT} generated"
echo "  • Worktrees: ${REQUIRED_PORTS} created"
echo "  • Time taken: $(calculate_duration)"
echo ""
echo "🔗 Quick Links:"
echo "  • Performance:    http://localhost:3001/test-orchestrated"
echo "  • Architecture:   http://localhost:3002/test-orchestrated"
echo "  • UX/DX:         http://localhost:3003/test-orchestrated"
echo "  • Accessibility: http://localhost:3004/test-orchestrated"
echo "  • Innovation:    http://localhost:3005/test-orchestrated"
echo "  • Synthesis:     http://localhost:3006/test-orchestrated"
echo ""
echo "  • Comparison:    file://$(pwd)/.taskmaster/comparison-dashboard.html"
echo ""
echo "💡 Next Steps:"
echo "  1. Review implementations in your browser"
echo "  2. Switch implementations: cd .worktrees/<name> && switch-impl <impl>"
echo "  3. View server logs: tmux attach -t orchestration"
echo "  4. Clean up: /orchestrate-cleanup task_id=${task_id}"
echo ""

# Update final state
sed -i 's/status: orchestrating/status: completed/' "$STATE_FILE"
echo "completed_at: $(date -u +"%Y-%m-%d %H:%M:%S UTC")" >> "$STATE_FILE"
```

**ERROR RECOVERY**

If orchestration fails at any point:

```bash
# Save recovery information
cat >> "$STATE_FILE" << EOF
error:
  phase: ${CURRENT_PHASE}
  message: ${ERROR_MESSAGE}
  can_resume: true
  resume_command: "/orchestrate-and-test task_id=${task_id} resume=true"
EOF

echo "❌ Orchestration failed during ${CURRENT_PHASE}"
echo ""
echo "The system state has been saved. You can:"
echo "  1. Resume: /orchestrate-and-test task_id=${task_id} resume=true"
echo "  2. Start over: /orchestrate-cleanup task_id=${task_id} && /orchestrate-and-test task_id=${task_id}"
echo "  3. Check logs: cat .taskmaster/orchestration.log"
```

**USAGE:**

Simple as:
```bash
/orchestrate-and-test task_id=7
```

Or with options:
```bash
/orchestrate-and-test task_id=7 specialists=performance,architecture depth=2 auto_start_servers=false
```

Resume a failed run:
```bash
/orchestrate-and-test task_id=7 resume=true
```