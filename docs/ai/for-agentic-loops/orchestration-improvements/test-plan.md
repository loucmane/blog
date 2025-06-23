# Orchestration Improvements Test Plan

## Quick Start for Next Session

```bash
# 1. Check you're on the right branch
git branch --show-current  # Should be: feat/007-core-layout-components

# 2. Review what was implemented
cat docs/ai/for-agentic-loops/orchestration-improvements/implementation-tracker.md

# 3. Run baseline test (minimal depth for quick test)
/orchestrate-and-test task_id=7 depth=1
```

## What to Monitor During Test

### 1. Check if Orchestration Log is Created
```bash
# Find the output directory
ls -la docs/ai/for-agentic-loops/orchestration-outputs/task-7/

# Check if log exists
ls -la docs/ai/for-agentic-loops/orchestration-outputs/task-7/logs/

# Monitor in real-time (if it exists)
tail -f docs/ai/for-agentic-loops/orchestration-outputs/task-7/logs/orchestration.log
```

### 2. Verify Progressive Summarization Works
```bash
# Check if summaries directory was created
ls -la docs/ai/for-agentic-loops/orchestration-outputs/task-7/summaries/

# If summaries exist, check their content
cat docs/ai/for-agentic-loops/orchestration-outputs/task-7/summaries/performance-summary.md
```

### 3. Check Synthesis Behavior
Look for evidence that the Synthesis Orchestrator read summaries instead of full implementations.

## Expected Outcomes

### ✅ Success Indicators:
1. `orchestration.log` exists and shows agent deployments with timestamps
2. 5 summary files created (one per specialist)
3. Synthesis completes without context overload
4. Can monitor progress with `tail -f`

### ❌ Failure Indicators:
1. No log file created
2. Summaries directory empty
3. Errors about missing variables
4. Synthesis still trying to read all implementations

## Debugging Commands

```bash
# Check state file for errors
cat docs/ai/for-agentic-loops/orchestration-outputs/task-7/state/orchestration-state.yaml

# Look for bash errors
grep -i error docs/ai/for-agentic-loops/orchestration-outputs/task-7/logs/*

# Check if contracts were generated (pre-requisite)
ls -la docs/ai/for-agentic-loops/orchestration-outputs/task-7/contracts/
```

## Document Results

After testing, update the implementation tracker:
```bash
# Edit the tracker with results
nano docs/ai/for-agentic-loops/orchestration-improvements/implementation-tracker.md
```

Update the "Tested" column and add notes about what worked/didn't work.

## If Things Don't Work

1. **Missing Variables**: The ${ORCH_OUTPUT_DIR} might not be passed to agents
   - Solution: Use hardcoded paths or pass via agent prompt

2. **Logging Function Not Available**: The log_agent function might not be in scope
   - Solution: Inline the logging commands

3. **Summaries Not Created**: Agents might not write files as instructed
   - Solution: Adjust agent prompts or use different approach

## Clean Up After Test

```bash
# If you need to clean up and retry
/orchestrate-cleanup task_id=7

# Or manually
git worktree list | grep task-7 | awk '{print $1}' | xargs -I {} git worktree remove {}
rm -rf docs/ai/for-agentic-loops/orchestration-outputs/task-7/
```

## Next Steps Based on Results

- **If both features work**: Implement Partial Failure Handling
- **If partially working**: Fix issues before proceeding
- **If not working**: Revise implementation approach

Remember: The goal is to learn what actually works with the Task tool!