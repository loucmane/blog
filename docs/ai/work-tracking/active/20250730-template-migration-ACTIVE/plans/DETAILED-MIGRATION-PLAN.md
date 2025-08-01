# Detailed Template Migration Plan

## Executive Summary
This document outlines the comprehensive plan for migrating the Claude template system from monolithic files to a folder-based handler structure. The migration affects 69 handlers across 4 template files and includes creation of 6 missing critical handlers.

## Current State Analysis

### Handler Distribution
- **TOOLS.md**: 18 handlers (COMPLETED in test run)
- **WORKFLOWS.md**: ~25 handlers (PENDING - largest file)
- **CONVENTIONS.md**: ~15 handlers (PENDING)
- **PATTERNS.md**: ~8 handlers (PENDING)
- **BUILDING-BETTER.md**: ~3 handlers (PENDING)
- **Missing Handlers**: 6 critical handlers need creation

### Agent Ecosystem (15 Specialized Agents)

#### Core Migration Agents
1. **template-scanner**: System-wide analysis and dependency mapping
2. **template-migrator**: Handler extraction and file generation
3. **handler-validator**: YAML and structure validation
4. **handler-creator**: New handler generation

#### Quality Assurance Agents
5. **integration-tester**: Automated testing and compliance checks
6. **security-validator**: Security vulnerability scanning
7. **performance-analyzer**: Performance metrics and optimization
8. **template-optimizer**: Redundancy and pattern analysis

#### Support Agents
9. **version-controller**: Version management and compatibility
10. **template-documenter**: Documentation generation
11. **trigger-router**: Request routing and handler selection
12. **orchestration-conductor**: Multi-handler workflow coordination
13. **template-debugger**: Deep debugging for failures
14. **swhe-enforcer**: S:W:H:E format compliance
15. **pattern-extractor**: Usage pattern learning

### Critical Issues Addressed
1. **Agent Recursion Bug**: Fixed by adding constraints to prevent agents spawning other agents
2. **Incomplete Migration**: Previous attempt only completed TOOLS.md
3. **Validation Gaps**: Need per-handler validation, not just per-file
4. **State Tracking**: No persistent state tracking in previous attempt

## Migration Architecture

### Staging Environment
```
.claude/staging/
├── migration-state.json      # Persistent state tracking
├── MIGRATION-PIPELINE.md     # This pipeline documentation
├── handlers/                 # Migrated handler files
│   ├── triggers/            # User-facing entry points
│   │   ├── development/
│   │   ├── git/
│   │   └── search/
│   ├── orchestrators/       # Workflow coordinators
│   └── operators/           # Atomic operations
├── backups/                 # Pre-migration backups
└── reports/                 # Migration reports
```

### Handler Structure
```yaml
---
id: handler-name
name: Human Readable Handler Name
role: trigger|orchestrator|operator
domain: development|git|search|debug|test|docs|workflow
stability: stable|experimental|deprecated
triggers:
  - "trigger phrase 1"
  - "trigger phrase 2"
dependencies:
  - dependent-handler-1
  - dependent-handler-2
tools:
  - Tool1
  - Tool2
version: 1.0.0
---

# Handler Name

## Purpose
[Handler description]

## Process
1. Step one
2. Step two
3. Step three

## Success Criteria
- [ ] Criteria 1
- [ ] Criteria 2
```

## Migration Pipeline Phases

### Phase 1: Environment Preparation
**Objective**: Clean setup with state tracking

1. **Clean Staging Directory**
   - Remove all existing staging files
   - Create fresh directory structure
   - Initialize backup directory

2. **Create State Tracker**
   ```json
   {
     "version": "1.0",
     "started": "ISO-8601 timestamp",
     "last_updated": "ISO-8601 timestamp",
     "phase": "preparation|migration|validation|optimization|cutover",
     "files": {},
     "handlers": {},
     "errors": [],
     "checkpoints": []
   }
   ```

3. **Baseline Metrics**
   - Current search performance
   - Handler execution times
   - Memory usage patterns

### Phase 2: File-by-File Migration

**For each template file:**

#### Step 1: Pre-Migration Analysis
```bash
# Scan file for handlers and dependencies
Task: template-scanner "Analyze [FILE] and create dependency map"

# Security check before migration
Task: security-validator "Scan [FILE] for security vulnerabilities"

# Record baseline performance
Task: performance-analyzer "Measure current [FILE] handler performance"
```

#### Step 2: Handler Extraction Loop
```bash
for each handler in file:
    # Check existence
    if handler exists in staging:
        log: "Duplicate handler [name] skipped"
        continue
    
    # Extract single handler
    Task: template-migrator "Extract [handler] from [FILE] to staging"
    
    # Immediate validation
    Task: handler-validator "Validate staging handler [handler]"
    
    # Update state
    migration-state.json.handlers[handler] = {
        source: FILE,
        migrated: timestamp,
        validated: true/false,
        location: "handlers/[role]/[domain]/[handler].md"
    }
    
    # Checkpoint every 5 handlers
    if handler_count % 5 == 0:
        create checkpoint
        update todo list
```

#### Step 3: Post-File Validation
```bash
# Validate all handlers from this file
Task: handler-validator "Validate all [FILE] handlers in staging"

# Test handler interactions
Task: integration-tester "Test [FILE] handler interactions"

# Update file status
migration-state.json.files[FILE] = {
    status: "completed",
    handlers_count: N,
    completed_at: timestamp
}
```

### Phase 3: Missing Handler Creation

**Create 6 Critical Handlers:**

1. **fix-bug**: "fix bug in X", "bug found in Y"
2. **debug-issue**: "debug this", "why is X failing"
3. **explain-code**: "explain this code", "how does X work"
4. **code-review**: "review this code", "check for issues"
5. **optimize-code**: "optimize this", "make this faster"
6. **create-docs**: "document this", "create docs for X"

```bash
for each missing_handler:
    Task: handler-creator "Create [handler] with triggers [list]"
    Task: handler-validator "Validate new handler [handler]"
```

### Phase 4: System Optimization

1. **Pattern Consolidation**
   ```bash
   Task: template-optimizer "Find and consolidate duplicate patterns"
   ```

2. **Shared Pattern Extraction**
   ```bash
   Task: template-optimizer "Create shared patterns library"
   ```

3. **Version Metadata**
   ```bash
   Task: version-controller "Add version 1.0.0 to all handlers"
   ```

### Phase 5: Comprehensive Validation

1. **Full System Scan**
   ```bash
   Task: template-scanner "Complete dependency analysis of staging"
   ```

2. **Integration Testing**
   ```bash
   Task: integration-tester "Run full test suite on staging"
   ```

3. **Performance Comparison**
   ```bash
   Task: performance-analyzer "Compare staging vs production metrics"
   ```

4. **Security Audit**
   ```bash
   Task: security-validator "Final security scan of all handlers"
   ```

### Phase 6: Documentation Generation

```bash
Task: template-documenter "Generate user guide for new handler system"
Task: template-documenter "Create API documentation for handlers"
Task: template-documenter "Generate migration guide"
```

### Phase 7: Production Cutover

1. **Final Validation**
   - All handlers present (75 total)
   - Zero validation errors
   - All tests passing

2. **Backup Production**
   ```bash
   cp -r .claude/templates .claude/templates.backup-[timestamp]
   ```

3. **Deploy Staging**
   ```bash
   mv .claude/staging/handlers .claude/templates/handlers
   ```

4. **Update Core Files**
   - Update CLAUDE.md execution engine
   - Update REGISTRY.md with new paths
   - Update template file imports

5. **Smoke Tests**
   ```bash
   Task: integration-tester "Run production smoke tests"
   ```

## Risk Mitigation

### Identified Risks

1. **Context Window Exhaustion**
   - Mitigation: Create memory after each file
   - Fallback: Can resume from any checkpoint

2. **Agent Failures**
   - Mitigation: Recursion constraints added
   - Fallback: Manual handler creation if needed

3. **Validation Failures**
   - Mitigation: Per-handler validation
   - Fallback: Fix and retry individual handlers

4. **Breaking Changes**
   - Mitigation: Staging environment testing
   - Fallback: Complete rollback capability

### Rollback Procedures

#### Staging Rollback
```bash
rm -rf .claude/staging
# Restart migration from beginning
```

#### Production Rollback
```bash
rm -rf .claude/templates/handlers
cp -r .claude/templates.backup-[timestamp]/* .claude/templates/
# Revert CLAUDE.md and REGISTRY.md changes
```

## Success Metrics

### Quantitative Metrics
- ✓ 75 total handlers (69 migrated + 6 created)
- ✓ 0 validation errors
- ✓ 100% test coverage
- ✓ Performance within 5% of baseline
- ✓ All cross-references resolved

### Qualitative Metrics
- ✓ Consistent YAML frontmatter
- ✓ Clear folder organization
- ✓ Improved maintainability
- ✓ Enhanced discoverability
- ✓ Complete documentation

## Timeline Estimate

### Optimistic (No Issues)
- Phase 1-2: 2 hours (migration)
- Phase 3-4: 1 hour (creation & optimization)
- Phase 5-6: 1 hour (validation & docs)
- Phase 7: 30 minutes (cutover)
- **Total: 4.5 hours**

### Realistic (Some Issues)
- Phase 1-2: 4 hours
- Phase 3-4: 2 hours
- Phase 5-6: 2 hours
- Phase 7: 1 hour
- **Total: 9 hours**

### Pessimistic (Major Issues)
- Multiple sessions required
- Extensive debugging needed
- Manual interventions
- **Total: 16+ hours**

## Next Immediate Actions

1. ✓ Review and approve this plan
2. Clean staging directory
3. Create migration-state.json
4. Begin WORKFLOWS.md migration
5. Create checkpoint memory after WORKFLOWS.md

## Appendices

### A. Agent Task Commands
[See MIGRATION-COMMANDS.md for exact commands]

### B. Handler Type Guidelines
- **Triggers**: Detect user intent, route to handlers
- **Orchestrators**: Coordinate multi-step workflows
- **Operators**: Perform atomic operations

### C. Domain Classifications
- **development**: Code implementation, features
- **git**: Version control operations
- **search**: Finding code, files, patterns
- **debug**: Problem investigation
- **test**: Testing and validation
- **docs**: Documentation operations
- **workflow**: Process management

### D. Validation Checklist
- [ ] YAML syntax valid
- [ ] Required fields present
- [ ] Handler ID matches filename
- [ ] Role matches folder placement
- [ ] Tools listed are valid
- [ ] Triggers are unique
- [ ] Dependencies exist
- [ ] Process steps numbered
- [ ] Success criteria defined
- [ ] Cross-references work