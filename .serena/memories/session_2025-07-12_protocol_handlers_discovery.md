# Protocol Handlers Discovery

## Key Discovery
While testing the new protocol-based CLAUDE.md, discovered that **handlers don't exist**. We have workflows, tools, and conventions, but no handlers to route to them.

## Handler Requirements
Identified need for 70+ handlers:
- 22 for WORKFLOWS.md (development, sessions, testing)
- 18 for TOOLS.md (search, files, git, analysis)
- 13 for CONVENTIONS.md (evidence, naming, style)
- 10 for CLAUDE.md (routing, errors, meta)
- 6+ for cross-system integration

## Handler Format
```markdown
### Handler: [name]
**Pattern**: Intent patterns to match
**Triggers**: Example phrases
**Pre-conditions**: What must be true
**Process**: Step-by-step execution
**Routes to**: Target workflow/tool
**Example**: Input → Output
```

## Work Location
`/docs/ai/work-tracking/active/20250712-checkpoint-evolution-ACTIVE/`

## Critical Insight
Protocol-based routing requires infrastructure we don't have. Need handlers first!