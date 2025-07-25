# Template Refinement Findings

## Key Discoveries

### From ULTRATHINK Testing
- REGISTRY has many broken/mismatched anchors
- Some handlers renamed but REGISTRY not updated
- Some handlers too specific (create-component)
- Missing common operations (PRs, releases)

### From Anchor Audit
- WORKFLOWS.md: Only 48% of referenced handlers exist
- Many strikethrough entries need resolution
- Special file rules aren't handlers
- Git operations partially missing

## Handler Categories

### Too Specific
- `create-component` - Only covers UI components, not general code creation

### Redundant/Outdated
- `implement-feature` - Covered by start-new-work
- `analyze-error` - Covered by emergency-debug
- `root-cause-analysis` - Covered by emergency-debug
- `test-implementation` - Covered by create-test-checkpoint

### Actually Missing
- Pull request creation workflow
- Version tagging/release workflow
- General code artifact creation

### Exists but Misnamed
- `fix-problem` → `bug-fix-template`
- `debug` → `emergency-debug`
- `session-end` → `end-session`

## Key Insight
The template system has evolved organically, leading to inconsistencies. A systematic refinement will improve discoverability and reduce confusion.

## Sequential Thinking Insights

### Handler Naming Pattern
- Established `{verb}-{noun}[-{modifier}]` pattern
- Controlled vocabulary prevents verb proliferation  
- Handler name MUST equal anchor name

### Registry Structure Innovation
- Lifecycle sections: ACTIVE, DEPRECATED, PROPOSED
- Metadata tracking: Added date, keywords, relationships
- Migration process: 30-day deprecation period

### Consolidation Principle
- Merge handlers with >80% overlap
- Keep debug-error, remove analyze-error variants
- Single entry point for common workflows

### Discoverability Enhancement  
- Keywords/aliases for alternative search terms
- Relationship mapping shows handler connections
- Makes ULTRATHINK format more effective

### Quality Control
- Registry validator tool concept
- Pre-commit checks for anchor validity
- Prevents regression to chaos

## Critical Discovery from Template Analysis

### Handlers vs Templates
After reading the actual templates, discovered a fundamental distinction:
- **Handlers**: Have triggers, respond to user input (e.g., `start-new-work`)
- **Templates**: Step-by-step guides, no triggers (e.g., `bug-fix-template`)
- **REGISTRY conflated these**: Listed templates as handlers

### The Real Problem
1. REGISTRY is inaccurate - references non-existent handlers
2. Many "missing" handlers never existed (phantom entries)
3. Templates were mistaken for handlers
4. The actual handler system is well-designed

### Examples of Confusion
- `fix-problem` - Listed as handler, doesn't exist
- `bug-fix-template` - Template, not a handler
- `implement-feature` - Never existed, phantom entry
- `session-start` - Real handler, wrong file location in REGISTRY

### Revised Understanding
- The template system is sophisticated and well-documented
- The issue is discovery/indexing, not design
- Need to fix the catalog, not rewrite the books
- Minimal changes needed: accurate REGISTRY + keywords

### 2025-07-25 14:27 - MATRICES.md Reveals Additional Missing Handlers

**The Discovery**
While verifying handler counts, discovered that MATRICES.md references 10 handlers that don't exist, not just 2. MATRICES.md was aspirational documentation - showing how the system SHOULD work rather than how it DOES work.

**Why It Matters**
- Original count dropped from 81 to 65 (only 2 missing)
- But MATRICES.md reveals we actually need 69-73 handlers
- Common user operations like "review code", "optimize X" have no handlers
- MATRICES.md acts as a requirements document showing gaps

**Evidence**
- Verified all 63 existing handlers with search
- Found 10 phantom handlers in MATRICES.md
- Categorized by priority: 4 high, 2 medium, 4 low
- Fixed misnamed references (implement-feature → standard-dev-workflow)

**Missing Handler Categories**
1. High Priority (common user needs):
   - fix-bug, debug-issue, explain-code, code-review
2. Medium Priority (useful but less common):
   - optimize-code, create-docs
3. Low Priority (project-specific):
   - security-check, deployment, rollback, compare-code