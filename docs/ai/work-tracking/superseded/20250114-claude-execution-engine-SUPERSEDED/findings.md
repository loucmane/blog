# Discoveries & Findings

## 2025-07-14 17:50 CEST - Template Structure Discovery

### We Have 7 Template Files:
1. **HANDLERS.md** - Registry of all handlers (start-new-work, fix-problem, etc.)
2. **PATTERNS.md** - Execution patterns (work-activity, file-operation, evidence-check)
3. **WORKFLOWS.md** - Complete workflows (session-start, specialist-deployment)
4. **CONVENTIONS.md** - Standards and rules (git, naming, evidence)
5. **TOOLS.md** - Tool selection matrix
6. **BUILDING-BETTER.md** - Meta improvements
7. **PROJECT-BLOG.md** - Project-specific context

### Key Insight: Natural Search Behavior
Instead of forced execution, CLAUDE.md should trigger natural curiosity:
- "Is there a handler for this?" → Search HANDLERS.md
- "What pattern applies?" → Search PATTERNS.md
- "What workflow to follow?" → Search WORKFLOWS.md
- "What conventions?" → Search CONVENTIONS.md
- "Which tool?" → Search TOOLS.md

### The Magic Formula:
Make me WANT to search templates because they have answers I need, not because I'm commanded to.

## Key Discovery: Command Execution Pattern
From memory `session_2025-06-24_orchestrate_test_disguised_prompt_discovery`:
- Working commands are "thinking exercises with example prompts"
- TASK blocks must be in anonymous triple backticks
- Use JavaScript template literal syntax: ${var}
- Transform perspective from deployment to agent

## Critical Constraint
From analyzing the situation:
- Commands work because they're explicitly called
- CLAUDE.md needs to run automatically on EVERY request
- There's no mechanism to force preprocessing before responses
- This is fundamentally different from command execution

## Successful Pattern Elements
From orchestrate-and-test.md:
1. Opens with "Think deeply about this..."
2. Has TASK blocks that look like prompts to complete
3. Uses ${var} interpolation throughout
4. Written from agent perspective
5. Contains explicit "using Task tool" instructions

## The Challenge
CLAUDE.md is written as instructions/documentation, not as something that triggers execution. Need to transform it into a "thinking exercise" pattern.