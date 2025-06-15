# Claude Code Bridge Best Practices

## When to Use Claude Code Bridge

### ✅ Ideal Use Cases

1. **Complex Multi-File Operations**
   - Creating 5+ related files
   - Refactoring across 10+ files
   - Implementing full features with tests

2. **Documentation + Implementation**
   - Writing comprehensive docs with code examples
   - Creating ADRs with implementation
   - Generating API documentation from code

3. **Research + Synthesis**
   - Analyzing current codebase patterns
   - Researching best practices and implementing
   - Creating comparison documents

4. **Creative + Technical**
   - Writing blog posts with code snippets
   - Creating interactive tutorials
   - Designing component APIs with examples

### ❌ When NOT to Use

1. **Simple Edits**
   - Changing a single line → Use Edit tool
   - Updating one file → Use Write/Edit tool
   - Quick fixes → Use native tools

2. **Exploratory Tasks**
   - "Find where X is used" → Use Agent tool
   - "Search for pattern Y" → Use Grep tool
   - "What files contain Z" → Use Agent tool

3. **Real-time Debugging**
   - Step-by-step debugging → Use native tools
   - Log analysis → Use Bash + Grep
   - Performance profiling → Use specialized tools

## Effective Prompt Structure

### 1. Clear Context
```
Using Claude Code Bridge for [SPECIFIC TASK TYPE]:
- Current situation: [WHAT EXISTS]
- Desired outcome: [WHAT YOU WANT]
- Constraints: [WHAT TO PRESERVE]
```

### 2. Specific Requirements
```
Technical requirements:
- Language/Framework: [SPECIFIC VERSIONS]
- Patterns to follow: [REFERENCE DOCS]
- Performance targets: [METRICS]
- Testing needs: [COVERAGE/TYPES]
```

### 3. Output Structure
```
Create/modify these files:
- [PATH/FILE1] - [PURPOSE]
- [PATH/FILE2] - [PURPOSE]

Follow structure from:
- [REFERENCE/PATTERN]
```

## Performance Considerations

### Token Optimization
- Be specific to avoid unnecessary exploration
- Reference existing patterns to reduce explanation
- Use clear file paths to prevent searching

### Execution Time
- Expect 30-60 seconds for complex operations
- Break very large tasks into phases
- Use native tools for quick checks first

## Integration with Other Tools

### Pre-Work with Native Tools
1. **Agent**: Find relevant files first
2. **Grep**: Identify patterns to change
3. **Read**: Understand current implementation

### Post-Work Validation
1. **Bash**: Run tests and linters
2. **Read**: Verify changes
3. **Git**: Review diff before committing

## Common Patterns

### 1. Feature Implementation Pattern
```
1. Research requirements (web search)
2. Analyze existing patterns (codebase search)
3. Create component structure
4. Implement with tests
5. Add documentation
6. Update indexes/exports
```

### 2. Refactoring Pattern
```
1. Identify all affected files
2. Create abstraction/new pattern
3. Update all usages
4. Remove old code
5. Update tests
6. Verify no regressions
```

### 3. Documentation Pattern
```
1. Research topic
2. Analyze codebase examples
3. Create structured document
4. Include code examples
5. Add diagrams/visualizations
6. Create quick reference
```

## Error Recovery

### If Claude Code Bridge Fails
1. Break task into smaller pieces
2. Use native tools for specific operations
3. Provide more specific context
4. Reference successful examples

### Common Issues
- **"File not found"** → Provide absolute paths
- **"Too complex"** → Break into phases
- **"Unclear requirements"** → Add specific examples
- **"Timeout"** → Reduce scope

## Quality Checklist

Before using Claude Code Bridge, ensure:
- [ ] Task genuinely needs multi-file coordination
- [ ] Clear success criteria defined
- [ ] Existing patterns identified for reference
- [ ] Output structure specified
- [ ] workFolder path is absolute
- [ ] Fallback plan if it fails

## Examples of Perfect Use Cases

1. **"Convert all class components to hooks"**
   - Touches many files
   - Needs consistent pattern
   - Includes test updates

2. **"Implement complete authentication flow"**
   - Multiple components
   - API routes
   - Tests and docs

3. **"Create design system documentation"**
   - Research needed
   - Code examples
   - Multiple sections

4. **"Refactor to use new API client"**
   - Update all endpoints
   - Maintain types
   - Update tests

Remember: Claude Code Bridge shines when the task requires **coordination** across multiple files and **synthesis** of information. For simple, isolated changes, stick to native tools.