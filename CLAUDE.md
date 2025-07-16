# AI Execution Engine

## ⚠️ CRITICAL: THIS IS YOUR OPERATING SYSTEM ⚠️
**YOU MUST PROCESS EVERY REQUEST THROUGH THIS ENGINE FIRST**
- This is NOT documentation - this IS your execution protocol
- Run this BEFORE thinking about any response
- This is your interrupt handler - it runs FIRST, always

## 🎯 CONTEXT-AWARE ACTIVATION

**Natural Conversation Mode (DEFAULT)**
- Casual chat, questions, discussions → Respond naturally
- No routing announcements, no [CTS] tags
- System runs silently in background

**Development Mode (AUTO-TRIGGERED BY)**
- Work signals: "implement", "build", "fix", "test", "debug", "work on"
- Tool requests: "search", "find", "edit", "commit"
- Project references: "task", "component", "feature"
- Explicit activation: "CTS mode", "use template system"

**Mode Detection**:
```
If request contains development signals → Use full system (but keep output clean)
If request is casual conversation → Respond naturally without visible routing
If user requests "show routing" → Display [CTS] routing decisions
```

---

## MY TEMPLATE NAVIGATION PROTOCOL

When I receive ANY request, I MUST:

### 1. Quick Intent Check
```
Is this casual chat? → Skip to natural response
Is this development work? → Continue to step 2
```

### 2. Find the Right Handler
```
I search the REGISTRY for the appropriate handler:
mcp__serena__search_for_pattern --substring_pattern "[user's intent keywords]" --relative_path ".claude/templates/REGISTRY.md"
```

### 3. Load Handler from Template
```
Once I find the handler in REGISTRY, I load it from its source:
mcp__serena__search_for_pattern --substring_pattern "Handler: [handler-name]" --relative_path "[template-file]"
```

### 4. Execute Handler Completely
Follow the loaded handler's Process steps exactly, using specified tools and conventions.

## BEHAVIORAL HOOKS (How I Actually Work)

### Before Any File Edit
```
TRIGGER: About to use Edit/Write/MultiEdit
ACTION: mcp__serena__search_for_pattern --substring_pattern "[filename] conventions" --relative_path ".claude/templates/CONVENTIONS.md"
BLOCKS: Cannot edit until conventions checked
```

### Before Implementation
```
TRIGGER: About to write new code/features  
ACTION: mcp__serena__search_for_pattern --substring_pattern "start-new-work" --relative_path ".claude/templates/REGISTRY.md"
THEN: Load handler from WORKFLOWS.md
BLOCKS: Cannot code without workflow
```

### Before Tool Use
```
TRIGGER: About to search/find anything
ACTION: mcp__serena__search_for_pattern --substring_pattern "tool-selection" --relative_path ".claude/templates/REGISTRY.md"
THEN: Check tool matrix for correct tool
BLOCKS: Cannot use wrong tool
```

### Before Making Claims
```
TRIGGER: About to state facts about code
ACTION: mcp__serena__search_for_pattern --substring_pattern "evidence-check" --relative_path ".claude/templates/REGISTRY.md"
THEN: Gather evidence first
BLOCKS: No claims without proof
```

## COMMON REQUEST FLOWS

### "Work on X" → Development Flow
```
1. Search REGISTRY: "start-new-work"
2. Find: Handler in WORKFLOWS.md
3. Load: mcp__serena__search_for_pattern --substring_pattern "Handler: start-new-work" --relative_path ".claude/templates/WORKFLOWS.md"
4. Execute: Create work folder, initialize todos, begin implementation
```

### "Fix bug Y" → Problem Solving Flow
```
1. Search REGISTRY: "fix-problem"
2. Find: Handler in WORKFLOWS.md
3. Load: Full handler definition
4. Execute: Evidence gathering → root cause → fix → test
```

### "Find Z" → Search Flow
```
1. Search REGISTRY: "search-code" or "find-symbol"
2. Find: Tool selection matrix
3. Load: Appropriate search handler
4. Execute: Use Serena for code, Grep for text
```

### "Commit changes" → Git Flow
```
1. Search REGISTRY: "commit-changes"
2. Find: Handler in TOOLS.md + conventions in CONVENTIONS.md
3. Load: Both handlers
4. Execute: Check conventions → create message → commit
```

## TEMPLATE SYSTEM STRUCTURE

My knowledge lives in these templates that I search dynamically:

### REGISTRY.md - Master Index
- **Purpose**: Fast lookup of all handlers
- **When I use it**: FIRST, for every request
- **What I find**: Handler names, locations, triggers

### WORKFLOWS.md - Development Processes
- **Purpose**: How to do development work
- **When I use it**: Implementation, features, bugs
- **Key handlers**: start-new-work, fix-problem, test-implementation

### TOOLS.md - Tool Selection
- **Purpose**: Which tool for which task
- **When I use it**: Before any tool operation
- **Key principle**: Serena for search, Edit for files

### CONVENTIONS.md - Standards & Rules
- **Purpose**: How things should be done
- **When I use it**: Before edits, commits, naming
- **Key rules**: Timestamps, git format, file conventions

### PATTERNS.md - Meta Routing
- **Purpose**: How to route complex requests
- **When I use it**: Ambiguous or multi-step requests
- **Key patterns**: work-activity, tool-selection, evidence-check

### BUILDING-BETTER.md - Integration
- **Purpose**: How systems connect
- **When I use it**: Cross-system operations
- **Key handlers**: save-context, workflow-to-tool

## ENFORCEMENT MECHANISMS

### Cannot Proceed Without
1. **File Edit** → Convention check first
2. **Implementation** → Workflow loaded
3. **Tool Use** → Correct tool verified
4. **Claims** → Evidence gathered
5. **Commits** → Format validated

### Natural Execution
Instead of "I should check templates", these become "I cannot proceed without checking" - making template usage automatic and unavoidable.

## PRACTICAL EXAMPLES

### User: "implement user authentication"
```
My Internal Process:
1. [DETECT] "implement" → Development signal
2. [SEARCH] REGISTRY for "implement" → Find "implement-feature"
3. [LOAD] Handler from WORKFLOWS.md
4. [CHECK] Tool matrix for correct tools
5. [CREATE] Work folder 20250715-user-auth-ACTIVE/
6. [INIT] TodoWrite with implementation tasks
7. [EXECUTE] Follow TDD workflow from handler
```

### User: "why is the login failing?"
```
My Internal Process:
1. [DETECT] "why is" + "failing" → Debug signal
2. [SEARCH] REGISTRY for "debug" → Find debug handler
3. [LOAD] Handler from TOOLS.md
4. [GATHER] Evidence with Serena searches
5. [ANALYZE] With loaded debug workflow
6. [RESPOND] With evidence-based findings
```

### User: "how's the weather?"
```
My Internal Process:
1. [DETECT] No development signals → Natural conversation
2. [SKIP] All template loading
3. [RESPOND] Naturally about weather
```

## KEY OPERATING PRINCIPLES

1. **Registry First** - Always search REGISTRY.md before anything else
2. **Load on Demand** - Only load handlers when needed
3. **Execute Completely** - Follow loaded handlers to completion
4. **Tool Discipline** - Right tool for right job (no exceptions)
5. **Evidence Required** - Claims need proof from code
6. **Natural Conversation** - Skip all protocols for casual chat

## THE DIFFERENCE

**OLD WAY**: "Check templates" → Often skipped
**NEW WAY**: "Cannot proceed without templates" → Always happens

Like syntax checking - I can't write invalid code, and now I can't skip template checks.

## ERROR HANDLING & FALLBACKS

### When No Handler Found
```
If REGISTRY search returns nothing:
1. Try broader search terms in REGISTRY
2. Search PATTERNS.md for meta-routing
3. Check ambiguous-request pattern
4. Ask user for clarification
```

### When Handler Has Gaps
```
If handler missing steps or unclear:
1. Search for similar handlers
2. Check conventions for related rules
3. Use general principles from KEY OPERATING PRINCIPLES
4. Document the gap for future improvement
```

### Fallback Decision Tree
```
No handler match?
├─ Is it development work? → Use start-new-work as default
├─ Is it a search? → Check tool selection matrix
├─ Is it file operation? → Check special files rules
├─ Is it unclear? → Ask: "What specifically would you like me to do?"
└─ Still stuck? → Explain what I found and what's missing
```

### Creating Missing Handlers
```
When encountering repeated gaps:
1. Document pattern in work tracking
2. Suggest handler addition to templates
3. Follow existing handler format
4. Update REGISTRY when added
```

## DEBUGGING THE SYSTEM

### If Something Goes Wrong
```
1. Check: Did I search REGISTRY first?
2. Check: Did I load the full handler?
3. Check: Did I skip any pre-conditions?
4. Check: Am I using the right tool?
5. If still broken: Document exact failure point
```

### Common Issues & Solutions
- **"Can't find handler"** → Search variations, check PATTERNS.md
- **"Handler incomplete"** → Use similar handler as template
- **"Wrong tool used"** → Always check tool matrix first
- **"Convention violated"** → Stop and check CONVENTIONS.md
- **"Not sure what to do"** → Ask user for specific guidance

## REMEMBER

- Templates aren't references - they're my program
- REGISTRY.md is my index - search it first
- Handlers contain complete workflows - follow them
- Tools have specific purposes - respect them
- Conventions are requirements - not suggestions
- **When stuck, ask for help - don't guess**

This execution engine ensures I use templates naturally and automatically, making the system work as intended.