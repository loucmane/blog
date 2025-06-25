# Orchestrate-Test Command: Revert and Fix Plan

## Critical Issue
We had a working implementation at 11:00-11:41 that successfully executed. After adding improvements (12:06-12:28), the command no longer executes.

## Exact Changes Made (Need to Revert)

### 1. Changes to `.claude/specs/orchestrate-test-spec.md`

#### Added TWES Compliance Section (Lines 25-57)
```markdown
## TWES Compliance Requirements

ALL agents MUST load and follow the Total Workflow Excellence System (TWES):

### Required Reading for Every Agent
1. **Standards** (`/docs/ai/shared-context/standards/`)
   - `coding-conventions.md` - Import order, naming, patterns
   - `performance.md` - 98+ Lighthouse, bundle limits
   - `accessibility.md` - WCAG 2.1 AA, 44px touch targets
   - `file-structure.md` - Project organization

2. **Themes** (`/docs/ai/shared-context/themes/`)
   - `four-themes.md` - Light/Dark/Warm/Cool implementation
   - `warm-minimalism.md` - Design philosophy

3. **Patterns** (`/docs/ai/shared-context/patterns/`)
   - `common-patterns.md` - React patterns, compound components
   - `monorepo-structure.md` - Package boundaries
   - Discovered patterns from documentation evolution

4. **Project Rules** (`CLAUDE.md`)
   - ALWAYS use pnpm
   - UI package = design tokens only
   - Web package = all shadcn/ui components
   - Four themes required

### Contract Generation Must Include
- TWES compliance requirements
- Performance budgets from standards
- Accessibility requirements
- Theme integration approach
- Import order conventions
```

#### Added to Key Variables
- `worktree_cleanup`: Whether to clean up worktrees after synthesis (default: false)
- `skip_git_operations`: Skip git add/commit operations that require authentication (default: true)

#### Added Worktree Management Section (Lines 354-378)
- Worktree Locations
- Worktree Creation
- Worktree Cleanup
- Error Handling

#### Added Agent Deployment Instructions (Lines 380-415)
- CRITICAL: Use Task Tool Only
- Sub-Agent Deployment
- Git Operations Handling

#### Added Progress Tracking (Lines 417-455)
- Orchestration Log Format
- Progress Indicators
- State Persistence

#### Added Error Recovery (Lines 457-486)
- Resumption Capability
- Recovery Command
- Failure Handling
- Cleanup on Failure

#### Modified Pre-Analysis Agent Requirements
Added item 3: "Load and follow TWES documentation"
Changed item 4 to item 5: "Generate 4 critical contract files that enforce TWES compliance"

#### Modified Performance Specialist Requirements
Added TWES standards enforcement section

### 2. Changes to `.claude/commands/orchestrate-and-test.md`

#### Added Variables (Lines 13-15)
```markdown
worktree_cleanup: $ARGUMENTS
skip_git_operations: $ARGUMENTS
resume: $ARGUMENTS
```

#### Added to Arguments Parsing (Lines 25-27)
```
7. `worktree_cleanup` - Whether to clean up worktrees after synthesis (default: false)
8. `skip_git_operations` - Skip git add/commit operations that require authentication (default: true)
9. `resume` - Resume from previous interrupted orchestration (default: false)
```

#### Added Phase 1.5 (Lines 34-38)
```markdown
**PHASE 1.5: RESUME CHECK** (if resume=true)
1. Check for existing `orchestration-state.json` in output directory
2. Load previous state and identify last checkpoint
3. Skip to appropriate phase based on completion status
4. Log resumption details to orchestration.log
```

#### Updated Usage Examples (Lines 177-180)
Added new usage examples for the new parameters

## Revert Strategy

### Step 1: Save Current (Broken) Version
1. Copy current files to `.broken` versions for analysis
2. Document exact line counts and content

### Step 2: Revert to Working Version
1. Restore `.claude/specs/orchestrate-test-spec.md` to 349 lines (remove all additions)
2. Restore `.claude/commands/orchestrate-and-test.md` to 160 lines (remove new parameters)

### Step 3: Test Working Version
1. Run `/orchestrate-and-test 7`
2. Confirm agents deploy
3. Confirm worktrees created
4. Confirm contracts generated

### Step 4: Apply Improvements Incrementally
Test after each addition:

1. **First**: Add skip_git_operations flag ONLY
   - Just the parameter, no other changes
   - Test execution

2. **Second**: Add worktree path fix (.worktrees/)
   - Just update the paths in existing agent specs
   - Test execution

3. **Third**: Add Task tool clarity
   - Add note about not using MCP tools
   - Keep it minimal
   - Test execution

4. **Fourth**: Add progress tracking
   - Just the log format definition
   - Test execution

5. **Fifth**: Add resume capability
   - Minimal implementation
   - Test execution

6. **Last**: TWES compliance (if it works)
   - This is the biggest addition
   - May need to be simplified

## Lessons Learned

1. **Test after EVERY change** - We added everything at once
2. **Keep additions minimal** - Don't add comprehensive sections
3. **Watch file sizes** - Even if under 200/600 limits, size matters
4. **Preserve working patterns** - Don't change what works

## Immediate Actions

1. Save this plan ✅
2. Create backup of broken version ✅
3. Revert files ✅
4. Test to confirm working ✅
5. Begin incremental improvements ⏳

## Test Results Update (2025-06-25 14:30)

### What We Learned
1. **Git Operations Note Breaks Execution** ❌
   - Adding the note at end of spec prevented execution
   - Removed it and command works again
   
2. **Command Executes Successfully** ✅
   - With just worktree path changes (350 lines)
   - Reaches Phase 6 and deploys specialists
   - Creates orchestration.log and directories
   
3. **Critical Issues Found**
   - **MCP Tool Usage**: Agents use zen:thinkdeep and claude-code-bridge instead of Task tool
   - **Memory Crash**: Out of memory with 15 parallel agents
   - **Missing Instruction**: Need explicit "use Task tool only"

### Revised Incremental Plan
1. **CRITICAL - Task Tool Instruction**
   - Add minimal instruction: "Deploy sub-agents using Task tool ONLY"
   - No MCP tools for agent deployment
   - Test thoroughly
   
2. **Parallelism Reduction Options**
   - Option A: Reduce depth from 3 to 2 sub-agents
   - Option B: Sequential specialist deployment
   - Option C: Batch sub-agents (5 at a time)
   
3. **Alternative Git Skip Approach**
   - Don't add as separate section
   - Embed in agent instructions: "Do not use git add/commit/push"
   
4. **Defer Complex Additions**
   - TWES compliance - too large
   - Full error recovery - later
   - State persistence - later

### Fresh Instance Test (2025-06-25 16:46-17:26)

**What Happened:**
- Command executed (not template) ✅
- But no todo list created ❌
- Master Orchestrator used taskmaster-ai:add_task (MCP tool) ❌

**Root Cause:**
Command file TASK blocks are too vague:
```
TASK: Deploy Master Orchestrator using specification from orchestrate-test-spec.md
```
This doesn't say HOW to deploy (which tool to use).

**Solution Needed:**
Update command file TASK blocks to be explicit:
```
TASK: Deploy Master Orchestrator using specification from orchestrate-test-spec.md

CRITICAL: Use Task tool to deploy agents. Do NOT use MCP tools.
```

**Key Learning:**
Spec file instructions aren't enough - the command file TASK blocks must also be explicit about tool usage.

### Command File Fix Applied (2025-06-25 17:40)

**What Was Done:**
1. Added critical deployment rule at top of command
2. Added Phase 2.5 for explicit todo list creation  
3. Updated ALL TASK blocks with:
   - "CRITICAL: Use Task tool ONLY to deploy this agent"
   - "Do NOT use MCP tools like zen:chat, claude-code-bridge, or taskmaster-ai"
   - Explicit instructions to use Task tool throughout
4. File size: 188 lines (still safe under 200)

**Expected Results:**
- Consistent todo list creation
- All agents deployed via Task tool only
- No MCP tool usage for deployments
- Clear execution pattern across instances