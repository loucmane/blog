# DDII: Enhanced Trigger Detection

## Define

**Problem**: Development Mode Checkpoint only triggers on explicit keywords ("fix", "implement", etc.), missing many development scenarios.

**Current State**:
- Works: "fix the header" ✅
- Misses: "the header isn't sticky" ❌
- Misses: "what's in config.js?" ❌
- Misses: Reading/editing files without explicit request ❌

**Desired State**:
- Catch ALL development work, explicit or implicit
- Minimize false positives (don't trigger on casual chat)
- Make enforcement feel natural, not annoying

## Design

### Three-Layer Detection Model

1. **Explicit Layer** (Current)
   - Direct commands: "fix", "implement", "debug"
   - Clear intent, map to specific handlers

2. **Implicit Layer** (Missing)
   - Problem descriptions: "isn't working", "looks broken"
   - Exploration: "how does X work?", "what's in Y?"
   - Context clues: file paths, code snippets, error messages

3. **Behavioral Layer** (Missing)
   - Tool usage patterns (about to use Read/Edit)
   - Conversation context (following up on code discussion)
   - Domain indicators (UI/UX terms, technical language)

## Iterate on Design

**Key Insight**: We're not just detecting keywords, we're detecting *development intent*.

**Refined Approach**:
```
1. Intent Detection (before checkpoint)
   - Explicit: Keyword match → specific handler
   - Implicit: Pattern match → investigation handler
   - Uncertain: Ask user → clarify intent

2. Checkpoint Execution (current)
   - State what triggered it
   - Find appropriate handler
   - Declare usage

3. Graceful Fallback
   - No specific handler? → "general-investigation"
   - Still development work, just exploratory
```

## Design Implementation

### Enhanced CLAUDE.md Structure

```markdown
**Development Mode (AUTO-TRIGGERED BY)**

**Explicit Triggers** (map to specific handlers):
- Commands: "implement", "build", "fix", "test", "debug", "work on"
- Tools: "search", "find", "edit", "commit"
- Tasks: "create", "update", "refactor", "optimize"

**Implicit Triggers** (map to investigation/analysis):
- Problems: "not working", "broken", "issue", "error", "bug"
- Questions: "how does", "what's in", "where is", "why does"
- Analysis: "explain this code", "what does this do"
- Mentions: file paths (.js, .tsx, /src/), code in backticks, error messages

**Behavioral Triggers** (context-based):
- Following up on code discussion
- Any request that would use code tools
- Technical domain language about the project

**Uncertainty Resolution**:
If unclear, ask: "Is this about code/development work?"
```

## Missing Categories Discovered

### Documentation Work (Currently Ignored!)
- "document this function"
- "write a README"
- "update the docs"
- "explain how this works" (for docs)
- "create API documentation"
- "add comments to this code"

### Other Development Work
- "review this PR"
- "analyze the architecture"
- "diagram the flow"
- "create a guide for"
- "write tests for"

## Implementation Challenges

1. **Pattern Matching Complexity**
   - Need regex for file paths
   - Need to detect code in backticks
   - Need to identify error message patterns

2. **Context Persistence**
   - How to track we're in development conversation?
   - When to reset context?
   - How to handle topic switches?

3. **False Positive Prevention**
   - "How does photosynthesis work?" shouldn't trigger
   - "What's in my lunch?" shouldn't trigger
   - Need domain-specific filtering

## Next Steps

1. Create comprehensive trigger list
2. Design pattern matching rules
3. Implement graceful fallbacks
4. Test with edge cases
5. Refine based on results