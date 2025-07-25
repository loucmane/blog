# Template Refinement Decisions

## Decision Log

### 2025-07-25: Create New Work Folder
**Decision**: Create dedicated work folder for template refinement
**Rationale**: 
- Significant structural changes to templates
- Affects core system functionality
- Needs careful tracking and testing
**Alternative**: Could have done in behavior-testing folder
**Why chosen**: Clean separation of concerns, this is refinement not testing

### Handler Disposition Decisions

#### To Remove (Redundant)
- `implement-feature` - start-new-work covers this
- `analyze-error` - emergency-debug is sufficient
- `root-cause-analysis` - emergency-debug handles this
- `test-implementation` - create-test-checkpoint is better

#### To Broaden
- `create-component` → `create-artifact` or `create-module`
  - Should cover: components, services, models, utils, configs, etc.

#### To Add
- `create-pull-request` - Common workflow needing guidance
- `tag-release` - Version management is important

#### To Keep As-Is
- `gac` convention for commits (no new handler needed)
- All working handlers in TOOLS.md
- All working handlers in PATTERNS.md

## Open Questions
1. Best name for broadened create-component?
2. Should PR creation be a handler or just documented workflow?
3. Do we need both emergency-debug AND bug-fix-template?

### 2025-07-25: Pivot from Redesign to Registry Fix
**Decision**: Fix the registry/index rather than redesigning the handler system
**Rationale**: 
- Template system is actually well-designed with 63 working handlers
- The problem is discovery/indexing, not the handlers themselves
- REGISTRY.md had phantom entries and misclassifications
- Only 6-10 handlers actually missing, not 20+
**Evidence**:
- Verified all handlers with systematic search
- Found handlers vs templates distinction
- MATRICES.md revealed the real gaps
**Alternative**: Complete handler system redesign
**Why chosen**: Minimal changes for maximum impact

### 2025-07-25: Prioritize Missing Handlers
**Decision**: Add 6 high/medium priority handlers, defer 4 low priority
**Rationale**:
- High priority: Common user needs (fix-bug, debug-issue, explain-code, code-review)
- Medium priority: Useful operations (optimize-code, create-docs)
- Low priority: Too project-specific (deployment, rollback, security-check)
**Evidence**: MATRICES.md shows these are requested but missing
**Alternative**: Add all 10 missing handlers
**Why chosen**: Focus on universal needs, avoid project-specific complexity

### 2025-07-25: Create Comprehensive Documentation Suite
**Decision**: Create 7 user-facing documentation guides
**Rationale**:
- Users need guidance beyond just handler lists
- Common patterns and workflows should be documented
- Troubleshooting guide prevents repeated issues
- "If you want to X, say Y" format very user-friendly
**Evidence**: User confusion about how to phrase requests
**Alternative**: Just improve handler keywords
**Why chosen**: Comprehensive docs enable self-service and better UX

### 2025-07-25: Documentation Organization Strategy
**Decision**: Move user docs to templates folder with cross-references
**Rationale**:
- Documentation should be part of the template system
- Cross-references enable natural discovery flow
- USER-GUIDE.md as primary entry point
- Integrate with existing files rather than separate
**Evidence**: Current work folder location not discoverable
**Alternative**: Create separate docs/ folder
**Why chosen**: Integration makes docs part of the system, not adjacent to it