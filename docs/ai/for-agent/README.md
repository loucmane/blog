# Agent Tool Documentation

## Overview
Agent is your autonomous code explorer. When you need to understand patterns, find connections, or discover opportunities in your codebase, Agent is your guide.

## Quick Start
```
Find [WHAT] in the codebase:
- Looking for: [SPECIFIC PATTERNS]
- Context: [WHY YOU NEED THIS]
- Focus on: [AREAS/FILE TYPES]
```

## Directory Contents

### 📝 prompts/
Strategic search patterns:
- `codebase-exploration.md` - Templates for effective exploration

### 💡 examples/
Real exploration stories:
- `finding-patterns.md` - How Agent discovered performance opportunities

### 📋 guidelines/
Search mastery:
- `search-strategies.md` - Advanced techniques for effective Agent use

### 📚 reference/
Technical capabilities (coming soon)

## When Agent Shines ✨

### Perfect For:
1. **Pattern Discovery**
   - "Find all components that fetch data"
   - "Show me error handling patterns"
   - "Where do we use localStorage?"

2. **Architecture Understanding**
   - "How does authentication work?"
   - "What's the data flow from API to UI?"
   - "How are styles organized?"

3. **Impact Analysis**
   - "What breaks if I change this type?"
   - "Which components import this?"
   - "Find all calls to the old API"

4. **Code Quality Audit**
   - "Find potential performance issues"
   - "Where's duplicated logic?"
   - "Show me components without tests"

### Use Other Tools When:
- **Know exact location** → Read tool
- **Simple string search** → Grep tool  
- **Need to edit** → Edit/Write tools
- **Complex refactoring** → Claude Code Bridge

## Core Concepts

### Search Strategies
1. **Expanding Circle**: Start narrow, broaden scope
2. **Connection Tracer**: Follow the thread
3. **Pattern Hunter**: Find consistency/inconsistency
4. **Impact Analyzer**: Understand ripple effects

### Prompt Crafting
```
❌ Vague: "Find bugs"
✅ Specific: "Find API endpoints missing error handling"

❌ Too Narrow: "Show line 42"
✅ Right Scope: "How is Button component structured?"
```

## Power Patterns

### New to Codebase
```
I'm new here. Help me understand:
1. Overall architecture
2. Key design patterns
3. Where main features live
4. Coding conventions used
```

### Debugging Mystery
```
Users report [SYMPTOM]. Help me trace:
1. Where this could originate
2. Related error handling  
3. Similar working patterns
4. Relevant logging
```

### Refactoring Prep
```
Planning to refactor [FEATURE]. Find:
1. All files involved
2. Current patterns
3. Test coverage
4. Potential impacts
```

## Integration Magic

### Agent + Grep
```
1. Agent: "Find performance patterns"
2. Agent identifies: "Large bundle imports"
3. Grep: Search for "import *"
4. Read: Examine specific cases
```

### Agent + TaskMaster
```
1. Agent: Discover technical debt
2. Agent reports: "15 components need optimization"
3. TaskMaster: Create targeted tasks
```

### Agent + Claude Code Bridge
```
1. Agent: "Show me form validation patterns"
2. Agent finds: "3 different approaches"
3. Claude Code Bridge: Standardize them
```

## Pro Tips

### 1. Start Broad, Then Focus
```
"Find auth code"
→ "Focus on token handling"
→ "Show refresh logic"
```

### 2. Provide Context
```
Bad: "Find config"
Good: "Find config for API keys, need to add Stripe"
```

### 3. Use Multiple Passes
```
Pass 1: Find all animations
Pass 2: Which use CSS vs JS?
Pass 3: Performance impact?
```

### 4. Ask for Examples
```
"You found 20 instances. Show me:
- Simplest case
- Most complex case
- Any outliers"
```

## Common Patterns

### Architecture Exploration
```
"How does [FEATURE] work?"
→ Entry points
→ Core logic
→ Data flow
→ UI components
```

### Problem Investigation
```
"Why is [X] happening?"
→ Trace execution
→ Find related code
→ Check error handling
→ Look for patterns
```

### Knowledge Building
```
"Teach me about [AREA]"
→ Key files
→ Main patterns
→ Common operations
→ Best examples
```

## Remember
Agent is like having a senior developer who already knows your codebase. The better your questions, the more valuable the insights.

Use Agent when you need to:
- Understand before you build
- Explore before you change
- Discover what you don't know
- Find patterns and connections

Your codebase has stories to tell. Agent helps you hear them.