# Handler Folder Structure Design

## Complete Hierarchy

```
.claude/staging/handlers/
├── triggers/              # User-facing entry points
│   ├── development/       # "implement X", "create Y"
│   ├── git/              # "commit", "push", "create branch"
│   ├── search/           # "find", "search", "where is"
│   ├── debug/            # "fix bug", "debug", "why failing"
│   ├── workflow/         # "start work", "update tracker"
│   ├── docs/             # "document", "explain"
│   └── test/             # "test", "validate"
│
├── orchestrators/        # Multi-step coordinators
│   ├── development/      # Complex features
│   ├── workflow/         # Multi-phase processes
│   ├── analysis/         # Deep investigations
│   └── session/          # Session management
│
└── operators/            # Atomic operations
    ├── file/             # Read, write, edit
    ├── git/              # Add, commit, push
    ├── search/           # Grep, find, glob
    ├── external/         # External tools
    └── session/          # State updates
```

## Classification Rules

### Triggers (User Entry Points)
- Respond to user commands
- Parse user intent
- Route to appropriate handlers
- Examples: "work on X", "fix bug Y"

### Orchestrators (Coordinators)
- Manage multi-step workflows
- Coordinate multiple operators
- Handle complex logic
- Examples: implement-feature, debug-complex-issue

### Operators (Atomic Actions)
- Single, focused operations
- Direct tool usage
- No complex logic
- Examples: read-file, run-grep, update-json

## Domain Classifications

### development
- Code implementation
- Feature creation
- Component building
- Refactoring

### git
- Version control
- Commits, branches
- History, status
- Collaboration

### search
- Finding code
- Pattern matching
- Symbol lookup
- File discovery

### debug
- Problem investigation
- Error analysis
- Bug fixing
- Performance issues

### workflow
- Work tracking
- Session management
- Progress updates
- Task organization

### docs
- Documentation
- Comments
- Explanations
- Guides

### test
- Testing
- Validation
- Quality checks
- Coverage

### file
- File operations
- Reading/writing
- Editing
- Moving

### external
- External tools
- Build systems
- Package managers
- CLI tools

### session
- Session state
- Progress tracking
- Memory management
- Checkpoints

### analysis
- Code analysis
- Dependency checking
- Complexity metrics
- Pattern detection

## Naming Conventions

### Handler IDs
- Kebab-case: `start-new-work`
- Descriptive: `implement-react-component`
- Action-oriented: `fix-typescript-error`
- Unique across system

### File Names
- Match handler ID: `start-new-work.md`
- Always `.md` extension
- No special characters
- Lowercase only

## Placement Decision Tree

```
Is it triggered by user command?
├─ YES → triggers/
│   └─ What domain? → appropriate subfolder
└─ NO
    ├─ Does it coordinate multiple operations?
    │   ├─ YES → orchestrators/
    │   └─ NO → operators/
    └─ What domain? → appropriate subfolder
```

## Examples

### Trigger Placement
- "work on X" → `triggers/workflow/start-new-work.md`
- "fix bug" → `triggers/debug/fix-bug.md`
- "commit changes" → `triggers/git/commit-changes.md`

### Orchestrator Placement
- Complex feature → `orchestrators/development/implement-feature.md`
- Debug workflow → `orchestrators/debug/debug-complex-issue.md`
- Session flow → `orchestrators/session/manage-session.md`

### Operator Placement
- Read file → `operators/file/read-file.md`
- Run grep → `operators/search/grep-pattern.md`
- Update JSON → `operators/file/update-json.md`