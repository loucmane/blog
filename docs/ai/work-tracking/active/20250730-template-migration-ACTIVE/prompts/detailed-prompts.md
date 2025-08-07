# Detailed Prompts for Template Modularization Phase 2

## Overview
This document contains exact prompts for subagents to execute the template modularization. Each prompt is designed to be copy-pasted directly to the appropriate agent.

## Phase 1: Shared Pattern Library Creation

### 1.1 Create Directory Structure
```bash
Task: operator-executor "Create the shared pattern library directory structure at .claude/templates/shared/ with subdirectories: patterns, tools, structures, conventions, recovery, testing, formats. Also create the modular template directories: .claude/engine/, .claude/behaviors/, .claude/matrices/, .claude/registry/, .claude/tools/, .claude/guides/, .claude/conventions/, .claude/workflows/. Each main directory should have appropriate subdirectories based on the migration mappings in /docs/ai/work-tracking/active/20250730-template-migration-ACTIVE/designs/detailed-migration-mappings.md"
```

### 1.2 Extract ULTRATHINK Pattern (Highest Priority)
```bash
Task: template-migrator "Extract the ULTRATHINK pattern that is duplicated across 17 files into a single shared pattern library file. Create .claude/templates/shared/patterns/ultrathink-format.md with proper YAML frontmatter (id: ultrathink-format, type: shared-pattern, category: core, version: 1.0.0). Source the content from BEHAVIORS.md lines 30-64 and consolidate all variations from other files. The pattern should include: 1) The S:W:H:E format definition, 2) Pre-ultrathink protocol, 3) Handler comprehension requirements, 4) Evidence field values, 5) All enforcement mechanisms. Ensure zero duplication after extraction."
```

### 1.3 Extract Tool Selection Matrix
```bash
Task: template-migrator "Create .claude/templates/shared/tools/tool-selection-matrix.md by consolidating all tool selection logic currently duplicated 315 times across the codebase. Extract from TOOLS.md lines 13-47 (router table) and lines 64-106 (decision funnel). Include: 1) Complete tool selection matrix, 2) When to use each tool, 3) Tool precedence rules, 4) Special cases and exceptions. Add YAML frontmatter (id: tool-selection-matrix, type: shared-pattern, category: tools, version: 1.0.0)."
```

## Phase 2: CLAUDE.md Modularization (CRITICAL)

### 2.1 Analyze CLAUDE.md Structure
```bash
Task: template-scanner "Analyze .claude/templates/CLAUDE.md for modularization. Create a detailed report showing: 1) All logical sections that can be extracted, 2) Dependencies between sections, 3) Critical sections that must remain in root, 4) Sections that can move to engine/, 5) Risk assessment for each extraction. Follow the mappings in detailed-migration-mappings.md lines 1-46. Output as JSON to .claude/templates/shared/reports/claude-analysis.json"
```

### 2.2 Create Engine Core Modules
```bash
Task: template-migrator "Modularize CLAUDE.md into .claude/engine/ structure following the exact mappings in detailed-migration-mappings.md. Create these core modules: 
1) engine/core/execution-engine.md (lines 1-17)
2) engine/core/enforcement-check.md (lines 9-17)  
3) engine/core/ultrathink-protocol.md (lines 19-46)
4) engine/core/pre-ultrathink.md (lines 37-46)
5) engine/activation/context-aware.md (lines 48-97)
Each module needs proper YAML frontmatter with id, type: engine-component, dependencies list, and exports list. Maintain all functionality and cross-references."
```

### 2.3 Create Slim CLAUDE.md Router
```bash
Task: handler-creator "Create a new slim CLAUDE.md (approximately 50 lines) that acts as a router to the modular engine components. It should:
1) Keep the critical header warning about being the operating system
2) Import all modules from .claude/engine/ via references  
3) Maintain backward compatibility with existing handler references
4) Include a module map showing where each component moved
5) Preserve the ULTRATHINK enforcement as first priority
The new file should be a clean entry point that delegates to modules."
```

### 2.4 Validate CLAUDE.md Migration
```bash
Task: integration-tester "Test the modularized CLAUDE.md to ensure zero functionality loss. Verify:
1) ULTRATHINK protocol still triggers correctly
2) S:W:H:E format works with all handlers
3) Handler discovery through both Read and Serena methods
4) All enforcement mechanisms activate properly
5) Common flows (work on X, fix bug Y, commit changes) work
Create test report at .claude/engine/validation-report.json with pass/fail for each test."
```

## Phase 3: REGISTRY.md Transformation

### 3.1 Break Down REGISTRY.md
```bash
Task: template-migrator "Transform REGISTRY.md into modular structure at .claude/registry/ following mappings in detailed-migration-mappings.md lines 87-97:
1) Create registry/index.md as slim entry point (50 lines max)
2) Extract triggers section → registry/handlers/triggers-registry.md
3) Extract orchestrators → registry/handlers/orchestrators-registry.md  
4) Extract operators → registry/handlers/operators-registry.md
5) Extract navigation keywords → registry/navigation/keywords.md
Each file needs proper frontmatter and cross-references. Maintain all 73+ handler links."
```

### 3.2 Update Handler References
```bash
Task: pattern-extractor "Update all handler references in the new registry modules to ensure they point to the correct locations in .claude/templates/handlers/. Verify that all 71 deployed handlers are properly referenced and discoverable through both direct path and search methods. Create a verification report showing: handler name, old reference, new reference, validation status."
```

## Phase 4: BEHAVIORS.md Migration

### 4.1 Extract Behavioral Hooks
```bash
Task: template-migrator "Migrate BEHAVIORS.md (442 lines) to modular structure at .claude/behaviors/ following mappings in detailed-migration-mappings.md lines 114-128:
1) behaviors/index.md - Overview and navigation
2) behaviors/file-operations/before-edit.md
3) behaviors/file-operations/before-create.md  
4) behaviors/timestamps/before-adding.md
5) behaviors/git/before-commit.md
6) behaviors/work-tracking/update-tracker.md
7) behaviors/validation/evidence-claims.md
8) behaviors/task-management/todo-write.md
9) behaviors/session/compaction-detection.md
Each behavior must maintain its 'cannot proceed without' enforcement strength."
```

## Phase 5: Bulk Template Migration

### 5.1 Migrate MATRICES.md
```bash
Task: template-migrator "Migrate MATRICES.md (200 lines) to .claude/matrices/ following mappings in detailed-migration-mappings.md lines 130-143. Create focused matrix modules for routing, selection, recovery, and mapping. Each matrix should be a standalone decision tool with clear input/output specifications."
```

### 5.2 Migrate TOOLS.md
```bash
Task: template-migrator "Migrate TOOLS.md (981 lines) to .claude/tools/ following mappings in detailed-migration-mappings.md lines 99-112. Focus on eliminating the 315 duplicate tool selection references by using the shared pattern library. Create separate guides for search, file operations, git, and task delegation."
```

### 5.3 Migrate USER-GUIDE.md
```bash
Task: template-migrator "Migrate USER-GUIDE.md (933 lines) to .claude/guides/ structure. Create user-friendly modular guides: quickstart/getting-started.md, ultrathink/understanding.md, workflows/common.md, troubleshooting/issues.md, reference/triggers.md. Each guide should be self-contained and link to others as needed."
```

### 5.4 Process Remaining Templates
```bash
Task: template-migrator "Process the remaining template files:
1) Extract remaining content from WORKFLOWS.md not in handlers
2) Extract remaining CONVENTIONS.md conventions not in handlers
3) Extract remaining PATTERNS.md patterns not in handlers  
4) Migrate BUILDING-BETTER.md to integration guidance modules
5) Preserve PROJECT-BLOG.md as project configuration
Remove all content that's already been migrated to handlers or shared patterns."
```

## Phase 6: Consolidation & Optimization

### 6.1 Remove All Duplications
```bash
Task: template-optimizer "Scan all migrated modules for remaining duplications. For any pattern appearing 3+ times, extract to shared library. Focus on:
1) Git commit formats (12 duplicates)
2) Work tracking patterns (13 duplicates)
3) TodoWrite references (20 duplicates)
4) Pre-conditions/Success criteria (97 duplicates)
Create shared patterns for each and update all references. Target: 0% duplication."
```

### 6.2 Create Import Maps
```bash
Task: pattern-extractor "Create comprehensive import maps showing how all modules connect. Generate:
1) .claude/imports.md - Master import map
2) dependency-graph.json - Module dependencies
3) cross-reference-index.md - All cross-references
4) migration-manifest.json - Complete migration record
Ensure every module knows its dependencies and dependents."
```

## Phase 7: Validation & Testing

### 7.1 Full System Validation
```bash
Task: integration-tester "Run comprehensive validation of the entire modularized template system:
1) Test all 71 production handlers still work
2) Verify ULTRATHINK protocol functions correctly
3) Test handler discovery through both methods
4) Validate all cross-references resolve
5) Check for broken imports or missing modules
6) Verify 40% size reduction achieved
7) Confirm 0% duplication remains
Generate final report: validation-report-final.json"
```

### 7.2 Create Rollback Plan
```bash
Task: version-controller "Create a complete rollback plan in case issues are discovered:
1) Backup current modular structure to .claude/templates.modular-backup-[timestamp]/
2) Create rollback script that can restore monolithic files
3) Document rollback procedure step-by-step
4) Create verification checklist for post-rollback
5) Test rollback in safe environment
Save as .claude/rollback-modular-[timestamp].sh"
```

## Phase 8: Documentation & Handoff

### 8.1 Update Documentation
```bash
Task: template-documenter "Create comprehensive documentation for the new modular structure:
1) Architecture overview showing all modules
2) Migration guide for developers
3) Module API reference
4) Troubleshooting guide for common issues
5) Performance improvements achieved
Save to .claude/docs/modular-architecture.md"
```

### 8.2 Create Final Report
```bash
Task: template-optimizer "Generate final migration report showing:
1) Original state: 12 monolithic files, 8,500 lines, 43% redundancy
2) Final state: 100+ modules, ~5,100 lines, 0% redundancy
3) Performance improvements: discovery speed, maintenance effort
4) Lessons learned and recommendations
5) Next steps for further optimization
Output as: final-modularization-report.md"
```

## Success Criteria

All phases complete when:
- ✅ 12 monolithic files fully modularized
- ✅ 100+ focused modules created
- ✅ 40% size reduction achieved (8,500 → ~5,100 lines)
- ✅ 0% content duplication remains
- ✅ All handlers still functional
- ✅ ULTRATHINK protocol working
- ✅ S:W:H:E format operational
- ✅ Both discovery methods functional
- ✅ All cross-references resolved
- ✅ Comprehensive documentation complete

## Execution Order

1. **Quick Wins** (1 hour): Phases 1.1-1.3
2. **Critical** (4 hours): Phases 2.1-2.4 (CLAUDE.md)
3. **Important** (2 hours): Phases 3.1-3.2 (REGISTRY.md)
4. **Standard** (8 hours): Phases 4.1, 5.1-5.4 (Bulk migration)
5. **Optimization** (3 hours): Phases 6.1-6.2
6. **Validation** (2 hours): Phases 7.1-7.2
7. **Wrap-up** (1 hour): Phases 8.1-8.2

Total: ~21 hours (slightly over 16 hour estimate due to validation needs)

## Risk Mitigation

- Always create backups before each phase
- Test after every major change
- CLAUDE.md is most critical - handle with extreme care
- Maintain backward compatibility throughout
- Keep monolithic files until migration validated
- Have rollback plan ready at each phase

## Notes

- Copy these prompts exactly as written
- Agents have context about file locations
- Each agent knows its output format
- State tracking not needed (unlike handler migration)
- Focus on atomic, reversible operations
- Prioritize functionality over perfection