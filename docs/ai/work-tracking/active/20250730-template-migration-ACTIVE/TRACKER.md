# Template Migration Tracker

## Phase 1: Infrastructure & Agent Creation ✓
- [x] Create staging directory structure at `.claude/staging/`
- [x] Add explicit constraints to agents
- [x] Create AGENT-CONSTRAINTS-TEMPLATE.md
- [x] Create template-scanner agent
- [x] Create template-migrator agent  
- [x] Create handler-validator agent
- [x] Create template-optimizer agent
- [x] Create security-validator agent
- [x] Create version-controller agent

## Phase 2: Pipeline Testing ✓
- [x] Run template-scanner on system (found 69 handlers)
- [x] Migrate TOOLS.md handlers to staging (18 handlers)
- [x] Validate migrated handlers (0 errors)
- [x] Run optimizer analysis (25-30% consolidation possible)
- [x] Create MIGRATION-REPORT-20250730.md
- [x] Create MIGRATION-PLAN.md in staging

## Phase 3: Full Migration
- [ ] Migrate WORKFLOWS.md handlers (~25)
- [ ] Migrate CONVENTIONS.md handlers (~15)
- [ ] Migrate PATTERNS.md handlers (~8)
- [ ] Migrate BUILDING-BETTER.md handlers (~3)
- [ ] Migrate MATRICES.md references
- [ ] Create fix-bug handler
- [ ] Create debug-issue handler
- [ ] Create explain-code handler
- [ ] Create code-review handler
- [ ] Create optimize-code handler
- [ ] Create create-docs handler

## Phase 4: Optimization
- [ ] Create shared/serena-usage.md pattern
- [ ] Create shared/tool-selection-matrix.md
- [ ] Create shared/error-handling-patterns.md
- [ ] Standardize PRIMARY/FALLBACK/ALWAYS/NEVER keywords
- [ ] Remove empty dependencies fields
- [ ] Add version metadata to all handlers
- [ ] Consolidate search handler logic
- [ ] Create HANDLER-TEMPLATE.md

## Phase 5: Production Cutover
- [ ] Update CLAUDE.md with new search paths
- [ ] Update REGISTRY.md with new handler locations
- [ ] Create cutover.sh script
- [ ] Create rollback.sh script
- [ ] Test scripts in separate branch
- [ ] Execute cutover during low activity
- [ ] Validate S:W:H:E format works
- [ ] Test critical workflows
- [ ] Monitor for issues

## Metrics
- Total Handlers: 69
- Migrated: 18/69 (26%)
- Validated: 18/18 (100%)
- System Health: 78/100
- Consolidation Potential: 25-30%