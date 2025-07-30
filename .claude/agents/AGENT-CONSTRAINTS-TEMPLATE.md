# Agent Constraints Template

Use this template when creating or updating agents to ensure they have proper constraints defined.

## Constraints

**CRITICAL: You must operate within these constraints:**

### Scope Constraints
- **Read from**: [List allowed read directories/files]
- **Write to**: [List allowed write directories/files]
- **Never access**: [List forbidden directories/files]

### Safety Constraints
- **Never modify**: [List files/directories that must remain untouched]
- **Always backup**: [List what needs backing up before changes]
- **Validation required**: [List what must be validated before proceeding]
- **Rollback capability**: [Describe how to undo changes if needed]

### Output Constraints
- **Output directory**: [Specify exact output location]
- **File naming**: [Define naming conventions with examples]
- **Required formats**: [List required output formats (JSON, MD, etc.)]
- **Report structure**: [Define required sections in reports]

### Operational Constraints
- **Performance limits**: [Max files to process, timeouts, etc.]
- **Error handling**: [How to handle various error conditions]
- **Progress reporting**: [When and how to report progress]
- **Resource usage**: [Memory, disk space considerations]

### Integration Constraints
- **Dependencies**: [Other agents or tools required]
- **Input requirements**: [What must be provided to function]
- **Output contracts**: [What other agents expect from outputs]
- **Sequencing rules**: [Order of operations with other agents]

### Communication Constraints
- **Status updates**: [When and how to provide updates]
- **Error reporting**: [Format and urgency of error reports]
- **Completion message**: [Exact format of completion notification]
- **Human approval**: [What requires explicit human approval]

## Example Constraint Sections

### For Read-Only Analysis Agents
```markdown
### Scope Constraints
- **Read from**: Only `.claude/templates/` directory
- **Write to**: Only `.claude/agent-outputs/[agent-name]/`
- **Never modify**: Any source files (read-only operation)
```

### For Migration/Transformation Agents
```markdown
### Safety Constraints
- **Never modify**: Original source files
- **Always work in**: Staging directory only
- **Require approval**: Before moving to production
- **Create backups**: Before any destructive operation
```

### For Validation Agents
```markdown
### Validation Constraints
- **Must check**: Syntax, references, completeness
- **Report format**: Pass/Fail with specific issues
- **Severity levels**: Critical, Warning, Info
- **Block on**: Critical issues only
```

## Notes

1. Constraints should be:
   - **Specific** - No ambiguity about what's allowed
   - **Enforceable** - Can be checked programmatically
   - **Reasonable** - Don't overly restrict necessary operations
   - **Complete** - Cover all important safety aspects

2. Review constraints when:
   - Agent scope changes
   - New integration points added
   - Incidents occur
   - System architecture evolves

3. Constraints are promises to users about agent behavior - they build trust!