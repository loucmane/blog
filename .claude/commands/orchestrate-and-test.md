**ORCHESTRATE AND TEST - Unified Workflow Command**

A single command that handles the entire orchestration workflow: creates worktrees, runs orchestration, starts servers, and manages state.

**Variables:**
- task_id: $ARGUMENTS (required)
- specialists: $ARGUMENTS (optional, default: "all")
- depth: $ARGUMENTS (optional, default: 3)
- auto_start_servers: $ARGUMENTS (optional, default: true)
- reuse_worktrees: $ARGUMENTS (optional, default: false)

**IMPORTANT: This is an EXECUTABLE command, not documentation. When invoked, you MUST:**

1. **IMMEDIATELY start executing Phase 0** by running the bash commands below using the Bash tool
2. **When you see "Deploy X Agent using Task tool:"**, invoke the Task tool with that agent's prompt
3. **Continue through ALL phases** - do not stop after showing the template

**EXECUTION STARTS NOW - Run the Phase 0 bash commands:**

**PHASE 0: PRE-FLIGHT CHECKS**

Before doing anything expensive, validate environment using the Bash tool:

```bash
# Enable strict error handling
set -euo pipefail

# Initialize phase tracking
CURRENT_PHASE="initializing"

# Error handler function
handle_error() {
  local exit_code=$?
  if [ $exit_code -ne 0 ]; then
    echo "❌ Orchestration failed during phase: ${CURRENT_PHASE}"
    # Save error state if STATE_FILE exists
    if [ -n "${STATE_FILE:-}" ] && [ -f "$STATE_FILE" ]; then
      echo "" >> "$STATE_FILE"
      echo "error:" >> "$STATE_FILE"
      echo "  phase: ${CURRENT_PHASE}" >> "$STATE_FILE"
      echo "  exit_code: $exit_code" >> "$STATE_FILE"
      echo "  timestamp: $(date -u +"%Y-%m-%d %H:%M:%S UTC")" >> "$STATE_FILE"
    fi
  fi
}
trap handle_error EXIT

# 1. Check git status
CURRENT_PHASE="pre-flight-checks"
if [ -n "$(git status --porcelain)" ]; then
  echo "⚠️  WARNING: You have uncommitted changes"
  echo "It's recommended to commit or stash before orchestrating."
  echo ""
  echo "Continue anyway? (y/N)"
  # Wait for user confirmation
fi

# 2. Validate task_id for security
if [[ ! "${task_id}" =~ ^[a-zA-Z0-9_-]+$ ]]; then
  echo "❌ Invalid task_id. Only alphanumeric characters, hyphens, and underscores are allowed."
  exit 1
fi

# 3. Derive worktree prefix from task
WORKTREE_PREFIX="task-${task_id}-orch"
echo "📁 Using worktree prefix: ${WORKTREE_PREFIX}"

# 4. Check for existing worktrees
EXISTING_WORKTREES=$(git worktree list | grep -c "${WORKTREE_PREFIX}" || true)
if [ "$EXISTING_WORKTREES" -gt 0 ]; then
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

# 5. Check available ports
REQUIRED_PORTS=6
if [ "${specialists}" != "all" ]; then
  SPECIALIST_COUNT=$(echo "${specialists}" | tr ',' '\n' | wc -l)
  REQUIRED_PORTS=$((SPECIALIST_COUNT + 1))  # +1 for synthesis
fi

echo "🔍 Checking port availability (3001-300${REQUIRED_PORTS})..."
for i in $(seq 1 "$REQUIRED_PORTS"); do
  PORT=$((3000 + i))
  if lsof -i:"$PORT" > /dev/null 2>&1; then
    echo "❌ Port $PORT is already in use"
    echo "Please free up ports 3001-300${REQUIRED_PORTS} or adjust configuration"
    exit 1
  fi
done
echo "✅ All required ports are available"

# 6. Setup orchestration output directory
ORCH_OUTPUT_DIR="docs/ai/for-agentic-loops/orchestration-outputs/task-${task_id}"
mkdir -p "${ORCH_OUTPUT_DIR}"
mkdir -p "${ORCH_OUTPUT_DIR}/state"
mkdir -p "${ORCH_OUTPUT_DIR}/analysis"
mkdir -p "${ORCH_OUTPUT_DIR}/synthesis"
mkdir -p "${ORCH_OUTPUT_DIR}/logs"

# Initialize orchestration log
ORCH_LOG="${ORCH_OUTPUT_DIR}/logs/orchestration.log"
echo "=== Orchestration Started: $(date '+%Y-%m-%d %H:%M:%S') ===" > "$ORCH_LOG"
echo "Task ID: ${task_id}" >> "$ORCH_LOG"
echo "Specialists: ${specialists}" >> "$ORCH_LOG"
echo "Depth: ${depth}" >> "$ORCH_LOG"
echo "" >> "$ORCH_LOG"

# Logging function
log_agent() {
  local agent_name="$1"
  local status="$2"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[${timestamp}] ${agent_name}: ${status}" >> "$ORCH_LOG"
  echo "📝 [${timestamp}] ${agent_name}: ${status}"
}

# 7. Check for state file
STATE_FILE="${ORCH_OUTPUT_DIR}/state/orchestration-state.yaml"
if [ -f "$STATE_FILE" ]; then
  LAST_TASK=$(grep "task_id:" "$STATE_FILE" | awk '{print $2}')
  if [ "$LAST_TASK" = "${task_id}" ]; then
    echo "📄 Found previous orchestration state for task ${task_id}"
    echo "Resume previous orchestration? (y/N)"
    # Handle resume logic
  fi
fi

# 8. Estimate time
AGENT_COUNT=$((${depth} * 5 + 2))  # specialists * depth + evaluation + synthesis
EST_TIME=$((AGENT_COUNT * 10))  # ~10 seconds per agent
echo "⏱️  Estimated orchestration time: ~${EST_TIME} seconds"
echo ""
```

**PHASE 0.5: PRE-ANALYSIS - CONTRACT GENERATION**

Run analysis to create shared contracts before any implementation work:

```bash
CURRENT_PHASE="pre-analysis"
echo ""
echo "🔍 PHASE 0.5: Pre-Analysis - Generating Implementation Contracts"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Create contracts directory
CONTRACTS_DIR="${ORCH_OUTPUT_DIR}/contracts"
mkdir -p "${CONTRACTS_DIR}"

# Update state - we're already past initializing
echo "pre_analysis_started: $(date -u +"%Y-%m-%d %H:%M:%S UTC")" >> "$STATE_FILE"

# Log Pre-Analysis start
log_agent "Pre-Analysis Agent" "DEPLOYING"
```

**NOW DEPLOY Pre-Analysis Agent - Invoke the Task tool with this prompt:**

```
description: "Pre-Analysis Agent for Task ${task_id}"
prompt: |
  TASK: Pre-Analysis Agent for Task ${task_id} - Contract Generation

You are the Pre-Analysis Agent responsible for creating implementation contracts that will guide all other agents.

**Your Critical Mission**: Analyze Task ${task_id} and generate contracts that will ensure all 15+ implementations are coherent and compatible.

**Contract Files to Generate**:

1. **${CONTRACTS_DIR}/interface-contract.yaml**
   - Component props/API interface
   - Event handlers and callbacks
   - Type definitions
   - Return value contracts

2. **${CONTRACTS_DIR}/behavior-contract.yaml**
   - Core functionality requirements
   - User interaction patterns
   - State management approach
   - Error handling behavior

3. **${CONTRACTS_DIR}/integration-contract.yaml**
   - File naming conventions
   - Import/export patterns
   - Theme integration approach
   - Testing requirements

4. **${CONTRACTS_DIR}/constraints.yaml**
   - Performance budgets
   - Accessibility requirements
   - Browser support targets
   - Dependencies allowed/forbidden

**Analysis Approach**:
1. Read the task description from TaskMaster
2. Analyze existing codebase patterns
3. Consider all 5 specialist perspectives
4. Generate contracts that allow creativity while ensuring compatibility

**Key Principles**:
- Contracts should be specific enough to ensure compatibility
- But flexible enough to allow specialist creativity
- Focus on interfaces, not implementations
- Think about edge cases and error states

Begin by analyzing Task ${task_id} and the current codebase patterns.
```

After the Pre-Analysis Agent completes, update the agent prompts to reference the contracts:

```bash
# Verify contracts were generated
if [ ! -f "${CONTRACTS_DIR}/interface-contract.yaml" ]; then
  echo "❌ Pre-analysis failed to generate contracts"
  log_agent "Pre-Analysis Agent" "FAILED - No contracts generated"
  exit 1
fi

log_agent "Pre-Analysis Agent" "COMPLETED (success)"
echo "✅ Implementation contracts generated successfully"
echo ""
echo "📄 Contract files:"
ls -la "${CONTRACTS_DIR}/"
echo ""

# Update state
echo "contracts_generated: true" >> "$STATE_FILE"
echo "contracts_path: ${CONTRACTS_DIR}" >> "$STATE_FILE"
```

**PHASE 1: SMART WORKTREE CREATION**

If worktrees need to be created:

```bash
CURRENT_PHASE="worktree-creation"
echo "🌳 Creating ${REQUIRED_PORTS} worktrees..."

# Create state directory
echo "📁 Orchestration outputs will be in: $ORCH_OUTPUT_DIR"

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
CURRENT_PHASE="orchestration"
echo ""
echo "🤖 Starting orchestration for Task ${task_id}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Update state
sed -i 's/status: initializing/status: orchestrating/' "$STATE_FILE"

# Log orchestration phase start
echo "" >> "$ORCH_LOG"
echo "=== Orchestration Phase Started: $(date '+%Y-%m-%d %H:%M:%S') ===" >> "$ORCH_LOG"
```

**IMPORTANT: Now deploy the orchestration agents directly**

The orchestration agents are deployed through specific prompts that guide their implementation work.

**NOW DEPLOY Master Orchestrator - Run this bash command first:**

```bash
log_agent "Master Orchestrator" "DEPLOYING"
```

**Then IMMEDIATELY invoke the Task tool with this prompt:**

```
description: "Master Orchestrator for Task ${task_id}"
prompt: |
  TASK: Master Orchestrator for Task ${task_id} - Unified Workflow Orchestration

You are the Master Orchestrator for a sophisticated multi-agent system implementing Task ${task_id}.

Your deployment configuration:
- Task ID: ${task_id}
- Specialists: ${specialists}
- Depth: ${depth} sub-agents per specialist
- Deployment Mode: worktree-all
- Worktree Prefix: ${worktree_prefix}
- Target Path: packages/web/src/components
- Analysis Output: ${ORCH_OUTPUT_DIR}/analysis/

Your responsibilities:
1. Coordinate deployment of 5 Specialist Orchestrators
2. Each specialist will deploy ${depth} sub-agents for implementation
3. Monitor implementation progress across all worktrees
4. Ensure consistent quality and integration
5. Prepare for synthesis phase
6. Write analysis and coordination docs to ${ORCH_OUTPUT_DIR}/analysis/

**CRITICAL**: Read and enforce the implementation contracts:
- ${CONTRACTS_DIR}/interface-contract.yaml - All components MUST follow this interface
- ${CONTRACTS_DIR}/behavior-contract.yaml - All implementations MUST exhibit these behaviors
- ${CONTRACTS_DIR}/integration-contract.yaml - All code MUST follow these patterns
- ${CONTRACTS_DIR}/constraints.yaml - All implementations MUST respect these limits

Ensure ALL specialist orchestrators receive and understand these contracts.

Specialist worktree assignments:
- Performance: .worktrees/${worktree_prefix}-1-performance/
- Architecture: .worktrees/${worktree_prefix}-2-architecture/
- UX/DX: .worktrees/${worktree_prefix}-3-ux_dx/
- Accessibility: .worktrees/${worktree_prefix}-4-accessibility/
- Innovation: .worktrees/${worktree_prefix}-5-innovation/
- Synthesis: .worktrees/${worktree_prefix}-6-synthesis/

Begin by analyzing Task ${task_id} requirements and preparing deployment strategy.
```

```bash
# Log Master Orchestrator completion (will happen after deployment)
log_agent "Master Orchestrator" "DEPLOYED - Coordinating specialists"
```

**NOW DEPLOY 5 Specialist Orchestrators - First run these bash commands:**

```bash
log_agent "Performance Specialist" "DEPLOYING"
log_agent "Architecture Specialist" "DEPLOYING"
log_agent "UX/DX Specialist" "DEPLOYING"
log_agent "Accessibility Specialist" "DEPLOYING"
log_agent "Innovation Specialist" "DEPLOYING"
```

**Then IMMEDIATELY invoke the Task tool 5 times in parallel with these prompts:**

```
SPECIALIST 1 - PERFORMANCE:
TASK: Performance Specialist Orchestrator for Task ${task_id}

You are the Performance Specialist Orchestrator.
Your worktree: .worktrees/${worktree_prefix}-1-performance/
Your focus: Bundle size, runtime performance, memory efficiency
Analysis output: ${ORCH_OUTPUT_DIR}/analysis/performance/

Deploy ${depth} sub-agents to create implementations in:
- _implementations/bundle-optimizer/
- _implementations/runtime-optimizer/
- _implementations/memory-optimizer/

Each implementation should be complete and functional.

**MANDATORY**: All implementations MUST adhere to:
- ${CONTRACTS_DIR}/interface-contract.yaml - Use exact props/API defined here
- ${CONTRACTS_DIR}/behavior-contract.yaml - Implement all required behaviors
- ${CONTRACTS_DIR}/integration-contract.yaml - Follow naming/import patterns
- ${CONTRACTS_DIR}/constraints.yaml - Stay within performance budgets

Write a decision log to: ${ORCH_OUTPUT_DIR}/analysis/performance/decisions.md
```

```
SPECIALIST 2 - ARCHITECTURE:
TASK: Architecture Specialist Orchestrator for Task ${task_id}

You are the Architecture Specialist Orchestrator.
Your worktree: .worktrees/${worktree_prefix}-2-architecture/
Your focus: Code organization, maintainability, scalability
Analysis output: ${ORCH_OUTPUT_DIR}/analysis/architecture/

Deploy ${depth} sub-agents to create implementations in:
- _implementations/modular-design/
- _implementations/maintainability-focused/
- _implementations/scalability-optimized/

Each implementation should be complete and functional.

**MANDATORY**: All implementations MUST adhere to:
- ${CONTRACTS_DIR}/interface-contract.yaml - Use exact props/API defined here
- ${CONTRACTS_DIR}/behavior-contract.yaml - Implement all required behaviors
- ${CONTRACTS_DIR}/integration-contract.yaml - Follow naming/import patterns
- ${CONTRACTS_DIR}/constraints.yaml - Respect architectural patterns

Write a decision log to: ${ORCH_OUTPUT_DIR}/analysis/architecture/decisions.md
```

```
SPECIALIST 3 - UX/DX:
TASK: UX/DX Specialist Orchestrator for Task ${task_id}

You are the UX/DX Specialist Orchestrator.
Your worktree: .worktrees/${worktree_prefix}-3-ux_dx/
Your focus: User experience, developer experience, API design
Analysis output: ${ORCH_OUTPUT_DIR}/analysis/ux_dx/

Deploy ${depth} sub-agents to create implementations in:
- _implementations/intuitive-api/
- _implementations/enhanced-ux/
- _implementations/developer-friendly/

Each implementation should be complete and functional.

**MANDATORY**: All implementations MUST adhere to:
- ${CONTRACTS_DIR}/interface-contract.yaml - Use exact props/API defined here
- ${CONTRACTS_DIR}/behavior-contract.yaml - Implement all required behaviors
- ${CONTRACTS_DIR}/integration-contract.yaml - Follow naming/import patterns
- ${CONTRACTS_DIR}/constraints.yaml - Maintain UX/DX standards

Write a decision log to: ${ORCH_OUTPUT_DIR}/analysis/ux_dx/decisions.md
```

```
SPECIALIST 4 - ACCESSIBILITY:
TASK: Accessibility Specialist Orchestrator for Task ${task_id}

You are the Accessibility Specialist Orchestrator.
Your worktree: .worktrees/${worktree_prefix}-4-accessibility/
Your focus: WCAG compliance, screen reader support, keyboard navigation
Analysis output: ${ORCH_OUTPUT_DIR}/analysis/accessibility/

Deploy ${depth} sub-agents to create implementations in:
- _implementations/wcag-compliant/
- _implementations/screen-reader-optimized/
- _implementations/keyboard-first/

Each implementation should be complete and functional.

**MANDATORY**: All implementations MUST adhere to:
- ${CONTRACTS_DIR}/interface-contract.yaml - Use exact props/API defined here
- ${CONTRACTS_DIR}/behavior-contract.yaml - Implement all required behaviors
- ${CONTRACTS_DIR}/integration-contract.yaml - Follow naming/import patterns
- ${CONTRACTS_DIR}/constraints.yaml - Meet all accessibility requirements

Write a decision log to: ${ORCH_OUTPUT_DIR}/analysis/accessibility/decisions.md
```

```
SPECIALIST 5 - INNOVATION:
TASK: Innovation Specialist Orchestrator for Task ${task_id}

You are the Innovation Specialist Orchestrator.
Your worktree: .worktrees/${worktree_prefix}-5-innovation/
Your focus: Cutting-edge features, creative solutions, future-proofing
Analysis output: ${ORCH_OUTPUT_DIR}/analysis/innovation/

Deploy ${depth} sub-agents to create implementations in:
- _implementations/ai-enhanced/
- _implementations/experimental-features/
- _implementations/future-proof/

Each implementation should be complete and functional.

**MANDATORY**: All implementations MUST adhere to:
- ${CONTRACTS_DIR}/interface-contract.yaml - Use exact props/API defined here
- ${CONTRACTS_DIR}/behavior-contract.yaml - Implement all required behaviors
- ${CONTRACTS_DIR}/integration-contract.yaml - Follow naming/import patterns
- ${CONTRACTS_DIR}/constraints.yaml - Stay within innovation boundaries

Write a decision log to: ${ORCH_OUTPUT_DIR}/analysis/innovation/decisions.md
```

**Deploy Sub-Agents (15 total, 3 per specialist) using Task tool:**

```bash
# Log specialist completion and sub-agent deployment
log_agent "Performance Specialist" "DEPLOYED - Deploying 3 sub-agents"
log_agent "Architecture Specialist" "DEPLOYED - Deploying 3 sub-agents"
log_agent "UX/DX Specialist" "DEPLOYED - Deploying 3 sub-agents"
log_agent "Accessibility Specialist" "DEPLOYED - Deploying 3 sub-agents"
log_agent "Innovation Specialist" "DEPLOYED - Deploying 3 sub-agents"

# Log sub-agent deployments
for specialist in "Performance" "Architecture" "UX/DX" "Accessibility" "Innovation"; do
  for i in 1 2 3; do
    log_agent "${specialist} Sub-Agent ${i}" "DEPLOYING"
  done
done
```

Each specialist orchestrator deploys their sub-agents. Example for Performance:

```
PERFORMANCE SUB-AGENT 1:
TASK: Implement bundle-optimized version of Task ${task_id}

You are a Performance Sub-Agent focused on bundle optimization.
Write your implementation to: .worktrees/${worktree_prefix}-1-performance/packages/web/src/components/_implementations/bundle-optimizer/

Focus on:
- Minimal bundle size
- Tree-shaking optimization
- Code splitting strategies

**STRICT REQUIREMENTS**: Your implementation MUST comply with:
- ${CONTRACTS_DIR}/interface-contract.yaml - Use ONLY the defined props and types
- ${CONTRACTS_DIR}/behavior-contract.yaml - Implement ALL required behaviors
- ${CONTRACTS_DIR}/integration-contract.yaml - Follow exact file/import patterns
- ${CONTRACTS_DIR}/constraints.yaml - Stay under bundle size limits

Document your optimization decisions in a README.md in your implementation directory.
```

[Similar patterns for all 15 sub-agents]

```bash
# Log sub-agent completions (simulated after deployment)
for specialist in "Performance" "Architecture" "UX/DX" "Accessibility" "Innovation"; do
  for i in 1 2 3; do
    log_agent "${specialist} Sub-Agent ${i}" "COMPLETED (success)"
  done
done
```

**Deploy Evaluation Orchestrator using Task tool:**

```bash
log_agent "Evaluation Orchestrator" "DEPLOYING"
```

```
TASK: Evaluation Orchestrator for Task ${task_id}

You are the Evaluation Orchestrator.

Analyze all implementations across all worktrees:
- Performance: 3 implementations
- Architecture: 3 implementations  
- UX/DX: 3 implementations
- Accessibility: 3 implementations
- Innovation: 3 implementations

Total: 15 implementations to evaluate

Create evaluation reports and select the best from each category.
Update manifest.json files with scores and metrics.

**EVALUATION CRITERIA**: Use the contracts as your rubric:
- ${CONTRACTS_DIR}/interface-contract.yaml - Verify ALL implementations use correct interface
- ${CONTRACTS_DIR}/behavior-contract.yaml - Test ALL required behaviors work correctly
- ${CONTRACTS_DIR}/integration-contract.yaml - Check code follows patterns
- ${CONTRACTS_DIR}/constraints.yaml - Measure against defined limits

Any implementation that violates contracts should be marked as non-compliant.
Write evaluation summary to: ${ORCH_OUTPUT_DIR}/analysis/evaluation-report.md
```

```bash
log_agent "Evaluation Orchestrator" "COMPLETED (success)"
```

**Deploy Progressive Summarization Agents using Task tool (5 agents in parallel):**

```bash
# Log summarization phase
echo "" >> "$ORCH_LOG"
echo "=== Progressive Summarization Phase: $(date '+%Y-%m-%d %H:%M:%S') ===" >> "$ORCH_LOG"

for specialist in "Performance" "Architecture" "UX/DX" "Accessibility" "Innovation"; do
  log_agent "${specialist} Summarization Agent" "DEPLOYING"
done
```

To prevent context window overload, deploy summarization agents for each specialist:

```
SUMMARIZATION AGENT - PERFORMANCE:
TASK: Summarize Performance Implementations for Task ${task_id}

You are the Performance Summarization Agent.
Your worktree: .worktrees/${worktree_prefix}-1-performance/

Read and analyze your 3 implementations:
- _implementations/bundle-optimizer/
- _implementations/runtime-optimizer/
- _implementations/memory-optimizer/

Create a concise summary (max 500 words) that includes:
1. **Key Features**: What each implementation prioritizes
2. **Trade-offs**: What was sacrificed for performance gains
3. **Unique Innovations**: Novel approaches in each
4. **Recommendations**: Which to use in which scenarios
5. **Synthesis Guidance**: Best features to combine

Write your summary to: ${ORCH_OUTPUT_DIR}/summaries/performance-summary.md

Format:
```markdown
# Performance Implementations Summary

## Bundle Optimizer
- **Focus**: [Main optimization approach]
- **Key Features**: [2-3 bullet points]
- **Trade-offs**: [What was sacrificed]
- **Best For**: [Use case]

## Runtime Optimizer
[Same structure]

## Memory Optimizer
[Same structure]

## Synthesis Recommendations
- Combine [X] from Bundle Optimizer with [Y] from Runtime Optimizer
- Consider [Z] approach for [specific scenario]
```
```

```
SUMMARIZATION AGENT - ARCHITECTURE:
TASK: Summarize Architecture Implementations for Task ${task_id}

You are the Architecture Summarization Agent.
Your worktree: .worktrees/${worktree_prefix}-2-architecture/

[Similar structure as Performance, adapted for Architecture focus]
Write summary to: ${ORCH_OUTPUT_DIR}/summaries/architecture-summary.md
```

```
SUMMARIZATION AGENT - UX/DX:
TASK: Summarize UX/DX Implementations for Task ${task_id}

You are the UX/DX Summarization Agent.
Your worktree: .worktrees/${worktree_prefix}-3-ux_dx/

[Similar structure, adapted for UX/DX focus]
Write summary to: ${ORCH_OUTPUT_DIR}/summaries/ux_dx-summary.md
```

```
SUMMARIZATION AGENT - ACCESSIBILITY:
TASK: Summarize Accessibility Implementations for Task ${task_id}

You are the Accessibility Summarization Agent.
Your worktree: .worktrees/${worktree_prefix}-4-accessibility/

[Similar structure, adapted for Accessibility focus]
Write summary to: ${ORCH_OUTPUT_DIR}/summaries/accessibility-summary.md
```

```
SUMMARIZATION AGENT - INNOVATION:
TASK: Summarize Innovation Implementations for Task ${task_id}

You are the Innovation Summarization Agent.
Your worktree: .worktrees/${worktree_prefix}-5-innovation/

[Similar structure, adapted for Innovation focus]
Write summary to: ${ORCH_OUTPUT_DIR}/summaries/innovation-summary.md
```

Create summaries directory:
```bash
mkdir -p "${ORCH_OUTPUT_DIR}/summaries"
echo "📝 Progressive summarization in progress..."

# Log summarization completions
for specialist in "Performance" "Architecture" "UX/DX" "Accessibility" "Innovation"; do
  log_agent "${specialist} Summarization Agent" "COMPLETED (success)"
done
```

**Deploy Synthesis Orchestrator using Task tool:**

```bash
# Log synthesis phase
echo "" >> "$ORCH_LOG"
echo "=== Synthesis Phase: $(date '+%Y-%m-%d %H:%M:%S') ===" >> "$ORCH_LOG"
log_agent "Synthesis Orchestrator" "DEPLOYING"
```

```
TASK: Synthesis Orchestrator for Task ${task_id}

You are the Synthesis Orchestrator.
Your worktree: .worktrees/${worktree_prefix}-6-synthesis/

**IMPORTANT**: To prevent context overload, read the summaries instead of full implementations:
- ${ORCH_OUTPUT_DIR}/summaries/performance-summary.md
- ${ORCH_OUTPUT_DIR}/summaries/architecture-summary.md
- ${ORCH_OUTPUT_DIR}/summaries/ux_dx-summary.md
- ${ORCH_OUTPUT_DIR}/summaries/accessibility-summary.md
- ${ORCH_OUTPUT_DIR}/summaries/innovation-summary.md

Also read the evaluation report:
- ${ORCH_OUTPUT_DIR}/analysis/evaluation-report.md

Based on these summaries and evaluations, create the ultimate synthesis by:
1. Cherry-picking best features identified in summaries
2. Following synthesis recommendations from each specialist
3. Ensuring all perspectives are represented
4. Creating a cohesive, integrated solution

For specific implementation details, you may selectively read individual implementations mentioned in the summaries.

**SYNTHESIS CONSTRAINTS**: Your final implementation MUST:
- ${CONTRACTS_DIR}/interface-contract.yaml - Maintain the exact interface
- ${CONTRACTS_DIR}/behavior-contract.yaml - Include ALL required behaviors
- ${CONTRACTS_DIR}/integration-contract.yaml - Follow established patterns
- ${CONTRACTS_DIR}/constraints.yaml - Meet ALL constraints simultaneously

Read the evaluation report from: ${ORCH_OUTPUT_DIR}/analysis/evaluation-report.md
Document synthesis decisions in: ${ORCH_OUTPUT_DIR}/synthesis/synthesis-rationale.md
```

**Enhanced Coordination Through Decision Logs:**

Each specialist writes decisions to help other agents understand their approach:
- Performance: ${ORCH_OUTPUT_DIR}/analysis/performance/decisions.md
- Architecture: ${ORCH_OUTPUT_DIR}/analysis/architecture/decisions.md
- UX/DX: ${ORCH_OUTPUT_DIR}/analysis/ux_dx/decisions.md
- Accessibility: ${ORCH_OUTPUT_DIR}/analysis/accessibility/decisions.md
- Innovation: ${ORCH_OUTPUT_DIR}/analysis/innovation/decisions.md

These logs help the Synthesis agent understand trade-offs and make informed decisions.

**Implementation Structure:**

Each worktree will have this structure after orchestration:
```
packages/web/src/components/
├── _implementations/
│   ├── [impl-name-1]/
│   │   └── [complete implementation]
│   ├── [impl-name-2]/
│   │   └── [complete implementation]
│   ├── [impl-name-3]/
│   │   └── [complete implementation]
│   ├── manifest.json
│   ├── ACTIVE
│   └── switch.sh
└── [active implementation files]
```

The orchestration will take approximately ${EST_TIME} seconds to complete.

```bash
# Log synthesis completion
log_agent "Synthesis Orchestrator" "COMPLETED (success)"

# Log final orchestration summary
echo "" >> "$ORCH_LOG"
echo "=== Orchestration Completed: $(date '+%Y-%m-%d %H:%M:%S') ===" >> "$ORCH_LOG"
echo "Total agents deployed: $((5 + 15 + 1 + 5 + 1))" >> "$ORCH_LOG"  # specialists + sub-agents + eval + summaries + synthesis
echo "View real-time progress: tail -f $ORCH_LOG" >> "$ORCH_LOG"
```

**PHASE 3: AUTO-START DEV SERVERS**

If auto_start_servers=true:

```bash
CURRENT_PHASE="server-startup"
echo ""
echo "🚀 Starting development servers..."

# Create a session management script
cat > "$ORCH_OUTPUT_DIR/orchestration-servers.sh" << 'EOF'
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

chmod +x "$ORCH_OUTPUT_DIR/orchestration-servers.sh"
./$ORCH_OUTPUT_DIR/orchestration-servers.sh

echo "✅ All servers started in tmux session 'orchestration'"
```

**PHASE 4: CREATE COMPARISON DASHBOARD**

Generate a simple HTML dashboard:

```bash
CURRENT_PHASE="dashboard-creation"
# Create comparison dashboard
cat > "$ORCH_OUTPUT_DIR/comparison-dashboard.html" << 'EOF'
<!-- orchestration-outputs/task-{id}/comparison-dashboard.html -->
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
EOF
```

**PHASE 5: FINAL SUMMARY**

```bash
CURRENT_PHASE="completion"
echo ""
echo "✅ ORCHESTRATION COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Summary:"
echo "  • Task ID: ${task_id}"
echo "  • Contracts generated: 4 files"
echo "  • Implementations: ${AGENT_COUNT} generated"
echo "  • Worktrees: ${REQUIRED_PORTS} created"
echo "  • Decision logs: 5 specialist perspectives"
echo "  • Progressive summaries: 5 specialist summaries"
echo "  • Orchestration log: $ORCH_LOG"
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
echo "  • Comparison:    file://$(pwd)/$ORCH_OUTPUT_DIR/comparison-dashboard.html"
echo ""
echo "💡 Next Steps:"
echo "  1. Monitor orchestration progress: tail -f $ORCH_LOG"
echo "  2. Review contracts: cat $CONTRACTS_DIR/*.yaml"
echo "  3. Review implementations in your browser"
echo "  4. Read progressive summaries: cat $ORCH_OUTPUT_DIR/summaries/*.md"
echo "  5. Read decision logs: cat $ORCH_OUTPUT_DIR/analysis/*/decisions.md"
echo "  6. Switch implementations: cd .worktrees/<name> && switch-impl <impl>"
echo "  7. View server logs: tmux attach -t orchestration"
echo "  8. Clean up: /orchestrate-cleanup task_id=${task_id}"
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
echo "  3. Check logs: tail -f $ORCH_OUTPUT_DIR/logs/*.log"
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