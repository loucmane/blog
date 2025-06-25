# Lesson: Working Commands Use External Spec Files

## Critical Discovery
Working orchestration commands rely on external spec files, not inline prompts.

## Pattern Analysis
- `infinite.md`: Reads spec from `spec_file` argument
- `infinite-documentation.md`: Reads from `/docs/ai/for-agentic-loops/evolution-specs/`
- `orchestrate-and-test.md`: Has 898 lines with everything inline (doesn't work)

## Working Pattern
1. Command file stays short (100-200 lines)
2. Command reads external spec files
3. Command passes spec content to agents
4. Agents reference the spec, not inline instructions

## Why This Matters
- Commands with everything inline are treated as documentation
- External specs create proper separation of concerns
- Keeps command files focused on orchestration logic
- Allows Claude to recognize it as an executable command

## Fix Required
Extract all agent prompts to external spec files and reference them in the command.