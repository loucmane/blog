# EXACT Directory Structure for Remaining Migrations

## 🚨 CRITICAL: ALL MODULES GO UNDER `.claude/templates/` 🚨

## WORKFLOWS.md Migration Structure (Matching Handler Pattern)

```
/home/loucmane/dev/javascript/MomsBlog/blog/.claude/templates/workflows/
├── core/
│   └── ultrathink-system.md          # Core ULTRATHINK docs (if not duplicate)
├── protocols/
│   ├── universal-flight.md           # Pre/during/post flight checks
│   └── execution-protocol.md         # Execution patterns
├── patterns/
│   ├── task-management.md            # TodoWrite patterns
│   ├── evidence-gathering.md         # Evidence patterns
│   └── handler-selection.md          # Handler selection patterns
├── session/
│   ├── lifecycle.md                  # Session start/end
│   ├── compaction.md                 # Compaction detection
│   ├── continuation.md               # Session continuation
│   └── state-management.md           # State tracking
├── memory/
│   ├── serena-patterns.md           # Serena memory usage
│   ├── memory-lifecycle.md          # When to write/read
│   └── memory-format.md             # Format standards
├── analysis/
│   ├── evidence-based.md            # Evidence gathering
│   ├── claim-validation.md          # Making accurate claims
│   └── analysis-workflows.md        # Analysis patterns
├── testing/
│   ├── simulation-testing.md        # Simulation patterns
│   ├── validation-workflows.md      # Validation processes
│   └── test-checkpoints.md          # Checkpoint creation
├── templates/
│   ├── behavioral-templates.md      # Pre-composed sequences
│   └── quick-actions.md             # Common patterns
└── guides/
    ├── common-mistakes.md            # What to avoid
    └── best-practices.md             # Workflow best practices

NOTE: The original WORKFLOWS.md becomes a slim index at:
/home/loucmane/dev/javascript/MomsBlog/blog/.claude/templates/WORKFLOWS.md
```

## CONVENTIONS.md Migration Structure

```
/home/loucmane/dev/javascript/MomsBlog/blog/.claude/templates/conventions/
├── index.md                          # Slim replacement for CONVENTIONS.md
├── naming/
│   ├── files.md                     # File naming conventions
│   ├── variables.md                 # Variable naming
│   └── functions.md                 # Function naming
├── files/
│   ├── organization.md              # File organization
│   ├── special-files.md             # SESSION.md, TRACKER.md rules
│   └── directory-structure.md       # Project structure
├── git/
│   ├── commit-format.md             # gac format rules
│   ├── branch-naming.md             # Branch conventions
│   └── pr-conventions.md            # Pull request format
├── code-style/
│   ├── javascript.md                # JS conventions
│   ├── typescript.md                # TS conventions
│   └── general.md                   # General style
├── docs/
│   ├── documentation-standards.md   # Doc format
│   ├── comment-format.md            # Comment conventions
│   └── readme-format.md             # README standards
├── testing/
│   ├── test-naming.md               # Test conventions
│   └── test-structure.md            # Test organization
├── work-tracking/
│   ├── folder-structure.md          # Work folder format
│   ├── tracker-format.md            # TRACKER.md format
│   └── handoff-format.md            # HANDOFF.md format
└── timestamps/
    ├── format-rules.md               # Timestamp formats
    └── usage-patterns.md             # When to use timestamps
```

## PATTERNS.md Migration Structure

```
/home/loucmane/dev/javascript/MomsBlog/blog/.claude/templates/patterns/
├── index.md                          # Slim replacement for PATTERNS.md
├── routing/
│   ├── meta-routing.md              # Meta-routing patterns
│   ├── request-analysis.md          # Request parsing
│   └── intent-detection.md          # Intent patterns
├── selection/
│   ├── handler-selection.md         # Handler choice patterns
│   ├── tool-selection.md            # Tool choice (check shared!)
│   └── agent-selection.md           # Agent selection
├── evidence/
│   ├── evidence-patterns.md         # Evidence collection
│   ├── validation-patterns.md       # Validation approaches
│   └── proof-patterns.md            # Proof requirements
├── work-tracking/
│   ├── work-patterns.md             # Work tracking patterns
│   ├── progress-patterns.md         # Progress tracking
│   └── documentation-patterns.md    # Doc patterns
├── session/
│   ├── session-patterns.md          # Session management
│   ├── state-patterns.md            # State tracking
│   └── continuation-patterns.md     # Continuation
└── integration/
    ├── cross-system.md               # Cross-system patterns
    └── composition.md                # Pattern composition
```

## BUILDING-BETTER.md Migration Structure

```
/home/loucmane/dev/javascript/MomsBlog/blog/.claude/templates/integration/
├── index.md                          # Slim replacement for BUILDING-BETTER.md
├── guides/
│   ├── creating-handlers.md         # Handler creation guide
│   ├── extending-templates.md       # Template extension
│   ├── adding-agents.md             # Adding new agents
│   └── system-integration.md        # Integration guide
├── cross-system/
│   ├── mcp-integration.md           # MCP integration
│   ├── tool-integration.md          # Tool integration
│   └── agent-coordination.md        # Multi-agent coordination
├── composition/
│   ├── workflow-composition.md      # Composing workflows
│   ├── handler-chaining.md          # Chaining handlers
│   └── pattern-composition.md       # Composing patterns
├── best-practices/
│   ├── handler-design.md            # Handler best practices
│   ├── template-design.md           # Template practices
│   └── integration-patterns.md      # Integration patterns
└── architecture/
    ├── system-architecture.md        # Overall architecture
    ├── handler-architecture.md       # Handler system design
    └── template-architecture.md      # Template system design
```

## ABSOLUTE PATHS - Use These Exactly!

When creating files, use these EXACT paths:

### For WORKFLOWS.md modules:
```bash
/home/loucmane/dev/javascript/MomsBlog/blog/.claude/templates/workflows/index.md
/home/loucmane/dev/javascript/MomsBlog/blog/.claude/templates/workflows/core/ultrathink-system.md
/home/loucmane/dev/javascript/MomsBlog/blog/.claude/templates/workflows/protocols/universal-flight.md
# ... etc
```

### For CONVENTIONS.md modules:
```bash
/home/loucmane/dev/javascript/MomsBlog/blog/.claude/templates/conventions/index.md
/home/loucmane/dev/javascript/MomsBlog/blog/.claude/templates/conventions/naming/files.md
# ... etc
```

### For PATTERNS.md modules:
```bash
/home/loucmane/dev/javascript/MomsBlog/blog/.claude/templates/patterns/index.md
/home/loucmane/dev/javascript/MomsBlog/blog/.claude/templates/patterns/routing/meta-routing.md
# ... etc
```

### For BUILDING-BETTER.md modules:
```bash
/home/loucmane/dev/javascript/MomsBlog/blog/.claude/templates/integration/index.md
/home/loucmane/dev/javascript/MomsBlog/blog/.claude/templates/integration/guides/creating-handlers.md
# ... etc
```

## ⚠️ VERIFICATION COMMANDS ⚠️

After creating modules, ALWAYS verify with:

```bash
# Check WORKFLOWS modules are in correct place
ls -la /home/loucmane/dev/javascript/MomsBlog/blog/.claude/templates/workflows/

# Check CONVENTIONS modules
ls -la /home/loucmane/dev/javascript/MomsBlog/blog/.claude/templates/conventions/

# Check PATTERNS modules  
ls -la /home/loucmane/dev/javascript/MomsBlog/blog/.claude/templates/patterns/

# Check BUILDING-BETTER modules
ls -la /home/loucmane/dev/javascript/MomsBlog/blog/.claude/templates/integration/
```

## 🚫 NEVER CREATE IN THESE LOCATIONS 🚫

- ❌ `/home/loucmane/dev/javascript/MomsBlog/blog/.claude/workflows/`
- ❌ `/home/loucmane/dev/javascript/MomsBlog/blog/.claude/conventions/`
- ❌ `/home/loucmane/dev/javascript/MomsBlog/blog/.claude/patterns/`
- ❌ `/home/loucmane/dev/javascript/MomsBlog/blog/.claude/integration/`

These would be WRONG - missing the `templates/` directory!

## Module References

When modules reference each other, use relative paths from templates/:

```yaml
dependencies:
  - ../shared/patterns/ultrathink-format.md
  - ../shared/tools/tool-selection-matrix.md
  - ../engine/core/enforcement-check.md
```

Or absolute from templates root:
```yaml
dependencies:
  - .claude/templates/shared/patterns/ultrathink-format.md
```

## Final Check

Before completing ANY migration:
1. Run `find .claude -type d -name "workflows"` - Should ONLY show `.claude/templates/workflows`
2. Run `find .claude -type d -name "conventions"` - Should ONLY show `.claude/templates/conventions`
3. Run `find .claude -type d -name "patterns"` - Should ONLY show `.claude/templates/patterns`
4. Run `find .claude -type d -name "integration"` - Should ONLY show `.claude/templates/integration`

If any show up without `templates/` in the path, files are in WRONG location!