# Claude Code Bridge → Agent Tool Migration Guide

## Why This Migration?

Claude Code Bridge creates separate API sessions that consume tokens even when using Claude Code Max plan. The Agent tool runs within your existing session, avoiding duplicate token usage.

## Migration Strategy

### 1. Update CLAUDE.md

Replace the MCP Integration Pattern section:

```diff
## MCP Integration Pattern
1. **TaskMaster** for planning and tracking work
2. **Context7** for latest documentation (use single topics)
-3. **Claude Code Bridge** for complex file operations
+3. **Agent Tool** for complex multi-step operations and autonomous tasks
4. **Zen** for deep thinking, code review, and multi-AI collaboration
```

### 2. Replace Usage Patterns

#### Before (Claude Code Bridge):
```typescript
mcp__claude-code-bridge__claude_code({
  prompt: "Create a comprehensive design document researching best practices",
  workFolder: "/path/to/project"
})
```

#### After (Agent Tool):
```typescript
Task({
  description: "Create design document",
  prompt: `Create a comprehensive design document at /docs/design/example.md that includes:
    1. Research current best practices for React component architecture
    2. Analyze our existing codebase patterns
    3. Synthesize findings into a structured document
    
    Use web search for current best practices and create a well-structured markdown document.`
})
```

## Common Use Cases Migration

### 1. Complex Documentation Creation

**Claude Code Bridge approach:**
- Single command with complex prompt
- Automatic file creation and research

**Agent Tool approach:**
- Detailed prompt with clear steps
- Agent handles research and file creation
- Same capabilities, no extra API usage

### 2. Multi-File Refactoring

**Claude Code Bridge approach:**
```
claude_code "Refactor all components to use new theme system"
```

**Agent Tool approach:**
```
Task "Refactor theme system" with prompt:
"Find all components using the old theme system and update them to use the new four-theme system. 
Steps:
1. Search for components importing from old theme
2. Update imports to new theme system
3. Verify TypeScript types are correct
4. Test that components still render properly"
```

### 3. Feature Implementation

**Claude Code Bridge approach:**
- One-shot complex implementation

**Agent Tool approach:**
- Break down into clear steps
- Agent executes autonomously
- Better visibility into progress

## Key Differences

| Aspect | Claude Code Bridge | Agent Tool |
|--------|-------------------|------------|
| Token Usage | Uses API key | Uses existing session |
| Execution | Separate process | Within current session |
| Visibility | Black box | Can see agent's actions |
| Control | Limited | Full control |
| Cost | Extra API tokens | No extra cost |

## Migration Checklist

- [ ] Update CLAUDE.md MCP Integration Pattern
- [ ] Update MCP Tool Usage Guidelines section
- [ ] Replace Claude Code Bridge examples with Agent examples
- [ ] Update TWES documentation references
- [ ] Create Agent tool prompt templates
- [ ] Test complex operations with Agent tool
- [ ] Remove Claude Code Bridge from MCP config

## Agent Tool Best Practices

### 1. Clear Task Decomposition
Break complex tasks into clear steps in your prompt:
```
1. Research phase - gather information
2. Analysis phase - understand patterns
3. Implementation phase - make changes
4. Verification phase - test results
```

### 2. Specific File Paths
Always provide absolute paths when the agent needs to create/modify files.

### 3. Include Success Criteria
Tell the agent how to verify the task is complete.

### 4. Use for Appropriate Tasks
- ✅ Multi-step operations
- ✅ Research and synthesis
- ✅ Pattern finding across codebase
- ✅ Complex refactoring
- ❌ Simple single-file edits (use Edit tool)
- ❌ Quick searches (use Grep/Glob)

## Example Agent Prompts

### Comprehensive Feature Implementation
```
Implement a new blog post component with the following requirements:
1. Search for existing post components to understand patterns
2. Create new component following our forwardRef pattern
3. Include proper TypeScript types
4. Add Storybook stories
5. Update component registry
6. Verify 44px touch targets
Success: Component renders in Storybook with all themes
```

### Codebase Analysis and Documentation
```
Analyze our authentication implementation and create documentation:
1. Find all auth-related files and functions
2. Map out the authentication flow
3. Identify any security concerns
4. Create a comprehensive auth guide at /docs/architecture/authentication.md
Include diagrams using mermaid syntax where helpful
```

### Performance Optimization
```
Optimize bundle size for the main application:
1. Analyze current bundle composition
2. Identify large dependencies
3. Implement code splitting for heavy components
4. Add dynamic imports where appropriate
5. Measure bundle size before and after
Target: Reduce initial JS bundle to under 100KB
```

## Transition Period

During transition:
1. Both tools remain available
2. Prefer Agent tool for new work
3. Document any limitations found
4. Share feedback for improvement

## Next Steps

1. Update your workflow to use Agent tool
2. Remove `ANTHROPIC_API_KEY` from environment when comfortable
3. Eventually remove Claude Code Bridge from MCP config