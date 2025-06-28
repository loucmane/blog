# Orchestration Refactor Needed - Command File Too Large

## Current Situation (2025-06-27 15:20)
After implementing the absolute path solution, the orchestration command file grew from 295 to 380 lines, exceeding the ~200 line threshold for execution. The command displays as documentation instead of executing.

## The Problem
1. **Absolute path solution works** - confirmed through extensive testing
2. **But implementation made command file too large** - 380 lines
3. **Commands over ~200 lines are treated as documentation** - discovered in earlier sessions
4. **Current result**: /orchestrate-and-test 7 shows template instead of executing

## Root Cause Analysis
- Each sub-agent needs ~10 lines of absolute path instructions
- 5 specialists × 2-3 sub-agents each = 10-15 sets of instructions
- This added ~150 lines to the command file
- Original file: 295 lines → After absolute paths: 380 lines

## The Solution: Spec Architecture Pattern
Move detailed sub-agent instructions from command file to spec file, following the pattern used by infinite.md command.

### How It Will Work:
1. **Command file** (target: <200 lines):
   ```
   Deploy ${depth} Performance Sub-Agents using instructions from spec Sections 3.1-3.3
   ```

2. **Spec file** (can be large):
   ```
   ### 3.1 Performance Sub-Agent 1
   You are Performance Sub-Agent 1 for Task ${task_id}.
   
   CRITICAL INSTRUCTIONS - USE ABSOLUTE PATHS:
   1. Create the .worktrees directory if needed: mkdir -p ${PROJECT_ROOT}/.worktrees
   2. Create git worktree at ABSOLUTE path: 
      git worktree add ${PROJECT_ROOT}/.worktrees/task-${task_id}-orch-perf-1 -b task-${task_id}-orch-perf-1
   [... rest of detailed instructions ...]
   ```

## Files Needing Updates
1. `.claude/commands/orchestrate-and-test.md` - Remove inline sub-agent instructions
2. `.claude/specs/orchestrate-test-spec.md` - Add sub-agent deployment sections

## Current Backups
- orchestrate-and-test.md.backup-absolute-path (380-line version)
- orchestrate-test-spec.md.backup-absolute-path (414-line version)

## Testing That Confirmed Absolute Paths Work
- Test 4: Sequential with absolute paths ✅
- Test 5: Clean environment ✅
- Test 6: True parallel deployment ✅
- Key: Used hardcoded absolute paths during testing

## Next Steps for Implementation
1. Create new backups before refactoring
2. Add sub-agent sections to spec file (3.1-7.3)
3. Simplify command file to reference spec sections
4. Verify command file under 200 lines
5. Test with /orchestrate-and-test 7

## Important Notes
- The absolute path solution is correct and tested
- Only the file organization needs adjustment
- Variables ${PROJECT_ROOT} and ${task_id} will still work when command executes
- This follows the proven infinite.md pattern

## How to Initialize After Compaction
```
Activate project /home/loucmane/dev/javascript/MomsBlog/blog,
read memory session_2025-06-27_orchestration_refactor_needed and SESSION.md

Current task: Refactor orchestration files to move sub-agent instructions to spec file
```