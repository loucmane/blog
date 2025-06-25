# Orchestrate-and-Test Compression Implementation Plan

## Goal
Reduce orchestrate-and-test.md from 898 lines to under 400 lines while maintaining functionality.

## Hypothesis
Commands over ~200-300 lines are treated as documentation rather than executable code.

## Evidence
- test-minimal.md (23 lines) - EXECUTES ✓
- test-parallel.md (~50 lines) - EXECUTES ✓
- test-orchestration.md (116 lines) - EXECUTES ✓ (created worktrees)
- infinite.md (181 lines) - EXECUTES ✓
- orchestrate-and-test.md (898 lines) - DISPLAYS ONLY ✗

## Iterative Approach

### Iteration 1: Minimal Viable Test (3 agents)
Target: ~80 lines
- Pre-Analysis Agent
- Performance Specialist
- Synthesis Agent
Test: Does it execute or display?

### Iteration 2: Phase 1 Complete (5 agents)
Target: ~120 lines
- Add Architecture Specialist
- Add Master Orchestrator
Test: Still executing?

### Iteration 3: Half Implementation (14 agents)
Target: ~200 lines
- Add remaining 3 specialists
- Add 4 evaluation agents
- Add 2 sub-agents per specialist
Test: Approaching threshold?

### Iteration 4: Near Complete (22 agents)
Target: ~300 lines
- Add remaining sub-agents
- Add 3 summarizers
Test: Finding the limit?

### Iteration 5: Full Implementation (28 agents)
Target: ~380 lines
- Add final summarizer
- Add final synthesis
Test: Can we fit all 28?

## Compression Strategies

### Level 1: Remove Redundancy
- Move shared context to header
- Use variables for repeated paths
- Reference contracts once

### Level 2: Condense TASK Blocks
From:
```
TASK: Performance Specialist Orchestrator for Task ${task_id}

You are the Performance Specialist Orchestrator.

CONTEXT:
- Task specification: [Full content...]
- Task ID: ${task_id}
- Worktree: .worktrees/...
[20+ more lines]
```

To:
```
TASK: Performance Specialist for Task ${task_id}
You are the Performance Specialist managing worktree-1.
Focus: Bundle size, runtime, memory
Deploy 3 sub-agents, ensure compliance, document decisions.
Output: implementations/ and analysis/performance/
```

### Level 3: Extreme Compression (if needed)
- Single line per requirement
- Abbreviate paths
- Minimal context

## Success Metrics
- Command executes (not displays)
- All agents deploy
- Worktrees created
- Contracts generated
- Full orchestration works