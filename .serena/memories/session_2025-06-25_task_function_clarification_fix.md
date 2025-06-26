# Session Memory: Task Function vs MCP Tools Clarification Fix

## Date: 2025-06-25 19:30-19:45 CEST

## Problem Discovered
During orchestrate-test execution, agents were trying to use MCP tools (like taskmaster-ai:get_task) instead of the built-in Task function for deploying sub-agents. This was due to ambiguous language in the command and spec files.

## Root Cause
- "Task tool" was ambiguous - could mean:
  - The built-in Task function (correct interpretation)
  - MCP tools related to tasks (incorrect interpretation)
- The spec said "use Task tool ONLY" but also "do NOT use MCP tools" - contradictory

## Solution Applied
1. **Command file** (.claude/commands/orchestrate-and-test.md):
   - Replaced all "Task tool" → "built-in Task function"
   - Updated critical deployment rule
   - File size: 190 lines (safe)

2. **Spec file** (.claude/specs/orchestrate-test-spec.md):
   - Replaced all "using Task tool" → "using built-in Task function"
   - Added "Important Clarification" section defining terminology
   - File size: 355 lines (safe)

3. **Also changed default depth** from 3 to 2 to reduce memory usage

## Key Learning
Precise language matters when tools have similar names. "Task function" (built-in) vs "task-related MCP tools" (external) needed explicit disambiguation.

## Current State
- Command and spec files updated with clear terminology
- Default depth reduced to 2 for memory efficiency
- Ready to test orchestration with `/orchestrate-and-test 7`

## Next Steps
Test the orchestration command to verify:
1. Agents use built-in Task function for deployments
2. No MCP tools are used for agent deployment
3. Memory usage stays within limits with depth=2

## How to Initialize Next Session
```
Activate project MomsBlog, read memory session_2025-06-25_task_function_clarification_fix and SESSION.md.
Test the orchestrate-and-test command to verify Task function usage is correct.
```