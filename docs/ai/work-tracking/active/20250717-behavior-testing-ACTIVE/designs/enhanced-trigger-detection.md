# Enhanced Trigger Detection Design

## Current Limitation
Only triggers on explicit keywords: "fix", "implement", "search", etc.
Misses implicit development work and context-based scenarios.

## Proposed Enhancements

### 1. Implicit Development Signals
```markdown
**Development Mode (AUTO-TRIGGERED BY)**
- Explicit signals: "implement", "build", "fix", "test", "debug", "work on"
- Tool requests: "search", "find", "edit", "commit"
- Project references: "task", "component", "feature"
- **Implicit signals**: 
  - Questions about code: "how does", "what's in", "why is", "where is"
  - Problem reports: "not working", "broken", "issue", "error"
  - File/path mentions: ".tsx", ".js", "src/", "components/"
  - Code snippets in backticks
  - Error messages or stack traces
```

### 2. Tool Usage Detection
```markdown
**Tool-Triggered Development Mode**
If request would use any of these tools → Development mode:
- Read, Write, Edit, MultiEdit (file operations)
- Grep, Glob, LS (file searching)
- Bash with development commands (npm, git, etc.)
- Any Serena tool (find_symbol, etc.)
```

### 3. Context Persistence
```markdown
**Conversation Context Mode**
Once in development mode → Stay in development mode until:
- User explicitly says "thanks, that's all"
- Topic clearly changes to non-development
- New session starts
```

### 4. Pattern-Based Detection
```markdown
**Pattern Detection Rules**
1. Contains file path → Development mode
2. Contains code snippet → Development mode
3. Contains error message → Development mode
4. References previous code discussion → Development mode
5. Mentions UI/UX issues → Development mode
```

### 5. Enhanced Checkpoint Logic
```markdown
**🛑 DEVELOPMENT MODE CHECKPOINT**
When development mode triggered, I must:

1. State triggers: "Detected: [_______]" 
   - Can be: keyword, pattern, tool need, or context
2. Find handler: "Maps to: [_______] (line [___] in REGISTRY.md)"
   - Or: "Maps to: general-investigation (no specific handler)"
3. Start response: "[Using (handler) from (template)]"
   - Or: "[Using development mode - no specific handler]"

ERROR if development signals detected but no checkpoint stated.
```

## Implementation Options

### Option A: Expand Trigger List
Simply add more keywords and patterns to existing list.
- Pros: Easy to implement
- Cons: Still might miss edge cases

### Option B: Multi-Stage Detection
```
1. Quick keyword check (current)
2. Pattern analysis (code, paths, errors)
3. Tool prediction (will I need development tools?)
4. Context check (are we in dev conversation?)
```

### Option C: Default to Development
Assume development mode unless clearly casual chat.
- Pros: Won't miss anything
- Cons: Too many false positives

### Option D: Hybrid Approach (Recommended)
1. Keep current keyword triggers
2. Add pattern detection for code/files/errors
3. Add "uncertain" state that asks user
4. Track conversation context

## Example Enhanced Triggers

### Would Now Trigger:
- "What's in the config file?" → Implicit file request
- "The navbar doesn't stick" → Implicit problem report
- "How does `AuthContext` work?" → Code reference
- "Getting TypeError in console" → Error mention
- "/src/components/Header.tsx" → File path

### Still Wouldn't Trigger:
- "What's the weather?"
- "Tell me a joke"
- "Explain quantum physics"
- General discussion without code context