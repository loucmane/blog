# Template Migration Pipeline

## Overview
A comprehensive, safe pipeline for migrating handlers from monolithic template files to folder-based structure.

## Pipeline Principles
- **Idempotent**: Can be run multiple times safely
- **Validated**: Each step verifies the previous step  
- **Reversible**: Can rollback if issues found
- **Incremental**: Processes one file/handler at a time
- **Traceable**: Full audit trail of all changes

## Agent Capabilities

### Analysis & Mapping
- **template-scanner**: Maps dependencies, validates system integrity
- **security-validator**: Checks for security vulnerabilities
- **performance-analyzer**: Measures and compares performance

### Migration & Creation  
- **template-migrator**: Extracts handlers to staging with YAML frontmatter
- **handler-creator**: Creates new handlers from requirements
- **version-controller**: Manages versions and compatibility

### Validation & Testing
- **handler-validator**: Validates YAML, structure, references
- **integration-tester**: Tests handler interactions and S:W:H:E compliance
- **template-optimizer**: Finds redundancy and optimization opportunities

### Documentation & Support
- **template-documenter**: Auto-generates documentation
- **Other agents**: Debugging, routing, orchestration support

## Migration State Tracking

### migration-state.json Structure
```json
{
  "started": "2025-01-30T14:00:00Z",
  "files": {
    "TOOLS.md": {
      "status": "completed",
      "handlers_found": 18,
      "handlers_migrated": 18,
      "validation_passed": true,
      "completed_at": "2025-01-30T12:00:00Z"
    },
    "WORKFLOWS.md": {
      "status": "in_progress",
      "handlers_found": 25,
      "handlers_migrated": 0,
      "current_handler": null,
      "errors": []
    }
  },
  "totals": {
    "handlers_found": 69,
    "handlers_migrated": 18,
    "handlers_remaining": 51,
    "validation_failures": 0
  }
}
```

## Per-File Migration Process

### 1. Pre-Migration Check
```bash
# Check if file already processed
if migration-state.json shows file completed:
    skip to next file
```

### 2. Analysis Phase
```bash
# Map all handlers in the file
/agent template-scanner "Analyze .claude/templates/WORKFLOWS.md and map all handlers"

# Security check
/agent security-validator "Check WORKFLOWS.md handlers for security issues"
```

### 3. Migration Phase (Per Handler)
```bash
for each handler in file:
    # Check if handler exists in staging
    if handler already exists:
        log duplicate and skip
    
    # Migrate single handler
    /agent template-migrator "Extract handler [name] from WORKFLOWS.md"
    
    # Immediate validation
    /agent handler-validator "Validate .claude/staging/handlers/[path]/[handler].md"
    
    # Update migration state
    update migration-state.json with progress
```

### 4. Post-File Validation
```bash
# Validate all handlers from this file
/agent handler-validator "Validate all handlers migrated from WORKFLOWS.md"

# Test interactions
/agent integration-tester "Test handler interactions for WORKFLOWS.md handlers"
```

## Full Migration Pipeline

### Phase 1: Initial Setup
1. Clean staging directory
2. Create migration-state.json
3. Baseline performance metrics

### Phase 2: File-by-File Migration
```
For each file in [WORKFLOWS.md, CONVENTIONS.md, PATTERNS.md, BUILDING-BETTER.md]:
    1. Run per-file migration process
    2. Create checkpoint/memory after each file
    3. Update todo list progress
```

### Phase 3: Missing Handler Creation
```bash
# Create missing handlers identified in memory
/agent handler-creator "Create fix-bug handler..."
/agent handler-creator "Create debug-issue handler..."
# ... etc for all 6 missing handlers
```

### Phase 4: Optimization
```bash
# Find and consolidate patterns
/agent template-optimizer "Analyze all handlers in staging for optimization"

# Apply version control
/agent version-controller "Add version metadata to all handlers"
```

### Phase 5: Final Validation
```bash
# Complete system scan
/agent template-scanner "Full system analysis of staging handlers"

# Integration testing
/agent integration-tester "Complete integration test suite"

# Performance comparison
/agent performance-analyzer "Compare staging vs production performance"
```

### Phase 6: Documentation
```bash
# Generate docs
/agent template-documenter "Generate complete documentation for new handler system"
```

### Phase 7: Cutover
1. Final validation pass
2. Backup production handlers
3. Move staging to production
4. Update CLAUDE.md and REGISTRY.md
5. Run smoke tests
6. Create cutover completion memory

## Error Recovery

### Handler Migration Failure
- Log error in migration-state.json
- Continue with next handler
- Retry failed handlers in second pass

### Agent Failure
- Check for recursion attempts
- Log agent error
- Use manual fallback if needed

### Validation Failure  
- Stop migration for that file
- Fix issues before continuing
- Update migration state

## Rollback Plan

### Staging Rollback
- Simply delete staging directory
- Restart from clean state

### Production Rollback
- Restore from backup
- Revert CLAUDE.md changes
- Revert REGISTRY.md changes

## Success Criteria
- All 69 handlers migrated
- 6 missing handlers created  
- Zero validation errors
- All integration tests pass
- Performance metrics maintained or improved
- Complete documentation generated
- Smooth production cutover

## Next Immediate Steps
1. Clean staging directory
2. Create migration-state.json
3. Start WORKFLOWS.md migration