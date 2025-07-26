# Handler Documentation Format Standard

## Purpose
This document defines the standard format for documenting handlers in the Claude Template System. All handlers MUST follow this format to ensure consistency, discoverability, and proper ULTRATHINK integration.

## Required Handler Structure

Every handler MUST include these 8 sections in this exact order:

```markdown
#### Handler: handler-name {#handler-name}
**Triggers**: Comma-separated list of exact phrases that activate this handler
**Target Pattern**: What the handler extracts or acts upon from user input
**Pre-conditions**: 
- Bulleted list of conditions that must be true
- Before this handler can execute successfully
**Process**:
1. Numbered steps the handler follows
2. Each step should be clear and actionable
3. Include specific tools or templates used
4. Show routing logic if applicable
5. End with concrete outcome
**Success**: What happens when handler completes successfully
**Failure**: What happens when handler cannot complete
**Examples**:
- Input phrase → Expected outcome
- Another example → Another outcome
```

## Section Specifications

### 1. Handler Name Line
```markdown
#### Handler: handler-name {#handler-name}
```
- Use kebab-case for handler names
- Include anchor tag for cross-referencing
- Handler name should be descriptive but concise

### 2. Triggers
```markdown
**Triggers**: "exact phrase 1", "exact phrase 2", "pattern with X variable"
```
- List actual phrases users might say
- Use quotes around each trigger
- Include variable patterns with X, Y, Z placeholders
- Order from most common to least common

### 3. Target Pattern
```markdown
**Target Pattern**: What gets extracted or identified from input
```
- Describe what the handler looks for in the user's request
- Example: "Feature name after 'work on'" 
- Example: "Bug description and location"
- Keep to one line

### 4. Pre-conditions
```markdown
**Pre-conditions**: 
- First condition that must be met
- Second condition that must be met
```
- Use bullet points
- Each condition should be verifiable
- Include both technical and contextual requirements
- Use "None" if truly no pre-conditions

### 5. Process
```markdown
**Process**:
1. First concrete step
2. Second step with tool usage
3. Conditional routing:
   ```yaml
   IF condition: Route to handler-a
   ELSE: Route to handler-b
   ```
4. Continue with remaining steps
5. Final outcome
```
- Use numbered list
- Be specific about tools used
- Include routing logic where applicable
- Show example structures for complex steps
- Keep steps actionable

### 6. Success
```markdown
**Success**: Single line describing successful completion
```
- One line only
- Focus on user-visible outcome
- Be specific about what was achieved

### 7. Failure
```markdown
**Failure**: Single line describing failure mode and recovery
```
- One line only
- Include what user should do next
- Don't just say "Handler fails"

### 8. Examples
```markdown
**Examples**:
- "user input" → Resulting action/outcome
- "another input" → Another result
```
- Use bullet points
- Show actual user phrases
- Use arrow (→) to show outcome
- Include 2-3 diverse examples

## Best Practices

### DO:
- ✅ Keep triggers realistic - what users actually say
- ✅ Make process steps concrete and actionable
- ✅ Include tool names when tools are used
- ✅ Show routing to templates/other handlers
- ✅ Make examples diverse to show handler range
- ✅ Use consistent formatting throughout

### DON'T:
- ❌ Make triggers too abstract or technical
- ❌ Write vague process steps like "analyze the code"
- ❌ Skip pre-conditions - use "None" if none exist
- ❌ Write multi-line success/failure descriptions
- ❌ Use different formatting styles

## Example: Well-Formatted Handler

```markdown
#### Handler: fix-bug {#fix-bug}
**Triggers**: "fix bug X", "fix the Y bug", "resolve issue with Z", "bug in X"
**Target Pattern**: Bug description and location
**Pre-conditions**: 
- Bug identified or reported
- Can reproduce or understand issue
**Process**:
1. Understand the bug clearly
2. Route to bug-fix-template:
   ```yaml
   STATE: "I need to fix: [bug description]"
   USE: Load WORKFLOWS.md#bug-fix-template
   FOLLOW: Locked step progression
   ```
3. Cannot skip bug reproduction step
4. Must gather evidence before theorizing
**Success**: Bug fixed with evidence
**Failure**: Skipped template steps
**Examples**:
- "fix bug in login" → Load bug-fix-template
- "resolve issue with nav" → Bug fix workflow
- "login is broken" → Systematic debugging
```

## Handler Categories

Handlers should be grouped into logical categories:

1. **Development Handlers** - Creating, building, implementing
2. **Task Management Handlers** - Todos, planning, tracking
3. **Search & Navigation Handlers** - Finding code, patterns
4. **Problem Solving Handlers** - Bugs, debugging, issues
5. **Testing Handlers** - Test creation, validation
6. **Documentation Handlers** - Explaining, documenting
7. **Git Operations Handlers** - Commits, branches, PRs
8. **Session Management Handlers** - Start, checkpoint, end
9. **Work Tracking Handlers** - Folders, progress, decisions
10. **Specialist Deployment Handlers** - AI agents, orchestration

## Integration with REGISTRY.md

Each handler in REGISTRY.md should reference its full definition:

```markdown
#### Handler: `handler-name` {#handler-name}
- **Triggers**: Brief list of main triggers
- **Keywords**: [searchable, terms, for, discovery]
- **Process**: One-line summary
- **Location**: FILENAME.md#handler-name
- **Template**: If routes to template, note here
```

## Validation Checklist

Before adding a new handler, verify:

- [ ] All 8 sections are present
- [ ] Triggers are realistic user phrases
- [ ] Process steps are numbered and specific
- [ ] Success/Failure are single lines
- [ ] Examples use real-world phrases
- [ ] Handler name matches anchor tag
- [ ] Pre-conditions are verifiable
- [ ] Formatting matches this standard exactly

## Conclusion

This standard ensures handlers are:
1. **Discoverable** - Via triggers and keywords
2. **Understandable** - Clear structure and examples
3. **Implementable** - Concrete process steps
4. **Consistent** - Same format everywhere

Following this standard makes the ULTRATHINK format work effectively and helps users understand what handlers can do.