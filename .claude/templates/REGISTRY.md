# Claude Template System Registry

Complete index of all handlers, patterns, tools, and conventions across the template system.

## 🎯 Quick Navigation

- [Navigation Keywords](#navigation-keywords) - Keyword to handler mapping
- [Intent Handlers](#intent-handlers) - User request processing (WORKFLOWS.md)
- [Tool Selection Handlers](#tool-selection-handlers) - Tool routing (TOOLS.md)
- [Convention Handlers](#convention-handlers) - Standards enforcement (CONVENTIONS.md)
- [Execution Patterns](#execution-patterns) - Meta-routing (PATTERNS.md)
- [Integration Handlers](#integration-handlers) - Cross-system (BUILDING-BETTER.md)
- [Behavioral Hooks](#behavioral-hooks) - Automatic enforcement (BEHAVIORS.md)
- [Decision Matrices](#decision-matrices) - Quick lookup tables (MATRICES.md)
- [Special Files](#special-files) - File-specific rules (CONVENTIONS.md)
- [Common Commands](#common-commands) - Copy-paste commands
- [Tool Selection Matrix](#tool-selection-matrix) - Which tool when

## 🔍 Navigation Keywords

Quick keyword lookup for finding handlers based on natural language.

### Action Keywords → Handlers
| Keywords | Primary Handler | Secondary Options | Location |
|----------|----------------|-------------------|----------|
| work, working, start | start-new-work | continue-work | WORKFLOWS.md |
| implement, implementing | implement-feature | start-new-work | WORKFLOWS.md |
| fix, fixing, resolve | fix-problem | debug | WORKFLOWS.md |
| debug, debugging | debug | analyze-error | WORKFLOWS.md |
| error, failing, failed | analyze-error | debug | WORKFLOWS.md |
| search, find, looking | search-code | find-symbol, grep-pattern | TOOLS.md |
| edit, modify, update, change | edit-file | - | TOOLS.md |
| commit, save | create-commit-message | commit-changes | WORKFLOWS/TOOLS |
| create, new, make | create-component | start-new-work | WORKFLOWS.md |
| test, testing | test-implementation | create-test-checkpoint | WORKFLOWS.md |

### Context Keywords
| Keywords | Likely Context | Handlers | Location |
|----------|---------------|----------|----------|
| bug, issue, problem | Problem solving | fix-problem, debug | WORKFLOWS.md |
| feature, functionality | Development | start-new-work, implement-feature | WORKFLOWS.md |
| component, widget, ui | UI work | create-component | WORKFLOWS.md |
| git, repository, branch | Version control | Git handlers section | TOOLS.md |
| code, function, class | Code search | search-code, find-symbol | TOOLS.md |
| session, continue, resume | Session management | session-start, continue-work | WORKFLOWS/CONVENTIONS |

## Intent Handlers (WORKFLOWS.md)

Location: `.claude/templates/WORKFLOWS.md#intent-handlers`

### Development Work
- `start-new-work` - Initialize new feature/component
- `continue-work` - Resume existing work with context
- `standard-dev-workflow` - Follow development process
- `create-component` - Create new UI/code component
- `refactor-code` - Improve code structure
- `implement-feature` - Feature implementation with TDD
- `create-work-folder` - Initialize work tracking
- `save-context` - Preserve current state
- `restore-context` - Resume from saved state

### Problem Solving  
- `fix-problem` - Bug fix workflow
- `debug` - Debug code issues
- `test-implementation` - Test-driven development
- `analyze-error` - Stack trace examination
- `root-cause-analysis` - Deep problem investigation

### Session Management
- `session-start` - Initialize new session (NOW IN CONVENTIONS.md!)
- `session-end` - Close session properly
- `show-capabilities` - Display system capabilities
- `check-progress` - Show current state
- `update-tracker` - Progress documentation

### Task Management
- `create-todos` - Break down into tasks
- `orchestrate-task` - Deploy specialists
- `create-test-checkpoint` - User testing points
- `sequential-processing` - One subtask at a time

### Git & Commits
- `create-commit-message` - Generate proper message
- `create-pr` - Pull request workflow
- `tag-release` - Version tagging

## Tool Selection Handlers (TOOLS.md)

Location: `.claude/templates/TOOLS.md#tool-selection-handlers`

### Search Operations
- `search-code` - Find code with Serena
- `find-symbol` - Locate specific symbols
- `find-references` - Find symbol usage
- `grep-pattern` - Simple text search

### File Operations
- `read-file` - Display file contents
- `edit-file` - Modify file contents
- `create-file` - Create new files
- `delete-file` - Remove files safely

### Git Operations
- `check-status` - Git status
- `commit-changes` - Execute git commit
- `create-branch` - New git branch
- `view-history` - Git log

### Analysis Operations
- `analyze-code` - Code quality analysis
- `check-dependencies` - Dependency analysis
- `measure-complexity` - Complexity metrics

### External Tools
- `run-tests` - Execute test suite
- `check-lint` - Run linter
- `build-project` - Run build process

## Convention Handlers (CONVENTIONS.md)

Location: `.claude/templates/CONVENTIONS.md#convention-handlers`

### Evidence & Claims
- `verify-claim` - Require evidence for assertions
- `gather-evidence` - Search for proof
- `cite-source` - Include file:line references

### Naming & Style
- `check-naming` - Validate naming conventions
- `suggest-name` - Generate compliant names
- `check-style` - Code style validation

### Git Conventions
- `check-commit-msg` - Validate commit format
- `suggest-commit-type` - Recommend commit type
- `format-commit` - Apply commit conventions

### Pre-flight Checks
- `check-conventions-first` - Before-action checks
- `enforce-pre-flight` - System-wide enforcement

### Special File Rules
- `tracker-md-rules` - Append-only to Progress Log
- `findings-md-rules` - Append-only to Discoveries
- `session-md-rules` - Append after Current Focus
- `session-start` - Full SESSION.md handler (in CONVENTIONS.md)

## Execution Patterns (PATTERNS.md)

Location: `.claude/templates/PATTERNS.md`

### Work Patterns
- `work-activity` - Route to work handlers
- `work-continuation` - Resume previous work

### File Patterns
- `file-operation` - File edit routing
- `file-creation` - New file patterns

### Tool Patterns
- `tool-selection` - Choose right tool
- `code-creation` - Generate new code

### Evidence Patterns
- `evidence-check` - Verify claims
- `architecture-claim` - Design assertions

### Time Patterns
- `time-capture` - Timestamp handling

### Complex Patterns
- `ambiguous-request` - Clarify intent
- `multi-step-request` - Break down tasks

### Meta Patterns
- `lost-context` - User reorientation
- `system-improvement` - Enhance system

## Integration Handlers (BUILDING-BETTER.md)

Location: `.claude/templates/BUILDING-BETTER.md#cross-system-integration-handlers`

### Handler Interconnections
- `workflow-to-tool` - Connect workflows to tools
- `tool-to-convention` - Apply conventions to tools
- `convention-to-workflow` - Fix violations via workflow

### State Management
- `save-context` - Preserve work state
- `restore-context` - Resume from saved state
- `switch-context` - Change between contexts

## Common Commands (CONVENTIONS.md)

Location: `.claude/templates/CONVENTIONS.md#common-commands`

```bash
# Timestamps - ALWAYS use for documentation
date "+%Y-%m-%d %H:%M %Z"        # Full timestamp
date +%Y%m%d                      # Folder names

# Git Operations
gac "commit message"              # git add . && commit
git status                        # Check before committing
git diff                          # Review changes

# Project Commands
pnpm dev                          # Start development
pnpm build                        # Build project
pnpm test                         # Run tests
pnpm typecheck                    # Check types
```

## Tool Selection Matrix

### Action → Tool Mapping

| I need to... | For... | MUST use... | BLOCKED |
|--------------|---------|-------------|----------|
| Search | Simple text (TODO, logs) | `Grep` | - |
| Search | Code understanding | `mcp__serena__search_for_pattern` | grep |
| Search | Symbol definitions | `mcp__serena__find_symbol` | grep |
| Search | File patterns | `Glob` | find |
| Understand | Code structure | `mcp__serena__get_symbols_overview` | manual |
| Find references | To symbols | `mcp__serena__find_referencing_symbols` | grep |
| Edit | ANY file changes | `Edit` or `MultiEdit` | Serena editing |
| Create | New files | `Write` | Serena tools |
| List directory | Contents | `LS` | ls (bash) |
| Timestamp | Any document | `date "+%Y-%m-%d %H:%M %Z"` | manual typing |
| Commit | Code changes | `gac "message"` | git commit |
| Complex search | Multiple files | `Task` tool with agent | multiple greps |
| Deep analysis | Architecture | `Task` tool with ultrathink | surface analysis |

## Special Files

### Append-Only Files
- `tracker.md` - Progress Log section only
- `findings.md` - Discoveries section only
- `SESSION.md` - After Current Focus section

### Work Tracking Files (7-file structure, ALL CAPS)
- `IMPLEMENTATION.md` - The implementation plan (what we intend to do)
- `TRACKER.md` - Checkbox tasks tracking plan execution
- `CHANGELOG.md` - What actually changed/was built (results)
- `FINDINGS.md` - Discoveries and insights
- `DECISIONS.md` - Rationale for choices
- `MEMORY-REFS.md` - Related memories
- `HANDOFF.md` - Next session instructions
Plus subfolders: plans/, design/, code/, archive/

## Key Principles

### Tool Selection
1. **Serena** for code understanding, NOT editing
2. **Edit/Write** for ALL file modifications
3. **Grep** for simple text patterns
4. **Task** for complex multi-step work
5. **TodoWrite** before starting any work

### Convention Enforcement
1. **Timestamps** - Always use date command
2. **Git commits** - Single quotes, evidence-based
3. **File naming** - PascalCase for components
4. **Append-only** - Never insert in middle
5. **Evidence** - File:line for all claims

### Workflow Patterns
1. **Start work** → Create folder → Initialize todos
2. **Fix bugs** → Evidence first → Then theorize
3. **Search code** → Serena for semantic → Grep for text
4. **Complex tasks** → Task tool → Sequential processing
5. **Session end** → Update docs → Memory → Init + Commit messages

## Behavioral Hooks (BEHAVIORS.md)

Location: `.claude/templates/BEHAVIORS.md`

### Work Tracking
- Real-time documentation updates
- Automatic progress tracking
- Discovery documentation triggers
- Decision recording requirements

### File Operations
- Convention checking before edits
- File creation justification
- Deletion impact analysis

### Git Operations
- gac format enforcement
- Commit message validation
- PR creation process

### Task Management
- TodoWrite enforcement
- Task completion verification
- Progress tracking requirements

### Session Management
- Compaction detection
- Session creation rules
- Progress documentation

## Decision Matrices (MATRICES.md)

Location: `.claude/templates/MATRICES.md`

### Available Matrices
- **Request Type → Handler Matrix** - Route requests to handlers
- **File Type → Convention Matrix** - Apply file-specific rules
- **Problem Type → Solution Matrix** - Problem-solving paths
- **Context → Mode Matrix** - Activate appropriate modes
- **Error → Recovery Matrix** - Error handling strategies

### Usage
- Quick visual lookup
- Decision support
- Pattern recognition
- Error recovery

## Statistics

- **Total Handlers**: 85+
- **Intent Handlers**: 24 (WORKFLOWS.md)
- **Tool Handlers**: 18 (TOOLS.md)
- **Convention Handlers**: 15 (CONVENTIONS.md)
- **Patterns**: 13 (PATTERNS.md)  
- **Integration Handlers**: 6 (BUILDING-BETTER.md)
- **Behavioral Hooks**: 9 categories (BEHAVIORS.md)
- **Decision Matrices**: 5 matrices (MATRICES.md)
- **Protocol Exceptions**: 11 (CLAUDE.md)
- **Common Commands**: 10+ (CONVENTIONS.md)

## Registry Maintenance

When adding new items to template files:
1. Add to appropriate section in template
2. Update this registry immediately
3. Include in HANDLERS.md if it's a handler
4. Test with Serena search to verify

## Usage Examples

### Finding a Handler
```bash
# Search by trigger phrase
mcp__serena__search_for_pattern --substring_pattern "work on" --relative_path ".claude/templates"

# Search by handler name
mcp__serena__search_for_pattern --substring_pattern "Handler: start-new-work" --relative_path ".claude/templates/WORKFLOWS.md"
```

### Quick Lookups
- **Starting work?** → Check Intent Handlers → Development Work
- **Using a tool?** → Check Tool Selection Matrix
- **Git operation?** → Check Git Operations + Convention Handlers
- **File edit?** → Check Special Files first
- **Lost/confused?** → Check Meta Patterns

This registry is the complete index. Full handler definitions live in their respective template files.