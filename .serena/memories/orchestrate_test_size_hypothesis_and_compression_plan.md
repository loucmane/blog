# Orchestrate-Test Command: Size Hypothesis and Compression Plan

## The Journey So Far

### Two Days of Failed Attempts
1. **TASK Block Conversion** - Added proper TASK: blocks with triple backticks → Failed
2. **Disguised Prompt Pattern** - Transformed to narrative thinking exercise → Failed  
3. **Explicit Task Tool** - Added "using Task tool" in 6 locations → Failed
4. **Spec Architecture Discussion** - Explored moving to external specs → User frustration

### Key Discovery
After all attempts failed despite proper formatting:
- Working commands: 23-181 lines
- Our command: 898 lines
- Hypothesis: **Size is the actual problem**

## The Size Hypothesis

### Evidence Supporting Size Theory
1. **test-minimal.md** (23 lines) - Executes
2. **test-parallel.md** (~50 lines) - Executes
3. **infinite.md** (181 lines) - Executes
4. **orchestrate-and-test.md** (898 lines) - Displays only

### Claude's Behavior Pattern
- Commands <200 lines → Treated as executable
- Commands >300 lines → Treated as documentation
- Threshold appears to be around 200-300 lines

## Compression Plan

### Phase 1: Minimal Test
Create `test-orchestrate-minimal.md`:
```
- Header and variables (10 lines)
- Pre-Analysis Agent (12 lines)
- 2-3 Specialist Orchestrators (12 lines each)
- Basic execution instruction
- Total: ~60-80 lines
```

Purpose: Prove that a shortened version executes

### Phase 2: Full Compression Strategy

#### Current Structure (898 lines)
- Headers/Variables: ~50 lines
- Phase descriptions: ~150 lines
- 28 TASK blocks × 30 lines: ~840 lines
- Execution management sections: ~100 lines

#### Target Structure (350-400 lines)
- Headers/Variables: 10 lines
- Minimal phase descriptions: 20 lines
- 28 TASK blocks × 12 lines: 336 lines
- Simple execution: 10 lines
- Total: ~376 lines

#### Compression Techniques
1. **Remove Redundancy**
   - Each agent repeats task context → Move to header
   - Contracts list repeated 15+ times → Reference once
   - Worktree patterns repeated → Use variables

2. **Condense TASK Blocks**
   ```
   From:
   TASK: Performance Specialist Orchestrator for Task ${task_id}
   
   You are the Performance Specialist Orchestrator.
   
   CONTEXT:
   - Task specification: [Full content from .taskmaster/tasks/task_${String(task_id).padStart(3, '0')}.txt]
   - Task ID: ${task_id}
   - Task title: ${task_title}
   - Worktree: .worktrees/${worktree_prefix}-1-performance/
   - Focus: Bundle size, runtime performance, memory efficiency
   - Analysis output: ${ORCH_OUTPUT_DIR}/analysis/performance/
   - Sub-agent count: ${depth}
   - Contracts: ${CONTRACTS_DIR}
   
   REQUIREMENTS:
   1. Read and understand all implementation contracts:
      - ${CONTRACTS_DIR}/interface-contract.yaml - Component interfaces
      - ${CONTRACTS_DIR}/behavior-contract.yaml - Required behaviors
      - ${CONTRACTS_DIR}/integration-contract.yaml - Code patterns
      - ${CONTRACTS_DIR}/constraints.yaml - Performance budgets
   
   2. Deploy ${depth} sub-agents to create implementations:
      - Bundle Optimizer → _implementations/bundle-optimizer/
      - Runtime Optimizer → _implementations/runtime-optimizer/
      - Memory Optimizer → _implementations/memory-optimizer/
   
   3. Ensure each implementation:
      - Is complete and functional
      - Strictly adheres to ALL contracts
      - Optimizes for performance metrics
      - Can be tested independently
   
   4. Document your orchestration decisions:
      - Write decision log to ${ORCH_OUTPUT_DIR}/analysis/performance/decisions.md
      - Explain trade-offs between implementations
      - Note performance metrics and benchmarks
   
   DELIVERABLES:
   - ${depth} complete implementations in designated folders
   - Decision log documenting approach and trade-offs
   - All implementations compliant with contracts
   
   To:
   TASK: Performance Specialist for Task ${task_id}
   
   You are the Performance Specialist Orchestrator managing worktree-1-performance.
   
   Focus: Bundle size, runtime performance, memory efficiency
   
   Deploy 3 sub-agents: Bundle/Runtime/Memory Optimizers
   Ensure contract compliance and document decisions.
   
   Output: implementations/ and analysis/performance/
   ```

3. **Remove All Non-Essential Sections**
   - Delete "Parallel Execution Management" blocks
   - Remove explanation paragraphs
   - Eliminate duplicate instructions

### Phase 3: Progressive Testing

Test incrementally to find the exact threshold:
1. 5 agents (~80 lines) → Test execution
2. 10 agents (~140 lines) → Test execution  
3. 15 agents (~200 lines) → Test execution
4. 20 agents (~260 lines) → Test execution
5. 28 agents (~370 lines) → Test execution

Stop when execution fails, backtrack to last working size.

### Phase 4: If Still Too Large

Options if 28 agents exceed threshold:
1. **Split into 2 commands**:
   - orchestrate-and-test-phase1 (Pre-analysis + Specialists)
   - orchestrate-and-test-phase2 (Evaluation + Synthesis)

2. **Create meta-orchestrator**:
   - One command that deploys other commands
   - Each sub-command under 200 lines

3. **Dynamic generation**:
   - Command generates TASK blocks programmatically
   - Reduces static line count

## Tracking Document

Create `orchestrate-compression-tracker.md`:
```markdown
# Orchestrate Command Compression Tracker

## Original Metrics
- Total lines: 898
- TASK blocks: 28 × ~30 lines
- Execution: FAILS (displays only)

## Compression Progress
| Version | Lines | Agents | Status | Notes |
|---------|-------|--------|--------|-------|
| Original | 898 | 28 | FAILS | Baseline |
| Minimal Test | [TBD] | 3-4 | [TEST] | Prove hypothesis |
| Compressed v1 | [TBD] | 28 | [TEST] | Full compression |

## Line Count Breakdown
[Track what was removed and why]

## Test Results
[Document each test with Task 7]
```

## Key Insights

1. **We've been solving the wrong problem** - Format was never the issue, size was
2. **Simplest solution might work** - Just make it shorter
3. **No complex architecture needed** - Compression, not reorganization
4. **Test hypothesis first** - Minimal version before full compression

## Next Steps

1. Create minimal test version (3-4 agents)
2. Test with Task 7
3. If it executes, proceed with full compression
4. If it fails, investigate other causes
5. Track everything in compression tracker

## Success Criteria

- Minimal test executes with Task 7
- Full compressed version stays under 400 lines
- All 28 agents remain functional
- No loss of orchestration capability