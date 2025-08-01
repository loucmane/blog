# Template Migration Pipeline - Complete Design & Pre-Execution State

## Critical Context
This memory captures the complete state after designing the migration pipeline but BEFORE execution. We are about to compact and need everything documented.

## Session Summary
- **Session 1** (11:56-15:38): Test migration of TOOLS.md, created agents
- **Session 2** (16:51-18:00): Fixed recursion bug, designed complete pipeline

## Current State

### What We've Done
1. **Fixed Critical Bug**: All 19 agents now have recursion constraints
   - Prevents agents from spawning other agents via Task tool
   - Allows Task tool for general development work

2. **Designed 7-Phase Pipeline**:
   - Phase 1: Environment Preparation
   - Phase 2: File-by-File Migration 
   - Phase 3: Missing Handler Creation
   - Phase 4: System Optimization
   - Phase 5: Comprehensive Validation
   - Phase 6: Documentation Generation
   - Phase 7: Production Cutover

3. **Created Documentation**:
   - `/docs/.../plans/MIGRATION-PIPELINE-BACKUP.md` - Technical pipeline
   - `/docs/.../plans/DETAILED-MIGRATION-PLAN.md` - 500+ line comprehensive plan
   - `/docs/.../plans/MIGRATION-ULTRATHINK.md` - Strategic analysis

4. **Cleaned Environment**:
   - Deleted old handlers in `.claude/templates/handlers/staging/`
   - Cleaned `.claude/staging/` completely
   - Ready for fresh start

### What We Haven't Done Yet
- NOT created migration-state.json
- NOT started any actual migration
- NOT run any agents yet

## Migration Stats
- **Total Handlers**: 69 existing + 6 to create = 75
- **By File**:
  - TOOLS.md: 18 (tested but not in staging)
  - WORKFLOWS.md: ~25
  - CONVENTIONS.md: ~15
  - PATTERNS.md: ~8
  - BUILDING-BETTER.md: ~3
- **Missing Handlers**: fix-bug, debug-issue, explain-code, code-review, optimize-code, create-docs

## Agent Pipeline Sequence

### For Each File:
1. `template-scanner` - Map handlers and dependencies
2. `security-validator` - Check for vulnerabilities
3. `template-migrator` - Extract each handler
4. `handler-validator` - Validate each migration
5. `integration-tester` - Test interactions

### After All Files:
6. `handler-creator` - Create 6 missing handlers
7. `template-optimizer` - Consolidate patterns
8. `version-controller` - Add version metadata
9. `template-documenter` - Generate docs
10. Final validation suite

## Key Design Decisions

### State Tracking
```json
{
  "version": "1.0",
  "started": "timestamp",
  "files": {
    "WORKFLOWS.md": {
      "status": "in_progress|completed",
      "handlers_migrated": 15,
      "current_handler": "handler-name"
    }
  },
  "checkpoints": []
}
```

### Handler Format
```yaml
---
id: handler-name
name: Human Readable Name
role: trigger|orchestrator|operator
domain: development|git|search|debug|test|docs|workflow
stability: stable|experimental|deprecated
triggers:
  - "trigger phrase"
tools:
  - Tool1
  - Tool2
dependencies:
  - other-handler
version: 1.0.0
---

# Handler Name
## Purpose
## Process
## Success Criteria
```

### Folder Structure
```
.claude/staging/handlers/
├── triggers/       # User-facing entry points
├── orchestrators/  # Complex workflows
└── operators/      # Atomic operations
```

## Critical Commands for Next Session

### 1. Create Structure & State
```bash
mkdir -p .claude/staging/handlers/{triggers,orchestrators,operators}
mkdir -p .claude/staging/{reports,backups}

cat > .claude/staging/migration-state.json << 'EOF'
{
  "version": "1.0",
  "started": "$(date -Iseconds)",
  "phase": "migration",
  "files": {},
  "handlers": {},
  "checkpoints": []
}
EOF
```

### 2. Start Migration
```bash
# First file - WORKFLOWS.md
Task: template-scanner "Analyze WORKFLOWS.md and map all handlers"
Task: template-migrator "Extract all handlers from WORKFLOWS.md to staging"
Task: handler-validator "Validate all WORKFLOWS.md handlers in staging"
```

## Recovery Points
- After each file completion
- Every 5 handlers within a file
- Before any risky operation
- Create memory at each checkpoint

## Risk Mitigation
1. **Staging Isolation**: Never touch production
2. **Validation Gates**: Must pass before proceeding
3. **State Persistence**: Can resume from any point
4. **Rollback Plan**: Simple - delete staging, start over

## Next Session Must
1. Read this memory
2. Review `/docs/.../plans/DETAILED-MIGRATION-PLAN.md`
3. Create staging structure
4. Begin with WORKFLOWS.md
5. Track progress meticulously

## Success Metrics
- 75 total handlers migrated/created
- 0 validation errors
- 100% test coverage
- Performance maintained
- Complete documentation

## Time Estimate
- Optimistic: 3-4 hours
- Realistic: 4-6 hours  
- Pessimistic: Multiple sessions

The pipeline is designed, documented, and ready. Just needs execution.