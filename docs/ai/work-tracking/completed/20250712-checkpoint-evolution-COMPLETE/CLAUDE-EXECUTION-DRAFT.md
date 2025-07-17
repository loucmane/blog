# AI Execution Engine

Think deeply about how to process this request. You are Claude, and this is your execution protocol for handling all requests.

**Variables:**
request: $USER_INPUT
intent_type: $PARSED_INTENT
target: $PARSED_TARGET
context: $PARSED_CONTEXT

**REQUEST PARSING:**
Parse the user's request to identify:
1. `intent_type` - What they want to do (develop, fix, search, commit, etc.)
2. `target` - What they're working on (feature, bug, file, etc.)
3. `context` - Current state (new, continuing, stuck, etc.)

**PHASE 1: HANDLER LOOKUP**
Load HANDLERS.md and find the appropriate handler:

```
TASK: Find handler for "${request}"

1. Check HANDLERS.md Section "Common Patterns" for direct matches
2. If ambiguous, check Section "Disambiguation Guide"
3. Load handler entry to get:
   - Handler name and location
   - Quick reference of process
   - Link to full handler definition
```

**PHASE 2: CONVENTION ENFORCEMENT GATE**
Before executing the handler, check conventions:

```
TASK: Check conventions for ${intent_type}

CRITICAL: Load relevant convention handlers from HANDLERS.md:
- git-conventions (if git operation)
- naming-conventions (if creating files)
- evidence-based (if making claims)
- append-only-files (if editing tracker.md, findings.md, etc.)

Execute ALL applicable convention checks BEFORE proceeding.
```

**PHASE 3: EXECUTE HANDLER**
Load and execute the full handler from its source file:

```
TASK: Execute handler for "${request}"

1. From HANDLERS.md, get handler location (e.g., WORKFLOWS.md#start-new-work)
2. Load full handler definition from source file
3. Execute handler steps with these principles:
   - Use Serena-first for all code operations
   - Check conventions at each step
   - Track progress with TodoWrite
   - Document per work tracking standards
```

**PHASE 4: PROTOCOL EXCEPTIONS**
When standard routing fails, use exception handlers from HANDLERS.md:

```
UNCLEAR INTENT → Check HANDLERS.md disambiguation → Show options
CONTEXT MISSING → Load context-missing handler → Resolve references
LOST/CONFUSED → Load lost-confused handler → Check todos+status
NO HANDLER → Show HANDLERS.md categories → Suggest closest matches
CONVENTION SKIP → STOP → Load skipped convention immediately
```

## EXECUTION PROTOCOLS BY INTENT

### DEVELOPMENT PROTOCOL
```
TASK: Handle development request "${request}"

1. Find handler in HANDLERS.md (likely: start-new-work, continue-work, implement-feature)
2. Check conventions: naming, work-tracking, evidence-based
3. Execute handler with:
   - Create work folder if new
   - Update TodoWrite
   - Use Serena for code understanding
   - Track in 6-file structure
```

### PROBLEM-SOLVING PROTOCOL
```
TASK: Handle problem/bug "${request}"

1. Find handler in HANDLERS.md (likely: fix-problem, debug-issue, analyze-error)
2. Check conventions: evidence-based, work-preservation
3. Execute handler with:
   - Gather evidence first
   - Use Serena for root cause analysis
   - Document findings with file:line refs
   - Test fixes thoroughly
```

### SEARCH PROTOCOL
```
TASK: Handle search request "${request}"

1. Find handler in HANDLERS.md (likely: search-code, find-files, search-text)
2. Check conventions: tool-selection (Serena-first)
3. Execute handler with:
   - Serena search_for_pattern as primary
   - Fallback to grep only if needed
   - Present results with context
```

### GIT PROTOCOL
```
TASK: Handle git operation "${request}"

1. Find handler in HANDLERS.md (likely: git-commit, git-operations, create-pr)
2. CRITICAL: Check git-conventions first
3. Execute handler with:
   - Single quotes in commit messages
   - Evidence-based descriptions
   - Proper format per conventions
```

**HANDLER EXECUTION FLOW:**

```
User Request
     ↓
Parse Intent
     ↓
HANDLERS.md Lookup ← [Find appropriate handler]
     ↓
Convention Check ← [Load applicable conventions]
     ↓
Load Full Handler ← [From source file]
     ↓
Execute Steps ← [With Serena-first principle]
     ↓
Track Progress ← [TodoWrite + work files]
```

**CRITICAL PRINCIPLES:**

1. **HANDLERS.md is the map** - Always start there for discovery
2. **Conventions are gates** - Check before action, not after
3. **Handlers are complete** - Load full definition, not summary
4. **Serena-first always** - For any code operation
5. **Evidence required** - No claims without proof
6. **Track everything** - In proper 6-file structure