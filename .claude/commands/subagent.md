**SUBAGENT - Complex Multi-Step Operations**

Execute complex multi-step operations using the native Agent tool for autonomous task completion.

**Variables:**
- prompt: $ARGUMENTS (required - the task description)
- files: $ARGUMENTS (optional - comma-separated list of files to include as context)
- research: $ARGUMENTS (optional - whether to use web search, default: false)

**Usage Examples:**
```
/subagent Create a comprehensive design document for authentication system
/subagent Refactor all theme imports to use the new four-theme system files=packages/web/src
/subagent Research and implement modern performance optimization techniques research=true
```

**IMPORTANT: When this command is invoked, use the Task tool to deploy an agent**

## Execution Steps:

### STEP 1: Parse Arguments
Extract the prompt and optional parameters from $ARGUMENTS.

### STEP 2: Prepare Context
If files are specified, read them to provide context to the agent.

### STEP 3: Deploy Agent
Use the Task tool with a detailed prompt that includes:
1. The user's request
2. Project context from CLAUDE.md
3. Any specified files
4. Clear success criteria

### STEP 4: Execute
Let the agent work autonomously to complete the task.

## Template for Agent Deployment:

```
Task tool invocation:
- description: "Complex operation"
- prompt: """
  [USER REQUEST]
  ${prompt}
  
  [PROJECT CONTEXT]
  - Using Next.js 15.3.3, React 19.1.0, TypeScript 5.8.3
  - Monorepo structure with packages: web, ui, backend, shared
  - Four-theme system: light, dark, contrast, gentle
  - Performance target: 98+ Lighthouse scores
  - Use pnpm, not npm
  
  [ADDITIONAL CONTEXT]
  ${files ? "See these files for context: " + files : ""}
  
  [REQUIREMENTS]
  - Follow all patterns in CLAUDE.md
  - Maintain TypeScript type safety
  - Ensure all themes work correctly
  - Write clean, maintainable code
  ${research ? "- Use web search for current best practices" : ""}
  
  [SUCCESS CRITERIA]
  - Task completed as requested
  - All code follows project conventions
  - No TypeScript errors
  - Changes are well-documented
  """
```

## Collaborative Problem-Solving:

When you and Claude are working through an issue together, you can use the subagent for fresh perspectives:

### Method 1: Summarize and Delegate
Ask Claude to summarize the problem, then use that summary:
```
You: "Summarize our authentication issue for a subagent to solve"
Claude: "Here's the summary: [detailed problem description]"
You: "/subagent [paste the summary]"
```

### Method 2: Write Problem to File
Save the context for the subagent:
```
You: "Write our current problem and what we've tried to /tmp/problem-context.md"
Claude: [creates file with full context]
You: "/subagent Solve the issue described in /tmp/problem-context.md files=/tmp/problem-context.md"
```

### Method 3: Structured Handoff
Use a template for complex issues:
```
/subagent Investigate and solve this issue:
PROBLEM: [Claude summarizes the issue]
TRIED SO FAR: [What we've attempted]
CONSTRAINTS: [Any limitations]
GOAL: [Desired outcome]
Please provide 3 different approaches with pros/cons
```

### Example Collaborative Session:
```
You: "We're having issues with theme switching performance"
Claude: "I see the theme switch is causing layout shifts. Let me prepare this for deeper analysis..."
You: "/subagent Analyze theme switching performance issues in our Next.js app. The problem: theme changes cause visible layout shifts and take 200ms+. Need solutions that maintain our 4-theme system while achieving instant switches. files=packages/web/src/app/globals.css,packages/web/src/components/theme-provider.tsx research=true"
```

## Common Use Cases:

### 1. Complex Documentation
```
/subagent Create comprehensive API documentation including examples, error codes, and integration guides
```

### 2. Multi-File Refactoring
```
/subagent Update all components to use forwardRef pattern files=packages/web/src/components
```

### 3. Feature Implementation
```
/subagent Implement dark mode toggle with theme persistence and smooth transitions
```

### 4. Performance Optimization
```
/subagent Analyze and optimize bundle size, implement code splitting where beneficial research=true
```

### 5. Architecture Design
```
/subagent Design a caching strategy for API responses with Redis integration research=true
```

## Key Benefits:
- ✅ Uses your current session (no extra API calls)
- ✅ Full visibility into agent's actions
- ✅ Can be interrupted if needed
- ✅ Integrated with your project context
- ✅ Handles complex multi-step operations autonomously

## Using Subagent as a Second Opinion:

Sometimes you need a fresh perspective on a problem. The subagent can act as another developer reviewing your approach:

```
/subagent Review this approach and suggest improvements:
We're implementing [feature] by [current approach].
Key requirements: [list requirements]
Current concerns: [what you're unsure about]
Please analyze for potential issues and suggest alternatives.
```

### Debugging Together:
```
/subagent Debug this issue:
SYMPTOMS: [what's happening]
ERROR: [error messages]
HYPOTHESIS: [what we think is wrong]
TRIED: [what we've attempted]
Find the root cause and provide a fix.
```

### Architecture Decisions:
```
/subagent Evaluate these architecture options:
OPTION 1: [first approach]
OPTION 2: [second approach]
CONTEXT: [project constraints]
Provide detailed analysis with trade-offs.
```

## Tips:
1. Be specific in your prompts - the clearer the request, the better the result
2. Include file paths when the agent needs to work with specific code
3. Use research=true when you need current best practices or external info
4. Break very large tasks into multiple subagent calls if needed
5. Review the agent's plan before it executes major changes

Remember: This command enables powerful autonomous operations within your current session!