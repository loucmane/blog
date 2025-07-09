**TEST ORCHESTRATION ITERATION 1**

Test minimal orchestration with 3 agents.

**Variables:**
task_id: $ARGUMENTS

**Setup:**
ORCH_OUTPUT_DIR=/tmp/orchestration/task_${task_id}/${timestamp}
CONTRACTS_DIR=${ORCH_OUTPUT_DIR}/contracts

**PHASE 1: PRE-ANALYSIS**

```
TASK: Pre-Analysis for Task ${task_id}

You are a Pre-Analysis Agent generating implementation contracts.

Read task from: .taskmaster/tasks/task_${String(task_id).padStart(3, '0')}.txt
Generate 4 YAML contracts in ${CONTRACTS_DIR}:
- interface-contract.yaml
- behavior-contract.yaml
- integration-contract.yaml
- constraints.yaml
```

**Parallel Execution Management:**
- Deploy the Pre-Analysis Agent using Task tool
- Wait for contract generation before proceeding

**PHASE 2: SPECIALIST**

```
TASK: Performance Specialist for Task ${task_id}

You are the Performance Specialist managing worktree-1.

Focus: Bundle size, runtime, memory
Deploy 3 sub-agents, ensure compliance, document decisions.
Output: ${ORCH_OUTPUT_DIR}/analysis/performance/
```

**Parallel Execution Management:**
- Deploy the Performance Specialist using Task tool
- Monitor sub-agent deployments

**PHASE 3: SYNTHESIS**

```
TASK: Synthesize results for Task ${task_id}

You are the Synthesis Agent.

Read all analysis outputs.
Create final recommendations.
Output: ${ORCH_OUTPUT_DIR}/synthesis/final.md
```

**Parallel Execution Management:**
- Deploy the Synthesis Agent using Task tool
- Complete orchestration process

**VERIFICATION:**
Check ${ORCH_OUTPUT_DIR} for:
- contracts/
- analysis/performance/
- synthesis/final.md