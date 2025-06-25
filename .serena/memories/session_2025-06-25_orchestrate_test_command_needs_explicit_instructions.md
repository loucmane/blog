# Session: 2025-06-25 Command Needs Explicit Instructions

## Key Discovery
The orchestrate-test command executes but has two critical issues:
1. **No todo list** - Creation is inconsistent between runs
2. **MCP tool usage** - Despite spec saying "using Task tool"

## Test Results (Fresh Instance 16:46)
- Command executed ✅ (not template display)
- Pre-flight validation completed ✅
- But: No todo list created (inconsistent)
- But: Master Orchestrator used taskmaster-ai:add_task instead of Task tool

## Root Cause
Command file TASK blocks are too vague:
```
TASK: Deploy Master Orchestrator using specification from orchestrate-test-spec.md
```
This doesn't specify HOW to deploy or which tool to use.

## Solution Required
1. **Add Phase 2.5** for explicit todo list creation
2. **Update all TASK blocks** to include:
   - "CRITICAL: Use Task tool to deploy agents"
   - "Do NOT use MCP tools"
3. **Add example** of proper sub-agent deployment

## Current State
- Command: 164 lines (identical to backup)
- Spec: 350 lines (has "using Task tool" mentions)
- Issue: Command file TASK blocks need explicit instructions

## Key Learning
**Spec instructions aren't enough** - the command file itself must explicitly tell agents which tools to use in the TASK blocks. Claude instances have inconsistent execution patterns without explicit guidance.

## How to Initialize Next Session
```
Activate project MomsBlog, read memory session_2025-06-25_orchestrate_test_command_needs_explicit_instructions and SESSION.md.
Fix orchestrate-test command TASK blocks to explicitly specify Task tool usage.
```

## Files to Update
- `.claude/commands/orchestrate-and-test.md` - Add explicit tool instructions to TASK blocks