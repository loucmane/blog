# Complete List of Migration Files

## 🚨 CRITICAL FILES FOR NEXT SESSION

### 1. Planning Documents
- **Pipeline Technical Spec**: `plans/MIGRATION-PIPELINE-BACKUP.md`
  - The exact pipeline architecture
  - State tracking design
  - Error recovery procedures
  
- **Comprehensive Plan**: `plans/DETAILED-MIGRATION-PLAN.md`
  - 500+ lines of complete migration details
  - All 15 agents analyzed
  - Risk mitigation strategies
  
- **Strategic Analysis**: `plans/MIGRATION-ULTRATHINK.md`
  - Deep insights about the migration
  - Hidden complexities identified
  - Optimization opportunities

- **Agent Commands**: `plans/MIGRATION-COMMANDS.md`
  - Exact commands for each agent
  - Phase-by-phase execution
  - Missing handler creation commands

- **Critical Updates**: `plans/CRITICAL-UPDATES.md`
  - CLAUDE.md changes needed
  - REGISTRY.md updates required
  - Cutover checklist

### 2. Design Specifications
- **Handler Format**: `designs/HANDLER-FORMAT.md` ✅
  - YAML frontmatter requirements
  - Folder structure rules
  - Naming conventions

- **Migration Strategy**: `designs/MIGRATION-STRATEGY.md` ✅
  - Staging approach
  - Testing strategy
  - Rollback procedures

- **Folder Structure**: `designs/FOLDER-STRUCTURE.md` ✅
  - Complete hierarchy design
  - Domain classifications
  - Handler placement rules

### 3. Reports & Analysis
- **Scanner Issues**: `reports/SCANNER-ISSUES.md` ✅
  - 6 missing handlers identified
  - Orphaned handlers found
  - Dependency problems

- **Staging Status**: `reports/STAGING-STATUS.md` ✅
  - Current migration state
  - What's been tested
  - Validation results

- **Migration Report**: `reports/MIGRATION-REPORT-20250730.md` ✅
  - Test run results
  - Lessons learned
  - Optimization findings

### 4. Code & Scripts
- **Cutover Script**: `code/CUTOVER-SCRIPT.md`
  - Production deployment steps
  - Backup procedures
  - Rollback commands

- **Pattern Library**: `code/SHARED-PATTERNS.md`
  - Common code to extract
  - Consolidation opportunities
  - DRY improvements

### 5. Session Documentation
- **README.md**: Main tracking file with session summaries
- **READY-TO-EXECUTE.md**: First commands for next session
- **ALL-MIGRATION-FILES.md**: This file - complete reference

## 📁 Agent Files (All Have Recursion Constraints)

### Core Migration Agents
- `.claude/agents/template-scanner.md`
- `.claude/agents/template-migrator.md`
- `.claude/agents/handler-validator.md`
- `.claude/agents/handler-creator.md`

### Quality Assurance Agents
- `.claude/agents/integration-tester.md`
- `.claude/agents/security-validator.md`
- `.claude/agents/performance-analyzer.md`
- `.claude/agents/template-optimizer.md`

### Support Agents
- `.claude/agents/version-controller.md`
- `.claude/agents/template-documenter.md`
- `.claude/agents/trigger-router.md`
- `.claude/agents/orchestration-conductor.md`

## 📊 Migration Stats Reference

### Handlers by File
```
TOOLS.md:          18 handlers (tested)
WORKFLOWS.md:      ~25 handlers
CONVENTIONS.md:    ~15 handlers
PATTERNS.md:       ~8 handlers
BUILDING-BETTER.md: ~3 handlers
Missing:           6 handlers
──────────────────────────────
TOTAL:             75 handlers
```

### Missing Handlers to Create
1. `fix-bug` - "fix bug in X", "bug found in Y"
2. `debug-issue` - "debug this", "why is X failing"
3. `explain-code` - "explain this code", "how does X work"
4. `code-review` - "review this code", "check for issues"
5. `optimize-code` - "optimize this", "make this faster"
6. `create-docs` - "document this", "create docs for X"

## 🔄 Session Initialization

For next session, say:
```
"Activate project blog, read memory template-migration-pipeline-complete, 
review ALL-MIGRATION-FILES.md in work tracking, check READY-TO-EXECUTE.md"
```

## ⚠️ Important Reminders

1. **Staging is clean** - Ready to start fresh
2. **Recursion bug fixed** - All agents updated
3. **No migration started yet** - Only planning done
4. **State tracking ready** - migration-state.json system designed
5. **Pipeline documented** - 7 phases fully specified

## 🎯 First Actions Next Session

1. Create staging directory structure (command in READY-TO-EXECUTE.md)
2. Create migration-state.json 
3. Run template-scanner on WORKFLOWS.md
4. Begin handler-by-handler migration
5. Update todo list after each success

Everything needed for successful migration is documented and ready!