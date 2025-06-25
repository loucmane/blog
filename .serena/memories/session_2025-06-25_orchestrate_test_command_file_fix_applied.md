# Session Memory: Orchestrate-Test Command File Fix Applied

## Date: 2025-06-25 17:40-17:45 CEST

## Work Completed
Applied critical fix to orchestrate-and-test.md command file based on fresh instance testing that revealed root cause: TASK blocks were too vague about HOW to deploy agents.

## The Fix
1. **Added Phase 2.5**: Explicit todo list creation instruction
2. **Updated ALL TASK blocks** with:
   - "CRITICAL: Use Task tool ONLY to deploy this agent"
   - "Do NOT use MCP tools like zen:chat, claude-code-bridge, or taskmaster-ai"
   - Explicit "Deploy using Task tool" instructions
3. **Added global warning** at top of command
4. **File size**: 188 lines (still under 200 threshold)

## Current State
- **Command file**: Fixed with explicit Task tool instructions
- **Spec file**: Still has "using Task tool" mentions (350 lines)
- **Ready for testing**: Should now create todo list and use Task tool consistently

## Key Learning
Spec file instructions alone aren't enough - the command file TASK blocks must be explicit about tool usage. Claude instances need very clear instructions at the point of task execution.

## Next Steps
Test the fixed command with `/orchestrate-and-test 7` and verify:
- Todo list gets created (Phase 2.5)
- All agents use Task tool only
- No MCP tools used for deployments

## How to Initialize Next Session
```
Activate project MomsBlog, read memory session_2025-06-25_orchestrate_test_command_file_fix_applied and SESSION.md.
Test the orchestrate-and-test command to see if Task tool usage is now consistent.
```