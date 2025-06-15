# Agent: Effective Search Strategies

## The Art of Asking Agent

Agent is like having a senior developer who's already familiar with your codebase. The key is asking the right questions in the right way.

## Search Strategy Patterns

### 1. The Expanding Circle
Start with what you know, expand to what you need:

```
Circle 1: "Find the Button component"
Circle 2: "Show me all components that use Button"
Circle 3: "Which of these handle onClick differently?"
Circle 4: "Are there performance issues with any?"
```

### 2. The Connection Tracer
Follow the thread through your system:

```
Start: "Find where user authentication happens"
→ "Show me where auth tokens are stored"
→ "Which API calls include these tokens?"
→ "What happens when a token expires?"
→ "How do components handle auth failures?"
```

### 3. The Pattern Hunter
Look for consistency and inconsistency:

```
"Find all data fetching patterns"
→ "Which ones use try-catch?"
→ "Which ones show loading states?"
→ "Any that don't handle errors?"
→ "Show me the most robust pattern"
```

### 4. The Impact Analyzer
Understand ripple effects before making changes:

```
"I want to change the User type"
→ "Find all files importing User type"
→ "Which components would break?"
→ "Are there API endpoints affected?"
→ "What about test files?"
```

## Crafting Effective Prompts

### ❌ Vague
```
"Find bugs"
"Show me bad code"
"Where's the problem?"
```

### ✅ Specific
```
"Find React components missing error boundaries"
"Show me API endpoints without rate limiting"
"Where do we mutate state directly instead of using setState?"
```

### ❌ Too Narrow
```
"Find line 42 in Button.tsx"
"Show me the exact import statement"
```

### ✅ Appropriately Scoped
```
"How is the Button component structured and what patterns does it use?"
"Show me how imports are organized across the component library"
```

## Search Strategies by Goal

### 🎯 Understanding Architecture
```
Phase 1: Structure
"Show me the high-level architecture of this Next.js app"
"How are the packages organized in this monorepo?"
"What's the deployment setup?"

Phase 2: Patterns
"What state management approach is used?"
"How is routing handled?"
"What's the data fetching strategy?"

Phase 3: Conventions
"What naming conventions are followed?"
"How are components organized?"
"What's the testing approach?"
```

### 🐛 Debugging
```
Symptom → Cause → Solution

"Users report slow page loads on mobile"
→ "Find components that might be performance bottlenecks"
→ "Which components render large lists?"
→ "Show me the AnimalGallery implementation"
→ "Is virtualization implemented?"
```

### ♻️ Refactoring
```
Current State → Impact → Migration Path

"I need to replace our old Form library"
→ "Find all components using OldFormLibrary"
→ "What features do they use?"
→ "Show me a complex form example"
→ "What would break if we switch?"
```

### 📚 Documentation
```
Discovery → Examples → Edge Cases

"Document the donation flow"
→ "Find all donation-related components"
→ "Show me the main user journey"
→ "What edge cases are handled?"
→ "Any error states I should document?"
```

## Advanced Techniques

### 1. Multi-Criteria Searches
```
Find components that:
- Are over 200 lines
- Have more than 5 props
- Don't have tests
- Are used in more than 3 places

This helps identify refactoring candidates.
```

### 2. Temporal Analysis
```
"Show me recently modified files in the auth system"
"Which components were changed for the last feature?"
"Find TODO comments older than 3 months"
```

### 3. Cross-Cutting Concerns
```
"How is logging implemented across different packages?"
"Where do we handle authentication in API routes vs pages?"
"Find all places where we interact with localStorage"
```

### 4. Style and Quality
```
"Find inconsistent error handling patterns"
"Show me components not following our naming convention"
"Where do we have duplicate logic?"
```

## Working with Agent Results

### 1. Verify Understanding
When Agent gives you results, confirm:
- Are these the files I expected?
- Is this the pattern used everywhere?
- Are there exceptions I should know about?

### 2. Ask Follow-ups
```
Initial: "Find all API endpoints"
Follow-up: "Which ones are public vs authenticated?"
Follow-up: "Any missing input validation?"
Follow-up: "Show me the most complex one"
```

### 3. Request Examples
```
"You found 15 components using this pattern.
Show me:
- The simplest example
- The most complex example  
- Any that deviate from the pattern"
```

## Common Pitfalls and Solutions

### Pitfall: Information Overload
**Problem**: "Find all TypeScript files" → 500 results
**Solution**: Add constraints: "Find TypeScript files in the API layer that handle user data"

### Pitfall: Missing Context
**Problem**: "Find the bug" → Agent doesn't know what bug
**Solution**: Provide symptoms: "Find why images aren't loading on the gallery page"

### Pitfall: Wrong Abstraction Level
**Problem**: "Show me every function call" → Too detailed
**Solution**: Match the level to your need: "Show me the main functions in the payment flow"

## Combining Agent with Other Tools

### Agent → Grep → Read
```
1. Agent: "Find performance bottlenecks"
2. Grep: Search for specific patterns Agent identified
3. Read: Examine the exact implementation
```

### Agent → TaskMaster
```
1. Agent: Discover technical debt
2. TaskMaster: Create tasks for fixes
```

### Agent → Claude Code Bridge
```
1. Agent: Understand current patterns
2. Claude Code Bridge: Implement improvements
```

## Remember

Agent is best for:
- **Exploration**: When you don't know exactly what you're looking for
- **Understanding**: When you need to grasp patterns and relationships
- **Discovery**: When you want to find opportunities or issues
- **Learning**: When you're new to a codebase

Use specific tools when you know exactly what you want. Use Agent when you need to discover what you want.