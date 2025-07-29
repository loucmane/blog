# Agent Technical Specification

## Agent Configuration Format

All agents follow a consistent YAML frontmatter + markdown structure:

```yaml
---
name: agent-name
description: Use proactively for [purpose]. Specialist for [specialization].
tools: Tool1, Tool2, Tool3
color: ColorName
---

# Purpose

[Detailed purpose statement]

## Project Context

- **Work Tracking**: `docs/ai/work-tracking/active/`
- **Session Management**: `SESSION.md` (at project root)
- **Templates Directory**: `.claude/templates/`
- **Output Directory**: `.claude/agent-outputs/[agent-name]/`

## Instructions

[Numbered steps the agent must follow]

## Report / Response

[Expected output format]
```

## Required Components

### 1. YAML Frontmatter
- **name**: Kebab-case identifier (e.g., `template-migrator`)
- **description**: Clear purpose with "Use proactively" if applicable
- **tools**: Comma-separated list of allowed tools
- **color**: Visual identifier (Red, Green, Blue, etc.)

### 2. Purpose Section
Clear statement of what the agent does and why it exists.

### 3. Project Context
Must include relative paths (not absolute):
- Work tracking location
- Session file location
- Relevant directories
- Output directory

### 4. Instructions
Numbered, sequential steps the agent follows:
1. Initial analysis/setup
2. Core processing steps
3. Validation/verification
4. Output generation

### 5. Report Format
Clear specification of output structure and location.

## Tool Allocation Guidelines

### Read-Only Agents
```yaml
tools: Read, Grep, Glob
```
Examples: claude-md-specialist, swhe-enforcer

### Creation Agents
```yaml
tools: Read, Write, MultiEdit, Grep, Glob
```
Examples: handler-creator, template-documenter

### Analysis Agents
```yaml
tools: Read, Grep, Glob, Bash
```
Examples: performance-analyzer, template-debugger

### Migration/Modification Agents
```yaml
tools: Read, Grep, Glob, Write, MultiEdit
```
Examples: template-migrator, template-optimizer

## Color Convention

Established color meanings:
- **Red**: Validation/Enforcement/Debugging
- **Green**: Creation/Building/Testing
- **Blue**: Routing/Documentation
- **Yellow**: Validation/Performance
- **Purple**: Orchestration/Patterns
- **Orange**: Execution
- **Cyan**: Optimization
- **Magenta**: Analysis
- **Pink**: Creation
- **Indigo**: Coordination

## Output Directory Structure

Each agent must specify its output location:
```
.claude/agent-outputs/
└── [agent-name]/
    ├── reports/
    ├── logs/
    └── [specific-outputs]/
```

## Best Practices for Agent Creation

### 1. Single Responsibility
Each agent should do one thing well.

### 2. Clear Triggers
Define when the agent should be used:
- Explicit triggers (user commands)
- Implicit triggers (conditions)
- Proactive triggers (automatic)

### 3. Error Handling
Include error detection and reporting:
```markdown
**Error Handling:**
- If X fails, report specific error
- Continue/stop based on severity
- Log all errors to output directory
```

### 4. Validation Steps
Include self-validation:
```markdown
7. **Validate Results**
   - Check all outputs created
   - Verify no broken references
   - Confirm success criteria met
```

### 5. Progress Reporting
For long-running agents:
```markdown
- Report progress at key milestones
- Save intermediate results
- Allow resumption if interrupted
```

## Agent Communication

Since agents cannot spawn other agents:

### Input Handling
```markdown
**Expected Inputs:**
- From user: Natural language request
- From Claude: Specific file paths or data
- From previous agent: Output file location
```

### Output Format
```markdown
**Output Structure:**
- Summary: Brief results overview
- Details: Full findings/changes
- Next Steps: Recommendations
- File Locations: Where outputs saved
```

## Testing Agent Configurations

### Validation Checklist
- [ ] YAML frontmatter valid
- [ ] All required sections present
- [ ] Tools appropriate for purpose
- [ ] Project Context uses relative paths
- [ ] Output directory specified
- [ ] Instructions clear and numbered
- [ ] Report format defined

### Common Issues
1. **Absolute paths**: Always use relative paths
2. **Missing tools**: Ensure all needed tools listed
3. **No output spec**: Must specify where files saved
4. **Vague instructions**: Steps must be specific
5. **No error handling**: Include failure scenarios

## Creating New Agents

### Using meta-agent
```
Task(
    description="Create new agent",
    prompt="[Detailed agent specification]",
    subagent_type="meta-agent"
)
```

### Manual Creation
1. Copy this template
2. Modify all sections
3. Save to `.claude/agents/[agent-name].md`
4. Restart Claude Code
5. Test agent functionality

## Agent Lifecycle

### Creation
1. Identify need/gap
2. Design agent purpose
3. Allocate appropriate tools
4. Create configuration
5. Test functionality

### Maintenance
1. Monitor agent outputs
2. Gather error reports
3. Update instructions
4. Refine tool allocation
5. Improve error handling

### Deprecation
1. Document replacement
2. Update workflows
3. Archive configuration
4. Remove from registry

## Integration with Template System

Agents interact with:
- **CLAUDE.md**: Execution engine
- **REGISTRY.md**: Handler index
- **Templates**: Handler definitions
- **Work Tracking**: Session context
- **Agent Outputs**: Results storage

## Performance Considerations

### Resource Limits
- No built-in timeouts (add if needed)
- No file size limits (consider adding)
- No operation counters (track if needed)

### Optimization
- Minimize file reads
- Batch operations
- Cache results where appropriate
- Report progress on long operations

## Security Considerations

### Tool Restrictions
- Read-only agents cannot modify
- No system command execution
- File operations limited to project

### Validation
- Input sanitization
- Path traversal prevention
- Output validation

## Future Enhancements

### Needed Features
1. Agent result caching
2. Progress tracking API
3. Error recovery protocols
4. Performance metrics
5. Agent health monitoring

### Architectural Improvements
1. Event-based triggers
2. Shared context store
3. Agent versioning
4. Rollback capabilities
5. A/B testing framework