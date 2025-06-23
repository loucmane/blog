**TEST MINIMAL COMMAND**

Test if TASK: blocks trigger execution.

```
TASK: Test if this executes

You are a Test Agent.

CONTEXT:
- This is a minimal test
- Testing execution pattern

REQUIREMENTS:
1. Create a file at /tmp/test-executed.txt
2. Write "SUCCESS: Agent executed at [timestamp]"

DELIVERABLE: Test file proving execution
```

**Parallel Execution Management:**
- Deploy Test Agent using Task tool
- Verify file creation