# Orchestration Refactor Exact Plan

**Created**: 2025-06-27 15:35 CEST
**Updated**: 2025-06-28 17:xx CEST
**Purpose**: Detailed implementation plan for refactoring orchestration files

## Starting State (2025-06-27)
- **Command file**: 380 lines (too large to execute)
- **Spec file**: 414 lines
- **Problem**: Command treated as documentation due to size
- **Solution**: Move sub-agent instructions to spec file

## Option 1: Embed in Existing Sections (NOT CHOSEN)
Would expand each orchestrator section in spec with sub-agent details.
- Pros: Keeps related content together
- Cons: Makes existing sections very long, harder to find sub-agent instructions

## Option 2: Separate Sub-Agent Section (CHOSEN) ✅
Create new dedicated section for all sub-agent deployment instructions.
- Pros: Clean separation, easy to reference, follows infinite.md pattern
- Cons: Sub-agent instructions separated from parent orchestrator

## Implementation Details for Option 2

### Command File Updates
Each specialist section simplified from ~30 lines to ~10 lines:

```markdown
## Performance Specialist Role
If "performance" is in ${specialists}:

TASK: Deploy Performance Specialist Orchestrator

You are now the Performance Specialist. Your focus: speed, efficiency, and optimization.

Actions:
1. Review performance-related contracts from contracts/
2. Deploy ${depth} Performance Sub-Agents using the built-in Task function
   - Load deployment instructions from spec file Section "Sub-Agent Deployment Instructions" → "3. Performance Sub-Agents"
   - Each sub-agent gets its own isolated worktree
3. Log deployments to orchestration.log
4. Transition to next role
```

### Spec File Structure
Add new major section after "### 14. Synthesis Orchestrator":

```markdown
## Sub-Agent Deployment Instructions

### 3. Performance Sub-Agents

#### 3.1 Performance Sub-Agent 1
You are Performance Sub-Agent 1 for Task ${task_id}.

CRITICAL INSTRUCTIONS - USE ABSOLUTE PATHS:
1. Create the .worktrees directory if needed: mkdir -p ${PROJECT_ROOT}/.worktrees
2. Create git worktree at ABSOLUTE path: 
   git worktree add ${PROJECT_ROOT}/.worktrees/task-${task_id}-orch-perf-1 -b task-${task_id}-orch-perf-1
3. Navigate using ABSOLUTE path: cd ${PROJECT_ROOT}/.worktrees/task-${task_id}-orch-perf-1
4. Verify location: pwd (should show the worktree path)
5. All file operations use ABSOLUTE paths: ${PROJECT_ROOT}/.worktrees/task-${task_id}-orch-perf-1/...

THEN implement with focus on: render optimization and initial load performance

#### 3.2 Performance Sub-Agent 2
You are Performance Sub-Agent 2 for Task ${task_id}.

CRITICAL INSTRUCTIONS - USE ABSOLUTE PATHS:
1. Create the .worktrees directory if needed: mkdir -p ${PROJECT_ROOT}/.worktrees
2. Create git worktree at ABSOLUTE path: 
   git worktree add ${PROJECT_ROOT}/.worktrees/task-${task_id}-orch-perf-2 -b task-${task_id}-orch-perf-2
3. Navigate using ABSOLUTE path: cd ${PROJECT_ROOT}/.worktrees/task-${task_id}-orch-perf-2
4. Verify location: pwd (should show the worktree path)
5. All file operations use ABSOLUTE paths: ${PROJECT_ROOT}/.worktrees/task-${task_id}-orch-perf-2/...

THEN implement with focus on: bundle efficiency and code splitting strategies

#### 3.3 Performance Sub-Agent 3 (if depth=3)
You are Performance Sub-Agent 3 for Task ${task_id}.

CRITICAL INSTRUCTIONS - USE ABSOLUTE PATHS:
1. Create the .worktrees directory if needed: mkdir -p ${PROJECT_ROOT}/.worktrees
2. Create git worktree at ABSOLUTE path: 
   git worktree add ${PROJECT_ROOT}/.worktrees/task-${task_id}-orch-perf-3 -b task-${task_id}-orch-perf-3
3. Navigate using ABSOLUTE path: cd ${PROJECT_ROOT}/.worktrees/task-${task_id}-orch-perf-3
4. Verify location: pwd (should show the worktree path)
5. All file operations use ABSOLUTE paths: ${PROJECT_ROOT}/.worktrees/task-${task_id}-orch-perf-3/...

THEN implement with focus on: runtime performance and optimization

### 4. Architecture Sub-Agents

#### 4.1 Architecture Sub-Agent 1
You are Architecture Sub-Agent 1 for Task ${task_id}.

CRITICAL INSTRUCTIONS - USE ABSOLUTE PATHS:
1. Create the .worktrees directory if needed: mkdir -p ${PROJECT_ROOT}/.worktrees
2. Create git worktree at ABSOLUTE path: 
   git worktree add ${PROJECT_ROOT}/.worktrees/task-${task_id}-orch-arch-1 -b task-${task_id}-orch-arch-1
3. Navigate using ABSOLUTE path: cd ${PROJECT_ROOT}/.worktrees/task-${task_id}-orch-arch-1
4. Verify location: pwd (should show the worktree path)
5. All file operations use ABSOLUTE paths: ${PROJECT_ROOT}/.worktrees/task-${task_id}-orch-arch-1/...

THEN implement with focus on: component modularity and separation of concerns

[Continue pattern for 4.2, 4.3, 5.1-5.3, 6.1-6.3, 7.1-7.3]
```

### Focus Areas for Each Sub-Agent:
- **Performance 1**: render optimization and initial load
- **Performance 2**: bundle efficiency and code splitting
- **Performance 3**: runtime performance
- **Architecture 1**: component modularity and separation
- **Architecture 2**: system scalability and extensibility
- **Architecture 3**: dependency management
- **UX/DX 1**: developer ergonomics and API design
- **UX/DX 2**: user interactions and interfaces
- **UX/DX 3**: documentation and examples
- **Accessibility 1**: WCAG 2.1 AA compliance
- **Accessibility 2**: assistive technology support
- **Accessibility 3**: keyboard navigation
- **Innovation 1**: cutting-edge patterns and techniques
- **Innovation 2**: future adaptability and evolution
- **Innovation 3**: experimental feature exploration

## Expected Line Count Changes
- **Command file**: 380 → ~275 lines (27.6% reduction)
- **Spec file**: 414 → ~600 lines (45% increase)
- **Result**: Command file under execution threshold

## Variable Substitution
These variables will be replaced at runtime:
- `${PROJECT_ROOT}` - Captured in Phase 3
- `${task_id}` - From command arguments
- `${depth}` - Number of sub-agents per specialist
- `${specialists}` - Which specialists to deploy

## Cross-References
Command file references spec sections:
- "Section 3: Performance Sub-Agents"
- "Section 4: Architecture Sub-Agents"
- "Section 5: UX/DX Sub-Agents"
- "Section 6: Accessibility Sub-Agents"
- "Section 7: Innovation Sub-Agents"

## Success Verification
1. Command file < 300 lines
2. All sub-agent instructions preserved
3. References clear and findable
4. Variables properly referenced
5. Command executes instead of displaying

## Rollback Plan
If refactoring fails:
1. Restore from backup-380-lines-20250627-1911
2. Restore from backup-414-lines-20250627-1911
3. Investigate alternative solutions
4. Consider different file split approach

## 2025-06-28 Updates

### Nested Code Blocks Issue Discovered
- **Problem**: Refactoring introduced nested markdown code blocks
- **Impact**: Command displayed as template instead of executing
- **Root Cause**: Markdown parser can't handle nested triple-backticks
- **Solution**: Remove ALL nested blocks, use flat TASK structure

### Fix Implementation
Transformed all specialist sections from nested to flat structure:
- Removed outer code block wrapper
- Each specialist has direct TASK: declaration
- Preserved all functionality and references
- Command now executes successfully

### Parallel Deployment Enhancement
**Issue**: Sub-agents were deploying sequentially within each specialist

**Solution Applied**:
1. Updated all 5 specialist sections:
   - Changed "Deploy ${depth} Sub-Agents" → "Deploy ${depth} Sub-Agents IN PARALLEL"
   - Added "CRITICAL: Deploy all sub-agents in a single message with multiple Task invocations"
   
2. Updated Phase 8 summarization:
   - Emphasized "Deploy ALL 5 summarizers IN A SINGLE MESSAGE"
   
3. Command file grew to 380 lines but still executes (nested blocks were the real issue)

**Expected Impact**:
- Much faster orchestration execution
- Better resource utilization  
- Clear instructions prevent AI from sequential deployment
- Maintains all existing functionality

### Current Status
- ✅ Command executes successfully
- ✅ Nested blocks issue resolved
- ✅ Parallel deployment instructions added
- ✅ All functionality preserved
- Ready for full orchestration test with parallel execution