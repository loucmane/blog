# Worktree Context Fix Implementation Plan

## Executive Summary
We discovered that sub-agents deployed via the Task function inherit the working directory of their deployer. This document comprehensively details our testing, findings, and implementation approaches to ensure sub-agents work in isolated worktrees rather than the main project directory.

## The Core Discovery
**Date**: 2025-06-26 14:30 CEST
**Finding**: When you deploy an agent using the Task function, that agent starts in whatever directory YOU are in when you deploy it.

### How We Discovered This
1. Ran `/orchestrate-and-test 7` command
2. Main session created worktree `.worktrees/task-7-orch-perf`
3. Main session stayed in main directory
4. Deployed Performance Sub-Agent
5. Sub-agent modified files in MAIN project, not worktree
6. User noticed: "its not updating the files in the worktrees but its updating the files in the actual project"

### The Testing That Proved It
We ran three critical tests:

**Test 1**: Deploy agent with explicit CD command
- Result: Agent said "already in worktree" 
- Conclusion: It inherited the worktree context

**Test 2**: Check agent's pwd
- Result: Agent's pwd showed worktree location
- Conclusion: Working directory inheritance confirmed

**Test 3**: Deploy agent to modify files
- Result: Files were modified IN the worktree
- Conclusion: If deployed from worktree, agent works in worktree

## Implementation Approaches

### Approach 1: Main Session CD (Currently Implemented in Files)

#### How It Works
```markdown
## Performance Specialist Role
Actions:
1. Review performance-related contracts from contracts/
2. Create worktree: `.worktrees/task-${task_id}-orch-perf`
3. Switch working context: `cd .worktrees/task-${task_id}-orch-perf`
4. Deploy ${depth} sub-agents using the built-in Task function
5. Return to main directory: `cd ${PROJECT_ROOT}`
6. Log deployments to orchestration.log
7. Transition to next role
```

#### What Actually Happens
- Main session creates ONE worktree per specialist (e.g., `task-7-orch-perf`)
- Main session CDs into that worktree
- ALL sub-agents for that specialist work in the SAME worktree
- Result: `task-7-orch-perf` contains work from BOTH Performance Sub-Agent 1 AND 2

#### Problems With This Approach
1. **File Conflicts**: Both sub-agents modify same files
2. **No Parallel Execution**: Can't truly work in parallel
3. **Lost Diversity**: Can't compare different implementation approaches
4. **Not Original Vision**: Spec originally had numbered worktrees per sub-agent

### Approach 2: Sub-Agent Self-Navigation (Discovered During Testing)

#### The Discovery Timeline
**Time**: 2025-06-26 17:30 CEST
**Test**: Deployed sub-agent with instructions to create its own worktree

**Exact Test Performed**:
```
Prompt: "You are a test sub-agent. Your job is to:
1. First, create a git worktree at .worktrees/test-self-nav-1 with branch test-self-nav-1
2. Then CD into that worktree
3. Create a file called test.txt with content 'I navigated here myself'
4. Run pwd to show your current directory"
```

**Result**: SUCCESS! The sub-agent:
- Created worktree at `.worktrees/test-self-nav-1`
- CD'd into it successfully
- Created test.txt IN the worktree
- Confirmed with: `/home/loucmane/dev/javascript/MomsBlog/blog/.worktrees/test-self-nav-1/test.txt`

#### The Nesting Problem We Discovered
**Time**: 2025-06-26 17:40 CEST
**Issue**: When deploying multiple sub-agents, the second one created a NESTED worktree

**What Happened**:
1. First sub-agent created `.worktrees/test-self-nav-1` ✅
2. Second sub-agent created `.worktrees/test-self-nav-1/.worktrees/test-pre-created` ❌
3. Path became: `/home/loucmane/dev/javascript/MomsBlog/blog/.worktrees/test-self-nav-1/.worktrees/test-pre-created`

**Root Cause**: The second agent was somehow deployed from within the first agent's context

## What We Need to Test Next

### Critical Parallel Deployment Test
**Purpose**: Verify that multiple sub-agents can create their own worktrees WITHOUT nesting

**Test Plan**:
```bash
# From main directory, deploy 3 agents simultaneously:
- Performance Sub-Agent 1: Create .worktrees/task-7-orch-perf-1
- Performance Sub-Agent 2: Create .worktrees/task-7-orch-perf-2  
- Performance Sub-Agent 3: Create .worktrees/task-7-orch-perf-3
```

**Expected Result**:
```
.worktrees/
├── task-7-orch-perf-1/    # Agent 1's isolated implementation
├── task-7-orch-perf-2/    # Agent 2's isolated implementation
└── task-7-orch-perf-3/    # Agent 3's isolated implementation
```

**What Could Go Wrong**:
1. Nesting if deployment context isn't clean
2. Race conditions creating worktrees
3. Git conflicts with branch names

## Implementation Examples

### Approach 1 Implementation (Current Files)
**File**: `.claude/commands/orchestrate-and-test.md` (lines 118-136)
```markdown
## Performance Specialist Role
Actions:
1. Review performance-related contracts from contracts/
2. Create worktree: `.worktrees/task-${task_id}-orch-perf`
3. Switch working context: `cd .worktrees/task-${task_id}-orch-perf`
4. Deploy ${depth} sub-agents using the built-in Task function:
   - Sub-Agent 1: Focus on render optimization and initial load
   - Sub-Agent 2: Focus on bundle efficiency and code splitting
5. Return to main directory: `cd ${PROJECT_ROOT}`
6. Log deployments to orchestration.log
7. Transition to next role
```

### Approach 2 Implementation (Proposed)
```markdown
## Performance Specialist Role
Actions:
1. Review performance-related contracts from contracts/
2. Deploy ${depth} sub-agents using the built-in Task function:
   - Sub-Agent 1 prompt: "FIRST: Create worktree .worktrees/task-${task_id}-orch-perf-1 
     and cd into it. THEN: Focus on render optimization..."
   - Sub-Agent 2 prompt: "FIRST: Create worktree .worktrees/task-${task_id}-orch-perf-2 
     and cd into it. THEN: Focus on bundle efficiency..."
3. Log deployments to orchestration.log
4. Transition to next role
```

## Current File Changes Summary

### Files Modified
1. **`.claude/commands/orchestrate-and-test.md`** (294 lines)
   - Added CD commands to all 5 specialist roles
   - Each specialist: create worktree → cd into it → deploy → cd back
   - Example: Lines 128-129 and 133 for Performance Specialist

2. **`.claude/specs/orchestrate-test-spec.md`** (Updated all specialists)
   - Added "Working Directory Context" section to each specialist
   - Added "Worktree Details" explaining directory structure
   - Clarified that all sub-agents work in same worktree (current approach)

### What the Spec Currently Says vs Reality

**Spec Says** (lines 147-148):
```
**Implementation Requirements**:
- All sub-agents work in the same worktree: `.worktrees/task-${task_id}-orch-perf`
```

**Original Vision** (before our changes):
```
- Each sub-agent creates in worktree: `.worktrees/task-${task_id}-orch-perf-{number}`
```

**This Mismatch Reveals**: We changed the spec to match our CD approach, but lost the original vision of isolated sub-agent implementations!

### CLAUDE.md Updates

Add new section after "Doing tasks":
```markdown
## Orchestration Context Management

### Working Directory Context for Role-Playing
When implementing orchestration commands that use role-playing and worktrees:

1. **Context Switching is Part of the Role**
   - When assuming a specialist role, switch to that role's worktree
   - This ensures sub-agents inherit the correct working directory
   - Return to main directory when role is complete

2. **This is NOT arbitrary CD usage**
   - Context switching is integral to role-playing
   - Required for proper agent isolation
   - Explicitly documented in orchestration specs

3. **Example**:
   ```bash
   # Assume Performance Specialist role
   cd .worktrees/task-7-orch-perf  # Enter role context
   # Deploy sub-agents (they work here)
   cd -  # Exit role context
   ```
```

### Expected Execution Flow

```
Main Session (main directory)
├── Create Performance worktree
├── CD to Performance worktree
├── Deploy Performance Sub-Agents (work in worktree)
├── CD back to main
├── Create Architecture worktree
├── CD to Architecture worktree
├── Deploy Architecture Sub-Agents (work in worktree)
├── CD back to main
└── Continue for all specialists...
```

### Benefits of This Approach

1. **Clean Isolation**: Each specialist's work is completely separate
2. **No Conflicts**: No file overwrites between specialists
3. **Parallel Servers**: Can run all 5 implementations simultaneously
4. **Easy Evaluation**: All worktrees remain for comparison
5. **Professional**: Mimics real-world feature branch development

## Decision Matrix: Which Approach to Use?

### Approach 1: Main Session CD (Current Implementation)
**Pros**:
- ✅ Simple implementation (already done)
- ✅ Guaranteed correct working directory
- ✅ Less complex agent prompts

**Cons**:
- ❌ All sub-agents share ONE worktree (file conflicts!)
- ❌ Can't run in parallel (they'd overwrite each other)
- ❌ Loses the whole point of multiple implementations
- ❌ Not what the original spec intended

**Verdict**: This approach defeats the purpose of having multiple sub-agents!

### Approach 2: Sub-Agent Self-Navigation
**Pros**:
- ✅ Each sub-agent gets isolated worktree
- ✅ True parallel execution possible
- ✅ Can compare different implementations
- ✅ Matches original spec vision
- ✅ We proved it works!

**Cons**:
- ⚠️ More complex prompts needed
- ⚠️ Must ensure deployment from main directory
- ⚠️ Slightly more error-prone

**Verdict**: This is what we should implement!

## Critical Implementation Details for Approach 2

### The Prompt Pattern That Works
```
"You are Performance Sub-Agent 1 for Task ${task_id}.

CRITICAL FIRST STEPS (DO THESE BEFORE ANYTHING ELSE):
1. Create git worktree: git worktree add .worktrees/task-${task_id}-orch-perf-1 -b task-${task_id}-orch-perf-1
2. Navigate to worktree: cd .worktrees/task-${task_id}-orch-perf-1
3. Confirm location: pwd (should show the worktree path)

THEN implement with focus on: [specific approach]"
```

### Why This Order Matters
1. **"CRITICAL FIRST STEPS"** - Makes it clear these aren't optional
2. **Explicit commands** - No ambiguity about what to do
3. **Confirmation step** - Ensures agent is in right place
4. **"THEN implement"** - Clear sequencing

## What Still Needs Testing

### Test 1: Clean Parallel Deployment ❌ FAILED
**Date**: 2025-06-26 18:20 CEST
**Result**: Even with parallel deployment, agents STILL create nested worktrees!

**What We Did**:
- Deployed 3 agents simultaneously from main directory
- Each had explicit instructions to create their own worktree
- Used clear "CRITICAL FIRST STEPS" pattern

**What Happened**:
- Agent 3 created: `.worktrees/task-7-orch-perf-1/.worktrees/task-7-orch-perf-3`
- This means agents are somehow inheriting each other's context
- Even parallel deployment doesn't solve the nesting issue

**New Discovery**: The Task function deployment might be serializing internally, causing later agents to inherit earlier agents' contexts!

### Test 2: Pre-Created Worktrees ❌ PARTIAL FAILURE
**Date**: 2025-06-27 11:07 CEST
**Result**: Mixed results - some agents work correctly, but Agent 2 still nested!

**What We Did**:
1. Pre-created all 3 worktrees BEFORE deploying any agents
2. Each worktree existed at:
   - `.worktrees/task-7-orch-perf-1`
   - `.worktrees/task-7-orch-perf-2`
   - `.worktrees/task-7-orch-perf-3`
3. Deployed agents with explicit instructions to use pre-existing worktrees

**What Happened**:
- Agent 1: ✅ Correctly used `.worktrees/task-7-orch-perf-1`
  - Created: `/home/loucmane/dev/javascript/MomsBlog/blog/.worktrees/task-7-orch-perf-1/src/components/PreCreatedTest1.tsx`
- Agent 2: ❌ Created nested `.worktrees/task-7-orch-perf-1/.worktrees/task-7-orch-perf-2`
  - Created: `/home/loucmane/dev/javascript/MomsBlog/blog/.worktrees/task-7-orch-perf-1/.worktrees/task-7-orch-perf-2/src/components/PreCreatedTest2.tsx`
  - Also created: `.worktrees/task-7-orch-perf-1/.worktrees/task-7-orch-perf-2/agent-2-test.txt`
- Agent 3: ✅ Correctly used `.worktrees/task-7-orch-perf-3`
  - Created: `/home/loucmane/dev/javascript/MomsBlog/blog/.worktrees/task-7-orch-perf-3/src/components/PreCreatedTest3.tsx`

**Critical Finding**: Even with pre-created worktrees, Agent 2 still nested under Agent 1's directory!

**Hypothesis**: The deployment order matters - Agent 2 seems to inherit Agent 1's context

**Files Created as Evidence**:
- Agent 1's file exists in correct location (verified)
- Agent 2's files exist in NESTED location (verified)
- Agent 3's file exists in correct location (verified)

### Test 3: Deployment with Delays ❌ FAILED
**Date**: 2025-06-27 11:18 CEST
**Result**: Delays don't help - still creates nested worktrees

**What We Did**:
- Deployed Agent 1 with explicit worktree creation
- Waited 2 seconds before deploying Agent 2
- Each agent had same critical first steps pattern

**What Happened**:
- Agent 1: ✅ Created `.worktrees/task-7-orch-delay-1`
- Agent 2: ❌ Still created nested worktree under Agent 1's context

**Conclusion**: Timing/delays don't solve the problem. The Task function inherits the deployer's context regardless of delays.

### Root Cause Analysis

Based on all three tests, the pattern is clear:
1. **Test 1 (Parallel)**: Agents 2 & 3 nested under Agent 1
2. **Test 2 (Pre-created)**: Agent 2 nested under Agent 1, Agent 3 worked
3. **Test 3 (Delays)**: Agent 2 still nested under Agent 1

**The Critical Pattern**: 
- First agent works correctly
- Second agent inherits first agent's context
- Sometimes third agent works (if it doesn't inherit second agent's context)

**This suggests**: The Task function might be maintaining state between deployments, causing subsequent agents to inherit previous agent's working directory.

## All Possible Solutions (2025-06-27 11:30 CEST)

### Option 1: Keep Current Implementation (Main Session CD)
**How it works**: Main session creates worktree, CDs into it, deploys agents
**Implementation**: Already done in current files
**Result**: All sub-agents for that specialist work in same worktree
**Pros**: 
- Already implemented and working
- Predictable behavior
- Simple to understand
**Cons**: 
- No parallel implementations per specialist
- Potential file conflicts between sub-agents
**Success Chance**: 100% (already works)

### Option 2: Manual Sequential Deployment
**How it works**: Run orchestration multiple times, deploying one agent at a time
**Implementation**: Would require breaking up the orchestration
**Result**: Each agent gets fresh context
**Pros**: 
- Guaranteed isolation
- No nesting issues
- Each agent starts clean
**Cons**: 
- Loses automation benefits
- Very manual process
- Time consuming
**Success Chance**: 100% (but not automated)

### Option 3: Test Absolute Path Approach
**How it works**: Agents create worktrees with absolute paths, work with absolute paths
**Implementation Example**:
```
"Create worktree at absolute path: /home/loucmane/dev/javascript/MomsBlog/blog/.worktrees/task-7-abs-1
Use git worktree add with absolute paths
Work exclusively in that absolute path for all operations"
```
**Pros**: 
- Might bypass working directory inheritance
- Still automated
- Worth testing
**Cons**: 
- More complex prompts
- Less portable (hardcoded paths)
- Untested approach
**Success Chance**: 70% (untested but promising)

### Option 4: Investigate Task Function Reset
**How it works**: Try to reset Task function state between deployments
**Ideas to test**:
- Deploy from different files?
- Use different Task function instances?
- Add some kind of "reset" between deployments?
**Pros**: 
- Could be the ideal solution
- Would maintain full automation
**Cons**: 
- Not sure if possible
- No documented way to reset state
- Requires deep research
**Success Chance**: 20% (unlikely)

### Option 5: Hybrid Specialist/Sub-Agent Approach
**How it works**: Main session acts as specialist AND deploys only 1 sub-agent
**Implementation**: Reduce sub-agents from 3 to 1 per specialist
**Result**: 2 implementations per specialist instead of 3-4
**Pros**: 
- Some diversity of implementation
- Reduces nesting complexity
- Simpler than current approach
**Cons**: 
- Less parallel perspectives
- Still not ideal
**Success Chance**: 80% (simplified version)

### Option 6: Pre-Create + Explicit Navigation Reset
**How it works**: Combine pre-created worktrees with very explicit navigation
**Implementation Example**:
```
"FIRST: Navigate to project root: cd /home/loucmane/dev/javascript/MomsBlog/blog
THEN: Navigate to your worktree: cd .worktrees/task-7-reset-1
CONFIRM: Run pwd to verify location"
```
**Pros**: 
- Might force context reset
- Uses existing worktrees
**Cons**: 
- Still fighting the inheritance issue
- Already partially tested (didn't work well)
**Success Chance**: 40% (some promise but doubtful)

## Testing Priority (User Decision Needed)

Based on analysis, recommended testing order:
1. **Option 3 (Absolute Paths)** - 70% chance, not yet tested
2. **Option 6 (Explicit Reset)** - 40% chance, variation of what we tried
3. **Option 5 (Hybrid)** - 80% chance but compromise solution
4. **Option 1 (Keep Current)** - 100% chance but not ideal
5. **Option 2 (Manual)** - 100% chance but loses automation
6. **Option 4 (Research)** - 20% chance, time investment

**User selected: Option 3 (Absolute Path Approach) for first test**

### Test Results: Option 3 ✅ CONFIRMED SOLUTION

**Test Date**: 2025-06-27 12:23 - 13:19 CEST
**Result**: COMPLETE SUCCESS across all test scenarios

**What We Tested**:
1. Sequential deployment with absolute paths - SUCCESS
2. Clean environment (no .worktrees folder) - SUCCESS  
3. True parallel deployment (3 agents in one message) - SUCCESS

**Key Findings**:
- Absolute paths completely bypass the working directory inheritance issue
- Works reliably in all scenarios tested
- Enables true parallel deployment without nesting
- No complex state management needed

**This is our confirmed solution for the orchestration implementation.**

## Risks and Mitigation

### Risk 1: Nested Worktrees
**Issue**: Sub-agents creating worktrees inside other worktrees
**Impact**: Complex directory structure, potential git corruption
**Mitigation**: ALWAYS deploy from main directory, explicit pwd checks

### Risk 2: Command File Size
**Issue**: Command file now 294 lines (suspected >200 line execution issue)
**Impact**: Command might display as template instead of executing
**Mitigation**: Have backup plan to split into smaller commands

## Rollback Plan

If Approach 2 fails testing:
1. Keep Approach 1 (current CD implementation)
2. Document limitation: all sub-agents share worktree
3. Consider sequential execution to avoid conflicts
4. Update spec to reflect single worktree reality

## The Key Insight We Must Not Forget

**THE MOST IMPORTANT DISCOVERY**: 
Sub-agents inherit the working directory of their deployer. This is not documented anywhere in Claude's docs but is fundamental to how the Task function works.

This means:
- Deploy from main → agent works in main
- Deploy from worktree → agent works in worktree
- Deploy from nested location → agent works in nested location

## Final Implementation Recommendation

Based on all testing and analysis:
1. **Use Approach 2** (Sub-Agent Self-Navigation)
2. **Remove the CD commands** from command file
3. **Update prompts** to include worktree creation
4. **Test thoroughly** before full deployment
5. **Document the pattern** for future use

---
*Created: 2025-06-26 15:05 CEST*
*Updated: 2025-06-27 15:00 CEST*
*Status: ✅ SOLUTION FOUND - Absolute Paths Successfully Implemented*

## Implementation Status

**COMPLETED** - The absolute path approach has been:
1. Successfully tested in multiple scenarios
2. Implemented in both orchestration files
3. Documented comprehensively
4. Ready for production testing

### Files Updated:
- ✅ `.claude/commands/orchestrate-and-test.md` - Added absolute path instructions
- ✅ `.claude/specs/orchestrate-test-spec.md` - Updated documentation
- ✅ `.gitignore` - Added .worktrees/ to prevent tracking

### Next Steps:
Test the updated orchestration command with Task 7 to verify the solution works in production.