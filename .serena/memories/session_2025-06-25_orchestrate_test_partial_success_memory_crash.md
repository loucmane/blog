# Session: 2025-06-25 Orchestrate-Test Partial Success and Memory Crash

## Major Discovery
The orchestrate-test command WORKS after removing the Git Operations Note! But with critical issues to fix.

## What Worked
1. **Command Execution**: After removing Git Operations Note, command executed properly
2. **Agent Deployment**: Successfully reached Phase 6 and started deploying specialists
3. **Output Creation**: Created orchestration.log and implementation directories
4. **Parallel Execution**: Attempted to run 5 specialists in parallel

## What Failed
1. **MCP Tool Usage**: Agents used zen:thinkdeep and claude-code-bridge instead of Task tool
2. **Memory Crash**: Out of memory error when running too many agents in parallel
3. **Missing Instruction**: Spec doesn't explicitly say "use Task tool ONLY"

## Current State
- Spec file: 350 lines (removed Git Operations Note)
- Worktree paths: Still have `.worktrees/` prefix
- Command: Executes but needs Task tool enforcement

## Lessons Learned
1. **Git Operations Note**: Adding this at end of spec broke execution
2. **Task Tool**: MUST add explicit "use Task tool only" instructions
3. **Parallelism**: 15 sub-agents in parallel causes memory issues
4. **Incremental Testing**: Our approach of minimal changes is working

## Next Steps
1. Add "use Task tool only" instruction to spec
2. Consider reducing parallelism or depth
3. Test with explicit Task tool usage
4. Maybe add Git operations skip differently

## How to Initialize Next Session
```
Activate project MomsBlog, read memory session_2025-06-25_orchestrate_test_partial_success_memory_crash and SESSION.md.
Continue fixing orchestrate-test command with Task tool instructions.
```

## Key Files
- `.claude/specs/orchestrate-test-spec.md` (350 lines, working but needs Task tool fix)
- `/docs/ai/for-agentic-loops/orchestration-improvements/orchestrate-test-spec-tracker.md`
- `/docs/ai/for-agentic-loops/orchestration-improvements/revert-and-fix-plan.md`