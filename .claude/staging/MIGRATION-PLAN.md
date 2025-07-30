# Template System Migration Plan

## Overview
This document outlines the complete process for migrating from monolithic template files to the new folder-based structure.

## Migration Phases

### Phase 1: Complete Staging (2-3 days)
**Status**: PARTIALLY COMPLETE ✓

1. **Full System Scan** ✓
   ```bash
   # Already completed - found 69 handlers, health score 78/100
   ```

2. **Migrate All Templates** (In Progress)
   ```bash
   # Already done: TOOLS.md (18 handlers)
   # Remaining:
   - WORKFLOWS.md (~25 handlers)
   - CONVENTIONS.md (~15 handlers)
   - PATTERNS.md (~8 handlers)
   - BUILDING-BETTER.md (~3 handlers)
   ```

3. **Create Missing Handlers**
   Using scanner results, create:
   - fix-bug handler
   - debug-issue handler
   - explain-code handler
   - code-review handler (convert from template)
   - optimize-code handler
   - create-docs handler

4. **Implement Optimizer Recommendations**
   - Create shared pattern files
   - Standardize tool selection keywords
   - Remove empty dependencies fields
   - Consolidate redundant patterns

### Phase 2: Validation & Testing (1-2 days)

1. **Run Full Validation Suite**
   ```bash
   # For each template file's handlers:
   - handler-validator: Check structure
   - security-validator: Check for vulnerabilities
   - version-controller: Add version metadata
   - integration-tester: Test handler connections
   ```

2. **Test Critical Workflows**
   - Start new work → create component → commit
   - Search code → edit file → test → commit
   - Fix bug → debug → test → commit
   - Each S:W:H:E format variation

3. **Performance Testing**
   - Measure Serena search performance
   - Compare load times (monolithic vs folder)
   - Test with Claude in different contexts

### Phase 3: Preparation for Cutover (1 day)

1. **Update CLAUDE.md Search Paths**
   ```markdown
   # OLD:
   mcp__serena__search_for_pattern --relative_path ".claude/templates/WORKFLOWS.md"
   
   # NEW:
   mcp__serena__search_for_pattern --relative_path ".claude/templates/handlers/"
   ```

2. **Update REGISTRY.md References**
   ```markdown
   # OLD:
   [start-new-work](WORKFLOWS.md#start-new-work)
   
   # NEW:
   [start-new-work](handlers/triggers/development/start-new-work.md)
   ```

3. **Create Cutover Script**
   ```bash
   #!/bin/bash
   # cutover.sh
   
   # 1. Backup current templates
   cp -r .claude/templates .claude/templates.backup
   
   # 2. Move staged handlers to production
   mv .claude/staging/handlers .claude/templates/handlers
   
   # 3. Archive monolithic files
   mkdir -p .claude/templates/archive
   mv .claude/templates/*.md .claude/templates/archive/
   
   # 4. Restore essential non-handler files
   cp .claude/templates/archive/CLAUDE.md .claude/templates/
   cp .claude/templates/archive/USER-GUIDE.md .claude/templates/
   ```

4. **Create Rollback Script**
   ```bash
   #!/bin/bash
   # rollback.sh
   
   # 1. Remove new structure
   rm -rf .claude/templates/handlers
   
   # 2. Restore monolithic files
   cp -r .claude/templates/archive/* .claude/templates/
   
   # 3. Clean up
   rm -rf .claude/templates/archive
   ```

### Phase 4: Cutover (30 minutes)

1. **Pre-Cutover Checklist**
   - [ ] All handlers migrated and validated
   - [ ] CLAUDE.md updates prepared
   - [ ] REGISTRY.md updates prepared
   - [ ] Cutover script tested
   - [ ] Rollback script tested
   - [ ] Team notified of maintenance window

2. **Cutover Sequence**
   ```bash
   # 1. Create pre-cutover snapshot
   git add -A && git commit -m "Pre-migration snapshot"
   
   # 2. Run cutover script
   ./cutover.sh
   
   # 3. Update CLAUDE.md with new paths
   # 4. Update REGISTRY.md with new references
   # 5. Test basic operations
   
   # 6. Commit migration
   git add -A && git commit -m "Migrate templates to folder structure"
   ```

3. **Immediate Validation**
   - Test S:W:H:E format recognition
   - Test handler discovery
   - Test basic workflow execution
   - Check Serena search performance

### Phase 5: Post-Migration (1 week)

1. **Monitor & Fix Issues**
   - Watch for broken references
   - Update any missed paths
   - Fix any handler discovery issues

2. **Optimize Based on Usage**
   - Move frequently used handlers to shortcuts
   - Create handler aliases for common operations
   - Refine shared patterns based on actual use

3. **Documentation Updates**
   - Update USER-GUIDE.md
   - Create migration notes
   - Document new handler creation process

## Risk Mitigation

### Gradual Rollout Option
Instead of full cutover, we could:
1. Run both systems in parallel temporarily
2. Update CLAUDE.md to check both locations
3. Gradually move workflows to new structure
4. Remove old structure after verification

### Backward Compatibility
During transition, CLAUDE.md could include:
```python
# Try new structure first, fall back to old
handler_locations = [
    ".claude/templates/handlers/",
    ".claude/templates/"  # fallback
]
```

## Success Criteria

1. **Functional**: All workflows execute correctly
2. **Performance**: No degradation in search/load times
3. **Reliability**: No increase in errors
4. **Maintainability**: Easier to add/modify handlers
5. **Discoverability**: Better handler organization

## Timeline

- **Day 1-3**: Complete staging
- **Day 4-5**: Validation & testing
- **Day 6**: Preparation
- **Day 7**: Cutover (early morning, low activity)
- **Week 2**: Monitor and optimize

## Decision Points

1. **Before Phase 3**: Go/No-Go based on validation results
2. **Before Phase 4**: Final Go/No-Go with rollback ready
3. **After Cutover**: Keep or rollback based on immediate results

## Migration Commands Summary

```bash
# Phase 1: Staging
/agent template-migrator migrate WORKFLOWS.md
/agent template-migrator migrate CONVENTIONS.md
/agent handler-creator create fix-bug debug-issue explain-code

# Phase 2: Validation
/agent handler-validator validate-all
/agent integration-tester test-workflows

# Phase 4: Cutover
./cutover.sh
# Manual: Update CLAUDE.md and REGISTRY.md
# Test: Basic operations

# If needed: Rollback
./rollback.sh
git reset --hard HEAD~1
```

This migration plan ensures a safe, validated transition with multiple checkpoints and a clear rollback strategy.