# Complete Inventory: Handlers vs Templates vs Patterns

## WORKFLOWS.md

### Intent Handlers (23 total)
These have triggers and respond to user input:

#### Development Handlers
1. `start-new-work` - "I want to work on X", "Let's build Y"
2. `continue-work` - "continue with X", "back to Y", "resume Z"
3. `standard-dev-workflow` - "implement X", "add feature Y"
4. `create-component` - "create a new component", "build component X"
5. `refactor-code` - "refactor X", "clean up Y"

#### Task Management Handlers
6. `create-todos` - "plan out X", "break down Y"
7. `update-todos` - "mark X as done", "update task Y"
8. `check-progress` - "where are we?", "what's left?"

#### Session Management Handlers
9. `show-capabilities` - "what can you do", "help"
10. `start-session` - "let's start", "begin work"
11. `update-session` - "update SESSION.md", "record progress"
12. `end-session` - "let's wrap up", "end for today"
13. `checkpoint-session` - Mid-session progress saves

#### Specialist Deployment Handlers
14. `deploy-ultrathink` - "think deeply about X", "ultrathink on Y"
15. `deploy-specialist` - "get expert help on X", "need specialist for Y"
16. `orchestrate-complex` - "this needs multiple experts"

#### Testing Handlers
17. `create-test-checkpoint` - "test X", "create tests for Y"
18. `simulation-test` - "simulate X", "test workflow Y"
19. `validate-changes` - "verify X works", "validate the changes"

#### Work Tracking Handlers
20. `create-work-folder` - Automatic from other handlers
21. `update-tracker` - "update progress", "log work done"
22. `document-findings` - "I discovered X", "found that Y"
23. `record-decision` - "decided to X", "choosing Y approach"

### Behavioral Templates (NOT handlers!)
These are step-by-step guides with no triggers:
- `feature-template` - Feature implementation steps
- `bug-fix-template` - Bug fix workflow (locked steps)
- `code-review-template` - Code review process
- `refactoring-template` - Refactoring steps
- `documentation-update-template` - Doc update process
- `emergency-debug` - Emergency debug steps

## TOOLS.md

### Tool Selection Handlers (18 total)

#### Search Handlers
1. `search-code` - "find X", "search for Y", "look for Z in code"
2. `find-symbol` - "where is X defined", "find class Y"
3. `find-references` - "what uses X", "find references to Y"
4. `grep-pattern` - "grep for X", "search pattern Y"

#### File Operation Handlers
5. `read-file` - "show me X", "what's in Y"
6. `edit-file` - "change X to Y", "update Z"
7. `create-file` - "create new file X", "make file Y"
8. `delete-file` - "remove X", "delete file Y"

#### Git Handlers
9. `check-status` - "what's changed", "git status"
10. `commit-changes` - "commit with message X", "save changes"
11. `create-branch` - "new branch for X", "create branch Y"
12. `view-history` - "show recent commits", "git log"

#### Analysis Handlers
13. `analyze-code` - "analyze X for issues", "check Y quality"
14. `check-dependencies` - "what does X depend on"
15. `measure-complexity` - "how complex is X"

#### External Tool Handlers
16. `run-tests` - "run tests", "test the code"
17. `check-lint` - "check code style", "run linter"
18. `build-project` - "build the project", "compile code"

## CONVENTIONS.md

### Convention Handlers (16 total)

#### Evidence Handlers
1. `verify-claim` - "prove X is true", "verify that Y"
2. `gather-evidence` - "find evidence for X"
3. `cite-source` - "where does this come from"

#### Naming Handlers
4. `check-naming` - "is X named correctly"
5. `suggest-name` - "what should I call X"
6. `validate-path` - "is this the right location"

#### Code Style Handlers
7. `check-style` - "does X follow conventions"
8. `format-code` - "format X properly"
9. `review-patterns` - "is this idiomatic"

#### Git Convention Handlers
10. `check-commit-msg` - "is this commit message valid"
11. `suggest-commit-type` - "what type is this change"

#### Session Handlers
12. `session-start` - "start new session" (LOCATED HERE!)

#### Documentation Handlers
13. `check-docs-needed` - "does X need documentation"
14. `validate-comments` - "are these comments good"

#### Action Pre-Check Handlers
15. `check-conventions-first` - Internal trigger before actions
16. `enforce-pre-flight` - "enforce conventions"

## PATTERNS.md (10 Meta-Patterns)

These route to handlers, not handlers themselves:

1. `work-activity` - Routes to start-new-work or continue-work
2. `work-continuation` - Routes to continue-work
3. `file-operation` - Routes based on file type
4. `file-creation` - Routes to file creation handlers
5. `tool-selection` - Routes to appropriate tool handler
6. `code-creation` - Routes to code creation handlers
7. `evidence-check` - Routes to evidence gathering
8. `architecture-claim` - Routes to architecture verification
9. `time-capture` - Routes to timestamp handling
10. `ambiguous-request` - Handles unclear requests
11. `multi-step-request` - Breaks down complex requests
12. `lost-context` - Helps user reorient
13. `system-improvement` - Routes to meta-improvements

## BUILDING-BETTER.md

### Cross-System Integration Handlers (6 total)
1. `workflow-to-tool` - Connect workflows to tools
2. `tool-to-convention` - Apply conventions to tools
3. `convention-to-workflow` - Fix violations via workflow
4. `save-context` - Preserve work state
5. `restore-context` - Resume from saved state
6. `switch-context` - Change between contexts

## BEHAVIORS.md

Not handlers, but automatic enforcement hooks that create "cannot proceed" gates.

## MATRICES.md

Quick lookup tables for decision making, references handlers but doesn't contain any.

## Summary of Findings

### Total ACTUAL Handlers: 81
- WORKFLOWS.md: 23 intent handlers
- TOOLS.md: 18 tool selection handlers
- CONVENTIONS.md: 16 convention handlers
- BUILDING-BETTER.md: 6 integration handlers
- PATTERNS.md: 13 meta-patterns (not handlers but routing logic)

### Templates (Step-by-step guides): 6
- All in WORKFLOWS.md Behavioral Templates section

### Critical Discoveries
1. `session-start` is in CONVENTIONS.md, NOT WORKFLOWS.md
2. Many REGISTRY entries are phantoms (never existed)
3. Templates like `bug-fix-template` are NOT handlers
4. Patterns are routing logic, not handlers themselves

### Handlers That DON'T Exist (Phantoms in REGISTRY)
- `implement-feature` (actual: standard-dev-workflow)
- `fix-problem` (no handler, but template exists)
- `debug` or `debug-issue` (actual: emergency-debug template)
- `analyze-error` (doesn't exist)
- `root-cause-analysis` (doesn't exist)
- `test-implementation` (actual: create-test-checkpoint)
- `orchestrate-task` (actual: orchestrate-complex)
- `create-commit-message` (doesn't exist)
- `create-pr` (doesn't exist)
- `tag-release` (doesn't exist)
- `format-commit` (doesn't exist)
- `tracker-md-rules` (special file rules, not handler)
- `findings-md-rules` (special file rules, not handler)
- `session-md-rules` (special file rules, not handler)

### Handlers Missing from System
- `debug-issue` - Should route to emergency-debug template
- `fix-bug` - Should route to bug-fix-template
- Maybe `create-pull-request` and `create-release`