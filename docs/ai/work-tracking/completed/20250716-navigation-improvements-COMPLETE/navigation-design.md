# Navigation Design: Enhanced REGISTRY.md

## Trigger Phrase Index Design

### New Section for REGISTRY.md
```markdown
## 🔍 Trigger Phrase Index

Quick lookup: What users say → Which handler to use

### Development & Features
| User Says | → Handler | Location | Example |
|-----------|-----------|----------|---------|
| "work on X" | start-new-work | WORKFLOWS.md | "work on authentication" |
| "implement Y" | implement-feature | WORKFLOWS.md | "implement user login" |
| "build Z" | start-new-work | WORKFLOWS.md | "build payment system" |
| "create component" | create-component | WORKFLOWS.md | "create button component" |
| "new feature" | start-new-work | WORKFLOWS.md | "new feature for search" |

### Problems & Debugging
| User Says | → Handler | Location | Example |
|-----------|-----------|----------|---------|
| "fix bug" | fix-problem | WORKFLOWS.md | "fix login bug" |
| "debug X" | debug | WORKFLOWS.md | "debug memory leak" |
| "error Y" | analyze-error | WORKFLOWS.md | "error in production" |
| "why is Z failing" | root-cause-analysis | WORKFLOWS.md | "why is test failing" |

### Git & Version Control
| User Says | → Handler | Location | Example |
|-----------|-----------|----------|---------|
| "commit" (alone) | create-commit-message | WORKFLOWS.md | "what's the commit message" |
| "commit changes" | commit-changes | TOOLS.md | "commit my changes" |
| "gac" | gac behavior | BEHAVIORS.md | "gac" → raw message |
| "create PR" | create-pr | WORKFLOWS.md | "create pull request" |

### Search & Navigation
| User Says | → Handler | Location | Example |
|-----------|-----------|----------|---------|
| "search for code" | search-code | TOOLS.md | "search for auth logic" |
| "find symbol" | find-symbol | TOOLS.md | "find class User" |
| "grep X" | grep-pattern | TOOLS.md | "grep TODO" |
| "where is Y" | search-code or find-symbol | TOOLS.md | "where is login function" |

### File Operations
| User Says | → Handler | Location | Example |
|-----------|-----------|----------|---------|
| "edit file" | edit-file + conventions | TOOLS.md | "edit config.js" |
| "create file" | create-file | TOOLS.md | "create new component" |
| "read X" | read-file | TOOLS.md | "read package.json" |
| "update Y" | edit-file | TOOLS.md | "update readme" |
```

## Navigation Shortcuts Design

### Add to CLAUDE.md
```markdown
## NAVIGATION SHORTCUTS

Common flows with direct search patterns:

### Start Work
```
mcp__serena__search_for_pattern --substring_pattern "Handler: start-new-work" --relative_path ".claude/templates/WORKFLOWS.md"
```

### Fix Bug
```
mcp__serena__search_for_pattern --substring_pattern "Handler: fix-problem" --relative_path ".claude/templates/WORKFLOWS.md"
```

### Commit Message
```
mcp__serena__search_for_pattern --substring_pattern "Handler: create-commit-message" --relative_path ".claude/templates/WORKFLOWS.md"
```

### Search Code
```
mcp__serena__search_for_pattern --substring_pattern "Handler: search-code" --relative_path ".claude/templates/TOOLS.md"
```
```

## Visual Navigation Aid Design

### Decision Tree for REGISTRY.md
```
User Request
├─ Development Work?
│  ├─ "work on" → start-new-work
│  ├─ "implement" → implement-feature
│  └─ "create" → create-component
├─ Problem Solving?
│  ├─ "fix" → fix-problem
│  ├─ "debug" → debug
│  └─ "error" → analyze-error
├─ Git Operations?
│  ├─ "commit" alone → create-commit-message
│  ├─ "commit changes" → commit-changes
│  └─ "gac" → gac behavior
└─ Search/Find?
   ├─ Code understanding → search-code
   ├─ Symbol location → find-symbol
   └─ Simple text → grep-pattern
```

## Benefits of This Design

1. **Direct Mapping**: User phrase → Handler in one lookup
2. **Examples**: Show real usage for clarity
3. **Categories**: Organized by intent type
4. **Visual Flow**: Decision tree for complex routing
5. **Shortcuts**: Pre-built searches for common tasks

## Handling Variations - Enhanced Design

### Pattern-Based Matching
Instead of exact phrases, use patterns:

```markdown
## 🔍 Trigger Phrase Index (Enhanced)

### Development & Features
| User Pattern | → Handler | Keywords | Examples |
|--------------|-----------|----------|----------|
| *work on* | start-new-work | work, on | "work on X", "let's work on Y", "start working on Z" |
| *implement* | implement-feature | implement | "implement X", "implementing Y", "please implement Z" |
| *build* | start-new-work | build | "build X", "let's build Y", "building Z" |
| *create*component* | create-component | create, component | "create a component", "create button component" |
| *new*feature* | start-new-work | new, feature | "new feature", "add new feature", "feature request" |

### Problems & Debugging  
| User Pattern | → Handler | Keywords | Examples |
|--------------|-----------|----------|----------|
| *fix*bug* OR *resolve* | fix-problem | fix, bug, resolve, issue | "fix bug", "fix the bug", "resolve issue" |
| *debug* | debug | debug | "debug X", "debugging Y", "need to debug" |
| *error* OR *failing* | analyze-error | error, fail, failing | "error in X", "why is Y failing", "test fails" |
```

### Fuzzy Matching Strategy

1. **Keyword Extraction**: Extract key terms from user input
2. **Pattern Matching**: Match against patterns, not exact phrases
3. **Scoring System**: Score matches by keyword presence
4. **Fallback Search**: If no match, fall back to broader search

### Implementation in CLAUDE.md

```markdown
## SMARTER NAVIGATION

When user request doesn't exactly match trigger index:

1. **Extract Keywords**
   - Remove stop words (the, a, please, etc.)
   - Identify action verbs (work, fix, create, etc.)
   - Find object nouns (bug, feature, component, etc.)

2. **Score Matches**
   - 2 points: Action verb match
   - 2 points: Object noun match  
   - 1 point: Context word match
   - Highest score wins

3. **Ambiguity Resolution**
   - If multiple high scores: Check PATTERNS.md
   - If still unclear: Ask for clarification
   - If unique match: Proceed with handler

Example:
User: "I need to resolve the login issue"
- Keywords: [resolve, login, issue]
- Matches: "fix-problem" (resolve + issue = 4 points)
- Action: Load fix-problem handler
```

### Fallback Patterns

If no pattern matches:
1. Search for closest verb in all handlers
2. Check PATTERNS.md for ambiguous requests
3. Show top 3 possibilities to user
4. Learn from user's choice for future

## Implementation Priority

1. **Phase 1**: Add Trigger Phrase Index to REGISTRY.md
2. **Phase 2**: Add Navigation Shortcuts to CLAUDE.md
3. **Phase 3**: Add Decision Tree visualization
4. **Phase 4**: Test and refine based on usage