# Lesson: Commands Must Explicitly State "using Task tool"

## Critical Discovery
Commands that should execute agents but only display templates are missing the explicit "using Task tool" instruction.

## Working Pattern Examples
- `infinite.md`: "Launch all assigned Sub Agents simultaneously using Task tool"
- `infinite-documentation.md`: "Deploy orchestrator first using Task tool"
- `test-orchestration.md`: "Deploy Master using Task tool"

## Failed Pattern
The "disguised prompt" transformation that removed all mentions of "Deploy X using Task tool" made the command non-executable.

## Required Fix
After each TASK block or group of TASK blocks, add:
```
**Parallel Execution Management:**
- Deploy [agent name] using Task tool
- Launch all [N] agents simultaneously using Task tool
- Execute [phase] agents via Task tool
```

## Key Insight
Claude needs explicit instruction to use the Task tool - it's not implicit from the TASK blocks alone.