# CLAUDE.md - Current Version: Narrative Checkpoint

## ⚠️ CRITICAL: THIS IS YOUR OPERATING SYSTEM ⚠️
**YOU MUST PROCESS EVERY REQUEST THROUGH THIS ENGINE FIRST**
- This is NOT documentation - this IS your execution protocol
- Run this BEFORE thinking about any response
- This is your interrupt handler - it runs FIRST, always

## 🧠 ULTRATHINK: MANDATORY THINKING MODE
**EVERY REQUEST REQUIRES MAXIMUM THINKING DEPTH**
- Use "ultrathink" mode as your standard operating procedure
- This ensures thorough analysis even for 'simple' tasks
- Hidden complexity often emerges only through deep thinking
- Better to overthink than underthink - there's no penalty for being thorough
- Format: "Let me ultrathink about this..." before any implementation

## 🛑 DEVELOPMENT MODE CHECKPOINT - NARRATIVE EXECUTION

Initiating development response for "[_____]"...

**Chapter 0: Ultrathink Analysis**
"Let me ultrathink about this request... [Deep analysis of the request, potential approaches, hidden complexities, and optimal strategy before proceeding]"

**Chapter 1: Handler Discovery**
"I need to find the appropriate handler for this request. Searching... Found handler '[_____]' at line [___] of [_____].md. The handler's Process section begins with: '[_____first 10 words_____]' confirming this is the correct handler."

**Chapter 2: Understanding Requirements**  
"The handler specifies [___] total steps. Let me quote the exact requirements:
- Step 1: '[_____exact quote from handler_____]'
- Step 2: '[_____exact quote from handler_____]'
[continue for all steps]"

**Chapter 3: Progressive Execution**
"Beginning implementation following the handler's instructions...

Entering Step 1: '[_____handler quote_____]'
→ Executing: [_____specific action description_____]
→ Evidence: [_____specific evidence based on action type_____]
→ Result: [Success/Failed because _____]
Exiting Step 1 with: [_____outcome_____]

[Continue for all steps]"

**Chapter 4: Validation**
"Confirming all [___] steps from handler '[_____]' have been completed:
- Total steps required: [___]
- Steps successfully completed: [___]
- Handler success criteria: '[_____quote success criteria_____]'
- Criteria met: [YES/NO because _____]"

NARRATIVE BROKEN if any chapter incomplete or incoherent!

ERROR if development signals detected but checkpoint skipped!

## MY TEMPLATE NAVIGATION PROTOCOL

### 3. Load Handler from Template Using Anchors
```
Once I find the handler in REGISTRY (now with anchor links), I load it using:
mcp__serena__search_for_pattern --substring_pattern "{#handler-name}" --relative_path "[template-file]"

Example: For `start-new-work` handler:
1. Registry shows: [start-new-work](WORKFLOWS.md#start-new-work)
2. I search: mcp__serena__search_for_pattern --substring_pattern "{#start-new-work}" --relative_path ".claude/templates/WORKFLOWS.md"
3. This finds the exact handler location with permanent anchor reference
```

## BEHAVIORAL HOOKS (How I Actually Work)

All my behavioral enforcement lives in a dedicated template:
```
mcp__serena__search_for_pattern --substring_pattern "[trigger-type]" --relative_path ".claude/templates/BEHAVIORS.md"
```

Key behaviors enforced automatically:
- **Work Tracking** - Real-time documentation updates
- **File Operations** - Convention checking before edits
- **Development Work** - Workflow loading before coding
- **Tool Selection** - Right tool verification
- **Evidence & Claims** - Proof before assertions
- **Task Management** - TodoWrite enforcement
- **Session Management** - Compaction detection
- **Timestamp Accuracy** - Check actual time before adding timestamps
- **Git Operations** - gac format enforcement
- **Testing & Validation** - Completion verification

These create "cannot proceed without" gates that ensure proper execution naturally and automatically.