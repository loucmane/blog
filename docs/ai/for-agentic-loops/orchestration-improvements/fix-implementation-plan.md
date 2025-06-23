# Orchestrate-and-Test Fix Implementation Plan

## Overview
Fix the `/orchestrate-and-test` command to execute properly by using TaskMaster task files as specifications and converting all agent deployments to the proper `TASK:` block format.

## Root Cause
The command displays its template instead of executing because:
1. It doesn't read a specification file first (working commands do)
2. Agent deployments use descriptive headers instead of `TASK:` blocks
3. Missing explicit "Parallel Execution Management" sections

## Solution Approach
Use TaskMaster task files (`.taskmaster/tasks/task_XXX.txt`) as specification files, following the pattern of working commands like `infinite.md`.

## Step-by-Step Implementation

### Step 1: Update PHASE 1 - Add Task File Reading
```markdown
**PHASE 1: TASK SPECIFICATION ANALYSIS**
Read the task specification file at `.taskmaster/tasks/task_${pad(task_id, 3)}.txt`.

Extract and analyze:
- Task title, description, and details
- Implementation requirements
- Test strategy
- All subtasks with their descriptions and dependencies

Store this as the task specification that all agents will reference.
```

### Step 2: Agent Deployment Template
Every agent deployment must follow this exact format:

```markdown
```
TASK: [Specific action for this agent]

You are [Agent Role/Name].

CONTEXT:
- Task specification: [Full task details from file]
- Task ID: ${task_id}
- Task title: ${task_title}
- [Other relevant context items]

REQUIREMENTS:
1. [First requirement]
2. [Second requirement]
3. [Third requirement]
[etc.]

DELIVERABLE: [Specific output expected]
```

**Parallel Execution Management:**
- Deploy [agent description] using Task tool
- [Any specific coordination notes]
- Monitor completion before proceeding
```

### Step 3: Conversion Order

#### Phase 1: Pre-Orchestration
1. **Pre-Analysis Agent**
   - Current: "**Deploy Pre-Analysis Agent using Task tool:**"
   - Convert to: TASK: block format
   - Add task specification to context

#### Phase 2: Master Orchestrator
2. **Master Orchestrator**
   - Current: "**Deploy Master Orchestrator using Task tool:**"
   - Convert to: TASK: block format
   - Reference contracts and task spec

#### Phase 3: Specialist Orchestrators (Deploy in parallel)
3-7. **5 Specialist Orchestrators**
   - Current: "**SPECIALIST N - [NAME]:**"
   - Convert each to: TASK: block format
   - Add "Deploy all 5 specialists simultaneously using Task tool"

#### Phase 4: Sub-Agents (15 total)
8-22. **15 Sub-Agents** (3 per specialist)
   - Currently described in prose
   - Create explicit TASK: blocks for each
   - Group by specialist with execution management

#### Phase 5: Post-Processing
23. **Evaluation Orchestrator**
24-28. **5 Summarization Agents**
29. **Synthesis Orchestrator**

### Step 4: Parallel Execution Sections
Add these after agent groups:
- After Pre-Analysis: Single agent execution
- After Master: Single agent execution
- After Specialists: "Deploy all 5 specialists simultaneously"
- After Sub-Agents: "Deploy all 15 sub-agents in specialist groups"
- After Summarizers: "Deploy all 5 summarizers simultaneously"

### Step 5: Testing Protocol
1. Save the updated `orchestrate-and-test.md`
2. Run: `/orchestrate-and-test task_id=7 depth=1`
3. Check for:
   - Worktree creation: `git worktree list`
   - Output directory: `ls docs/ai/for-agentic-loops/orchestration-outputs/`
   - Log file: `cat [output]/logs/orchestration.log`
   - Agent deployments in terminal

## Example Conversion

### Before:
```markdown
**Deploy Master Orchestrator using Task tool:**

The Master Orchestrator coordinates the entire multi-agent system for Task {task_id}:

You are the Master Orchestrator for a sophisticated multi-agent system...
[prose description]
```

### After:
```markdown
```
TASK: Orchestrate multi-agent implementation system for Task ${task_id}

You are the Master Orchestrator.

CONTEXT:
- Task specification: [Full content from .taskmaster/tasks/task_${pad(task_id, 3)}.txt]
- Task ID: ${task_id}
- Task title: ${task_title}
- Subtasks: ${task_subtasks}
- Specialists: ${specialists}
- Contracts directory: ${CONTRACTS_DIR}

REQUIREMENTS:
1. Read and enforce all implementation contracts
2. Deploy and coordinate 5 Specialist Orchestrators
3. Ensure each specialist receives contracts and task spec
4. Monitor implementation progress
5. Document orchestration decisions

DELIVERABLE: Deployed specialists and coordination documentation
```

**Parallel Execution Management:**
- Deploy Master Orchestrator using Task tool
- Wait for orchestration strategy before deploying specialists
- Log completion to orchestration.log
```

## Success Criteria
- Command executes instead of showing template
- Agents are deployed via Task tool
- Worktrees are created
- Orchestration.log shows progress
- Implementations are generated

## Test Validation

### Test Results (2025-06-23 19:50)
Successfully validated TASK: block pattern with `/test-orchestration` command:
- Master Orchestrator: ✅ Executed at 19:50:26 CEST
- Sub-agent 2: ✅ Executed at 19:51:25 CEST
- Sub-agent 1: ❌ Got stuck, never completed
- Synthesis: ❌ Never reached due to stuck execution

### Lessons Learned:
1. **TASK: block pattern confirmed to work** - Agents execute with proper format
2. **Parallel deployments need careful handling** - UI approval issues
3. **Consider sequential deployment for critical agents** - Avoid confusion
4. **Commands can hang** - Need timeout considerations

## Updated Implementation Strategy

### Parallel Deployment Considerations:
Based on test results, deploy agents in logical groups:

1. **Deploy alone (critical path)**:
   - Pre-Analysis Agent (generates contracts)
   - Master Orchestrator (coordinates everything)
   - Synthesis Orchestrator (final implementation)

2. **Deploy in small groups**:
   - Specialists: Groups of 2-3 (not all 5 at once)
   - Sub-agents: By specialist (3 at a time, not all 15)
   - Summarizers: Groups of 2-3 (not all 5)

3. **Execution management**:
   - Add clear "Wait for completion" notes
   - Document expected execution times
   - Provide interrupt guidance

### Timeout Handling:
- Pre-Analysis: ~1-2 minutes
- Master Orchestrator: ~1 minute
- Each Specialist: ~2-3 minutes
- Each Sub-agent: ~1-2 minutes
- Synthesis: ~3-5 minutes
- Total expected: ~15-20 minutes for full orchestration

## Notes
- Keep all existing logic and phases
- Only change agent deployment format
- Ensure task file content flows to all agents
- Maintain the sophisticated orchestration pattern
- Be mindful of parallel deployment issues discovered in testing