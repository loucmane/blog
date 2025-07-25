# Missing Handlers Analysis

## Handlers Referenced in MATRICES.md but Don't Exist

### Category 1: CRITICAL - Common User Requests
These represent frequent user needs that should have handlers:

1. **fix-bug** → Routes to bug-fix-template
   - User says: "fix bug in login", "resolve issue with auth"
   - Currently broken in MATRICES.md (says fix-problem)
   
2. **debug-issue** → Routes to emergency-debug template
   - User says: "debug this error", "find the problem"
   - Essential for problem-solving workflow

3. **code-review** → Should create systematic review process
   - User says: "review my changes", "check this code"
   - Very common developer request

4. **explain-code** → Deep code explanation
   - User says: "how does auth work?", "explain this function"
   - Currently handled ad-hoc, needs structure

### Category 2: MEDIUM - Useful but Less Frequent

5. **optimize-code** → Performance optimization workflow
   - User says: "optimize this query", "improve performance"
   - Could route to existing analyze-code + refactor-code

6. **create-docs** → Documentation generation
   - User says: "document this API", "write docs for X"
   - Could be valuable for consistency

7. **security-check** → Security analysis workflow
   - User says: "check for vulnerabilities", "secure this endpoint"
   - Important but specialized

### Category 3: LOW - Questionable Need

8. **deployment** → Deploy to environments
   - User says: "deploy to staging"
   - Might be too project-specific

9. **rollback** → Revert deployments
   - User says: "rollback the deploy"
   - Very project-specific

10. **compare-code** → Compare two versions
    - User says: "compare v1 and v2"
    - Could use existing git diff tools

### Misnamed References to Fix

- `implement-feature` → `standard-dev-workflow` (exists)
- `fix-problem` → `fix-bug` (to be created)
- `test-implementation` → `create-test-checkpoint` (exists)
- `search-pattern` → `grep-pattern` (exists)

## Recommended Action Plan

### Phase 1: Immediate Fixes (High Impact, Low Effort)
1. Fix MATRICES.md misnamed references
2. Create `fix-bug` handler → routes to bug-fix-template
3. Create `debug-issue` handler → routes to emergency-debug
4. Create `explain-code` handler → structured code explanation
5. Create `code-review` handler → systematic review process

### Phase 2: Quick Wins (Medium Impact, Low Effort)
6. Update MATRICES.md to remove truly phantom handlers
7. Create `optimize-code` as alias to analyze-code + suggestions
8. Create `create-docs` handler for documentation consistency

### Phase 3: Evaluate Need (Low Priority)
9. Consider if deployment/rollback/security-check are needed
10. These might be better as project-specific extensions

## Impact on Handler Count

- Current verified: 63 handlers
- Phase 1 additions: 4 handlers (fix-bug, debug-issue, explain-code, code-review)
- Phase 2 additions: 2 handlers (optimize-code, create-docs)
- **New Total: 69 handlers**

## Why This Happened

MATRICES.md was created as an idealized routing table - documenting how the system SHOULD work rather than how it DOES work. It's aspirational documentation that reveals gaps in the actual implementation.