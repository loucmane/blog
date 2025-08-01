# CRITICAL TEMPLATE MIGRATION - COMPLETE REFERENCE

## URGENT STATUS
- **Migrated**: 18/69 handlers (TOOLS.md only)
- **Staging Location**: `.claude/staging/handlers/triggers/`
- **Work Tracking**: `docs/ai/work-tracking/active/20250730-template-migration-ACTIVE/`
- **Compaction at 4%** - This memory contains EVERYTHING needed

## CRITICAL ISSUE DISCOVERED
Template-migrator agent tried to spawn another template-migrator - INFINITE RECURSION BUG!
Need to add constraint to ALL agents: "NEVER use Task tool to spawn other agents"

## COMPLETE PIPELINE (TESTED & WORKING)
1. **template-scanner** - Found 69 handlers, 6 missing, health 78/100
2. **template-migrator** - Migrated 18 from TOOLS.md successfully
3. **handler-validator** - 100% validation pass
4. **template-optimizer** - Found 25-30% consolidation
5. **security-validator** - Ready to use
6. **version-controller** - Ready to use
7. **integration-tester** - Ready to use
8. **handler-creator** - Ready to use

## MISSING HANDLERS (MUST CREATE)
1. **fix-bug** - "fix bug X", "bug in Y"
2. **debug-issue** - "debug this", "why is X failing"
3. **explain-code** - "explain this code", "how does X work"
4. **code-review** - "review this code", "check for issues"
5. **optimize-code** - "optimize this", "make this faster"
6. **create-docs** - "document this", "create docs for X"

## FILES TO UPDATE FOR CUTOVER
### CLAUDE.md Changes
```markdown
# OLD
mcp__serena__search_for_pattern --relative_path ".claude/templates/WORKFLOWS.md"
# NEW
mcp__serena__search_for_pattern --relative_path ".claude/templates/handlers/"
```

### REGISTRY.md Changes
```markdown
# OLD
[handler-name](WORKFLOWS.md#handler-name)
# NEW
[handler-name](handlers/triggers/domain/handler-name.md)
```

## YAML FRONTMATTER (REQUIRED)
```yaml
---
id: handler-name
name: Human Readable Name
role: trigger|orchestrator|operator
domain: [development, git, search, file, testing, documentation]
stability: stable|experimental|deprecated
triggers: ["phrase 1", "phrase 2"]
dependencies: []
tools: [Serena, Edit, Bash]
version: 1.0.0
---
```

## CUTOVER SCRIPTS
Located at: `code/CUTOVER-SCRIPTS.md`
- cutover.sh - Moves staging to production
- rollback.sh - Instant rollback
- Must update CLAUDE.md and REGISTRY.md between scripts

## SHARED PATTERNS (25-30% REDUCTION)
Create in `.claude/staging/handlers/shared/`:
1. **serena-usage.md** - 14/18 handlers repeat this
2. **tool-selection.md** - 12/18 handlers repeat this
3. **error-handling.md** - 10/18 handlers repeat this
4. **success-criteria.md** - 8/18 handlers repeat this

## EXACT COMMANDS TO RUN
```bash
# Continue migration
Task: "Extract all handlers from .claude/templates/WORKFLOWS.md and migrate to staging"
Task: "Extract all handlers from .claude/templates/CONVENTIONS.md and migrate to staging"
Task: "Extract all handlers from .claude/templates/PATTERNS.md and migrate to staging"

# Create missing handlers
Task: "Create fix-bug handler - user says 'fix bug X' or 'bug in Y'"
Task: "Create debug-issue handler - user says 'debug this' or 'why is X failing'"
[etc...]

# Validate
Task: "Validate all handlers in .claude/staging/handlers/"
```

## WORK TRACKING FILES
- **README.md** - START HERE post-compaction
- **plans/MIGRATION-COMMANDS.md** - Copy-paste commands
- **designs/HANDLER-FORMAT.md** - YAML spec
- **reports/SCANNER-ISSUES.md** - Missing handlers
- **plans/CRITICAL-UPDATES.md** - File updates
- **code/CUTOVER-SCRIPTS.md** - Migration scripts
- **code/SHARED-PATTERNS.md** - Optimizations

## CURRENT STAGING STRUCTURE
```
.claude/staging/
├── handlers/
│   ├── triggers/        # 18 handlers here
│   │   ├── analysis/    # 3 handlers
│   │   ├── external/    # 3 handlers
│   │   ├── file/        # 4 handlers
│   │   ├── git/         # 4 handlers
│   │   └── search/      # 4 handlers
│   ├── orchestrators/   # EMPTY (created folders)
│   └── operators/       # EMPTY
└── MIGRATION-PLAN.md
```

## CRITICAL DECISIONS
1. **Staging-first** - Never touch production
2. **Interaction-based** - triggers/orchestrators/operators
3. **Rich metadata** - YAML frontmatter
4. **Atomic cutover** - All or nothing
5. **Agent constraints** - Prevent recursion

## NEXT SESSION MUST
1. Fix agent recursion bug
2. Complete remaining migrations
3. Create missing handlers
4. Run full validation
5. Execute cutover

EVERYTHING IS IN WORK TRACKING FOLDER!