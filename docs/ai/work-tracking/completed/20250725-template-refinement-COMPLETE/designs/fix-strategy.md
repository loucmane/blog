# Template System Fix Strategy

## The Problem
- REGISTRY.md is inaccurate (lists 81+ handlers)
- MATRICES.md references handlers that don't exist
- Actually only 63 handlers exist
- 10 handlers are referenced but missing
- Common operations like "fix bug" and "review code" have no handlers

## Phase 1: Quick Fixes (Done ✓)
1. **Fixed MATRICES.md misnamed references**
   - implement-feature → standard-dev-workflow
   - fix-problem → fix-bug (to be created)
   - test-implementation → create-test-checkpoint
   - search-pattern → search-code

2. **Created REGISTRY-REFINED.md**
   - Accurate count: 69 handlers (63 + 6 to add)
   - Clear handler vs template distinction
   - Keywords for every handler
   - Proper file locations

## Phase 2: Create Missing Handlers (Next)

### High Priority (User Needs Daily)
```yaml
fix-bug:
  triggers: "fix bug X", "resolve issue Y"
  routes-to: bug-fix-template
  location: WORKFLOWS.md

debug-issue:
  triggers: "debug X", "find the problem"
  routes-to: emergency-debug template
  location: WORKFLOWS.md

explain-code:
  triggers: "how does X work?", "explain Y"
  process: Deep analysis with evidence
  location: WORKFLOWS.md

code-review:
  triggers: "review my changes", "check code"
  routes-to: code-review-template
  location: WORKFLOWS.md
```

### Medium Priority (Useful but Less Common)
```yaml
optimize-code:
  triggers: "optimize X", "improve performance"
  process: Analyze + suggest improvements
  location: TOOLS.md

create-docs:
  triggers: "document X", "write docs"
  process: Generate consistent documentation
  location: WORKFLOWS.md
```

## Phase 3: System Cleanup
1. Replace original REGISTRY.md with REGISTRY-REFINED.md
2. Test ULTRATHINK format with new keywords
3. Keep MATRICES.md and REGISTRY in sync
4. Consider adding low-priority handlers later

## Why This Works
- Fixes immediate user pain points (can't fix bugs, review code)
- Minimal changes to well-designed system
- Improves discoverability without major refactoring
- MATRICES.md becomes accurate routing table

## Implementation Order
1. Create fix-bug and debug-issue first (most common)
2. Add explain-code and code-review
3. Add optimize-code and create-docs
4. Replace REGISTRY.md
5. Test everything with ULTRATHINK