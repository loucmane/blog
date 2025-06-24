# Orchestrate-and-Test Conversion Implementation Plan (REVISED)

## Objective
Convert `/orchestrate-and-test` command from technical manual to thinking exercise with embedded example prompts, following the "disguised prompt" pattern from working commands.

## NEW UNDERSTANDING (from Subagent Analysis)
Working commands are **thinking prompts disguised as examples**, not deployment specifications. They trick Claude into completing examples rather than following instructions.

## Pre-Implementation Checklist

### 1. Understand the Working Pattern
**From infinite.md and infinite-documentation.md:**
```
TASK: [Description without code fences]

You are [Agent Role].

CONTEXT:
- [Context items]

REQUIREMENTS:
1. [Requirement]
2. [Requirement]

DELIVERABLE: [What to produce]
```

### 2. Understand the Non-Working Pattern
**Current orchestrate-and-test.md:**
```markdown
```
TASK: [Description]

You are [Agent Role].
[Content]
```
```

## Revised Implementation Steps (Based on Subagent Insights)

### Step 0: Mindset Shift (Critical!)
Transform from "deployment specification" to "thinking exercise with examples to complete"

### Step 1: Pre-Conversion Audit (5 minutes)
1. Count total TASK: blocks using grep
2. List all unique variable patterns
3. Create backup: `orchestrate-and-test.md.backup`
4. Document current line numbers for each TASK: block

### Step 2: Systematic Code Fence Removal (20 minutes)
1. Start from top of file
2. For each TASK: block:
   - Note line number
   - Remove opening ``` before TASK:
   - Remove closing ``` after agent content
   - Mark as complete in tracker
3. Use regex for efficiency where safe

### Step 3: Variable Conversion (10 minutes)
1. Create find/replace pairs:
   ```
   ${task_id} → [TASK_ID]
   ${CONTRACTS_DIR} → [CONTRACTS_DIR]
   ${ORCH_OUTPUT_DIR} → [ORCH_OUTPUT_DIR]
   ${worktree_prefix} → [WORKTREE_PREFIX]
   ${CURRENT_BRANCH} → [CURRENT_BRANCH]
   ${PROJECT_ROOT} → [PROJECT_ROOT]
   ${task_title} → [TASK_TITLE]
   ${task_subtasks} → [TASK_SUBTASKS]
   ${specialists} → [SPECIALISTS]
   ${depth} → [DEPTH]
   ${EST_TIME} → [EST_TIME]
   ```
2. Handle special case: `String(task_id).padStart(3, '0')` → `[TASK_ID_PADDED]`
3. Apply conversions systematically

### Step 4: Language Simplification (10 minutes)
1. Remove phrases like:
   - "Deploy [X] using the Task tool"
   - "Create a contracts directory in the orchestration output path and deploy"
2. Make language direct and action-oriented
3. Remove explanatory text between TASK: blocks

### Step 5: Structure Validation (5 minutes)
1. Ensure each TASK: block follows pattern:
   - No code fences
   - Direct TASK: statement
   - Agent content
   - Clear separation between blocks
2. Compare structure with working commands
3. Verify no stray backticks remain

### Step 6: Final Review (5 minutes)
1. Run grep to confirm no ``` around TASK:
2. Spot check variable conversions
3. Read through for flow and clarity
4. Update tracker to 100% complete

## Risk Mitigation
1. **Backup**: Keep original as .backup file
2. **Incremental**: Convert one section at a time
3. **Validation**: Test after each major section
4. **Rollback**: Can restore from backup if needed

## Success Criteria
- [ ] All TASK: blocks have no surrounding code fences
- [ ] All variables converted to bracket notation
- [ ] Language is direct and executable
- [ ] Structure matches working commands
- [ ] Command executes instead of displaying template

## Estimated Time: 55 minutes

## Post-Conversion Testing
1. Run command with simple task_id
2. Check for agent deployment messages
3. Verify worktree creation
4. Monitor orchestration.log generation
## NEW: Critical Pattern Checklist (from Subagents)

### The "Disguised Prompt" Test
- [ ] Opening reads like "Think deeply about this [task]" not "This command does X"
- [ ] Variables are minimal: `var: $ARGUMENTS` not `- var: $ARGUMENTS (required)`
- [ ] TASK blocks are in anonymous ``` ``` (no language identifier)
- [ ] Each TASK block starts with "You are [role]" perspective
- [ ] No "Deploy X using Task tool" language anywhere
- [ ] Reads like a thinking exercise, not technical documentation

### Specific Changes for orchestrate-and-test.md

1. **Opening Transformation**:
   ```
   FROM: "Think deeply about orchestrating a comprehensive multi-agent implementation workflow..."
   TO: "Think deeply about this task implementation challenge. You are about to guide a sophisticated multi-perspective creation process."
   ```

2. **Variable Simplification**:
   ```
   FROM:
   - task_id: $ARGUMENTS (required)
   - specialists: $ARGUMENTS (optional, default: "all")
   
   TO:
   task_id: $ARGUMENTS
   specialists: $ARGUMENTS
   ```

3. **TASK Block Perspective Shift**:
   ```
   FROM:
   Deploy a Pre-Analysis Agent using the Task tool.
   ```
   TASK: Generate contracts...
   ```
   
   TO:
   ```
   TASK: Generate implementation contracts for Task ${task_id}
   
   You are the Pre-Analysis Agent...
   ```
   ```

4. **Remove ALL Deployment Commands**:
   - Delete: "Deploy X using the Task tool"
   - Delete: "Parallel Execution Management:" sections
   - Replace with natural transitions

## Success Validation

The command should:
1. Read like Claude is thinking about a problem
2. Have TASK blocks that look like example prompts to complete
3. Flow narratively from one concept to the next
4. Never explicitly mention deployment or execution
