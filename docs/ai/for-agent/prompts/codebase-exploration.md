# Agent: Codebase Exploration Prompts

## Use Case
Using the Agent tool for autonomous exploration and discovery within your codebase when you're not sure exactly what you're looking for.

## Example Prompt Template

```
Search for [PATTERN/CONCEPT] in the codebase:

Looking for:
- [SPECIFIC THING 1]
- [SPECIFIC THING 2]

Context: [WHY YOU NEED THIS]

Focus on:
- [FILE TYPES]
- [DIRECTORIES]
```

## Real Examples

### Example 1: Finding Theme Implementation
```
Search for how themes are implemented across the codebase:

Looking for:
- Where theme values are defined
- Components that use theme switching
- CSS variables or design tokens
- Theme provider setup

Context: Need to add a new "kids" theme

Focus on:
- TypeScript and CSS files
- packages/ui and packages/web directories
```

### Example 2: Performance Patterns
```
Find all performance optimization patterns in use:

Looking for:
- Lazy loading implementations
- Code splitting
- Memoization patterns
- Image optimization
- Bundle size optimizations

Context: Preparing performance audit report

Focus on:
- React components
- Next.js configurations
- Build scripts
```

### Example 3: Error Handling
```
Locate error handling patterns and error boundaries:

Looking for:
- Try-catch blocks
- Error boundary components
- Error logging
- User-facing error messages
- API error handling

Context: Standardizing error handling across the app

Focus on:
- Components and API routes
- Utility functions
```

## Complex Search Patterns

### Architecture Discovery
```
Analyze the authentication architecture:

Looking for:
- Auth providers and contexts
- Protected route implementations
- Token management
- Session handling
- Auth-related API endpoints

Show me:
- How components check auth state
- Where tokens are stored
- How refresh works
```

### Pattern Analysis
```
Find all uses of the compound component pattern:

Looking for:
- Components with dot notation (e.g., Card.Header)
- Context providers with child components
- Components that share state via context

Examples I expect:
- Modal with Modal.Header, Modal.Body
- Form with Form.Field, Form.Error
```

### Dependency Investigation
```
Trace how data flows from API to UI:

Starting point: /api/animals endpoint

Find:
- Where this API is called
- How the data is transformed
- Which components consume it
- Any caching layers

I need to understand the full data flow.
```

## Agent Strengths

### 1. Pattern Recognition
- "Find all components that fetch data on mount"
- "Show me every place we use localStorage"
- "Find components with more than 200 lines"

### 2. Architecture Understanding
- "How does the routing system work?"
- "What's the deployment process?"
- "How are styles organized?"

### 3. Code Quality Analysis
- "Find potential performance issues"
- "Locate code duplication"
- "Find TODO comments"

### 4. Impact Analysis
- "What would break if I change this type?"
- "Which components import this utility?"
- "Find all API calls to the old endpoint"

## Tips for Effective Agent Use

### 1. Start Broad, Then Narrow
```
First: "Find authentication code"
Then: "Focus on JWT token handling"
Finally: "Show refresh token logic"
```

### 2. Provide Context
```
Bad: "Find config files"
Good: "Find config files for environment variables, 
      I need to add a new API key"
```

### 3. Use Multiple Passes
```
Pass 1: Find all animation code
Pass 2: Which use framer-motion?
Pass 3: Any performance issues?
```

### 4. Combine with Other Tools
```
1. Agent: Find all API endpoints
2. Grep: Search for specific endpoint
3. Read: Examine implementation
4. Claude Code Bridge: Refactor pattern
```

## Common Agent Patterns

### Onboarding Pattern
```
I'm new to this codebase. Help me understand:
1. Project structure
2. Key architectural decisions
3. Common patterns used
4. Where to find main features
```

### Refactoring Pattern
```
I want to refactor [FEATURE]. Find:
1. All files that touch this feature
2. Current implementation patterns
3. Test coverage
4. Potential impact points
```

### Debugging Pattern
```
[BUG DESCRIPTION]. Help me trace:
1. Where this error might originate
2. Related error handling
3. Similar patterns that work
4. Relevant logs or debugging code
```

### Documentation Pattern
```
I'm documenting [FEATURE]. Find:
1. All relevant code
2. Existing documentation
3. Usage examples
4. Edge cases handled
```

Remember: Agent excels at exploration and discovery. Use it when you need to understand patterns, find connections, or explore unfamiliar territory in your codebase!