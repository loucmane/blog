# Orchestrate-and-Test Command Fix Plan

## Issue
The `/orchestrate-and-test` command displays its template instead of executing because it doesn't follow the working command patterns that Claude recognizes as executable.

## Root Cause
1. Working commands (`infinite.md`, `infinite-documentation.md`) read specification files first
2. They use specific `TASK:` block format with triple backticks
3. They have explicit "Parallel Execution Management" sections
4. Orchestrate-and-test uses descriptive headers instead of this pattern

## Solution Discovery
- Found that TaskMaster task files in `.taskmaster/tasks/` are perfectly structured as spec files
- Each task file contains:
  - Full description and implementation details
  - Subtasks with dependencies
  - Test strategy
  - Everything needed for orchestration

## Implementation Approach
1. **Use TaskMaster task files as specifications**
   - Read from `.taskmaster/tasks/task_${pad(task_id, 3)}.txt`
   - No need for external spec files

2. **Convert all 29 agent deployments** to use:
   ```
   ```
   TASK: [specific task description]
   
   You are [agent role].
   
   CONTEXT:
   - Task specification: [from task file]
   - [other context items]
   
   REQUIREMENTS:
   - [numbered requirements]
   
   DELIVERABLE: [expected output]
   ```
   ```

3. **Add Parallel Execution Management sections** after agent groups

## Key Files Created
- Fix tracker: `/docs/ai/for-agentic-loops/orchestration-improvements/orchestrate-test-fix-tracker.md`
- Implementation plan: `/docs/ai/for-agentic-loops/orchestration-improvements/fix-implementation-plan.md`

## Agents to Convert (29 total)
- 1 Pre-Analysis Agent
- 1 Master Orchestrator
- 5 Specialist Orchestrators
- 15 Sub-Agents (3 per specialist)
- 1 Evaluation Orchestrator
- 5 Summarization Agents
- 1 Synthesis Orchestrator

## Next Steps
1. Update Phase 1 to read task file
2. Convert each agent deployment systematically
3. Test with Task 7
4. Verify worktrees, logs, and actual execution

## Why This Will Work
- Follows exact pattern of working commands
- Uses existing infrastructure (task files)
- Minimal changes, maximum compatibility
- Claude will recognize TASK: blocks as executable

## Test Validation (2025-06-23)

Successfully tested minimal orchestration pattern with `/test-orchestration`:
- TASK: blocks confirmed to trigger agent execution
- Master Orchestrator deployed at 19:50:26 CEST
- Sub-agent 2 deployed at 19:51:25 CEST
- Files created in specified locations
- Git worktrees created successfully

### Critical Learnings:
1. **Parallel agent deployment needs careful handling** - UI approval confusion
2. **Commands can hang waiting for agent completion** - Sub-agent 1 got stuck
3. **Our core approach (TASK: blocks) is CORRECT** - Agents execute!
4. **Need timeout considerations** - Test ran 10+ minutes

### Updated Implementation Strategy:
- Deploy critical agents alone (Pre-Analysis, Master, Synthesis)
- Deploy other agents in smaller groups (2-3 at a time)
- Add clear execution time expectations
- Document when to use ESC if stuck