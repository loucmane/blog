# Behavioral Hooks

This document contains all automatic behavioral hooks that enforce conventions and guide actions. These are the "cannot proceed without" gates that make the system work naturally.

## 🎯 Quick Navigation

- **[Work Tracking](#work-tracking)** - Real-time documentation enforcement
- **[File Operations](#file-operations)** - Before editing any file
- **[Development Work](#development-work)** - Before implementing features
- **[Tool Selection](#tool-selection)** - Before using any tool
- **[Evidence & Claims](#evidence--claims)** - Before making assertions
- **[Task Management](#task-management)** - Before starting work
- **[Session Management](#session-management)** - Compaction detection
- **[Git Operations](#git-operations)** - Before commits and PRs
- **[Testing & Validation](#testing--validation)** - Before marking complete

## Work Tracking

### Before Starting Any Work
```
TRIGGER: Beginning new development task
ACTION: Check for work tracking folder
BLOCKS: Cannot start without work tracking
PROCESS:
1. mcp__serena__search_for_pattern --substring_pattern "Create Work Tracking" --relative_path ".claude/templates/WORKFLOWS.md"
2. Create folder with 6-file structure
3. Initialize tracker.md with goals
CROSS-REF: See WORKFLOWS.md section "Create Work Tracking Folder"
```

### After Any Significant Discovery
```
TRIGGER: Found bug cause, pattern, solution, or insight
ACTION: Update findings.md immediately
BLOCKS: Cannot proceed to next investigation
FORMAT:
### [Timestamp] - [Brief Title]
#### The Discovery
[What was found]
#### Why It Matters
[Impact and implications]
TIMING: Within 2 minutes of discovery
```

### After Making Decisions
```
TRIGGER: Chose approach, tool, pattern, or direction
ACTION: Update decisions.md with rationale
BLOCKS: Cannot implement without documenting why
FORMAT:
### [Number]. [Decision Title]
**Decision**: [What was decided]
**Rationale**: [Why this choice]
**Alternatives Considered**: [Other options]
**Evidence**: [What supports this]
TIMING: Before implementation begins
```

### After Implementation Progress
```
TRIGGER: Completed todo item or reached milestone
ACTION: Update both tracker.md and implementation.md
BLOCKS: Cannot mark todo complete without updating
UPDATES:
- tracker.md: Add progress log entry with timestamp
- implementation.md: Document what was implemented
TIMING: Immediately after completion
```

### Every 30 Minutes Active Work
```
TRIGGER: 30 minutes elapsed during active development
ACTION: Update all relevant work tracking files
BLOCKS: Cannot continue without checkpoint
MINIMUM UPDATES:
- tracker.md: Progress log entry
- Current status of todos
- Any blockers encountered
```

### Before Context Switch
```
TRIGGER: Switching to different task/area
ACTION: Update handoff.md with current state
BLOCKS: Cannot switch without documenting
INCLUDE:
- Exact stopping point
- Next immediate steps
- Any open questions
- File paths being worked on
```

### When Tests Fail
```
TRIGGER: Test failure during implementation
ACTION: Document in findings.md
BLOCKS: Cannot just fix without understanding
CAPTURE:
- Exact error message
- What was expected
- Initial hypothesis
- Fix applied
```

## File Operations

### Before Any File Edit
```
TRIGGER: About to use Edit/Write/MultiEdit
ACTION: mcp__serena__search_for_pattern --substring_pattern "[filename] conventions" --relative_path ".claude/templates/CONVENTIONS.md"
BLOCKS: Cannot edit until conventions checked
EXAMPLE: Before editing SESSION.md, must check SESSION.md conventions
CROSS-REF: See CONVENTIONS.md for specific file rules
```

### Before Creating New Files
```
TRIGGER: About to use Write on non-existent file
ACTION: Check if similar file exists that should be edited instead
BLOCKS: Cannot create without justification
PRINCIPLE: Always prefer editing to creating
CROSS-REF: See CONVENTIONS.md "File Creation Rules"
```

### Before Deleting Files
```
TRIGGER: Request to remove/delete files
ACTION: Verify not in .gitignore, check dependencies
BLOCKS: Cannot delete without impact analysis
EXCEPTION: Temporary files, cache files
```

## Development Work

### Before Implementation
```
TRIGGER: About to write new code/features  
ACTION: mcp__serena__search_for_pattern --substring_pattern "start-new-work" --relative_path ".claude/templates/REGISTRY.md"
THEN: Load handler from WORKFLOWS.md
BLOCKS: Cannot code without workflow
CROSS-REF: See WORKFLOWS.md "Standard Development Workflow"
```

### Before Starting Any Work
```
TRIGGER: About to begin any multi-step task
ACTION: TodoWrite with comprehensive task breakdown
BLOCKS: Cannot start without task list
FORMAT:
- Break into specific, actionable items
- Include research, implementation, testing
- Mark in_progress when starting
- Complete immediately when done
CROSS-REF: See WORKFLOWS.md "Task Management"
```

### Before Refactoring
```
TRIGGER: About to change existing code structure
ACTION: Ensure tests exist and pass first
BLOCKS: Cannot refactor without test safety net
PROCESS: Run tests → Refactor → Run tests again
```

## Tool Selection

### Before Tool Use
```
TRIGGER: About to search/find anything
ACTION: mcp__serena__search_for_pattern --substring_pattern "tool-selection" --relative_path ".claude/templates/REGISTRY.md"
THEN: Check tool matrix for correct tool
BLOCKS: Cannot use wrong tool
CROSS-REF: See TOOLS.md "Tool Selection Matrix"
```

### Before Using Grep
```
TRIGGER: About to search with Grep
ACTION: Consider if Serena's find_symbol would be better
BLOCKS: Use Serena for code symbols
RULE: Grep for text patterns, Serena for code understanding
CROSS-REF: See TOOLS.md "Grep vs Serena"
```

### Before Using Task Tool
```
TRIGGER: Complex search or exploration needed
ACTION: Use Task tool for multi-step searches
BLOCKS: Don't do manual iteration
BENEFIT: Task tool handles complexity better
```

## Evidence & Claims

### Before Making Claims
```
TRIGGER: About to state facts about code
ACTION: mcp__serena__search_for_pattern --substring_pattern "evidence-check" --relative_path ".claude/templates/REGISTRY.md"
THEN: Gather evidence first
BLOCKS: No claims without proof
CROSS-REF: See PATTERNS.md "Evidence-Based Claims"
```

### Before Explaining How Code Works
```
TRIGGER: User asks "how does X work?"
ACTION: Find and read actual code first
BLOCKS: Cannot explain without seeing code
EVIDENCE: Line numbers, file paths, actual code
```

### Before Stating Dependencies
```
TRIGGER: About to say "X uses Y" or "X depends on Y"
ACTION: Verify in package.json, imports, or configs
BLOCKS: Cannot claim dependencies without proof
CHECK: Lock files, import statements, configs
```

## Task Management

### Before Marking Task Complete
```
TRIGGER: About to update todo status to completed
ACTION: Verify task actually done
BLOCKS: Cannot mark complete if failed/partial
CHECK:
- Implementation finished
- Tests pass (if applicable)
- Work tracking updated
- No errors or blockers
```

### Before Creating New Todos
```
TRIGGER: Adding tasks to TodoWrite
ACTION: Ensure tasks are specific and actionable
BLOCKS: No vague or compound tasks
FORMAT: Each todo should be independently completable
```

### When Todo List Gets Large
```
TRIGGER: More than 20 active todos
ACTION: Review and consolidate
BLOCKS: Cannot add more without cleanup
PROCESS: Complete, defer, or remove stale items
```

## Session Management

### Detecting Compaction Need
```
TRIGGER: User mentions "X% left", "compaction", "context getting full"
ACTION: Immediately provide resume message
BLOCKS: Cannot continue without giving resume instructions
RESPONSE FORMAT:

## 📦 Ready for Compaction

**To Resume After Compaction**, use this exact message:
---
Activate project [current-project-path], 
read memory [latest-session-memory] and SESSION.md.
Continue with [specific next tasks].
---

**Work Saved**: 
✓ Work tracking updated
✓ Session memory created
✓ SESSION.md current
✓ All todos documented

**Next Tasks**: 
- [List specific pending tasks with IDs]
- [Include work tracking folder name]
- [Note any blockers or context]

CROSS-REF: See WORKFLOWS.md "Compaction Protocol"
```

### Before Creating New Session
```
TRIGGER: "start new session" or beginning work
ACTION: mcp__serena__search_for_pattern --substring_pattern "session-start" --relative_path ".claude/templates/CONVENTIONS.md"
BLOCKS: Cannot create session without structure check
VERIFY: Current Focus section exists
CROSS-REF: See CONVENTIONS.md "SESSION.md Structure"
```

### Before Ending Session
```
TRIGGER: Work complete or switching tasks
ACTION: Update SESSION.md progress log
BLOCKS: Cannot leave session undocumented
UPDATE: Progress log, session status, next steps
```

## Git Operations

### When User Says "gac"
```
TRIGGER: User mentions "gac" or asks for commit message
ACTION: 
1. VERIFY no double quotes inside message (would break gac)
2. CHECK conventional commit format (type: description)
3. PROVIDE raw commit message without formatting
BLOCKS: Cannot provide message in code blocks or with extra text
FORMAT:
- Just the commit message text
- No code blocks
- No "Here's your commit message:" prefix
- No formatting or markdown
- Follow conventional commit format
- Use single quotes (') inside message if needed
- NEVER use double quotes inside the message
VERIFY CHECKLIST:
□ No double quotes inside message?
□ Has type prefix (feat/fix/docs/etc)?
□ Follows format: "type: description"?
□ Any quotes inside use single quotes?
EXAMPLE: 
User: "give me gac"
AI: feat: add new feature with 'special' handling
```

### Before Any Commit
```
TRIGGER: About to commit changes
ACTION: mcp__serena__search_for_pattern --substring_pattern "commit-changes" --relative_path ".claude/templates/REGISTRY.md"
BLOCKS: Cannot commit without convention check
VERIFY: Message format, file staging, tests pass
CROSS-REF: See TOOLS.md "Git Operations"
```

### Before Creating PR
```
TRIGGER: User requests pull request
ACTION: Load PR creation handler
BLOCKS: Cannot create without proper process
STEPS: Check branch, push changes, format PR body
CROSS-REF: See TOOLS.md "Creating Pull Requests"
```

### Before Git Config Changes
```
TRIGGER: Any git config command
ACTION: Stop immediately
BLOCKS: NEVER modify git configuration
REASON: User's personal settings
```

## Testing & Validation

### Before Marking Task Complete
```
TRIGGER: About to mark todo as completed
ACTION: Verify task actually done
BLOCKS: Cannot mark complete if failed/partial
CHECK: Tests pass, implementation complete, no errors
```

### Before Running Tests
```
TRIGGER: Need to test implementation
ACTION: Check README or package.json for test command
BLOCKS: Cannot assume test framework
NEVER: Assume jest, mocha, etc. without checking
```

### Before Claiming "It Works"
```
TRIGGER: Implementation appears complete
ACTION: Run actual tests or validation
BLOCKS: Cannot claim success without verification
MINIMUM: Lint passes, types check, tests run
```

## Special Behaviors

### URL Handling
```
TRIGGER: Need to reference a URL
ACTION: Only use URLs from user or local files
BLOCKS: Cannot guess or generate URLs
EXCEPTION: Documentation sites if explicitly helping with programming
```

### Natural Conversation Mode
```
TRIGGER: Casual chat, no development signals
ACTION: Skip all behavioral hooks
RESPOND: Naturally without protocol
EXAMPLES: "how's the weather?", general questions
```

### Error Recovery
```
TRIGGER: Behavioral hook fails
ACTION: Check ERROR → Recovery Matrix in MATRICES.md
BLOCKS: Cannot proceed without recovery plan
FALLBACK: Ask user for guidance
CROSS-REF: See MATRICES.md "Error → Recovery Matrix"
```

## Cross-Reference Map

### BEHAVIORS.md → Other Templates
- Work Tracking → WORKFLOWS.md "Create Work Tracking Folder"
- File Operations → CONVENTIONS.md (specific file rules)
- Development Work → WORKFLOWS.md "Standard Development Workflow"
- Tool Selection → TOOLS.md "Tool Selection Matrix"
- Evidence & Claims → PATTERNS.md "Evidence-Based Claims"
- Session Management → CONVENTIONS.md "SESSION.md Structure"
- Git Operations → TOOLS.md "Git Operations"
- Error Recovery → MATRICES.md "Error → Recovery Matrix"

### Other Templates → BEHAVIORS.md
- CLAUDE.md → "See BEHAVIORS.md for all behavioral hooks"
- WORKFLOWS.md → "For enforcement, see BEHAVIORS.md"
- CONVENTIONS.md → "Automated via BEHAVIORS.md"
- REGISTRY.md → Lists all behaviors with locations

## Integration with CLAUDE.md

CLAUDE.md references these behaviors through:
```
### BEHAVIORAL HOOKS (How I Actually Work)
For all behavioral enforcement, see BEHAVIORS.md
These create "cannot proceed without" gates that ensure proper execution.
```

Each behavior here becomes an interrupt in my execution flow, ensuring I follow conventions naturally and automatically.

## Adding New Behaviors

When adding a new behavior:
1. Identify the trigger clearly
2. Specify the blocking action
3. Define what satisfies the gate
4. Add to appropriate section
5. Update REGISTRY.md if needed
6. Add cross-references to related templates
7. Ensure corresponding workflow exists

Remember: Behaviors are not suggestions - they are mandatory execution gates that ensure system integrity.