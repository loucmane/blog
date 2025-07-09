**TEST ORCHESTRATION COMMAND**

Test minimal orchestration with worktrees and sub-agents.

**Variables:**
test_id: $ARGUMENTS

**ARGUMENTS PARSING:**
Parse test_id from "$ARGUMENTS" (default: "test")

**PHASE 1: SETUP**
Create test output directory at `/tmp/test-orchestration-${test_id}/`

**PHASE 2: WORKTREE CREATION**
Create two test worktrees:
- `.worktrees/test-${test_id}-1/`
- `.worktrees/test-${test_id}-2/`

**PHASE 3: DEPLOY MASTER**

```
TASK: Orchestrate hello world test ${test_id}

You are the Test Master Orchestrator.

CONTEXT:
- Test ID: ${test_id}
- Output dir: /tmp/test-orchestration-${test_id}/
- Purpose: Test if orchestration pattern works

REQUIREMENTS:
1. Create file: /tmp/test-orchestration-${test_id}/master.txt
2. Write: "Master deployed at [timestamp]"
3. Prepare to coordinate 2 sub-agents

DELIVERABLE: Master coordination file
```

**Parallel Execution Management:**
- Deploy Master using Task tool
- Wait for completion before sub-agents

**PHASE 4: DEPLOY SUB-AGENTS**

```
TASK: Sub-agent 1 for test ${test_id}

You are Sub-Agent 1.

CONTEXT:
- Test ID: ${test_id}
- Worktree: .worktrees/test-${test_id}-1/
- Output: /tmp/test-orchestration-${test_id}/

REQUIREMENTS:
1. Create file: /tmp/test-orchestration-${test_id}/agent1.txt
2. Write: "Hello World from Agent 1 at [timestamp]"
3. Also create: .worktrees/test-${test_id}-1/hello1.txt

DELIVERABLE: Test files proving execution
```

```
TASK: Sub-agent 2 for test ${test_id}

You are Sub-Agent 2.

CONTEXT:
- Test ID: ${test_id}
- Worktree: .worktrees/test-${test_id}-2/
- Output: /tmp/test-orchestration-${test_id}/

REQUIREMENTS:
1. Create file: /tmp/test-orchestration-${test_id}/agent2.txt
2. Write: "Hello World from Agent 2 at [timestamp]"
3. Also create: .worktrees/test-${test_id}-2/hello2.txt

DELIVERABLE: Test files proving execution
```

**Parallel Execution Management:**
- Deploy both sub-agents simultaneously using Task tool
- Monitor both completions

**PHASE 5: SYNTHESIS**

```
TASK: Synthesize test results for ${test_id}

You are the Synthesis Agent.

CONTEXT:
- Test ID: ${test_id}
- Input files: /tmp/test-orchestration-${test_id}/*.txt
- Purpose: Combine all outputs

REQUIREMENTS:
1. Read all files in /tmp/test-orchestration-${test_id}/
2. Create synthesis file: /tmp/test-orchestration-${test_id}/synthesis.txt
3. Write summary of all agent outputs

DELIVERABLE: Synthesis file with combined results
```

**Parallel Execution Management:**
- Deploy Synthesis Agent using Task tool
- This completes the test

**VERIFICATION:**
Check for these files to verify execution:
- `/tmp/test-orchestration-${test_id}/master.txt`
- `/tmp/test-orchestration-${test_id}/agent1.txt`
- `/tmp/test-orchestration-${test_id}/agent2.txt`
- `/tmp/test-orchestration-${test_id}/synthesis.txt`
- `.worktrees/test-${test_id}-1/hello1.txt`
- `.worktrees/test-${test_id}-2/hello2.txt`