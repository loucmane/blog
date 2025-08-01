# Handler Format Specification

## Required YAML Frontmatter

Every handler MUST have this exact frontmatter structure:

```yaml
---
id: handler-name           # kebab-case, must match filename
name: Human Readable Name  # Title case description
role: trigger|orchestrator|operator
domain: [development, git, search, file, testing, documentation]
stability: stable|experimental|deprecated
triggers:                  # Array of trigger phrases
  - "exact phrase 1"
  - "pattern phrase X"
dependencies: []           # Currently unused, may be removed
tools:                     # Required tools list
  - Serena
  - Edit
  - Bash
version: 1.0.0            # Semantic versioning
---
```

## Field Specifications

### id (required)
- Format: kebab-case (lowercase with hyphens)
- Must match the filename exactly
- Example: `create-component`, `fix-bug`

### name (required)
- Human-readable title
- Use title case
- Example: "Create React Component", "Fix Code Bug"

### role (required)
- Must be one of: `trigger`, `orchestrator`, `operator`
- Determines folder placement:
  - trigger → handlers/triggers/[domain]/
  - orchestrator → handlers/orchestrators/
  - operator → handlers/operators/[domain]/

### domain (required)
- Can be single string or array for cross-domain handlers
- Valid domains: development, git, search, file, testing, documentation, analysis, external
- Example: `domain: git` or `domain: [development, testing]`

### stability (required)
- Must be one of: `stable`, `experimental`, `deprecated`
- Guides usage and migration decisions

### triggers (required for trigger role)
- Array of exact phrases users might say
- Include variations and common patterns
- Example:
  ```yaml
  triggers:
    - "create component"
    - "make a new component"
    - "build component X"
  ```

### dependencies (optional)
- Currently all handlers have empty array
- May be used for handler-to-handler dependencies
- Consider removing if not used

### tools (required)
- List of MCP tools required by handler
- Common tools: Serena, Edit, MultiEdit, Write, Grep, Bash, TodoWrite
- Order doesn't matter

### version (recommended)
- Semantic versioning: MAJOR.MINOR.PATCH
- Start at 1.0.0 for migrated handlers
- Will be important for version-controller agent

## Handler Body Structure

After frontmatter, handler should follow this structure:

```markdown
# Handler Name

**Purpose**: Brief description of what this handler does

## Target Pattern
What triggers this handler (already in frontmatter but can elaborate)

## Pre-conditions
- What must be true before handler executes
- Required context or state

## Process
1. First step with specific tool usage
2. Second step with tool
3. Continue until complete

## Success Criteria
- What indicates successful completion
- Expected outcomes

## Failure Modes
- Common failures and how to handle
- Error recovery steps

## Examples
```
Input: "create component Button"
Process: [what happens]
Output: [expected result]
```

## Tool Usage
**PRIMARY**: Main tool for this operation
**FALLBACK**: Alternative if primary fails
**NEVER**: Tools to avoid for this operation
```

## Migration Notes

When migrating from monolithic files:
1. Extract complete handler content
2. Add YAML frontmatter based on handler analysis
3. Preserve all original content
4. Ensure triggers match REGISTRY.md entries
5. Verify tool list is complete
6. Set appropriate domain based on handler purpose