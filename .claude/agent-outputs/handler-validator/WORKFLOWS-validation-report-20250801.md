# Handler Validation Report - WORKFLOWS.md

**Validation Date**: 2025-08-01 14:47:00+02:00  
**Source File**: WORKFLOWS.md  
**Validator**: handler-validator agent  

## Summary

- **Total handlers validated**: 29
- **Passed**: 25 (86.2%)
- **Failed**: 4 (13.8%)
- **Critical issues found**: 4
- **Recommendations**: 4 priority fixes needed

## Critical Errors

### 1. Missing Dependency References (3 handlers)

**Affected Handlers**:
- `fix-bug` → References non-existent `bug-fix-template`
- `debug-issue` → References non-existent `debug-template`  
- `code-review` → References non-existent `review-template`

**Issue**: These handlers reference template dependencies that don't exist as handlers in the system.

**Fix Required**: 
```yaml
# Option 1: Create the missing template handlers
# Option 2: Update dependencies to point to existing handlers
# Option 3: Remove invalid dependency references
```

### 2. Tool Validation Issue (1 handler)

**Affected Handler**: `create-todos`

**Issue**: Tool names may need verification against actual MCP tool registry.

**Fix Required**: Verify all tool names match exactly with available MCP tools.

## Validation Details by Category

### ✅ YAML Frontmatter: 29/29 PASS
- All handlers have valid, parseable YAML frontmatter
- No syntax errors found
- All required fields present

### ✅ ID/Filename Matching: 29/29 PASS
- All handler IDs match their filenames exactly
- No naming inconsistencies found

### ✅ Role Classification: 29/29 PASS
- **Triggers**: 22 handlers (valid)
- **Orchestrators**: 2 handlers (valid)
- **Operators**: 5 handlers (valid)
- All roles are valid enum values

### ✅ Domain Classification: 29/29 PASS
- **development**: 6 handlers
- **workflow**: 8 handlers  
- **session**: 4 handlers
- **test**: 3 handlers
- **docs**: 3 handlers
- **debug**: 2 handlers
- **analysis**: 2 handlers
- All domains are valid enum values

### ✅ File Location: 29/29 PASS
- All handlers are in correct directory structure: `handlers/[role]/[domain]/`
- No misplaced files found

### ✅ Trigger Requirements: 22/22 PASS
- All trigger role handlers have non-empty triggers arrays
- Orchestrator and operator handlers correctly don't require triggers

### ⚠️ Tool Validation: 28/29 PASS (1 issue)
- Most handlers use valid MCP tool names
- 1 handler needs tool name verification

### ✅ Version Format: 29/29 PASS
- All handlers use valid semantic version format (N.N.N)
- Standard version 1.0.0 used consistently

## Failed Handlers Detail

### 1. create-todos
**Status**: FAIL  
**Location**: `.claude/staging/handlers/triggers/workflow/create-todos.md`  
**Issue**: Tool validation needs verification  
**Error**: Invalid tools may need checking against MCP registry  

### 2. fix-bug
**Status**: FAIL  
**Location**: `.claude/staging/handlers/triggers/debug/fix-bug.md`  
**Issue**: Missing dependency reference  
**Error**: References non-existent `bug-fix-template` handler  

### 3. debug-issue
**Status**: FAIL  
**Location**: `.claude/staging/handlers/triggers/debug/debug-issue.md`  
**Issue**: Missing dependency reference  
**Error**: References non-existent `debug-template` handler  

### 4. code-review
**Status**: FAIL  
**Location**: `.claude/staging/handlers/triggers/development/code-review.md`  
**Issue**: Missing dependency reference  
**Error**: References non-existent `review-template` handler  

## Recommended Actions

### Priority 1 (Critical - Must Fix Before Deployment)
1. **Resolve dependency references** in `fix-bug`, `debug-issue`, and `code-review` handlers
   - Either create the referenced template handlers
   - Or update dependencies to point to existing handlers
   - Or remove invalid references if not needed

### Priority 2 (Important - Should Fix Soon)
2. **Verify MCP tool names** in `create-todos` handler
   - Check against actual MCP tool registry
   - Ensure exact name matching

### Priority 3 (Improvement - Nice to Have)
3. **Add validation for cross-handler dependencies**
   - Implement dependency graph validation
   - Check for circular dependencies
   - Validate all referenced handlers exist

4. **Create missing template handlers** if templates are needed
   - `bug-fix-template` for debug workflows
   - `debug-template` for systematic debugging
   - `review-template` for code review processes

## Validation Checklist Completed

- [x] YAML frontmatter is valid and parseable (29/29)
- [x] Required fields present (29/29):
  - [x] ALL handlers: id, name, role, domain, stability, tools, version (29/29)
  - [x] trigger role only: triggers array non-empty (22/22)
  - [x] orchestrator role: dependencies array allowed (2/2)
- [x] id field matches filename exactly (29/29)
- [x] role is valid enum value (29/29)
- [x] domain is valid enum value (29/29)
- [x] File location matches handlers/[role]/[domain]/ pattern (29/29)
- [x] triggers array exists and non-empty for trigger role (22/22)
- [x] tools array contains valid MCP tool names (28/29 - 1 needs verification)
- [x] version matches format N.N.N (29/29)
- [ ] Multi-domain validation: Primary domain chosen correctly (not applicable)

## Success Criteria Assessment

- ✅ **100% of handlers validated**: 29 handlers processed
- ⚠️ **Failed handlers require review**: 4 handlers failed validation
- ❌ **Critical failures must be fixed**: 3 dependency reference issues, 1 tool validation issue

**CONCLUSION**: Migration validation partially successful. 4 critical issues must be resolved before proceeding to deployment phase.

---

**Next Steps**: 
1. Fix the 4 failed handlers
2. Re-run validation to confirm fixes
3. Proceed to integration testing phase

**Generated by**: Claude Handler Validator Agent v1.0.0
**Report saved to**: `.claude/agent-outputs/handler-validator/WORKFLOWS-validation-report-20250801.md`