# Claude Code Bridge Documentation

## Overview
Claude Code Bridge is your Swiss Army knife for complex, multi-faceted development tasks. It excels when you need high-level reasoning, multi-file coordination, and synthesis of information from various sources.

## Quick Start
```
Using Claude Code Bridge, [TASK DESCRIPTION]:

Requirements:
- [SPECIFIC REQUIREMENT 1]
- [SPECIFIC REQUIREMENT 2]

workFolder: /absolute/path/to/project
```

## Directory Contents

### 📝 prompts/
Pre-written, tested prompts for common scenarios:
- `comprehensive-documentation.md` - Creating extensive docs with research
- `multi-file-refactoring.md` - Refactoring patterns across codebase
- `feature-implementation.md` - Building complete features from scratch

### 💡 examples/
Real-world implementations with lessons learned:
- `emergency-appeal-banner.md` - Full feature with RSC, API, tests

### 📋 guidelines/
Best practices and decision frameworks:
- `best-practices.md` - When to use vs. other tools

### 📚 reference/
Technical details and capabilities:
- `capabilities.md` - What Claude Code Bridge can and cannot do

## When Claude Code Bridge Shines ✨

### Use Claude Code Bridge When:
1. **Complex Multi-File Operations** (10+ files)
   - Feature implementation touching many components
   - Codebase-wide refactoring
   - Creating related file sets (component + test + story + docs)

2. **Research + Implementation**
   - "Research best practices for X and implement"
   - "Analyze our codebase patterns and create Y"
   - "Find modern approaches to Z and adapt for our use"

3. **Creative + Technical Tasks**
   - Documentation with code examples
   - Blog posts with implementations
   - Architecture decisions with proof of concepts

4. **Synthesis Tasks**
   - Combining multiple sources of information
   - Creating comprehensive guides
   - Building from various examples

### Use Other Tools When:
- **Simple edits** → Edit tool (faster, more precise)
- **Finding files** → Agent tool (specialized for search)
- **Running commands** → Bash tool (direct execution)
- **Quick questions** → Direct chat (no file operations needed)

## Power Tips 💪

### 1. Be Specific About Structure
```
Create these files:
- src/components/Banner/Banner.tsx - React component
- src/components/Banner/Banner.test.tsx - Jest tests
- src/components/Banner/Banner.stories.tsx - Storybook stories
```

### 2. Reference Existing Patterns
```
Follow the component pattern in:
- src/components/Card/Card.tsx
- Use our standard test setup from test-utils.ts
```

### 3. Set Clear Boundaries
```
Do NOT modify:
- Existing API contracts
- Database schemas
- Public component APIs
```

### 4. Provide Context
```
Current situation: We have hardcoded theme values
Goal: Extract to CSS variables for runtime switching
Constraint: Maintain backward compatibility
```

## Common Patterns

### Feature Implementation
1. Research requirements
2. Analyze existing code
3. Design component structure
4. Implement with types
5. Add comprehensive tests
6. Create documentation

### Refactoring Flow
1. Find all occurrences
2. Design new pattern
3. Update systematically
4. Verify no regressions
5. Clean up old code

### Documentation Creation
1. Research best practices
2. Analyze codebase
3. Structure content
4. Include examples
5. Add quick reference

## Performance Expectations
- **Simple tasks**: 5-30 seconds
- **Medium complexity**: 30-60 seconds
- **Complex operations**: 60-120 seconds

## Integration with TWES
Claude Code Bridge works best when combined with:
1. **Agent** - Find relevant files first
2. **Grep** - Identify patterns to change
3. **Read** - Understand current implementation
4. **Bash** - Validate changes with tests

## Remember
Claude Code Bridge is like having a senior developer who can:
- See the big picture
- Coordinate complex changes
- Research and implement
- Maintain consistency
- Think about edge cases

Use it for tasks that benefit from this high-level thinking!
- When you need to see each step (use native tools)
- Operations requiring precise control
- Learning/debugging (native tools are more transparent)

## Quick Start
See `prompts/quick-start.md` for common usage patterns and `examples/` for specific scenarios.