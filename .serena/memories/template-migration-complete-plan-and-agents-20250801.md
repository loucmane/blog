# Template Migration - Complete Plan and Agent Enhancement Session

## Critical Overview

We have a comprehensive migration plan in IMPLEMENTATION.md and TRACKER.md to move 75 handlers from monolithic template files to a new folder-based structure. We just completed enhancing all 6 agents needed to execute this plan.

## The Migration Plan (from IMPLEMENTATION.md)

### Goal
Migrate 75 handlers total:
- 69 existing handlers from template files
- 6 new critical handlers to create
- Move from: `.claude/templates/*.md` (monolithic files)
- Move to: `.claude/templates/handlers/[role]/[domain]/[handler].md`

### Enhanced Agent Pipeline (What IMPLEMENTATION.md Specified)

1. **template-scanner**: Extract ALL handlers with metadata
   - Output: JSON with handler boundaries, roles, domains
   - Required: Line numbers, trigger phrases, dependencies

2. **security-validator**: Security scan before migration
   - Output: JSON with severity counts
   - Required: Block if critical_count > 0

3. **template-migrator**: Batch migrate ALL handlers
   - Output: Handler files + state updates
   - Required: Checkpoints, YAML frontmatter

4. **handler-validator**: Validate ALL migrated handlers
   - Output: JSON validation results
   - Required: Check YAML, paths, references

5. **integration-tester**: Test handler interactions
   - Output: JSON test results
   - Required: 8 specific test scenarios

6. **handler-creator**: Create 6 missing handlers
   - Output: New handler files
   - Required: execute-ultrathink, ambiguous-request, etc.

## What We Just Completed

### Agent Enhancement Summary
We discovered the agents needed updates to support the migration plan requirements. We:

1. **Initially broke 4 agents** by replacing their functionality
2. **Learned to ADD not REPLACE** functionality
3. **Successfully enhanced all 6 agents** with Migration Mode sections
4. **Preserved all original capabilities** while adding automation

### Key Enhancements Made
- **JSON outputs** for pipeline automation
- **Batch processing** (ALL handlers at once)
- **State management** (migration-state.json integration)
- **Error recovery** (checkpoints and continuations)
- **Clear success/failure criteria** for automation

## The Execution Plan (from TRACKER.md)

### Phase 1: Preparation ✅ COMPLETE
- [x] Clean staging directory
- [x] Prepare agent prompts in IMPLEMENTATION.md
- [x] Enhance all agents with Migration Mode

### Phase 2: Execution (READY TO START)
1. [ ] Create migration-state.json
2. [ ] Run template-scanner on each file:
   - [ ] WORKFLOWS.md (~25 handlers)
   - [ ] CONVENTIONS.md (~15 handlers)
   - [ ] PATTERNS.md (~8 handlers)
   - [ ] BUILDING-BETTER.md (~3 handlers)
   - [ ] TOOLS.md (~18 handlers)
3. [ ] Run security-validator on scan results
4. [ ] Run template-migrator for batch migration
5. [ ] Run handler-validator on migrated handlers
6. [ ] Run integration-tester for system tests
7. [ ] Create 6 missing handlers with handler-creator
8. [ ] Final validation pass

### Phase 3: Cutover
- [ ] Update CLAUDE.md to use new structure
- [ ] Update REGISTRY.md with new paths
- [ ] Remove old monolithic sections
- [ ] Deploy to production

## Critical Implementation Details

### Staging Structure Needed
```
.claude/staging/
├── handlers/
│   ├── triggers/
│   │   ├── development/
│   │   ├── git/
│   │   └── workflow/
│   ├── orchestrators/
│   └── operators/
│       ├── development/
│       ├── git/
│       └── search/
├── reports/
└── migration-state.json
```

### State Management Format
```json
{
  "files": {
    "WORKFLOWS.md": {
      "status": "scanned|migrated|validated",
      "handlers_found": 25,
      "handlers_migrated": 25
    }
  },
  "handlers": {
    "handler-id": {
      "source_file": "WORKFLOWS.md",
      "migrated_at": "ISO-timestamp",
      "validated": true
    }
  }
}
```

## File Locations

### Plan Documents
- **IMPLEMENTATION.md**: Complete technical plan with agent prompts
- **TRACKER.md**: Execution checklist with current status
- **HANDOFF.md**: Context for session continuity
- **README.md**: Migration overview

### Enhanced Agents
All in `.claude/agents/`:
- template-scanner.md (Migration Mode: lines 187-259)
- security-validator.md (Migration Mode: lines 127-149)
- template-migrator.md (Migration Mode: lines 153-233)
- handler-validator.md (Migration Mode: lines 190-216)
- integration-tester.md (Migration Mode: lines 170-200)
- handler-creator.md (Migration Mode: lines 89-117)

### Work Tracking
`docs/ai/work-tracking/active/20250730-template-migration-ACTIVE/`

## Why This Migration Matters

1. **Scalability**: Monolithic files are becoming unwieldy
2. **Modularity**: Individual handler files are easier to maintain
3. **Versioning**: Better Git history for individual handlers
4. **Discovery**: Folder structure aids in finding handlers
5. **Testing**: Easier to test individual handlers
6. **Future**: Enables handler packaging and distribution

## Next Session Instructions

1. Read this memory for complete context
2. Check TRACKER.md for current status
3. Create staging structure
4. Execute Phase 2 following TRACKER.md checklist
5. Use Migration Mode for all agents
6. Update TRACKER.md after each step

We are 100% ready to execute. All planning is complete, all agents are enhanced, and we have a clear checklist to follow.