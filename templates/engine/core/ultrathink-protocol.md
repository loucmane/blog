---
id: ultrathink-protocol
type: engine-component
priority: critical
dependencies:
  - templates/registry/index.md
  - templates/PATTERNS.md#execute-ultrathink
  - .claude/ULTRATHINK-ENFORCER.md
exports:
  - ultrathink-format
  - pre-ultrathink-sequence
  - handler-search-protocol
  - evidence-requirements
---

# 🧠 ULTRATHINK: MANDATORY THINKING MODE

**EVERY REQUEST REQUIRES MAXIMUM THINKING DEPTH**
- Use "ultrathink" mode as your standard operating procedure
- This ensures thorough analysis even for 'simple' tasks
- Hidden complexity often emerges only through deep thinking
- Better to overthink than underthink - there's no penalty for being thorough
- Format: "Let me ultrathink about this... [S:X|W:Y|H:Z|E:steps/\"criteria\"]" before any implementation
  - S = Today's session ID resolved from `sessions/` (use sessions/current or create via session-start)
  - W = Current work context from active/ (or VOID→workflows for optimal work)
  - H = Handler matching request (or VOID→registry for best practice) 
  - E = Evidence (step count/key:"most critical step") proving handler comprehension
  - **Handler Search Protocol**: When H unknown, MUST: 1) State "Searching for handler...", 2) Show search command + results, 3) Use H:searching|E:pending if unsure
  - **MANDATORY**: First ULTRATHINK must use H:searching|E:pending, then show search, then final ULTRATHINK with found handler
  - Context: W can be folder name, "investigating", "reviewing", "planning" - changes with task focus
  - In work folders (/work-tracking/active/*): Always required
- This format triggers [execute-ultrathink](templates/PATTERNS.md#execute-ultrathink) handler
- VOID states auto-resolve via template handlers

## PRE-ULTRATHINK PROTOCOL (Prevents false compliance)

- **NEVER** output ULTRATHINK as first response to any development request
- **REQUIRED SEQUENCE**:
  1. First output: "Searching for appropriate handler for [request type]..."
  2. Show actual search command and 1-2 results
  3. **HANDLER COMPREHENSION**: "Reading handler: [name]" then "Key steps: [list 2-3 critical steps from Process]"
  4. Output: "Let me ultrathink about this... [S:X|W:Y|H:searching|E:pending]"
  5. After comprehension, final: "Let me ultrathink about this... [S:X|W:Y|H:found-handler|E:n/key:"most critical step"]"
- **Why**: Comprehension check forces actual handler reading - can't list steps without reading them
- **Violation**: Wrong step count, missing key steps, or generic descriptions = didn't read handler

## Field Definitions

- **S**: Session ID from `sessions/` (or VOID→session-start)
- **W**: Work context (folder/activity or VOID→workflows)  
- **H**: Handler name (or searching/VOID→registry)
- **E**: Evidence (steps/"success criteria")

## Special E Field Values

- E:pending - During handler search only
- E:steps/None - No success criteria
- E:steps/"varies" - Conditional success
- E:steps/redirect - Routing handlers
- E:steps/"interactive" - User input required

## Handler Validation Required

Never use a handler name without finding it first:
- Unsure: Use H:searching|E:pending
- Not found: Use H:VOID→registry|E:searching
- Always show: "Found: [handler] ([template]#[anchor])"
- Execute with real handler in new ULTRATHINK

## Evidence-Based Execution

After ULTRATHINK, execute with inline evidence:
- File paths for all changes
- Line numbers for edits
- Operation summaries for commands
- Error messages if encountered

## Completion Status

- ✓ Completed: [handler] ([X] steps)
- ⚠️ Interrupted: [handler] ([Y] of [X] steps)
- ❌ Failed: [handler] (error at step [Y])