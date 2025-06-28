# Critical Discovery: Nested Code Blocks Break Command Execution

## Session Overview
**Date**: 2025-06-28
**Task**: Testing refactored orchestration command
**Key Discovery**: Commands fail to execute when they contain nested markdown code blocks

## The Problem Timeline

### What We Thought
For days, we believed commands over ~200 lines were treated as documentation templates. This led to extensive refactoring to reduce line count.

### What Actually Happened
1. **Working version** (164 lines): Executed successfully
2. **After worktree fix** (380 lines): Displayed as template
3. **After refactoring** (275 lines): Still displayed as template
4. **Line count was a red herring!**

## Root Cause: Nested Code Blocks

The command parser cannot handle nested triple-backtick markdown blocks.

### Broken Pattern (Current):
```
Execute these roles in order:
```                              <-- Opening outer block
## Performance Specialist Role
```                              <-- NESTED block (breaks parser!)
ROLE: Performance Specialist...
```                              <-- Closing nested block
## Architecture Specialist Role
```                              <-- Another nested block
...
```                              <-- Closing outer block (mismatched!)
```

### Working Pattern (Original):
```
TASK: Deploy [N] Specialist Orchestrators in parallel

For each selected specialist:
- Load their definition from orchestrate-test-spec.md
- Create dedicated worktree
- Deploy with ${depth} sub-agents
```

## Why This Matters

1. **Markdown parsers** cannot properly match nested triple-backticks
2. **Parsing confusion** causes entire file to be treated as documentation
3. **Claude's command system** requires proper markdown structure
4. **Line count** is less important than structural validity

## Evidence

- `infinite.md` (180 lines) - Works, no nested blocks
- `infinite-documentation.md` (500 lines) - Works, no nested blocks
- `orchestrate-and-test.md.backup-working` (164 lines) - Works, single TASK block
- `orchestrate-and-test.md` (275 lines) - Fails, has 22 code blocks with nesting

## Solution

### Remove All Nested Blocks
Replace the complex conditional specialist sections with a single TASK block that references the spec file sections.

### From This:
```
Execute these roles:
```
## Performance Specialist
If "performance" in specialists:
```
ROLE: Performance...
```
```

### To This:
```
TASK: Deploy Specialist Orchestrators

For each specialist in ${specialists}:
- Load definition from spec file (Sections 3-7)
- Deploy ${depth} sub-agents per specialist
- Use instructions from "Sub-Agent Deployment Instructions" section
- Each sub-agent gets isolated worktree using absolute paths
```

## Lessons Learned

1. **Test structural changes** - Not just content changes
2. **Parser limitations** - Markdown has strict nesting rules
3. **Red herrings** - Line count seemed logical but wasn't the issue
4. **Working backups** - Always keep them for comparison

## How to Initialize Next Session

```
Activate project /home/loucmane/dev/javascript/MomsBlog/blog,
read memory session_2025-06-28_nested_code_blocks_discovery and SESSION.md.

Fix the nested code blocks in orchestrate-and-test.md by returning to the single TASK block pattern from the working backup.
```

## Files to Update

1. `.claude/commands/orchestrate-and-test.md` - Remove nested blocks
2. Keep spec file as is - it's fine with the sub-agent instructions
3. Test immediately after fixing structure

## Key Insight

The orchestration command was always close to working. The absolute path solution was correct, the spec refactoring was correct, but the markdown structure with nested code blocks broke the parser. This is a simple fix that should immediately restore functionality.