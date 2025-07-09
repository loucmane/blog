**ORCHESTRATE AND TEST - Unified Workflow Command**

Think deeply about this multi-perspective implementation challenge. You are about to guide a sophisticated orchestration process.

**Variables:**

task_id: $ARGUMENTS
spec_file: $ARGUMENTS
specialists: $ARGUMENTS
depth: $ARGUMENTS
auto_start_servers: $ARGUMENTS
reuse_worktrees: $ARGUMENTS

**ARGUMENTS PARSING:**
Parse the following arguments from "$ARGUMENTS":
1. `task_id` - The TaskMaster task ID to implement (REQUIRED)
2. `spec_file` - Path to the orchestration specification file (default: .claude/specs/orchestrate-test-spec.md)
3. `specialists` - Which specialist perspectives to include (default: "all")
4. `depth` - Number of sub-agents per specialist (default: 3)
5. `auto_start_servers` - Whether to start development servers after orchestration (default: true)
6. `reuse_worktrees` - Whether to reuse existing worktrees from previous runs (default: false)

**PHASE 1: SPECIFICATION LOADING**
1. Load the orchestration specification from `spec_file` (or use default if not provided)
2. This specification contains all agent definitions and orchestration patterns
3. Parse and understand the complete orchestration framework

**PHASE 2: TASK ANALYSIS**
Read the task specification file at `.taskmaster/tasks/task_${String(task_id).padStart(3, '0')}.txt` and extract:
- Task ID, title, status, and priority
- Task description and implementation requirements
- Test strategy for validation
- All subtasks with their status
- Store complete specification for all agents

**PHASE 3: PRE-FLIGHT VALIDATION**
1. **Git Status Check**: Verify clean working state
2. **Task ID Validation**: Ensure valid task_id format
3. **Worktree Management**: Check existing worktrees with prefix `task-{task_id}-orch`
4. **Port Availability**: Verify ports 3001-3006 are available
5. **Output Directory Setup**: Create `docs/ai/for-agentic-loops/orchestration-outputs/task-{task_id}`
6. **Real-time Monitoring**: Initialize orchestration.log with timestamp
7. **State Management**: Check for existing state to enable resumption

**PHASE 4: CONTRACT GENERATION**
Deploy the Pre-Analysis Agent to generate implementation contracts:

```
TASK: Deploy Pre-Analysis Agent using specification from orchestrate-test-spec.md

Context:
- Task specification: [From task file]
- Contracts directory: docs/ai/for-agentic-loops/orchestration-outputs/task-{task_id}/contracts/
- Agent definition: Section 1 from orchestrate-test-spec.md

Deploy the Pre-Analysis Agent to generate:
- interface-contract.yaml
- behavior-contract.yaml  
- integration-contract.yaml
- constraints-contract.yaml
```

**PHASE 5: SPECIALIST ORCHESTRATION**
Deploy the Master Orchestrator to coordinate specialist perspectives:

```
TASK: Deploy Master Orchestrator using specification from orchestrate-test-spec.md

Context:
- Task specification: [From task file]
- Requested specialists: ${specialists}
- Depth: ${depth}
- Agent definition: Section 2 from orchestrate-test-spec.md

Coordinate deployment of selected Specialist Orchestrators:
- Performance (if requested)
- Architecture (if requested)
- UX/DX (if requested)
- Accessibility (if requested)
- Innovation (if requested)
```

**PHASE 6: PARALLEL SPECIALIST DEPLOYMENT**
Deploy all selected Specialist Orchestrators simultaneously:

```
TASK: Deploy [N] Specialist Orchestrators in parallel

For each selected specialist:
- Load their definition from orchestrate-test-spec.md (Sections 3-7)
- Create dedicated worktree
- Deploy with ${depth} sub-agents
- Monitor via orchestration.log
```

**PHASE 7: EVALUATION**
Deploy the Evaluation Orchestrator to analyze all implementations:

```
TASK: Deploy Evaluation Orchestrator using specification from orchestrate-test-spec.md

Context:
- All implementation worktrees
- Contracts for compliance checking
- Agent definition: Section 8 from orchestrate-test-spec.md

Analyze all implementations and create evaluation matrix.
```

**PHASE 8: SUMMARIZATION**
Deploy all Summarization Agents in parallel:

```
TASK: Deploy 5 Summarization Agents using specifications from orchestrate-test-spec.md

Deploy simultaneously:
- Performance Summarizer (Section 9)
- Architecture Summarizer (Section 10)
- UX/DX Summarizer (Section 11)
- Accessibility Summarizer (Section 12)
- Innovation Summarizer (Section 13)

Each creates a structured 500-word summary.
```

**PHASE 9: SYNTHESIS**
Deploy the Synthesis Orchestrator for final implementation:

```
TASK: Deploy Synthesis Orchestrator using specification from orchestrate-test-spec.md

Context:
- All summaries (500 words each)
- Evaluation report
- Contracts for compliance
- Agent definition: Section 14 from orchestrate-test-spec.md

Create optimal implementation combining best elements.
```

**PHASE 10: SERVER MANAGEMENT**
If auto_start_servers is true:
1. Create server management script
2. Start development servers on ports 3001-3006
3. Create tmux session for monitoring
4. Generate comparison dashboard HTML

**EXECUTION SUMMARY:**
Total agents deployed: 28
- 1 Pre-Analysis Agent
- 1 Master Orchestrator
- 5 Specialist Orchestrators
- 15 Sub-Agents (3 per specialist)
- 1 Evaluation Orchestrator
- 5 Summarization Agents
- 1 Synthesis Orchestrator

Monitor progress: `tail -f docs/ai/for-agentic-loops/orchestration-outputs/task-{task_id}/logs/orchestration.log`

**USAGE:**
- Simplest (positional): `/orchestrate-and-test 7`
- With custom spec (positional): `/orchestrate-and-test 7 .claude/specs/orchestrate-test-spec.md`
- Named arguments: `/orchestrate-and-test task_id=7 spec_file=.claude/specs/orchestrate-test-spec.md`
- Limited specialists: `/orchestrate-and-test 7 default performance,architecture 2`
- All options (named): `/orchestrate-and-test task_id=7 specialists=performance,architecture depth=2 auto_start_servers=false`