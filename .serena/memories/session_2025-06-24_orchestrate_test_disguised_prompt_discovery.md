# Session Memory: Orchestrate-Test "Disguised Prompt" Pattern Discovery

## Date: 2025-06-24
**Duration**: 12:23 - 14:31 CEST (ongoing)
**Key Discovery**: Working commands are "thinking exercises with example prompts", not technical specifications

## The Problem
The `/orchestrate-and-test` command only displayed its template instead of executing, despite having TASK: blocks with triple backticks (which we thought was the fix from yesterday's session).

## Investigation Method
Deployed two subagents to independently analyze:
- Working commands: `infinite.md`, `infinite-documentation.md`
- Non-working command: `orchestrate-and-test.md`
- Related spec files for context

## Critical Discovery: The "Disguised Prompt" Pattern

### Subagent 1 Findings
Working commands are **thinking prompts**, not deployment specifications:
- Open with task-focused thinking: "Think deeply about this [task]"
- Use minimal variables: `var: $ARGUMENTS`
- TASK blocks written from agent perspective
- Conversational, narrative flow

### Subagent 2 Findings
Working commands are **disguised prompts that create an illusion of examples**:
- TASK blocks must be in anonymous triple backticks (no language identifier)
- Use JavaScript template literal syntax: `${var}`
- The 80/20 rule: 80% of fix = removing deployment language

## Our Previous Understanding Was Wrong
Yesterday we thought:
- Remove code fences around TASK: blocks
- Convert ${var} to [VAR] format
- Make language more direct

**This was only partially correct!**

## The Correct Pattern
1. **KEEP anonymous triple backticks** - makes TASK blocks look like examples
2. **KEEP ${var} syntax** - working commands use JavaScript style
3. **Transform perspective** - from deployment ("Deploy X") to agent ("You are X")
4. **Narrative structure** - thinking exercise, not technical manual

## Key Insight
Working commands trick Claude into thinking it's completing example prompts within a thinking exercise. They're not command definitions - they're elaborate setups that naturally lead to execution.

## Example Transformation
```
FROM (Technical/Deployment):
Deploy a Pre-Analysis Agent using the Task tool.
```
TASK: Generate contracts...
```

TO (Thinking/Example):
```
TASK: Generate implementation contracts for Task ${task_id}

You are the Pre-Analysis Agent...
```
```

## Documents Created
1. `/docs/ai/for-agentic-loops/command-structure-analysis.md` - First subagent analysis
2. `/tmp/command-pattern-analysis-1.md` - Detailed pattern comparison
3. `/tmp/command-execution-analysis-2.md` - Execution trigger analysis
4. `/docs/ai/for-agentic-loops/orchestration-improvements/subagent-analysis-synthesis.md` - Combined findings
5. Updated implementation plan with new understanding
6. Revised conversion tracker

## Next Steps
Convert `orchestrate-and-test.md` following the "disguised prompt" pattern:
1. Transform opening to focus on task, not process
2. Keep anonymous ``` around TASK blocks
3. Keep ${var} syntax throughout
4. Remove ALL "Deploy using Task tool" language
5. Write each TASK from agent's perspective

## Why This Matters
This discovery explains why yesterday's "fix" didn't work. We were treating symptoms (code fences) instead of the root cause (narrative structure). The command must read like Claude is thinking about a problem and naturally encountering example prompts to complete.