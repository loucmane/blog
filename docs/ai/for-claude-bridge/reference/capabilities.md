# Claude Code Bridge Capabilities Reference

## Core Capabilities

### 1. File Operations
- **Create**: Multiple files with complex content
- **Read**: Analyze existing code patterns
- **Edit**: Coordinated changes across files
- **Delete**: Remove deprecated code safely
- **Move**: Reorganize with import updates

### 2. Code Analysis
- **Pattern Recognition**: Find and replicate patterns
- **Dependency Analysis**: Understand relationships
- **Impact Assessment**: Predict change effects
- **Code Quality**: Apply best practices

### 3. Content Generation
- **Documentation**: Technical and user-facing
- **Code**: Full implementations with types
- **Tests**: Unit, integration, and e2e
- **Examples**: Realistic usage scenarios

### 4. Web Integration
- **Research**: Current best practices
- **API Docs**: Fetch and synthesize
- **Security**: Latest vulnerability info
- **Trends**: Modern patterns and tools

## Technical Capabilities

### Language Support
- **Full Support**: TypeScript, JavaScript, Python, Go, Rust
- **Good Support**: Java, C#, Ruby, PHP
- **Basic Support**: Most other languages

### Framework Expertise
- **React/Next.js**: Deep understanding
- **Node.js**: Backend patterns
- **Testing**: Jest, Vitest, Playwright
- **Build Tools**: Webpack, Vite, Rollup

### Task Complexity

#### Simple Tasks (5-30 seconds)
- Create a component with tests
- Update imports across files
- Generate documentation

#### Medium Tasks (30-60 seconds)
- Implement full features
- Refactor patterns codebase-wide
- Create comprehensive guides

#### Complex Tasks (60+ seconds)
- Architecture redesign
- Multi-package updates
- Full system implementation

## Integration Points

### Input Sources
1. **Codebase**: Existing patterns and styles
2. **Documentation**: Reference guides
3. **Web**: Best practices and examples
4. **Context**: Previous decisions and constraints

### Output Formats
1. **Code Files**: Any language/framework
2. **Documentation**: Markdown, JSDoc, etc.
3. **Configuration**: JSON, YAML, TOML
4. **Scripts**: Bash, Python, Node.js

## Advanced Features

### 1. Context Awareness
- Maintains project understanding
- Follows established patterns
- Respects constraints
- Preserves functionality

### 2. Intelligent Defaults
- Infers structure from context
- Applies appropriate patterns
- Includes necessary imports
- Handles edge cases

### 3. Error Prevention
- Validates syntax
- Checks imports
- Ensures type safety
- Prevents common mistakes

### 4. Optimization
- Performance considerations
- Bundle size awareness
- Accessibility compliance
- Security best practices

## Limitations

### Cannot Do
1. **Execute Code**: Can't run or test
2. **Direct Git**: No commits or pushes
3. **System Changes**: No OS modifications
4. **Real-time**: No live updates

### Constraints
1. **Context Window**: Large but finite
2. **Execution Time**: 2-minute timeout
3. **File Size**: Reasonable limits
4. **Complexity**: May need breaking down

## Performance Characteristics

### Speed Factors
1. **Task Clarity**: Specific = Faster
2. **Context**: Less searching = Faster
3. **Scope**: Focused = Faster
4. **References**: Patterns = Faster

### Optimization Tips
1. Provide absolute paths
2. Reference existing examples
3. Define clear boundaries
4. Specify output structure

## Error Handling

### Common Errors
1. **Path Issues**: Use absolute paths
2. **Scope Creep**: Define boundaries
3. **Ambiguity**: Provide examples
4. **Timeout**: Reduce complexity

### Recovery Strategies
1. Break into smaller tasks
2. Provide more context
3. Use native tools first
4. Reference working examples

## Best Use Patterns

### 1. Research → Implement
```
1. Research best practices
2. Analyze codebase
3. Design solution
4. Implement with tests
5. Document decisions
```

### 2. Analyze → Refactor
```
1. Find all instances
2. Design new pattern
3. Update systematically
4. Verify completeness
5. Clean up old code
```

### 3. Design → Build
```
1. Define requirements
2. Create architecture
3. Build components
4. Add tests
5. Write documentation
```

Remember: Claude Code Bridge excels at **complex, multi-faceted tasks** that benefit from high-level reasoning and coordination.