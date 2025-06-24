# Agent Tool Best Practices

## When to Use Agent Tool

### Perfect For:
- **Multi-step research**: "Find all performance bottlenecks and suggest solutions"
- **Complex document creation**: "Create comprehensive architecture documentation"
- **Pattern discovery**: "Analyze codebase and find common patterns"
- **Implementation planning**: "Design a solution for X considering Y and Z"
- **Cross-file analysis**: "How does authentication work across the system?"

### Not Ideal For:
- Simple file reads (use Read tool)
- Known file edits (use Edit tool)
- Quick searches (use Grep/Glob)
- When you need step-by-step control

## Effective Agent Prompts

### Structure:
1. **Clear objective**: What should the agent accomplish?
2. **Context**: What files/areas are relevant?
3. **Constraints**: Any limitations or requirements?
4. **Deliverables**: What specific output is needed?
5. **Verification**: How to validate success?

### Example Templates:

```
TASK: Analyze Performance Bottlenecks

Objective: Find and document all performance issues in the web package.

Context: Focus on:
- React component rendering
- Bundle size issues  
- Data fetching patterns
- Memory leaks

Deliverables:
1. List of identified issues with severity
2. Root cause analysis for each
3. Specific recommendations with code examples
4. Priority order for fixes

Verification: Ensure each issue has evidence and actionable fix.
```

## Integration with Other Tools

### Before Agent:
- Use Serena to understand code structure
- Use TaskMaster to plan the work
- Gather context with Read/Grep

### After Agent:
- Verify findings with Grep
- Implement solutions with Edit
- Get second opinion with Multi-AI
- Review with Zen codereview

## Common Patterns

### Research Pattern:
1. Agent explores and documents findings
2. Human reviews and decides approach
3. Agent implements solution
4. Human verifies and refines

### Documentation Pattern:
1. Agent analyzes codebase
2. Creates comprehensive docs
3. Human reviews for accuracy
4. Agent updates based on feedback

### Refactoring Pattern:
1. Agent identifies refactoring opportunities
2. Creates detailed plan
3. Human approves approach
4. Step-by-step implementation

## Tips for Success
- Give agents breathing room - don't over-constrain
- Provide clear success criteria
- Include example of desired output format
- Reference specific files when known
- Ask for verification steps in output