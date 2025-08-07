# Execution Patterns

> ⚠️ **HANDLERS MIGRATED**: All handlers from this file have been migrated to the new folder-based structure.
>
> Pattern handlers are now in:
> - `.claude/templates/handlers/orchestrators/` - Most pattern handlers (routing, meta-patterns)
> - `.claude/templates/handlers/operators/external/` - External operation patterns

[Original content preserved below for reference]

---

Meta-patterns that route to appropriate handlers in template files.

## Pattern Matching Rules {#pattern-matching-rules}
1. Check triggers in order (most specific first)
2. First match wins
3. Load pattern's routing rules
4. Delegate to referenced handlers

## ULTRATHINK Integration {#ultrathink-integration}

This file participates in the ULTRATHINK system:

### VOID Resolution
- **S = VOID** → See [resolve-session-void](CONVENTIONS.md#resolve-session-void)
- **W = VOID** → See [resolve-work-void](WORKFLOWS.md#resolve-work-void)
- **H = VOID** → See [resolve-handler-void](REGISTRY.md#resolve-handler-void)

### Pattern Requirements
Meta-patterns in this file help resolve ambiguous requests. When H = VOID due to unclear intent, these patterns help identify the appropriate handler.

## Core Patterns {#core-patterns}

#### Pattern: execute-ultrathink {#execute-ultrathink}
**Triggers**: Start of ANY development request
**Pre-conditions**: 
- Development signal detected in user request
- No ULTRATHINK output yet
**Process**:
1. Output: "Let me ultrathink about this... [S:X|W:Y|H:Z|E:steps/"criteria"]"
2. Determine S (Session):
   - Run `date '+%Y%m%d'` for today's date
   - Check SESSION.md for matching entry
   - If no match → S = VOID→conventions
3. Determine W (Work context):
   - Analyze request type and domain
   - Check active work folders
   - Apply W VOID rules:
     - Direct folder match → W = folder-name
     - Search/analysis → W = "investigating"
     - Review request → W = "reviewing"
     - Planning → W = "planning"
     - No match → W = VOID→workflows
4. Determine H (Handler):
   - Extract keywords from request
   - Search REGISTRY for matches
   - If unclear → H = VOID→registry
5. For each VOID value:
   - Route to appropriate resolver
   - Cannot proceed until resolved
6. Output final valid [S:W:H]
7. Continue to matched handler
**Success**: Valid [S:W:H] obtained and handler executed
**Failure**: Cannot resolve one or more values
**Examples**:
- "Create a login component" → [S:20250726|W:auth-feature|H:create-component]
- "Fix the bug" → [S:20250726|W:VOID→workflows|H:fix-bug]
- First request of day → [S:VOID→conventions|W:?|H:?]

## Work Patterns {#work-patterns}

#### Pattern: work-activity {#work-activity}
**Triggers**: test, testing, implement, analyze, fix, document, "new feature", "work on", build, develop
**Pre-conditions**: None (meta-pattern)
**Process**:
1. Check for active work folder in docs/ai/work-tracking/active/
2. If exists → Load WORKFLOWS.md#continue-work
3. If not → Load WORKFLOWS.md#start-new-work
4. Follow loaded handler
**Success**: Routed to appropriate work handler
**Failure**: Use generic work creation
**Examples**:
- "Let's test auth" → Routes to start-new-work
- "Continue testing" → Routes to continue-work
- "Fix the login bug" → Routes to start-new-work or continue-work

#### Pattern: work-continuation {#work-continuation}
**Triggers**: continue, resume, "back to", "keep working", "where were we"
**Pre-conditions**: Previous work context exists
**Process**:
1. Check TodoWrite for active tasks
2. Check recent work folders
3. Load WORKFLOWS.md#continue-work
**Success**: Resumed from correct context
**Failure**: Ask which work to continue
**Examples**:
- "Continue working on auth" → Resumes auth work
- "Where were we?" → Shows current context

## File Patterns {#file-patterns}

#### Pattern: file-operation {#file-operation}
**Triggers**: edit, update, modify, "add to", append, change
**Pre-conditions**: Target file identifiable
**Process**:
1. Extract filename from request
2. Check CONVENTIONS.md#{filename}-editing-rules
3. If special file → Apply specific rules:
   - tracker.md → Append to Progress Log only
   - findings.md → Append to appropriate section
   - SESSION.md → Append after Current Focus
4. Else → Standard edit flow
**Success**: Correct edit rules applied
**Failure**: Ask which file to edit
**Examples**:
- "Update tracker" → Append-only rules
- "Fix typo in code" → Standard edit
- "Add to findings" → Append to discoveries

#### Pattern: file-creation {#file-creation}
**Triggers**: create file, new file, "write a file", generate
**Pre-conditions**: File type and location clear
**Process**:
1. Check CONVENTIONS.md#naming-conventions
2. Verify parent directory exists
3. If work-related → Create in proper work folder
4. Use Write tool (not Serena)
**Success**: File created with proper conventions
**Failure**: Ask for file details
**Examples**:
- "Create MyComponent.tsx" → Check casing conventions
- "New test file" → Follow test naming pattern

## Tool Patterns {#tool-patterns}

#### Pattern: tool-selection {#tool-selection}
**Triggers**: search, find, where, "how does", look for, locate
**Pre-conditions**: Operation type clear
**Process**:
1. Identify operation type
2. Load TOOLS.md#tool-selection-matrix
3. Route to appropriate handler:
   - Code understanding → TOOLS.md#search-code
   - Simple text → TOOLS.md#grep-search
   - File listing → TOOLS.md#list-files
**Success**: Correct tool selected
**Failure**: Ask for clarification
**Examples**:
- "Find TODO comments" → Uses Grep
- "How does auth work?" → Uses Serena
- "Where is UserService?" → Uses Serena find_symbol

#### Pattern: code-creation {#code-creation}
**Triggers**: create, write, generate, implement, build component
**Pre-conditions**: Clear what to create
**Process**:
1. Check existing patterns/conventions
2. Use Edit/Write tools (NEVER Serena)
3. Follow TDD if applicable
**Success**: Code created following conventions
**Failure**: Ask for specifications
**Examples**:
- "Create login component" → Write with conventions
- "Generate test file" → Follow test patterns

## Evidence Patterns {#evidence-patterns}

#### Pattern: evidence-check {#evidence-check}
**Triggers**: "the system", "it uses", "the code", claims about implementation
**Pre-conditions**: Making assertion about codebase
**Process**:
1. Flag: NEED_EVIDENCE = true
2. Load CONVENTIONS.md#gather-evidence
3. Search for proof before claiming
4. Include file:line reference
**Success**: Evidence found and cited
**Failure**: "I need to verify this"
**Examples**:
- "The system uses JWT" → Must find JWT usage
- "It implements caching" → Must locate cache code

#### Pattern: architecture-claim {#architecture-claim}
**Triggers**: "architecture", "designed to", "structured as", system claims
**Pre-conditions**: Making design assertion
**Process**:
1. Search for architecture docs first
2. Find code evidence second
3. Cite both sources
**Success**: Multi-source evidence
**Failure**: "Let me investigate the architecture"
**Examples**:
- "The app uses MVC" → Find structure evidence
- "It's event-driven" → Locate event handling

## Time Patterns {#time-patterns}

#### Pattern: time-capture {#time-capture}
**Triggers**: timestamp, date, "current time", "log entry", now
**Pre-conditions**: Time reference needed
**Process**:
1. Execute: date "+%Y-%m-%d %H:%M %Z"
2. Store in variable for use
3. Never type manually
**Success**: Accurate timestamp used
**Failure**: N/A (command always works)
**Examples**:
- "Add timestamp" → 2025-07-13 14:45 CEST
- "Log current time" → Exact system time

## Complex Patterns {#complex-patterns}

#### Pattern: ambiguous-request {#ambiguous-request}
**Triggers**: vague terms like "it", "that", "this", "the thing"
**Pre-conditions**: Context unclear
**Process**:
1. Check TodoWrite for active context
2. Check recent operations
3. If still unclear → Ask for clarification
**Success**: Context resolved
**Failure**: "Could you clarify what you're referring to?"
**Examples**:
- "Fix it" → Check what "it" refers to
- "Update that" → Resolve "that" from context

#### Pattern: multi-step-request {#multi-step-request}
**Triggers**: "and then", "after that", multiple verbs
**Pre-conditions**: Multiple operations requested
**Process**:
1. Parse into separate tasks
2. Create TodoWrite entries
3. Execute in sequence
**Success**: All steps completed
**Failure**: Ask to break down request
**Examples**:
- "Find bug and fix it" → Two separate operations
- "Test, fix, and commit" → Three-step process

## Meta Patterns {#meta-patterns}

#### Pattern: lost-context {#lost-context}
**Triggers**: "I'm lost", "what was I doing", confused state
**Pre-conditions**: User needs orientation
**Process**:
1. Check TodoWrite state
2. Check recent work folders
3. Run git status
4. Provide current context summary
**Success**: User reoriented
**Failure**: Suggest starting fresh
**Examples**:
- "I'm lost" → Show current state
- "What was I working on?" → Display active tasks

#### Pattern: system-improvement {#system-improvement}
**Triggers**: "improve system", "make better", enhancement requests
**Pre-conditions**: Meta-work requested
**Process**:
1. Load BUILDING-BETTER.md#system-improvements
2. Check which component to improve
3. Follow improvement workflow
**Success**: System enhanced
**Failure**: Ask what to improve
**Examples**:
- "Make reminders better" → This pattern system!
- "Improve handlers" → Update template files