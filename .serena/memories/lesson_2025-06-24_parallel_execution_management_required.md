# Lesson: Parallel Execution Management Sections Required

## Discovery
Even a 60-line command failed to execute when it lacked the specific pattern from working commands.

## Working Pattern Found
Working commands like `test-orchestration.md` have this structure:

```
TASK: [Agent description]
[TASK block content]
```

**Parallel Execution Management:**
- Deploy [Agent name] using Task tool
- [Optional coordination instructions]

## Key Insight
The "Parallel Execution Management:" section header seems to be a critical signal to Claude that actual execution should happen, not just template display.

## Next Steps
1. Update test-orch-iter1.md to include these sections
2. Test again to see if this fixes execution
3. If successful, apply to all iterations