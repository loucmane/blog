# Orchestrate-and-Test Command Conversion Plan

## Root Cause
The command displays as template because ALL TASK: blocks are wrapped in markdown code fences (```), making Claude interpret them as documentation rather than executable directives.

## Conversion Requirements

### 1. Remove ALL Code Fences
- Currently: 28 TASK blocks wrapped in ``` ``` 
- Required: Remove the wrapping backticks, leave TASK: blocks bare

### 2. Fix Variable Syntax
- Current: `${task_id}`, `${CONTRACTS_DIR}`, etc.
- Required: `[TASK_ID]`, `[CONTRACTS_DIR]`, etc.

### 3. Simplify Language
- Current: "Deploy a Pre-Analysis Agent using the Task tool"
- Required: Direct execution language

### 4. Working Pattern to Follow
```
TASK: Generate implementation contracts for Task [TASK_ID]

You are the Pre-Analysis Agent responsible for creating implementation contracts.

CONTEXT:
- Task specification: [Full content from task file]
- Task ID: [TASK_ID]
...

REQUIREMENTS:
1. [Requirement 1]
2. [Requirement 2]
...

DELIVERABLES:
- [Deliverable 1]
- [Deliverable 2]
```

## Conversion Steps

1. **Global Find/Replace**:
   - Find: ``` before TASK:
   - Replace: (nothing)
   - Find: ``` after agent blocks
   - Replace: (nothing)

2. **Variable Conversion**:
   - ${task_id} → [TASK_ID]
   - ${CONTRACTS_DIR} → [CONTRACTS_DIR]
   - ${ORCH_OUTPUT_DIR} → [ORCH_OUTPUT_DIR]
   - ${worktree_prefix} → [WORKTREE_PREFIX]
   - ${depth} → [DEPTH]
   - ${specialists} → [SPECIALISTS]

3. **Simplify Section Headers**:
   - Remove conceptual descriptions
   - Make execution direct

## Agents to Convert (28 total)
1. Pre-Analysis Agent
2. Master Orchestrator
3. Performance Specialist
4. Architecture Specialist  
5. UX/DX Specialist
6. Accessibility Specialist
7. Innovation Specialist
8. (15 Sub-Agents - deployed by specialists, may not need individual TASK blocks)
9. Evaluation Orchestrator
10. Performance Summarization
11. Architecture Summarization
12. UX/DX Summarization
13. Accessibility Summarization
14. Innovation Summarization
15. Synthesis Orchestrator

## Critical Success Factors
- NO code fences around TASK: blocks
- Direct execution language
- Simplified variable syntax
- Match the pattern from infinite.md and infinite-documentation.md